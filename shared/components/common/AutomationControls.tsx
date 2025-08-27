import React from 'react';

interface AutomationControlsProps {
  isAutomating: boolean;
  onStart: () => void;
  onStop: () => void;
}

const AutomationControls: React.FC<AutomationControlsProps> = ({ isAutomating, onStart, onStop }) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-cyan-600 mb-4">자동화 제어 및 로그</h2>
      {isAutomating ? (
        <button 
          onClick={onStop} 
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
        >
          자동화 중지
        </button>
      ) : (
        <button 
          onClick={onStart} 
          className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md transition-colors"
        >
          자동화 시작
        </button>
      )}
    </div>
  );
};

export default AutomationControls;