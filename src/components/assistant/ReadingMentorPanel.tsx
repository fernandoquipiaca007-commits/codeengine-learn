import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, Sparkles, Loader2, User, ChevronRight, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

interface ReadingMentorPanelProps {
  productId: string;
  productTitle: string;
  agentType?: 'ebook_mentor' | 'course_mentor';
}

export function ReadingMentorPanel({ productId, productTitle, agentType }: ReadingMentorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount or when productId changes
  useEffect(() => {
    void loadHistory();
  }, [productId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function loadHistory() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/assistant/history?productId=${productId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setMessages(result.messages || []);
        setConversationId(result.conversationId);
      }
    } catch (err) {
      console.error('Error loading mentor history:', err);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText('');
    setLoading(true);

    // Append user message locally
    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      sender: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/assistant/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: userText,
          conversationId: conversationId || undefined,
          productContext: productId, // Pass active book/course ID as context
          agentType: agentType || 'ebook_mentor'
        })
      });

      const result = await response.json();
      if (result.success && result.reply) {
        setMessages(prev => [...prev, {
          id: result.reply.id || `ai-${Date.now()}`,
          sender: 'assistant',
          content: result.reply.content,
          metadata: result.reply.metadata,
          created_at: result.reply.created_at
        }]);
        if (!conversationId) setConversationId(result.conversationId);
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending assistant message:', err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: 'Desculpe, tive um problema de comunicação com o assistente. Por favor, tente novamente.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface-lowest border-l border-white/10 overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-white/10 bg-white/[0.01] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider leading-none">Mentor de Aprendizado</h4>
            <span className="font-sans text-[10px] text-primary truncate max-w-[180px] block mt-1">
              Contexto: {productTitle}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full font-display text-[9px] font-bold text-primary tracking-widest uppercase">
          <Sparkles className="w-2.5 h-2.5" />
          Ativo
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={chatContainerRef}
        className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col scrollbar-thin bg-surface/30"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <HelpCircle className="w-10 h-10 text-on-surface-variant/40 mb-3" />
            <h5 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-1">Dúvidas sobre o conteúdo?</h5>
            <p className="font-sans text-[11px] text-on-surface-variant/70 max-w-[180px] leading-relaxed">
              Faça perguntas sobre os conceitos explicados neste material para que eu possa te ajudar na implementação prática.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isAI = msg.sender === 'assistant';
          // Filter out recommend commands from reading mentor display as they are not needed here
          const cleanContent = msg.content.replace(/\[RECOMMEND:\s*([a-zA-Z0-9-]+)\s*\|\s*([^\]]+)\]/g, '').trim();

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 max-w-[90%] ${
                isAI ? 'self-start' : 'self-end flex-row-reverse'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] ${
                  isAI
                    ? 'bg-primary/20 border border-primary/30 text-primary'
                    : 'bg-white/10 border border-white/15 text-white'
                }`}
              >
                {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`rounded-xl px-3 py-2 font-sans text-xs leading-relaxed ${
                  isAI
                    ? 'bg-white/5 border border-white/10 text-on-surface-variant/90 rounded-tl-none'
                    : 'bg-primary text-on-primary font-medium rounded-tr-none'
                }`}
              >
                {cleanContent}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2 max-w-[90%] self-start">
            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="rounded-xl rounded-tl-none px-3 py-2 bg-white/5 border border-white/10 text-on-surface-variant/60 flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="font-sans text-[10px]">Analisando material...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 border-t border-white/10 flex items-center gap-2 bg-surface-lowest"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tire suas dúvidas..."
          disabled={loading}
          className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 font-sans text-xs focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
            inputText.trim() && !loading
              ? 'bg-primary text-on-primary hover:bg-primary-fixed'
              : 'bg-white/5 text-white/20 border border-white/10'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
