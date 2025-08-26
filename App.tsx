
import React, { useState, useMemo } from 'react';
import { AUTOMATION_CONFIGS } from './constants';
import { AutomationConfig, AutomationType, DailyStat, EnrichedStat } from './types';
import Dashboard from './components/Dashboard';
import RedditDashboard from './components/RedditDashboard';
import TwitterThreadsDashboard from './components/TwitterThreadsDashboard';
import YouTubeDashboard from './components/YouTubeDashboard';
import Sidebar from './components/Sidebar';



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
    <div className="bg-white border border-gray-200 rounded-xl p-6 m-6">
      {/* 대시보드 제목 및 진행률 표시 */}
      <div className="py-6 border-b border-gray-200">
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {icon}
            <h2 className="text-2xl font-bold ml-4 text-black">{title}</h2>
            <button
              onClick={() => onToggle(id)}
              className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors w-20 ml-8"
            >
              {isExpanded ? '접기' : '열기'}
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">오늘의 진행률:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{completed} / {goal}</span>
        </div>
      </div>

      {/* 가로 스크롤 대시보드 */}
      {isExpanded && (
        <div className="py-8 bg-white">
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
          })()}
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
    <div className="min-h-screen bg-white">
      {/* 헤더 - 전체 화면 너비 */}
      <div className="text-center py-8 bg-white border-b border-gray-200">
        <h1 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          AI 마케팅 자동화 허브
        </h1>
        <p className="text-sm text-gray-600">
          반복적인 마케팅 작업을 자동화하여 시간을 절약하고 효율성을 높이세요.
        </p>
      </div>
      
      <div className="flex">
        {/* 왼쪽 API 키 관리 블럭 */}
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* 오른쪽 대시보드 리스트 */}
        <div className="flex-1">
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
