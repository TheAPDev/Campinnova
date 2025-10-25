import { useState } from 'react';
import { Home, MessageCircle, Bot, Users } from 'lucide-react';
import ChatBot from './ChatBot';

type BottomNavProps = {
  activePage?: string;
  onNavigate?: (page: string) => void;
};

export default function BottomNav({ activePage = 'home', onNavigate }: BottomNavProps) {
  const [showChatBot, setShowChatBot] = useState(false);

  function handleNavigation(page: string) {
    if (page === 'chatbot') {
      setShowChatBot(true);
    } else if (onNavigate) {
      onNavigate(page);
    }
  }

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'counselling', icon: MessageCircle, label: 'Counselling' },
    { id: 'chatbot', icon: Bot, label: 'AI Chat' },
    { id: 'groups', icon: Users, label: 'Groups' },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-xl border-t border-slate-700/50 z-40">
        <div className="max-w-md mx-auto px-2 py-1">
          <div className="flex items-center justify-around gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all text-xs font-normal ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-500/20 to-blue-500/20 text-teal-400'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-teal-500 to-blue-500 shadow-lg shadow-teal-500/30 scale-105'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} />}
    </>
  );
}
