import { Router, Request, Response } from 'express';
import { processDocument } from '../services/ragService';
import { answerQuestion } from '../services/ragService';

export const ragRouter = Router();

/**
 * POST /rag/process
 * Body: { documentId, businessId }
 * Chunks the document extracted text and stores embeddings in document_chunks.
 */
ragRouter.post('/process', async (req: Request, res: Response) => {
  try {
    const { documentId, businessId } = req.body as { documentId: string; businessId: string };
    await processDocument({ documentId, businessId });
    res.json({ success: true, message: 'Document processed and embeddings stored.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /rag/ask
 * Body: { businessId, question }
 * Retrieves relevant document chunks via vector similarity, then generates an answer.
 */
ragRouter.post('/ask', async (req: Request, res: Response) => {
  try {
    const { businessId, question } = req.body as { businessId: string; question: string };
    const answer = await answerQuestion({ businessId, question });
    res.json({ success: true, data: answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});
