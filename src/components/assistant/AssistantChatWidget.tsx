import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, BookOpen, ArrowRight, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

interface AssistantChatWidgetProps {
  onNavigateToProduct: (productId: string) => void;
}

export function AssistantChatWidget({ onNavigateToProduct }: AssistantChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount (only when open)
  useEffect(() => {
    if (isOpen) {
      void loadHistory();
      setHasUnread(false);
    }
  }, [isOpen]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function loadHistory() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/assistant/history`, {
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
      console.error('Error loading assistant history:', err);
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
          conversationId: conversationId || undefined
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
      // Fallback message if server error
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: 'Desculpe, tive um problema de conexão com a VPS e não consegui processar sua resposta. Por favor, tente enviar novamente em alguns segundos.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Parses assistant messages to extract product recommendations
  const parseMessageContent = (content: string) => {
    const recommendRegex = /\[RECOMMEND:\s*([a-zA-Z0-9-]+)\s*\|\s*([^\]]+)\]/g;
    const recommendations: { productId: string; actionText: string }[] = [];
    
    let cleanContent = content;
    let match;
    while ((match = recommendRegex.exec(content)) !== null) {
      recommendations.push({
        productId: match[1].trim(),
        actionText: match[2].trim()
      });
    }
    
    cleanContent = content.replace(recommendRegex, '').trim();

    return {
      text: cleanContent,
      recommendations
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-[90vw] sm:w-[380px] h-[550px] bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.65),_0_0_40px_rgba(192,193,255,0.05)] flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent relative">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 relative">
                  <Bot className="w-5 h-5 text-primary" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-surface rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white leading-none flex items-center gap-1.5">
                    CodeEngine Assistant
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  </h3>
                  <span className="font-sans text-[10px] text-on-surface-variant/70 mt-1 block">Consultor Pessoal Ativo</span>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 text-on-surface-variant hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div 
              ref={chatContainerRef}
              className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col scrollbar-thin"
            >
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-on-surface-variant" />
                  </div>
                  <p className="font-sans text-xs text-on-surface-variant/80 max-w-[200px]">
                    Olá! Comece uma conversa comigo para traçar seu plano de estudos.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isAI = msg.sender === 'assistant';
                const { text, recommendations } = parseMessageContent(msg.content);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 max-w-[85%] ${
                      isAI ? 'self-start' : 'self-end flex-row-reverse'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                        isAI
                          ? 'bg-primary/20 border border-primary/30 text-primary'
                          : 'bg-white/10 border border-white/15 text-white'
                      }`}
                    >
                      {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-2">
                      <div
                        className={`rounded-2xl px-4 py-2.5 font-sans text-sm leading-relaxed ${
                          isAI
                            ? 'bg-white/5 border border-white/10 text-on-surface-variant/95 rounded-tl-none'
                            : 'bg-primary text-on-primary font-medium rounded-tr-none shadow-[0_4px_12px_rgba(192,193,255,0.2)]'
                        }`}
                      >
                        {text}
                      </div>

                      {/* Render product recommendation buttons */}
                      {isAI && recommendations.length > 0 && (
                        <div className="flex flex-col gap-2 mt-1">
                          {recommendations.map((rec, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                onNavigateToProduct(rec.productId);
                                setIsOpen(false);
                              }}
                              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/50 text-xs font-semibold text-primary transition-all duration-300 shadow-[0_0_15px_rgba(192,193,255,0.05)] hover:shadow-[0_0_20px_rgba(192,193,255,0.15)] group"
                            >
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                {rec.actionText}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-start gap-2.5 max-w-[85%] self-start animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-white/5 border border-white/10 text-on-surface-variant/70 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="font-sans text-xs">Consultando VPS...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/10 flex items-center gap-2 bg-background/50"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escreva sua dúvida..."
                disabled={loading}
                className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 font-sans text-xs sm:text-sm focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  inputText.trim() && !loading
                    ? 'bg-primary text-on-primary hover:bg-primary-fixed shadow-md shadow-primary/20'
                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-on-surface text-background hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5),_0_0_30px_rgba(192,193,255,0.2)] flex items-center justify-center hover:scale-105 relative group border border-white/10"
        aria-label="Abrir Assistente de IA"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Bot className="w-6 h-6" />
              {hasUnread && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 border-2 border-on-surface rounded-full animate-ping" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
