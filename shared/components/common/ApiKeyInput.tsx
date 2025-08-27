import React from 'react';

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "API 키를 입력하세요",
  id 
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="password"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
};

export default ApiKeyInput;