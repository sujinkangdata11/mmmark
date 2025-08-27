
import React from 'react';
import { AutomationConfig } from '../types';

// This combines the necessary fields from both DailyStat and AutomationConfig
interface EnrichedStat extends AutomationConfig {
  completed: number;
  goal: number;
}

interface DailyProgressProps {
  stats: EnrichedStat[];
}

const DailyProgress: React.FC<DailyProgressProps> = ({ stats }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-12 animate-[fadeIn_0.5s_ease-in-out]">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400 border-b border-gray-700 pb-3">
        오늘의 진행 상황
      </h2>
      <div className="space-y-6">
        {stats.map((stat) => {
          const percentage = stat.goal > 0 ? (stat.completed / stat.goal) * 100 : 0;
          return (
            <div key={stat.id}>
              <div className="flex items-center space-x-3 mb-2">
                {stat.icon}
                <span className="font-semibold text-white">{stat.title}</span>
                <span className="text-sm text-gray-400 ml-auto">
                  {stat.completed} / {stat.goal}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={stat.completed}
                  aria-valuemin={0}
                  aria-valuemax={stat.goal}
                  aria-label={`${stat.title} progress`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyProgress;
