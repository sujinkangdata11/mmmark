
import React, { useState, useMemo, useCallback } from 'react';
import { AUTOMATION_CONFIGS } from './constants';
import { AutomationConfig, AutomationType, DailyStat, EnrichedStat } from './types';
import Dashboard from './shared/components/Dashboard';
import RedditDashboard from './platforms/reddit/RedditDashboard';
import TwitterThreadsDashboard from './platforms/twitter/TwitterThreadsDashboard';
import YouTubeDashboard from './platforms/youtube-feed/YouTubeDashboard';
import YouTubeUploadDashboard from './platforms/youtube-upload/YouTubeUploadDashboard';
import Sidebar from './shared/components/Sidebar';
import FocusTimer from './shared/components/common/FocusTimer';



// Card component updated to include progress visualization
interface AutomationCardProps {
  stat: EnrichedStat;
  onToggle: (id: AutomationType) => void;
  isExpanded: boolean;
}

const AutomationCard: React.FC<AutomationCardProps> = ({ stat, onToggle, isExpanded }) => {
  const { id, title, description, icon } = stat;
  
  return (
    <div id={id} className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      {/* 대시보드 제목 및 진행률 표시 */}
      <div className="py-6 border-b border-gray-200">
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {icon}
            <h2 className="text-lg font-bold ml-4 text-black">{title}</h2>
            <button
              onClick={() => onToggle(id)}
              className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors w-20 ml-8"
            >
              {isExpanded ? '접기' : '열기'}
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{description}</p>
        
        <FocusTimer />
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
              case 'youtube-upload':
                return <YouTubeUploadDashboard config={config} onBack={() => {}} hideBackButton={true} />;
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

  const handleScrollTo = useCallback((targetId: AutomationType) => {
    setExpandedCard(targetId);
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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
    <div className="min-h-screen bg-white px-8 py-16">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 헤더 */}
        <div className="text-center py-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            AI 마케팅 자동화 허브
          </h1>
          <p className="text-sm text-gray-600">
            반복적인 마케팅 작업을 자동화하여 시간을 절약하고 효율성을 높이세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => handleScrollTo('reddit-comment')}
            className="px-6 py-3 text-sm font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full hover:bg-cyan-100 transition-colors"
          >
            [레딧]
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('twitter-post')}
            className="px-6 py-3 text-sm font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full hover:bg-cyan-100 transition-colors"
          >
            [ Twitter & Threads ]
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('youtube-comment')}
            className="px-6 py-3 text-sm font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full hover:bg-cyan-100 transition-colors"
          >
            [YouTube 자동 댓글]
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('youtube-upload')}
            className="px-6 py-3 text-sm font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full hover:bg-cyan-100 transition-colors"
          >
            [유튜브, 인스타그램, 쓰레드, 트위터 영상업로드]
          </button>
        </div>

        {/* 상단 API 키 관리 패널 */}
        <Sidebar />

        {/* 대시보드 리스트 */}
        <div className="space-y-8">
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
