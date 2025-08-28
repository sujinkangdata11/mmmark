import React from 'react';

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  onReset?: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "API 키를 입력하세요",
  id,
  onReset 
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-2">
        <input
          type="password"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
        />
        {onReset && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-xs font-medium bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
            type="button"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default ApiKeyInput;