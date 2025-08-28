import React, { useState } from 'react';
import ApiKeyInput from './common/ApiKeyInput';
import { useApiKeys } from '../hooks';

const Sidebar: React.FC = () => {
  const { getApiKey, setApiKey, resetApiKey } = useApiKeys(['gemini', 'username', 'clientId', 'clientSecret', 'redditAccount', 'redditPassword', 'twitter', 'threads', 'youtube', 'discordWebhook', 'googleDriveClientId', 'googleDriveClientSecret']);
  
  // 각 섹션의 펼침/접힘 상태 (기본값: 모두 펼쳐짐)
  const [expandedSections, setExpandedSections] = useState({
    gemini: true,
    reddit: true,
    youtube: true,
    googleDrive: true,
    twitter1: true,
    twitter2: true,
    social: true,
    discord: true
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg 
      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      style={{ width: '14px', height: '14px' }}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-xl p-6 m-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">API 키 관리</h2>
        
        <div className="space-y-6">
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('gemini')}
            >
              <h3 className="text-sm font-semibold text-gray-700">공용 API</h3>
              <ChevronIcon isExpanded={expandedSections.gemini} />
            </div>
            {expandedSections.gemini && (
              <div className="mb-3">
                <ApiKeyInput 
                  label="Gemini API"
                  value={getApiKey('gemini')}
                  onChange={(value) => setApiKey('gemini', value)}
                  onReset={() => resetApiKey('gemini')}
                  id="gemini-api-key"
                />
              </div>
            )}
          </div>
          
          <div>
            <hr className="border-gray-300 mb-4" />
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('reddit')}
            >
              <h3 className="text-sm font-semibold text-gray-700">Reddit</h3>
              <ChevronIcon isExpanded={expandedSections.reddit} />
            </div>
            {expandedSections.reddit && (
              <div className="space-y-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">사용자명 (선택사항)</label>
                  <input
                    type="text"
                    value={getApiKey('username')}
                    onChange={(e) => setApiKey('username', e.target.value)}
                    placeholder="anonymous (기본값)"
                    className="w-full p-2 text-sm bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <ApiKeyInput 
                  label="Client ID"
                  value={getApiKey('clientId')}
                  onChange={(value) => setApiKey('clientId', value)}
                  onReset={() => resetApiKey('clientId')}
                  id="reddit-client-id"
                />
                <ApiKeyInput 
                  label="Client Secret"
                  value={getApiKey('clientSecret')}
                  onChange={(value) => setApiKey('clientSecret', value)}
                  onReset={() => resetApiKey('clientSecret')}
                  id="reddit-client-secret"
                />
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Reddit 계정명</label>
                  <input
                    type="text"
                    value={getApiKey('redditAccount')}
                    onChange={(e) => setApiKey('redditAccount', e.target.value)}
                    placeholder="Reddit 사용자명 입력"
                    className="w-full p-2 text-sm bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <ApiKeyInput 
                  label="Reddit 비밀번호"
                  value={getApiKey('redditPassword')}
                  onChange={(value) => setApiKey('redditPassword', value)}
                  onReset={() => resetApiKey('redditPassword')}
                  id="reddit-password"
                  placeholder="Reddit 계정 비밀번호"
                />
              </div>
            )}
          </div>
          
          <div>
            <hr className="border-gray-300 mb-4" />
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('youtube')}
            >
              <h3 className="text-sm font-semibold text-gray-700">YouTube</h3>
              <ChevronIcon isExpanded={expandedSections.youtube} />
            </div>
            {expandedSections.youtube && (
              <div className="mb-3">
                <ApiKeyInput 
                  label="YouTube Data API"
                  value={getApiKey('youtube')}
                  onChange={(value) => setApiKey('youtube', value)}
                  onReset={() => resetApiKey('youtube')}
                  id="youtube-api-key"
                />
              </div>
            )}
          </div>
          
          <div>
            <hr className="border-gray-300 mb-4" />
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('googleDrive')}
            >
              <h3 className="text-sm font-semibold text-gray-700">Google Drive</h3>
              <ChevronIcon isExpanded={expandedSections.googleDrive} />
            </div>
            {expandedSections.googleDrive && (
              <div className="space-y-3 mb-3">
                <ApiKeyInput 
                  label="Client ID"
                  value={getApiKey('googleDriveClientId')}
                  onChange={(value) => setApiKey('googleDriveClientId', value)}
                  onReset={() => resetApiKey('googleDriveClientId')}
                  id="google-drive-client-id"
                  placeholder="구글 콘솔에서 생성한 Client ID"
                />
                <ApiKeyInput 
                  label="Client Secret"
                  value={getApiKey('googleDriveClientSecret')}
                  onChange={(value) => setApiKey('googleDriveClientSecret', value)}
                  onReset={() => resetApiKey('googleDriveClientSecret')}
                  id="google-drive-client-secret"
                  placeholder="구글 콘솔에서 생성한 Client Secret"
                />
              </div>
            )}
          </div>
          
          <div>
            <hr className="border-gray-300 mb-4" />
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('twitter1')}
            >
              <h3 className="text-sm font-semibold text-gray-700">Twitter API OAuth 1.0a (이미지 업로드용)</h3>
              <ChevronIcon isExpanded={expandedSections.twitter1} />
            </div>
            {expandedSections.twitter1 && (
              <div className="space-y-3 mb-3">
                <ApiKeyInput 
                  label="Consumer Key (API Key)"
                  value={getApiKey('twitterConsumerKey')}
                  onChange={(value) => setApiKey('twitterConsumerKey', value)}
                  onReset={() => resetApiKey('twitterConsumerKey')}
                  id="twitter-consumer-key"
                  placeholder="Twitter 개발자 포털의 Consumer Key"
                />
                <ApiKeyInput 
                  label="Consumer Secret"
                  value={getApiKey('twitterConsumerSecret')}
                  onChange={(value) => setApiKey('twitterConsumerSecret', value)}
                  onReset={() => resetApiKey('twitterConsumerSecret')}
                  id="twitter-consumer-secret"
                  placeholder="Twitter 개발자 포털의 Consumer Secret"
                />
                <ApiKeyInput 
                  label="Access Token"
                  value={getApiKey('twitterAccessToken')}
                  onChange={(value) => setApiKey('twitterAccessToken', value)}
                  onReset={() => resetApiKey('twitterAccessToken')}
                  id="twitter-access-token"
                  placeholder="Twitter 개발자 포털의 Access Token"
                />
                <ApiKeyInput 
                  label="Access Token Secret"
                  value={getApiKey('twitterAccessTokenSecret')}
                  onChange={(value) => setApiKey('twitterAccessTokenSecret', value)}
                  onReset={() => resetApiKey('twitterAccessTokenSecret')}
                  id="twitter-access-token-secret"
                  placeholder="Twitter 개발자 포털의 Access Token Secret"
                />
              </div>
            )}
          </div>

          <div>
            <hr className="border-gray-300 mb-4" />
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('twitter2')}
            >
              <h3 className="text-sm font-semibold text-gray-700">Twitter API OAuth 2.0 (트윗 작성용)</h3>
              <ChevronIcon isExpanded={expandedSections.twitter2} />
            </div>
            {expandedSections.twitter2 && (
              <div className="space-y-3 mb-3">
                <ApiKeyInput 
                  label="Bearer Token"
                  value={getApiKey('twitterBearerToken')}
                  onChange={(value) => setApiKey('twitterBearerToken', value)}
                  onReset={() => resetApiKey('twitterBearerToken')}
                  id="twitter-bearer-token"
                  placeholder="Twitter 개발자 포털의 Bearer Token"
                />
              </div>
            )}
          </div>

          <div>
            <hr className="border-gray-300 mb-4" />
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('social')}
            >
              <h3 className="text-sm font-semibold text-gray-700">기타 소셜 미디어</h3>
              <ChevronIcon isExpanded={expandedSections.social} />
            </div>
            {expandedSections.social && (
              <div className="space-y-3 mb-3">
                <ApiKeyInput 
                  label="Threads API"
                  value={getApiKey('threads')}
                  onChange={(value) => setApiKey('threads', value)}
                  onReset={() => resetApiKey('threads')}
                  id="threads-api-key"
                />
              </div>
            )}
          </div>
          
          <div>
            <hr className="border-gray-300 mb-4" />
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 mb-3"
              onClick={() => toggleSection('discord')}
            >
              <h3 className="text-sm font-semibold text-gray-700">Discord</h3>
              <ChevronIcon isExpanded={expandedSections.discord} />
            </div>
            {expandedSections.discord && (
              <div className="mb-3">
                <ApiKeyInput 
                  label="Discord Webhook URL"
                  value={getApiKey('discordWebhook')}
                  onChange={(value) => setApiKey('discordWebhook', value)}
                  onReset={() => resetApiKey('discordWebhook')}
                  id="discord-webhook"
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;