import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { Streak } from '../components/Streak';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { signOut } = useAuth();
  // Set today's date to October 26, 2025 for demo
  const today = new Date(2025, 9, 26); // Month is 0-indexed
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0);

  function getWeekDays(offset: number = 0) {
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (offset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  }

  const weekDays = getWeekDays(weekOffset);

  // Dummy visited logic: mark today and all previous days as visited, future days as not visited
  const streakDates = weekDays.map((date) => ({
    date,
    visited: date <= today,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 pb-24">
      <h1 className="font-bold text-5xl text-white text-center mb-10 tracking-wide montserrat">STREAK</h1>
      <div className="w-full max-w-4xl">
        <div className="flex flex-row items-center justify-center gap-8">
          <div className="flex flex-col justify-center">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700/50 hover:text-teal-400 hover:border-teal-500/50 transition-all hover:scale-110 active:scale-95 self-center"
              title="Previous Week"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <Streak dates={streakDates} selectedDate={selectedDate} />
          </div>

          <div className="flex flex-col justify-center">
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700/50 hover:text-teal-400 hover:border-teal-500/50 transition-all hover:scale-110 active:scale-95 self-center"
              title="Next Week"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Logout button bottom right, fits BottomNav */}
      <button
        onClick={async () => { await signOut(); }}
        className="fixed bottom-3 right-4 z-50 bg-gradient-to-br from-red-500 to-orange-400 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm hover:scale-105 transition-all flex items-center gap-2"
        style={{ minWidth: 90, height: '40px' }}
        title="Logout"
      >
        Logout
      </button>
    </div>
  );
}
