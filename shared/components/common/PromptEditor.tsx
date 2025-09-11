import React, { useState } from 'react';
import { PromptConfig } from '../../config/prompts';
import { getFavoritePrompts } from '../../../prompts';

interface PromptEditorProps {
  prompt: PromptConfig;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  feedType?: string;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, value, onChange, onReset, feedType }) => {
  const [showFavorites, setShowFavorites] = useState(false);
  
  const favoritePrompts = feedType ? getFavoritePrompts(feedType, prompt.id) : [];

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-800">{prompt.name}</h4>
            {favoritePrompts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="text-xs bg-purple-100 text-purple-600 hover:bg-purple-200 px-2 py-1 rounded-md border border-purple-300"
                >
                  즐겨찾는 프롬프트 ▼
                </button>
                {showFavorites && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 border-b bg-gray-50">
                      <span className="text-xs font-medium text-gray-700">즐겨찾는 프롬프트 선택</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {favoritePrompts.map((favPrompt, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            onChange(favPrompt);
                            setShowFavorites(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                        >
                          {index === 0 ? (
                            <span className="font-medium text-blue-600">🔄 디폴트 프롬프트</span>
                          ) : (
                            <span>{favPrompt.slice(0, 60)}...</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
    </div>
  );
};

export default PromptEditor;