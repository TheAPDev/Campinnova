import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};



type ChatBotProps = {
  onClose: () => void;
};

// Simple memory base for context
const MAX_MEMORY = 10;



export default function ChatBot({ onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  // LocalStorage keys
  const CHAT_STORAGE_KEY = 'campinnova_chat_history';
  const CHAT_START_KEY = 'campinnova_chat_started_at';

  // Load chat history from localStorage on mount
  useEffect(() => {
    // Always start fresh chat on mount
    setMessages([
      {
        id: '1',
        text: "Hi — I’m Campinnova. I’m here to listen. What’s on your mind today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    localStorage.setItem(CHAT_START_KEY, new Date().toISOString());
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([
      {
        id: '1',
        text: "Hi — I’m Campinnova. I’m here to listen. What’s on your mind today?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      },
    ]));
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }))));
    // If this is the first message, set the start time
    if (!localStorage.getItem(CHAT_START_KEY)) {
      localStorage.setItem(CHAT_START_KEY, messages[0].timestamp.toISOString());
    }
  }, [messages]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Simple memory base
  const memory = useRef<Message[]>([]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Telemetry event output
  function emitEvent(_userMsg: string, _botMsg: string, riskFlag: string, consentGiven: boolean, escalationTriggered: boolean) {
    // For developer: replace with actual analytics integration
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      event: 'user_message',
      sentiment: riskFlag === 'high' ? 'high' : riskFlag === 'moderate' ? 'med' : 'low',
      risk_flag: riskFlag,
      consent_given: consentGiven,
      escalation_triggered: escalationTriggered,
      timestamp: new Date().toISOString(),
    }));
  }

  // Safety & escalation detection
  function detectRisk(text: string): 'none' | 'low' | 'moderate' | 'high' {
    const lower = text.toLowerCase();
    if (/i want to die|i will hurt myself|i'm thinking of suicide|suicide|kill myself|end my life/.test(lower)) {
      return 'high';
    }
    if (/worthless|hopeless|can't go on|no way out|panic|anxiety|lonely|depressed/.test(lower)) {
      return 'moderate';
    }
    return 'none';
  }

  // Consent detection
  function detectConsent(text: string): boolean {
    return /yes|allow|consent|ok/i.test(text);
  }

  // Main send handler (calls backend API for AI response)
  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Add to memory
    memory.current = [...memory.current, userMessage].slice(-MAX_MEMORY);

    // Safety & escalation
    const risk = detectRisk(input);
    let consentGiven = detectConsent(input);
    let escalationTriggered = false;
    let botText = '';

    // Emergency helpline info
    const helpline = '\n\nIf you are in crisis, please call the National Helpline for Mental Health: 9152987821 or 9152987820 (KIRAN), or visit https://www.mohfw.gov.in/pdf/helpline.pdf for more resources.';

    if (risk === 'high') {
      escalationTriggered = true;
      botText =
        "I’m really sorry you’re feeling so overwhelmed. I’m here with you. Are you thinking of harming yourself?" + helpline;
    } else if (risk === 'moderate') {
      botText =
        "I’m hearing that it’s been getting harder recently. Would you like me to connect you with a campus counselor or a trained peer supporter? You can also keep chatting with me — whichever feels better.";
    } else {
      // Call backend API for AI response
      try {
        const res = await fetch('http://localhost:5174/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Optionally add session ID for memory
            //'X-Session-ID': 'frontend',
          },
          body: JSON.stringify({ message: input }),
        });
        const data = await res.json();
        if (res.ok && data.response) {
          botText = data.response;
        } else {
          botText = `Sorry, I’m having trouble connecting right now. (${data.error || 'Proxy/API error'})`;
        }
      } catch (err) {
        const errorMsg = (err as Error)?.message || 'Network/API error';
        botText = `Sorry, I’m having trouble connecting right now. (${errorMsg})`;
      }
    }

    // If escalation consent, send alert (simulated)
    if (escalationTriggered && consentGiven) {
      // eslint-disable-next-line no-console
      console.log('ALERT: campus crisis team notified (anonymized)');
    }

    // Add bot message
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botText,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    memory.current = [...memory.current, botMessage].slice(-MAX_MEMORY);
    setLoading(false);

    emitEvent(userMessage.text, botText, risk, consentGiven, escalationTriggered);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Campinnova</h2>
              <p className="text-sm text-slate-400">Always here to listen</p>
            </div>
          </div>
          <button
            onClick={() => {
              // Optionally, you can save chat here again if needed
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-slate-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
