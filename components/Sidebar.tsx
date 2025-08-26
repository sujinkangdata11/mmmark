import React from 'react';
import ApiKeyInput from './common/ApiKeyInput';
import { useApiKeys } from '../hooks';

const Sidebar: React.FC = () => {
  const { getApiKey, setApiKey } = useApiKeys(['gemini', 'username', 'clientId', 'clientSecret', 'redditAccount', 'redditPassword', 'twitter', 'threads', 'youtube', 'discordWebhook']);

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-xl p-6 m-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">API 키 관리</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">공용 API</h3>
            <ApiKeyInput 
              label="Gemini API"
              value={getApiKey('gemini')}
              onChange={(value) => setApiKey('gemini', value)}
              id="gemini-api-key"
            />
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Reddit</h3>
            <div className="space-y-3">
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
                id="reddit-client-id"
              />
              <ApiKeyInput 
                label="Client Secret"
                value={getApiKey('clientSecret')}
                onChange={(value) => setApiKey('clientSecret', value)}
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
                id="reddit-password"
                placeholder="Reddit 계정 비밀번호"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">YouTube</h3>
            <ApiKeyInput 
              label="YouTube Data API"
              value={getApiKey('youtube')}
              onChange={(value) => setApiKey('youtube', value)}
              id="youtube-api-key"
            />
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">소셜 미디어</h3>
            <div className="space-y-3">
              <ApiKeyInput 
                label="Twitter API"
                value={getApiKey('twitter')}
                onChange={(value) => setApiKey('twitter', value)}
                id="twitter-api-key"
              />
              <ApiKeyInput 
                label="Threads API"
                value={getApiKey('threads')}
                onChange={(value) => setApiKey('threads', value)}
                id="threads-api-key"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Discord</h3>
            <ApiKeyInput 
              label="Discord Webhook URL"
              value={getApiKey('discordWebhook')}
              onChange={(value) => setApiKey('discordWebhook', value)}
              id="discord-webhook"
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;