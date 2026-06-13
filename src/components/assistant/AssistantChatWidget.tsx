import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, BookOpen, ArrowRight, User, GraduationCap, Rocket, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SpecializationBuilderOverlay } from './SpecializationBuilderOverlay';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

interface AssistantChatWidgetProps {
  onNavigateToProduct: (productId: string) => void;
  onNavigateToScreen?: (screen: string, section?: string) => void;
}

export function AssistantChatWidget({ onNavigateToProduct, onNavigateToScreen }: AssistantChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [productContext, setProductContext] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Syllabus generation flow
  const [isSyllabusOverlayOpen, setIsSyllabusOverlayOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInquiryTriggered = useRef(false);

  // Programmatic product details inquiry
  async function triggerProductInquiry(productId: string, productTitle: string) {
    isInquiryTriggered.current = true;
    setIsOpen(true);
    setLoading(true);
    setProductContext(productId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

      // 1. Fetch active history and conversationId for this product context
      const historyResponse = await fetch(
        `${backendUrl}/api/assistant/history?productId=${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      const historyResult = await historyResponse.json();
      let activeConvId = conversationId;
      let existingMessages: Message[] = [];
      if (historyResult.success) {
        existingMessages = historyResult.messages || [];
        setMessages(existingMessages);
        setConversationId(historyResult.conversationId);
        activeConvId = historyResult.conversationId;
      }

      // 2. If there are already messages in this conversation, do not send the inquiry again
      if (existingMessages.length > 0) {
        setLoading(false);
        return;
      }

      // 3. Otherwise, send the programmatic inquiry message
      const userText = `Gostaria de obter detalhes sobre o produto "${productTitle}".`;
      const tempUserMsg: Message = {
        id: `temp-user-${Date.now()}`,
        sender: 'user',
        content: userText,
        created_at: new Date().toISOString()
      };
      setMessages([tempUserMsg]);

      const response = await fetch(`${backendUrl}/api/assistant/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: userText,
          conversationId: activeConvId || undefined,
          productContext: productId,
          agentType: 'platform_assistant'
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
      console.error('Error sending product inquiry message:', err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: 'Desculpe, tive um problema ao buscar as informações do produto com o assistente. Por favor, tente perguntar novamente.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Listen for the custom event to open the chat and ask about a product
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvt = e as CustomEvent<{ productId: string; productTitle: string }>;
      const { productId, productTitle } = customEvt.detail || {};
      if (productId && productTitle) {
        void triggerProductInquiry(productId, productTitle);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('open-assistant-chat', handleOpenChat);
    return () => {
      window.removeEventListener('open-assistant-chat', handleOpenChat);
    };
  }, [conversationId]);

  // Listen for the custom event to open the specialization builder
  useEffect(() => {
    const handleOpenSpecialization = () => {
      setIsOpen(false);
      setIsSyllabusOverlayOpen(true);
    };

    window.addEventListener('open-specialization-builder', handleOpenSpecialization);
    return () => {
      window.removeEventListener('open-specialization-builder', handleOpenSpecialization);
    };
  }, []);

  // Load chat history and initiate proactive greetings on mount or when context changes
  useEffect(() => {
    if (isOpen) {
      if (isInquiryTriggered.current) {
        isInquiryTriggered.current = false;
        setHasUnread(false);
      } else {
        void loadAndInitiate();
        setHasUnread(false);
      }
    } else {
      // Reset product context when chat is closed
      setProductContext(null);
      isInquiryTriggered.current = false;
    }
  }, [isOpen, productContext]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function loadAndInitiate() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      // 1. Fetch active history and conversationId for current productContext
      const historyResponse = await fetch(
        `${backendUrl}/api/assistant/history${productContext ? `?productId=${productContext}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      const historyResult = await historyResponse.json();
      let activeConvId = conversationId;
      if (historyResult.success) {
        setMessages(historyResult.messages || []);
        setConversationId(historyResult.conversationId);
        activeConvId = historyResult.conversationId;
      }

      // 2. Initiate proactive greeting/response check
      const initiateResponse = await fetch(`${backendUrl}/api/assistant/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          conversationId: activeConvId || undefined,
          productId: productContext || undefined,
          agentType: 'platform_assistant'
        })
      });
      const initiateResult = await initiateResponse.json();
      if (initiateResult.success) {
        setMessages(initiateResult.messages || []);
        if (initiateResult.conversationId) {
          setConversationId(initiateResult.conversationId);
        }
      }
    } catch (err) {
      console.error('Error loading and initiating assistant:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNewSession = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/assistant/new-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ productId: productContext || undefined })
      });
      const result = await res.json();
      if (result.success) {
        setMessages([]);
        setConversationId(result.conversationId);
        
        // Initiate new chat session proactive greeting
        const initRes = await fetch(`${backendUrl}/api/assistant/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ 
            conversationId: result.conversationId, 
            productId: productContext || undefined,
            agentType: 'platform_assistant' 
          })
        });
        const initData = await initRes.json();
        if (initData.success) {
          setMessages(initData.messages || []);
        }
      }
    } catch (err) {
      console.error('Error starting new session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
          productContext: productContext || undefined,
          agentType: 'platform_assistant'
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
        content: 'Desculpe, tive um problema de conexão com o servidor e não consegui processar sua resposta. Por favor, tente enviar novamente em alguns segundos.',
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
    <div className="fixed bottom-[24px] right-[24px] z-50 flex flex-col items-end max-w-[calc(100vw-48px)]">
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`w-[calc(100vw-48px)] max-h-[calc(100vh-120px)] bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.65),_0_0_40px_rgba(192,193,255,0.05)] flex flex-col mb-[16px] overflow-hidden transition-all duration-300 ${
              isMaximized 
                ? 'sm:w-[700px] h-[750px]' 
                : 'sm:w-[380px] h-[550px]'
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/[0.04] to-transparent relative">
              {/* Left: New Session */}
              <div className="flex items-center justify-start w-10">
                <button
                  onClick={handleNewSession}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white transition-all disabled:opacity-40"
                  title="Nova Conversa"
                >
                  <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Center: Centered Logo and Beta Flag */}
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white leading-none">
                    CodeEngine AI
                  </h3>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] font-bold text-primary uppercase tracking-wider leading-none">
                    Beta
                  </span>
                </div>
                <span className="font-sans text-[9px] text-on-surface-variant/50 mt-1 block">
                  Assistente de IA
                </span>
              </div>

              {/* Right: Maximize & Close */}
              <div className="flex items-center justify-end gap-1 w-16">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white transition-all"
                  title={isMaximized ? "Minimizar Chat" : "Maximizar Chat"}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-white transition-all"
                  title="Fechar Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
                    Olá! Comece uma conversa comigo para tirar suas dúvidas.
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
                    <div className="flex flex-col gap-2 min-w-0">
                      <div
                        className={`font-sans text-sm leading-relaxed ${
                          isAI
                            ? 'bg-transparent border-none shadow-none text-white/90 px-0.5 py-1'
                            : 'bg-white/10 border border-white/5 text-white font-medium rounded-2xl rounded-tr-none px-4 py-2.5 shadow-none'
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
                  <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 text-primary text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-transparent border-none shadow-none text-white/50 px-0.5 py-1 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="font-sans text-xs">Processando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Card Container */}
            <div className="p-4 bg-transparent border-t border-white/5">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 flex flex-col gap-2 focus-within:border-white/20 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escreva sua dúvida..."
                  disabled={loading}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputText.trim() && !loading) {
                        void handleSendMessage();
                      }
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-white placeholder-white/30 font-sans text-xs sm:text-sm resize-none px-2 py-1 leading-relaxed"
                />
                
                <div className="flex items-center justify-between border-t border-white/5 pt-2 px-1">
                  {/* Left: Active Context Badge */}
                  <div className="flex-grow flex justify-start items-center">
                    {productContext && (
                      <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        <span>📖 1 selecionado</span>
                        <button
                          type="button"
                          onClick={() => setProductContext(null)}
                          className="p-0.5 rounded hover:bg-primary/20 transition-colors text-primary"
                          title="Limpar contexto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || loading}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      inputText.trim() && !loading
                        ? 'bg-gradient-to-tr from-primary to-secondary text-white hover:brightness-110 shadow-lg shadow-primary/20'
                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
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

      <SpecializationBuilderOverlay
        isOpen={isSyllabusOverlayOpen}
        onClose={() => setIsSyllabusOverlayOpen(false)}
        onSuccess={() => {
          setIsSyllabusOverlayOpen(false);
          onNavigateToScreen?.('member', 'especializacoes');
        }}
      />
    </div>
  );
}
