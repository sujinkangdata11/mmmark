import React, { useState } from 'react';
import ApiKeyInput from './common/ApiKeyInput';
import { useApiKeys } from '../hooks';

type SectionKey =
  | 'gemini'
  | 'reddit'
  | 'youtube'
  | 'googleDrive'
  | 'twitter1'
  | 'twitter2'
  | 'social'
  | 'discord';

interface SectionConfig {
  key: SectionKey;
  title: string;
  render: () => React.ReactNode;
}

const Sidebar: React.FC = () => {
  const { getDisplayValue, setApiKey, resetApiKey } = useApiKeys([
    'gemini',
    'username',
    'clientId',
    'clientSecret',
    'redditAccount',
    'redditPassword',
    'threads',
    'youtube',
    'discordWebhook',
    'googleDriveClientId',
    'googleDriveClientSecret',
    'twitterConsumerKey',
    'twitterConsumerSecret',
    'twitterAccessToken',
    'twitterAccessTokenSecret',
    'twitterBearerToken'
  ]);

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    gemini: false,
    reddit: false,
    youtube: false,
    googleDrive: false,
    twitter1: false,
    twitter2: false,
    social: false,
    discord: false
  });

  const toggleSection = (section: SectionKey) => {
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

  const sections: SectionConfig[] = [
    {
      key: 'gemini',
      title: '공용 API',
      render: () => (
        <ApiKeyInput
          label="Gemini API"
          value={getDisplayValue('gemini')}
          onChange={(value) => setApiKey('gemini', value)}
          onReset={() => resetApiKey('gemini')}
          id="gemini-api-key"
        />
      )
    },
    {
      key: 'reddit',
      title: 'Reddit',
      render: () => (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">사용자명 (선택사항)</label>
            <input
              type="text"
              value={getDisplayValue('username')}
              onChange={(e) => setApiKey('username', e.target.value)}
              placeholder="anonymous (기본값)"
              className="w-full p-2 text-sm bg-white rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <ApiKeyInput
            label="Client ID"
            value={getDisplayValue('clientId')}
            onChange={(value) => setApiKey('clientId', value)}
            onReset={() => resetApiKey('clientId')}
            id="reddit-client-id"
          />
          <ApiKeyInput
            label="Client Secret"
            value={getDisplayValue('clientSecret')}
            onChange={(value) => setApiKey('clientSecret', value)}
            onReset={() => resetApiKey('clientSecret')}
            id="reddit-client-secret"
          />
          <div>
            <label className="block text-xs text-gray-600 mb-1">Reddit 계정명</label>
            <input
              type="text"
              value={getDisplayValue('redditAccount')}
              onChange={(e) => setApiKey('redditAccount', e.target.value)}
              placeholder="Reddit 사용자명 입력"
              className="w-full p-2 text-sm bg-white rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <ApiKeyInput
            label="Reddit 비밀번호"
            value={getDisplayValue('redditPassword')}
            onChange={(value) => setApiKey('redditPassword', value)}
            onReset={() => resetApiKey('redditPassword')}
            id="reddit-password"
            placeholder="Reddit 계정 비밀번호"
          />
        </div>
      )
    },
    {
      key: 'youtube',
      title: 'YouTube',
      render: () => (
        <ApiKeyInput
          label="YouTube Data API"
          value={getDisplayValue('youtube')}
          onChange={(value) => setApiKey('youtube', value)}
          onReset={() => resetApiKey('youtube')}
          id="youtube-api-key"
        />
      )
    },
    {
      key: 'googleDrive',
      title: 'Google Drive',
      render: () => (
        <div className="space-y-3">
          <ApiKeyInput
            label="Client ID"
            value={getDisplayValue('googleDriveClientId')}
            onChange={(value) => setApiKey('googleDriveClientId', value)}
            onReset={() => resetApiKey('googleDriveClientId')}
            id="google-drive-client-id"
            placeholder="구글 콘솔에서 생성한 Client ID"
          />
          <ApiKeyInput
            label="Client Secret"
            value={getDisplayValue('googleDriveClientSecret')}
            onChange={(value) => setApiKey('googleDriveClientSecret', value)}
            onReset={() => resetApiKey('googleDriveClientSecret')}
            id="google-drive-client-secret"
            placeholder="구글 콘솔에서 생성한 Client Secret"
          />
        </div>
      )
    },
    {
      key: 'twitter1',
      title: 'Twitter OAuth 1.0a (이미지)',
      render: () => (
        <div className="space-y-3">
          <ApiKeyInput
            label="Consumer Key (API Key)"
            value={getDisplayValue('twitterConsumerKey')}
            onChange={(value) => setApiKey('twitterConsumerKey', value)}
            onReset={() => resetApiKey('twitterConsumerKey')}
            id="twitter-consumer-key"
            placeholder="Twitter 개발자 포털의 Consumer Key"
          />
          <ApiKeyInput
            label="Consumer Secret"
            value={getDisplayValue('twitterConsumerSecret')}
            onChange={(value) => setApiKey('twitterConsumerSecret', value)}
            onReset={() => resetApiKey('twitterConsumerSecret')}
            id="twitter-consumer-secret"
            placeholder="Twitter 개발자 포털의 Consumer Secret"
          />
          <ApiKeyInput
            label="Access Token"
            value={getDisplayValue('twitterAccessToken')}
            onChange={(value) => setApiKey('twitterAccessToken', value)}
            onReset={() => resetApiKey('twitterAccessToken')}
            id="twitter-access-token"
            placeholder="Twitter 개발자 포털의 Access Token"
          />
          <ApiKeyInput
            label="Access Token Secret"
            value={getDisplayValue('twitterAccessTokenSecret')}
            onChange={(value) => setApiKey('twitterAccessTokenSecret', value)}
            onReset={() => resetApiKey('twitterAccessTokenSecret')}
            id="twitter-access-token-secret"
            placeholder="Twitter 개발자 포털의 Access Token Secret"
          />
        </div>
      )
    },
    {
      key: 'twitter2',
      title: 'Twitter OAuth 2.0 (트윗)',
      render: () => (
        <ApiKeyInput
          label="Bearer Token"
          value={getDisplayValue('twitterBearerToken')}
          onChange={(value) => setApiKey('twitterBearerToken', value)}
          onReset={() => resetApiKey('twitterBearerToken')}
          id="twitter-bearer-token"
          placeholder="Twitter 개발자 포털의 Bearer Token"
        />
      )
    },
    {
      key: 'social',
      title: '기타 소셜 미디어',
      render: () => (
        <ApiKeyInput
          label="Threads API"
          value={getDisplayValue('threads')}
          onChange={(value) => setApiKey('threads', value)}
          onReset={() => resetApiKey('threads')}
          id="threads-api-key"
        />
      )
    },
    {
      key: 'discord',
      title: 'Discord',
      render: () => (
        <ApiKeyInput
          label="Discord Webhook URL"
          value={getDisplayValue('discordWebhook')}
          onChange={(value) => setApiKey('discordWebhook', value)}
          onReset={() => resetApiKey('discordWebhook')}
          id="discord-webhook"
          placeholder="https://discord.com/api/webhooks/..."
        />
      )
    }
  ];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">API 키 관리</h2>
          <p className="mt-1 text-sm text-gray-500">
            사용 중인 플랫폼의 API 키를 안전하게 저장하고 필요한 순간에만 펼쳐서 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full self-start md:self-auto">
          <span>Tip</span>
          <span>토글을 눌러 필요한 섹션만 펼칠 수 있어요</span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ key, title, render }) => (
          <div key={key} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-gray-700">{title}</span>
              <span className="flex items-center gap-2 text-xs text-gray-500">
                {expandedSections[key] ? '접기' : '열기'}
                <ChevronIcon isExpanded={expandedSections[key]} />
              </span>
            </button>

            {expandedSections[key] && (
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {render()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
