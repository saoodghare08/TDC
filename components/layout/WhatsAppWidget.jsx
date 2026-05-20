/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, Send, ChevronDown, ChevronUp, Link2, Instagram, Linkedin, Code, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'motion/react';

// Custom Official WhatsApp SVG Icon Component
const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.706 1.459h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// Resilient Offline Fallback Q&A Database
const fallbackFAQs = [
  {
    id: 1,
    question: "What diet plans do you offer?",
    answer: "We offer customized diet plans tailored to your food preferences, lifestyle, and fitness goals:\n\n- 🏋️ **Body Transformation** (fat loss/muscle gain)\n- 🥗 **Weight Loss/Gain**\n- 🌸 **PCOS Management**\n- 🤰 **Gestational & Postnatal Diets**\n- 🩺 **Therapeutic Diets** (metabolic health)\n\nWe offer 1-month, 3-month, and 6-month durations!",
    keywords: ["plan", "plans", "offer", "duration", "months", "regimen", "regimens", "program", "programs"],
    is_preset: true
  },
  {
    id: 2,
    question: "How can I book a customized plan?",
    answer: "You can easily select and purchase a plan on our [Checkout Page](/checkout)! 💳\n\nAlternatively, you can chat directly with Dt. Sabah on WhatsApp to discuss your goals before booking.",
    keywords: ["book", "booking", "appointment", "consult", "consultation", "start", "join", "price", "pricing", "cost", "fees", "buy", "purchase"],
    is_preset: true
  },
  {
    id: 3,
    question: "Who is Dt. Sabah Ghare?",
    answer: "Dt. Sabah Ghare is a Clinical Dietitian & Lifestyle Coach, certified fitness coach, and professor of nutrition. She is the founder of The Diet Cascade and has helped over 5,000+ clients across 8+ countries achieve sustainable results without starvation or unnecessary supplements!",
    keywords: ["sabah", "ghare", "dietitian", "who", "founder", "coach", "doctor"],
    is_preset: true
  },
  {
    id: 4,
    question: "Where are you located?",
    answer: "We consult clients globally online! 🌐 For in-person visits, we are active in Navi Mumbai (India) and Ajman/Dubai/Sharjah (UAE). No matter where you are in the world, we can craft a plan that fits your local ingredients and schedule!",
    keywords: ["where", "location", "located", "office", "address", "city", "country", "india", "dubai", "uae", "sharjah", "ajman", "mumbai", "navi mumbai"],
    is_preset: true
  },
  {
    id: 5,
    question: "Can you help with PCOS or Therapeutic Diets?",
    answer: "Yes, absolutely! PCOS management and Therapeutic diets (like reversing metabolic issues, diabetes, and thyroid management) are our specialties. We focus on natural, balanced nutrition, active lifestyle adaptation, and proper sleep.",
    keywords: ["pcos", "diabetes", "thyroid", "therapeutic", "condition", "conditions", "disease", "diseases", "illness", "health", "medical", "pregnant", "gestational", "postnatal"],
    is_preset: false
  },
  {
    id: 6,
    question: "Who designed this website?",
    answer: "This website was designed and developed by Saood Ghare. You can view his work or get in touch with him through his [Developer Portfolio](https://saoodghare08.github.io/MyPortfolio/).",
    keywords: ["saood", "developer", "portfolio", "designed", "developed", "coder", "saoodghare"],
    is_preset: false
  }
];

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [faqs, setFaqs] = useState(fallbackFAQs);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Hi there! 👋 Welcome to The Diet Cascade (TDC).",
      timestamp: 'Just now'
    },
    {
      id: 'welcome-2',
      sender: 'ai',
      text: "I'm Dt. Sabah's AI assistant. How can I help you today? Select one of the questions below or type a custom question!",
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickLinks, setShowQuickLinks] = useState(false);

  const chatBottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const presetContainerRef = useRef(null);

  const [width, setWidth] = useState(56);
  const [height, setHeight] = useState(56);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Update visibility of scroll buttons based on container scroll coordinates
  const updateScrollButtons = () => {
    if (presetContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = presetContainerRef.current;
      setShowLeftScroll(scrollLeft > 2);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 2);
    }
  };

  // Scroll horizontal container smooth-scroll left or right
  const scrollPresets = (direction) => {
    if (presetContainerRef.current) {
      const scrollAmount = 160;
      presetContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Recalculate scroll buttons when widget opens or preset faqs change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        updateScrollButtons();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, faqs]);

  // Recalculate scroll buttons on window resizing
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updateScrollButtons);
      return () => window.removeEventListener('resize', updateScrollButtons);
    }
  }, [isOpen]);
  // Handle dynamic size calculations for spring animation on open/close
  useEffect(() => {
    if (!isOpen) {
      setWidth(56);
      setHeight(56);
      return;
    }

    const handleResize = () => {
      if (window.innerWidth < 640) {
        setWidth(window.innerWidth - 32);
        setHeight(window.innerHeight - 120);
      } else if (window.innerWidth < 768) {
        setWidth(360);
        setHeight(480);
      } else {
        setWidth(380);
        setHeight(520);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Handle click outside to close the widget
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch FAQs dynamically from Supabase database with Stale-While-Revalidate caching
  useEffect(() => {
    // 1. Try loading from cache immediately for instant UI render
    try {
      const cached = localStorage.getItem('tdc_chatbot_faqs');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFaqs(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached FAQs:', e);
    }

    // 2. Fetch fresh data in the background and update cache/state
    async function loadFaqs() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('chatbot_faqs')
          .select('*')
          .order('id');

        if (error) throw error;
        if (data && data.length > 0) {
          setFaqs(data);
          localStorage.setItem('tdc_chatbot_faqs', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Supabase chatbot_faqs table fetch failed. Falling back to cache/offline list.', err);
      }
    }
    loadFaqs();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Trigger typing simulation
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const query = text.toLowerCase().trim();
      let matchedFAQ = null;

      // Match against dynamic keywords
      for (const faq of faqs) {
        if (faq.keywords && Array.isArray(faq.keywords)) {
          const hasKeyword = faq.keywords.some(keyword => {
            const cleanKeyword = keyword.toLowerCase().trim();
            // Check full word or sub-word boundary matching
            const regex = new RegExp(`\\b${cleanKeyword}\\b|${cleanKeyword}`, 'i');
            return regex.test(query);
          });
          if (hasKeyword) {
            matchedFAQ = faq;
            break;
          }
        }
      }

      let replyText = "";
      let showWhatsappBtn = false;

      if (matchedFAQ) {
        replyText = matchedFAQ.answer;
      } else {
        replyText = "I want to make sure you get the most accurate advice! Let me redirect you to Dt. Sabah directly so she can help with your query.";
        showWhatsappBtn = true;
      }

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        showWhatsappBtn,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 800);
  };

  // Format message string helper (support links & bullet points)
  const renderMessageContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      let isListItem = false;
      let cleanLine = line;
      if (line.trim().startsWith('- ')) {
        isListItem = true;
        cleanLine = line.trim().substring(2);
      }

      const elements = [];
      let currentIdx = 0;
      const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
      let match;

      while ((match = regex.exec(cleanLine)) !== null) {
        const matchText = match[0];
        const matchIdx = match.index;

        if (matchIdx > currentIdx) {
          elements.push(cleanLine.substring(currentIdx, matchIdx));
        }

        if (matchText.startsWith('**') && matchText.endsWith('**')) {
          elements.push(<strong key={matchIdx} className="font-semibold text-slate-900">{matchText.slice(2, -2)}</strong>);
        } else if (matchText.startsWith('[') && matchText.includes('](')) {
          const closeBrack = matchText.indexOf(']');
          const linkText = matchText.slice(1, closeBrack);
          const url = matchText.slice(closeBrack + 2, -1);
          const isExternal = url.startsWith('http') || url.startsWith('https');

          elements.push(
            <a
              key={matchIdx}
              href={url}
              target={isExternal ? '_blank' : '_self'}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-[#027eb5] hover:underline font-medium inline-flex items-center gap-0.5"
              onClick={() => {
                if (!isExternal) {
                  setIsOpen(false); // Close widget for Next.js internal links
                }
              }}
            >
              {linkText}
            </a>
          );
        }

        currentIdx = regex.lastIndex;
      }

      if (currentIdx < cleanLine.length) {
        elements.push(cleanLine.substring(currentIdx));
      }

      if (isListItem) {
        return (
          <li key={lineIdx} className="ml-4 list-disc pl-0.5 mb-1 text-[13.5px] leading-relaxed text-slate-800">
            {elements}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="mb-1 last:mb-0 text-[13.5px] leading-relaxed text-slate-800">
          {elements}
        </p>
      );
    });
  };

  const presetFAQs = faqs.filter(faq => faq.is_preset);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=919004491160&text=Hi%20Dt.%20Sabah,%20I'm%20interested%20in%20your%20diet%20plans!`;

  return (
    <>
      {/* Dynamic Keyframe Styles */}
      <style jsx global>{`
        @keyframes wp-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.6);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }
        .wp-pulse-btn {
          animation: wp-pulse 2s infinite;
        }
        @keyframes dot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .bounce-dot {
          animation: dot-bounce 1s infinite ease-in-out;
        }
        .bounce-dot:nth-child(2) { animation-delay: 0.2s; }
        .bounce-dot:nth-child(3) { animation-delay: 0.4s; }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Morphing Widget Wrapper Container */}
      <motion.div
        ref={widgetRef}
        animate={{
          width: isOpen ? width : 56,
          height: isOpen ? height : 56,
          bottom: isOpen ? 24 : 24,
          borderRadius: isOpen ? 16 : 28,
          backgroundColor: isOpen ? '#ffffff' : '#25d366',
          borderColor: isOpen ? '#e5e7eb' : 'transparent',
        }}
        whileHover={!isOpen ? { scale: 1.08 } : undefined}
        whileTap={!isOpen ? { scale: 0.94 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        style={{
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 120px)',
          right: 24,
        }}
        onClick={!isOpen ? () => setIsOpen(true) : undefined}
        className={`fixed z-50 shadow-2xl overflow-hidden border ${!isOpen ? 'cursor-pointer text-white wp-pulse-btn' : ''
          }`}
      >
        <AnimatePresence>
          {!isOpen ? (
            /* Floating Trigger Button View */
            <motion.div
              key="trigger-btn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex items-center justify-center text-white"
              title="Chat with us"
            >
              <WhatsAppIcon size={32} />
            </motion.div>
          ) : (
            /* Active Chat Window View */
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Stop background clicks inside the open window
            >
              {/* Header */}
              <div className="bg-[#075e54] text-white p-4 flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-3">
                  {/* Sabah Avatar */}
                  <div className="relative w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-emerald-800">
                    <img
                      src="/images/dietitian.jpg"
                      alt="Dt. Sabah Ghare"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/default-logo.png'; }}
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] rounded-full border border-[#075e54]" />
                  </div>
                  {/* Header Info */}
                  <div>
                    <h4 className="font-heading font-semibold text-sm leading-tight text-white">Dt. Sabah Ghare</h4>
                    <p className="text-[11px] text-emerald-200/90 font-medium">TDC Assistant • Online</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening/triggering widget parent clicks
                    setIsOpen(false);
                  }}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Links Menu Dropdown */}
              <div className="bg-gray-50 border-b border-gray-150 shrink-0">
                <button
                  onClick={() => setShowQuickLinks(!showQuickLinks)}
                  className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-primary">
                    <Link2 size={13} /> Useful Quick Links
                  </span>
                  {showQuickLinks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showQuickLinks && (
                  <div
                    data-lenis-prevent
                    className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-2 animate-fade-in bg-white max-h-40 overflow-y-auto"
                  >
                    <Link
                      href="/blog"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-50 text-slate-700 hover:text-primary transition-colors font-medium border border-gray-100"
                    >
                      📖 Read Blogs
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-50 text-slate-700 hover:text-primary transition-colors font-medium border border-gray-100"
                    >
                      💳 Book a Plan
                    </Link>
                    <a
                      href="https://www.instagram.com/thedietcascade/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-50 text-slate-700 hover:text-primary transition-colors font-medium border border-gray-100"
                    >
                      <Instagram size={13} className="text-pink-600" /> Instagram
                    </a>
                    <a
                      href="https://www.linkedin.com/in/sabah-aslam-ghare-9125a3213/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 p-1.5 rounded hover:bg-gray-50 text-slate-700 hover:text-primary transition-colors font-medium border border-gray-100"
                    >
                      <Linkedin size={13} className="text-blue-600" /> LinkedIn
                    </a>
                    <a
                      href="https://saoodghare08.github.io/MyPortfolio/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-2 flex items-center justify-center gap-1.5 p-1.5 rounded hover:bg-gray-50 text-slate-700 hover:text-primary transition-colors font-medium border border-gray-100 bg-[#f9fafb]"
                    >
                      <Code size={13} className="text-purple-600" /> Designed by Saood (Developer)
                    </a>
                  </div>
                )}
              </div>

              {/* Chat History Area (WhatsApp BG + Lenis Scroll Prevent) */}
              <div
                ref={messagesContainerRef}
                data-lenis-prevent
                className="flex-1 overflow-y-auto p-4 space-y-3 relative bg-[#efeae2]"
                style={{
                  backgroundImage: "url('/images/wpbg.png')",
                  backgroundRepeat: "repeat",
                  backgroundSize: "280px",
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-2.5 px-3 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-sm relative ${msg.sender === 'user'
                          ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
                          : 'bg-white text-slate-800 rounded-tl-none'
                        }`}
                    >
                      {/* Message Content */}
                      <div className="break-words">
                        {renderMessageContent(msg.text)}
                      </div>

                      {/* Direct CTA inside chat if fallback triggered */}
                      {msg.showWhatsappBtn && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-1.5 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold py-2 px-3 rounded-full text-xs transition-colors shadow-sm cursor-pointer border border-[#20ba5a]"
                        >
                          <WhatsAppIcon size={14} /> Connect on WhatsApp
                        </a>
                      )}

                      {/* Message Bubble Footer / Meta Info */}
                      <div className="text-[9px] text-slate-400 text-right mt-1 select-none">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-md max-w-[85%]">
                      <div className="flex items-center gap-1 px-1 py-0.5">
                        <span className="w-2 h-2 bg-slate-400 rounded-full bounce-dot" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full bounce-dot" />
                        <span className="w-2 h-2 bg-slate-400 rounded-full bounce-dot" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Preset FAQs chips area (Horizontal scroll + scroll buttons + Lenis scroll prevent) */}
              {presetFAQs.length > 0 && (
                <div className="relative bg-[#efeae2]/45 border-t border-gray-150 shrink-0">
                  {/* Left scroll chevron */}
                  {showLeftScroll && (
                    <button
                      onClick={() => scrollPresets('left')}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 hover:bg-white border border-gray-200/80 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-700 active:scale-90 transition-all cursor-pointer"
                      title="Scroll left"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  )}

                  {/* Scrollable preset chips */}
                  <div
                    ref={presetContainerRef}
                    data-lenis-prevent
                    onScroll={updateScrollButtons}
                    className="px-3 py-2 overflow-x-auto scrollbar-hide flex gap-2 scroll-smooth"
                  >
                    {presetFAQs.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => handleSendMessage(faq.question)}
                        className="shrink-0 bg-white hover:bg-[#d9fdd3] text-primary hover:text-primary-hover border border-primary/20 hover:border-primary/45 rounded-full px-3 py-1 text-xs transition-colors font-medium cursor-pointer shadow-sm active:scale-95 duration-100"
                      >
                        {faq.question}
                      </button>
                    ))}
                  </div>

                  {/* Right scroll chevron */}
                  {showRightScroll && (
                    <button
                      onClick={() => scrollPresets('right')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 hover:bg-white border border-gray-200/80 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-700 active:scale-90 transition-all cursor-pointer"
                      title="Scroll right"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Input Bar */}
              <div className="bg-white p-3 border-t border-gray-200 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(inputValue);
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 hover:bg-gray-150/70 focus:bg-white text-slate-800 placeholder-slate-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#075e54] transition-all border border-transparent"
                />
                {inputValue.trim() ? (
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    className="bg-[#075e54] hover:bg-[#128c7e] text-white p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-md cursor-pointer active:scale-95"
                  >
                    <Send size={15} />
                  </button>
                ) : (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25d366] hover:bg-[#20ba5a] text-white p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-md cursor-pointer active:scale-95"
                    title="Chat on WhatsApp"
                  >
                    <WhatsAppIcon size={16} />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
