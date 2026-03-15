'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { mockAIMessages, mockSuggestedPrompts } from '@/lib/mockData';
import { Send, Paperclip, Bot } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const mockResponses: Record<string, string> = {
  'reorder': "Based on current stock levels, I recommend reordering:\n\n• **Cooking Oil 2L** — only 4 units left (reorder 100)\n• **Black Pepper 50g** — only 3 units left (reorder 50)\n• **Wheat Flour 2kg** — out of stock (reorder 40)\n• **Tomato Paste 200g** — 7 units left (reorder 60)\n\nTotal estimated reorder cost: ~$480",
  'top customers': "Your top customers this month:\n\n1. **Priya Nair** — $3,450.00 (31 orders)\n2. **Aisha Patel** — $2,104.00 (22 orders)\n3. **Fatima Al-Ali** — $1,780.00 (18 orders)\n\nPriya Nair spends 3× more than the average customer.",
  'profit': "Your profit trend over the last 6 months:\n\n• Oct: $9,200\n• Nov: $11,700\n• Dec: $17,400 (holiday peak)\n• Jan: $10,000\n• Feb: $13,400\n• Mar: $7,800 (month in progress)\n\nOverall trend is **positive** — up 46% since October.",
  'overstock': "Products with excess stock relative to predicted demand:\n\n• **Instant Noodles** — 200 units in stock, only 80 predicted demand\n• **Mineral Water 1L** — 120 units, demand is stable\n\nConsider running a promotion on Instant Noodles to clear stock.",
};

function getResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('reorder') || lower.includes('stock')) return mockResponses['reorder'];
  if (lower.includes('customer')) return mockResponses['top customers'];
  if (lower.includes('profit') || lower.includes('trend')) return mockResponses['profit'];
  if (lower.includes('overstock') || lower.includes('excess')) return mockResponses['overstock'];
  return "I analyzed your business data and found some interesting patterns. Could you be more specific about what you'd like to know? Try asking about reorders, customers, profit trends, or inventory.";
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(mockAIMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getResponse(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  }

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="AI Assistant" subtitle="Ask anything about your business" />

      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        {/* Chat area */}
        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-indigo-600" />
                </div>
              )}
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-semibold text-slate-600">SA</span>
                </div>
              )}

              <div className={cn('max-w-2xl', msg.role === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'assistant'
                      ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  )}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <p key={`line-${i}`} className={cn(line.startsWith('•') ? 'ml-2' : '', i > 0 ? 'mt-1' : '')}>
                      {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                  ))}
                </div>
                <span className="text-xs text-slate-400">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        <div className="flex flex-wrap gap-2">
          {mockSuggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="text-xs text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-full px-3 py-1.5 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus-within:border-indigo-300 transition-colors">
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask something about your business..."
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-white disabled:text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
