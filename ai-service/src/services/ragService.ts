import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small';
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 500);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP ?? 50);
const RAG_TOP_K = Number(process.env.RAG_TOP_K ?? 5);

// ─── Document Processing ──────────────────────────────────────────────────────

interface ProcessInput {
  documentId: string;
  businessId: string;
}

/**
 * Splits a document's extracted_text into overlapping chunks,
 * generates OpenAI embeddings for each chunk, and stores them in document_chunks.
 */
export async function processDocument({ documentId, businessId }: ProcessInput): Promise<void> {
  // 1. Fetch the document
  const document = await prisma.document.findFirst({
    where: { id: documentId, businessId },
  });
  if (!document?.extractedText) {
    throw new Error(`Document ${documentId} has no extracted text.`);
  }

  // 2. Update status to processing
  await prisma.document.update({
    where: { id: documentId },
    data: { processingStatus: 'processing' },
  });

  try {
    // 3. Chunk the text
    const chunks = chunkText(document.extractedText, CHUNK_SIZE, CHUNK_OVERLAP);

    // 4. Generate embeddings in batches of 20
    const BATCH_SIZE = 20;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const embeddingResponse = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map((c) => c.text),
      });

      // 5. Store each chunk with its embedding using raw SQL for pgvector
      for (let j = 0; j < batch.length; j++) {
        const embedding = embeddingResponse.data[j].embedding;
        const embeddingLiteral = `[${embedding.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO document_chunks (id, business_id, document_id, chunk_index, chunk_text, embedding, token_count, metadata, created_at)
          VALUES (
            gen_random_uuid(),
            ${businessId}::uuid,
            ${documentId}::uuid,
            ${i + j},
            ${batch[j].text},
            ${embeddingLiteral}::vector,
            ${batch[j].tokenEstimate},
            ${JSON.stringify({ chunkIndex: i + j })}::jsonb,
            NOW()
          )
        `;
      }
    }

    // 6. Mark as processed
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'processed' },
    });
  } catch (err) {
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'failed' },
    });
    throw err;
  }
}

// ─── RAG Question Answering ───────────────────────────────────────────────────

interface AskInput {
  businessId: string;
  question: string;
}

interface RagAnswer {
  answer: string;
  sources: { documentId: string; chunkText: string; similarity: number }[];
}

/**
 * Embeds the user's question, finds the most similar document chunks
 * (scoped to the business), then sends context + question to GPT for an answer.
 */
export async function answerQuestion({ businessId, question }: AskInput): Promise<RagAnswer> {
  // 1. Embed the question
  const embedResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: question,
  });
  const queryEmbedding = embedResponse.data[0].embedding;
  const embeddingLiteral = `[${queryEmbedding.join(',')}]`;

  // 2. Vector similarity search (tenant-scoped)
  const chunks = await prisma.$queryRaw<
    { document_id: string; chunk_text: string; similarity: number }[]
  >`
    SELECT
      document_id::text,
      chunk_text,
      1 - (embedding <=> ${embeddingLiteral}::vector) AS similarity
    FROM document_chunks
    WHERE business_id = ${businessId}::uuid
    ORDER BY embedding <=> ${embeddingLiteral}::vector
    LIMIT ${RAG_TOP_K}
  `;

  // 3. Build context from top-k chunks
  const context = chunks.map((c, i) => `[Source ${i + 1}]: ${c.chunk_text}`).join('\n\n');

  // 4. Call GPT with context + question
  const completion = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL ?? 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful business assistant. Answer questions based only on the provided context from the business documents. If the answer is not in the context, say so clearly.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });

  const answer = completion.choices[0].message.content ?? 'Unable to generate an answer.';

  return {
    answer,
    sources: chunks.map((c) => ({
      documentId: c.document_id,
      chunkText: c.chunk_text.slice(0, 200) + '...',
      similarity: Number(c.similarity.toFixed(4)),
    })),
  };
}

// ─── Text chunking ────────────────────────────────────────────────────────────

function chunkText(text: string, chunkSize: number, overlap: number) {
  const words = text.split(/\s+/);
  const chunks: { text: string; tokenEstimate: number }[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const slice = words.slice(i, i + chunkSize).join(' ');
    if (slice.trim().length > 0) {
      chunks.push({ text: slice, tokenEstimate: Math.ceil(slice.length / 4) });
    }
  }

  return chunks;
}
