import React, { useState } from 'react';
import { PromptConfig } from '../../config/prompts';
import { getFavoritePrompts } from '../../../prompts';
import { FavoritePromptOption } from '../../../prompts/types';

interface PromptEditorProps {
  prompt: PromptConfig;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  feedType?: string;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, value, onChange, onReset, feedType }) => {
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const favoritePromptOptions = React.useMemo(() => {
    if (!feedType) return [] as FavoritePromptOption[];
    const raw = getFavoritePrompts(feedType, prompt.id);
    return raw.map((entry, index) => {
      if (typeof entry === 'string') {
        return {
          title: index === 0 ? '디폴트 프롬프트' : `옵션 ${index + 1}`,
          body: entry
        };
      }
      return entry;
    });
  }, [feedType, prompt.id]);

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-800">{prompt.name}</h4>
            {favoritePromptOptions.length > 0 && (
              <button
                onClick={() => setShowFavoritesModal(true)}
                className="text-xs bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded-md border border-purple-300"
              >
                즐겨찾는 프롬프트
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600">{prompt.description}</p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-cyan-600 hover:text-cyan-800 px-2 py-1 border border-cyan-600 rounded ml-2"
        >
          초기화
        </button>
      </div>
      
      {prompt.variables && prompt.variables.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">사용 가능한 변수: </span>
          <span className="text-xs text-cyan-600">
            {prompt.variables.map((v: string) => `{${v}}`).join(', ')}
          </span>
        </div>
      )}
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-32 p-2 bg-white rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-sm font-mono"
        placeholder={prompt.template}
      />
      {showFavoritesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">즐겨찾는 프롬프트 선택</h3>
                <p className="mt-1 text-xs text-gray-600">원하는 프롬프트 카드를 눌러 즉시 적용할 수 있어요.</p>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 justify-items-center">
              {favoritePromptOptions.map((favPrompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onChange(favPrompt.body);
                    setShowFavoritesModal(false);
                  }}
                  className="w-full max-w-[200px] h-[200px] border border-purple-200 rounded-xl p-4 text-left hover:border-purple-400 hover:shadow-md transition-transform duration-150 hover:-translate-y-1 bg-purple-50/40"
                >
                  <div className="h-full flex flex-col">
                    <span className={`text-sm font-semibold ${index === 0 ? 'text-purple-700' : 'text-gray-800'}`}>
                      {favPrompt.title}
                    </span>
                    <div className="mt-3 text-xs text-gray-600 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                      {favPrompt.body}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptEditor;
