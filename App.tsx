
import React, { useState, useMemo } from 'react';
import { AUTOMATION_CONFIGS } from './constants';
import { AutomationConfig, AutomationType, DailyStat, EnrichedStat } from './types';
import Dashboard from './components/Dashboard';
import RedditDashboard from './components/RedditDashboard';
import TwitterThreadsDashboard from './components/TwitterThreadsDashboard';
import YouTubeDashboard from './components/YouTubeDashboard';

// Card component updated to include progress visualization
interface AutomationCardProps {
  stat: EnrichedStat;
  onToggle: (id: AutomationType) => void;
  isExpanded: boolean;
}

const AutomationCard: React.FC<AutomationCardProps> = ({ stat, onToggle, isExpanded }) => {
  const { id, title, description, icon, completed, goal } = stat;
  const percentage = goal > 0 ? (completed / goal) * 100 : 0;
  
  return (
    <div className="bg-white rounded-xl p-6 flex flex-col border border-gray-300 hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center mb-4">
        {icon}
        <h2 className="text-xl font-bold ml-4 text-black">{title}</h2>
      </div>
      <p className="text-gray-600 mb-4 flex-grow">{description}</p>
      
      {/* Progress Bar Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-700">오늘의 진행률</span>
          <span className="text-sm text-gray-600">
            {completed} / {goal}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-label={`${title} progress`}
          ></div>
        </div>
      </div>
      
      <button
        onClick={() => onToggle(id)}
        className="mt-auto w-full bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-colors"
      >
        {isExpanded ? '대시보드 접기' : '대시보드 열기'}
      </button>
      
      {/* Accordion Content */}
      {isExpanded && (
        <div className="mt-6 border-t border-gray-300 pt-6">
          {(() => {
            const config = AUTOMATION_CONFIGS.find(c => c.id === id)!;
            switch (id) {
              case 'reddit-comment':
                return <RedditDashboard config={config} onBack={() => {}} hideBackButton={true} />;
              case 'twitter-post':
                return <TwitterThreadsDashboard config={config} onBack={() => {}} hideBackButton={true} />;
              case 'youtube-comment':
                return <YouTubeDashboard config={config} onBack={() => {}} hideBackButton={true} />;
              default:
                return <Dashboard config={config} onBack={() => {}} hideBackButton={true} />;
            }
          })()
          }
        </div>
      )}
    </div>
  );
};


const App: React.FC = () => {
  const [expandedCard, setExpandedCard] = useState<AutomationType | null>(null);
  const [dailyStats] = useState<DailyStat[]>([
    { id: 'reddit-comment', completed: 5, goal: 20 },
    { id: 'twitter-post', completed: 12, goal: 15 },
    { id: 'youtube-comment', completed: 8, goal: 30 },
    { id: 'youtube-upload', completed: 1, goal: 2 },
  ]);

  const handleToggleCard = (id: AutomationType) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const enrichedStats = useMemo((): EnrichedStat[] => {
    return AUTOMATION_CONFIGS.map(config => {
      const stat = dailyStats.find(s => s.id === config.id);
      return {
        ...config,
        completed: stat?.completed || 0,
        goal: stat?.goal || 0,
      };
    });
  }, [dailyStats]);


  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-5xl text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          AI 마케팅 자동화 허브
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          반복적인 마케팅 작업을 자동화하여 시간을 절약하고 효율성을 높이세요.
        </p>
        
        <div className="grid grid-cols-1 gap-8">
          {enrichedStats.map(stat => (
            <AutomationCard 
              key={stat.id} 
              stat={stat} 
              onToggle={handleToggleCard}
              isExpanded={expandedCard === stat.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
