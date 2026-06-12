import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, SendHorizontal, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I am the Luxarion Lead AI Graphics Engineer. 
How can I assist you today? I can help you draft optimized TSL (Three Shader Language) expression nodes, write high-performance WebGPU compute pipelines, structure positional spatial audio layouts, or customize post-processing templates.

Select a quick topic below or write your own shader layout idea!`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on message changes
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setInputValue('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server-side API failed to fetch.');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Gemini API call failed:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Processing Error: ${err.message || 'I was unable to establish connection with the AI server. Please make sure process.env.GEMINI_API_KEY is configured under Settings > Secrets.'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Wave Deform TSL', query: 'How do I deform mesh vertices along normals using a sine frequency wave inside Luxarion TSL? Show me the TSL code snippet.' },
    { label: 'WebGPU Compute Buffer', query: 'Under WebGPU rendering, how are StorageBufferNodes set up to stream parallel physics vectors? Give a clear annotated guide.' },
    { label: 'Draft Custom Post-Process', query: 'Outline the steps to write a dynamic Chroma aberration glitch shader pass inside Luxarion.' },
  ];

  return (
    <div id="ai-assistant" className="flex flex-col h-full bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Top Header */}
      <div className="bg-[#11111a] border-b border-gray-850 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest font-sans">
              Luxarion Lead AI Engineer
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Powered by gemini-3.5-flash server proxy
            </p>
          </div>
        </div>
        <div className="bg-purple-950/20 border border-purple-800/60 px-2 py-0.5 rounded text-[10px] text-purple-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Autonomous GPU Architect
        </div>
      </div>

      {/* Chat Messages Thread panel */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[350px] lg:max-h-[420px] bg-[#06060a]">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <div className="w-7 h-7 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs font-sans leading-relaxed text-gray-200 ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-500/10'
                  : 'bg-gray-900 border border-gray-850 rounded-bl-none'
              }`}
            >
              {/* Simple inline markdown formatter */}
              <div className="whitespace-pre-wrap select-text">
                {m.content}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-gray-900 border border-gray-850 max-w-[85%] rounded-xl px-3.5 py-3 text-xs text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="font-mono text-[10px] uppercase ml-1">Analyzing TSL shader matrices...</span>
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Quick Prompts tray */}
      <div className="bg-[#08080d] p-3 border-t border-gray-850">
        <span className="text-[10px] text-gray-500 block mb-2 font-mono uppercase tracking-widest">
          Quick Topics:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSend(p.query)}
              disabled={loading}
              className="text-[10px] px-2.5 py-1.5 rounded border border-gray-800 bg-[#0c0c14] text-gray-400 hover:text-purple-300 hover:border-purple-800 hover:bg-purple-950/10 cursor-pointer transition disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input panel Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="p-3 bg-[#0a0a10] border-t border-gray-850 flex gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Lead AI Architect a graphics or shader compilation query..."
          disabled={loading}
          className="flex-1 bg-[#050508] border border-gray-800 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-purple-500 text-gray-300 focus:ring-1 focus:ring-purple-500/20 transition"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 text-white p-2 rounded-lg transition shrink-0"
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
