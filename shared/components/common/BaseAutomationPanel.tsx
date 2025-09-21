import React, { ReactNode } from 'react';
import { AutomationConfig } from '../../types';
import AutomationControls from './AutomationControls';
import LogDisplay from './LogDisplay';
import { useLogger, useAutomation } from '../../hooks';

interface BaseAutomationPanelProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
  children: ReactNode;
  onStartAutomation: (addLog: (message: string, type?: 'info' | 'success' | 'error' | 'generating') => void, isRunning: () => boolean) => Promise<void>;
}

const BaseAutomationPanel: React.FC<BaseAutomationPanelProps> = ({ 
  config, 
  onBack, 
  hideBackButton,
  children,
  onStartAutomation
}) => {
  const { logs, addLog, clearLogs } = useLogger();
  const { isAutomating, startAutomation, stopAutomation, isRunning } = useAutomation();

  const handleStartAutomation = () => {
    clearLogs();
    startAutomation(() => onStartAutomation(addLog, isRunning));
  };

  const handleStopAutomation = () => {
    stopAutomation();
    addLog('자동화를 중지하는 중...', 'error');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl animate-[fadeIn_0.5s_ease-in-out]">
      {!hideBackButton && (
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-cyan-500 transition-colors"
        >
          &larr; 뒤로가기
        </button>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">{config.icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-black">{config.title}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="flex flex-col space-y-6">
          {children}
        </div>

        {/* Right Column: Automation & Logs */}
        <div className="bg-white rounded-xl p-6 border border-gray-300 flex flex-col">
          <AutomationControls 
            isAutomating={isAutomating}
            onStart={handleStartAutomation}
            onStop={handleStopAutomation}
          />
          <LogDisplay logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default BaseAutomationPanel;
