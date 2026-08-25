import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const WELCOME = {
  role: 'assistant',
  content: "Hi! Welcome to Arcan Painting. How can I help you today?",
  showChips: true,
  chips: [
    { label: "Discuss a Project", action: "quote" },
    { label: "📞 Call Us", action: "call" },
    { label: "Talk to a Human", action: "human" },
    { label: "View Our Pricing", action: "pricing" },
    { label: "Our Services", action: "services" },
  ]
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && !localStorage.getItem('arcan_chat_started')) {
        setShowEmailForm(true);
      } else {
        inputRef.current?.focus();
      }
    }
  }, [isOpen]);

  // Hide chat button when any modal (LeadFormPopup) is open
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOpen = () => setIsModalOpen(true);
    const onClose = () => setIsModalOpen(false);
    window.addEventListener('modal:open', onOpen);
    window.addEventListener('modal:close', onClose);
    // Also check for common modal selectors
    const observer = new MutationObserver(() => {
      const modal = document.querySelector('[class*="fixed inset-0"][class*="z-50"]:not([class*="chat"])');
      setIsModalOpen(!!modal);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('modal:open', onOpen);
      window.removeEventListener('modal:close', onClose);
      observer.disconnect();
    };
  }, []);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (email) localStorage.setItem('arcan_chat_email', email);
      localStorage.setItem('arcan_chat_started', 'true');
    }
    setShowEmailForm(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSkipEmail = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('arcan_chat_started', 'true');
    }
    setShowEmailForm(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleChipAction = async (action) => {
    switch (action) {
      case 'quote':
        setIsOpen(false);
        window.location.href = '#quote';
        break;
      case 'call':
        await new Promise(r => setTimeout(r, 500));
        window.location.href = 'tel:+14167272148';
        break;
      case 'human':
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Of course! One of our team members will be with you shortly. In the meantime, you can reach us directly at 📞 +1 (416) 727-2148 or email us at info@arcanpainting.ca. What's the best number to reach you?"
        }]);
        break;
      case 'pricing':
        window.location.href = '#pricing';
        break;
      case 'services':
        window.location.href = '#services';
        break;
      default:
        break;
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Sorry, something went wrong.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again or contact us at info@arcanpainting.ca." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Use mounted check to avoid SSR/client hydration mismatch (React #418).
  // On the server, window is undefined so we can't check pathname — render null on both
  // sides until mounted, then conditionally hide on admin pages.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  if (window.location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .animate-bounce-dot {
          animation: bounce-dot 1.2s ease-in-out infinite;
        }
        .chat-fade-in {
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {!isOpen && !isModalOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-[110] w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="chat-fade-in fixed bottom-6 right-6 z-[110] w-[390px] max-w-[90vw] h-[560px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Arcan Painting</h3>
                <p className="text-[10px] text-amber-100">Online · Typically replies instantly</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="p-1 hover:bg-amber-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Email capture overlay */}
          {showEmailForm && (
            <div className="absolute inset-0 bg-white z-10 flex flex-col p-6 chat-fade-in" style={{ top: '60px' }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to Arcan Painting! 👋</h3>
                <p className="text-sm text-slate-600">Hi there! How can we help you today?</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com (optional)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-colors"
                >
                  Let's Chat! →
                </button>
              </form>

              <div className="mt-5">
                <p className="text-xs text-slate-400 text-center mb-3">Or pick a quick option:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => { handleSkipEmail(); setMessages([WELCOME]); window.location.href = '#quote'; }}
                    className="px-3 py-2 border border-amber-400 text-amber-600 rounded-full text-xs font-medium hover:bg-amber-500 hover:text-white transition-colors"
                  >
                    Discuss a Project
                  </button>
                  <a
                    href="tel:+14167272148"
                    className="px-3 py-2 border border-amber-400 text-amber-600 rounded-full text-xs font-medium hover:bg-amber-500 hover:text-white transition-colors"
                  >
                    📞 Call Us
                  </a>
                  <button
                    onClick={() => { handleSkipEmail(); setMessages([WELCOME]); }}
                    className="px-3 py-2 border border-amber-400 text-amber-600 rounded-full text-xs font-medium hover:bg-amber-500 hover:text-white transition-colors"
                  >
                    Talk to a Human
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.showChips && msg.chips && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.chips.map((chip, ci) => (
                        <button
                          key={ci}
                          onClick={() => {
                            setMessages(prev => [...prev, { role: 'user', content: chip.label }]);
                            handleChipAction(chip.action);
                          }}
                          className="px-3 py-1.5 border border-amber-400 text-amber-600 rounded-full text-xs font-medium hover:bg-amber-500 hover:text-white transition-colors"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
