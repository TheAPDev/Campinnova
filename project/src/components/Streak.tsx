import React from "react";
import { Flame } from "lucide-react";

interface StreakProps {
  dates: Array<{ date: Date; visited: boolean }>;
  selectedDate: Date;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDate(date: Date) {
  return date.getDate();
}

export const Streak: React.FC<StreakProps> = ({ dates, selectedDate }) => {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-center gap-4 mb-8">
        {dates.map((d, idx) => {
          const isToday = d.date.toDateString() === selectedDate.toDateString();
          return (
            <div
              key={idx}
              className={`flex flex-col items-center px-8 py-6 rounded-xl border border-gray-700 relative transition-all duration-200 ${
                isToday ? "bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg" : "bg-gray-900 opacity-60"
              }`}
              style={{ minWidth: 90 }}
            >
              <span className="text-lg mb-2 text-gray-300">{formatDay(d.date)}</span>
              <span className={`text-3xl font-bold ${isToday ? "text-white" : "text-gray-500"}`}>{formatDate(d.date)}</span>
              {isToday && (
                <Flame className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-400" size={32} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-xl mt-4 text-cyan-300">
        Selected: <span className="font-bold">{selectedDate.toDateString()}</span>
      </div>
    </div>
  );
};
