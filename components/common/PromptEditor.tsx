import React from 'react';
import { PromptConfig } from '../../config/prompts';

interface PromptEditorProps {
  prompt: PromptConfig;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, value, onChange, onReset }) => {
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{prompt.name}</h4>
          <p className="text-xs text-gray-600">{prompt.description}</p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-cyan-600 hover:text-cyan-800 px-2 py-1 border border-cyan-600 rounded"
        >
          초기화
        </button>
      </div>
      
      {prompt.variables && prompt.variables.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">사용 가능한 변수: </span>
          <span className="text-xs text-cyan-600">
            {prompt.variables.map(v => `{${v}}`).join(', ')}
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