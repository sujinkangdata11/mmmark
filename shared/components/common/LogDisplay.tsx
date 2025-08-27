import React from 'react';
import LogMessage from './LogMessage';
import { AutomationLog } from '../../types';

interface LogDisplayProps {
  logs: AutomationLog[];
  onClear?: () => void;
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs, onClear }) => {
  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4 flex-grow h-96 flex flex-col border border-gray-300">
      <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-800">실시간 로그</h3>
        {onClear && (
          <button
            onClick={onClear}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-200 rounded"
          >
            로그 지우기
          </button>
        )}
      </div>
      <div className="space-y-2 overflow-y-auto flex-grow pr-2">
        {logs.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-gray-500">
            자동화를 시작하여 로그를 확인하세요.
          </div>
        ) : (
          logs.map((log) => <LogMessage key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
};

export default LogDisplay;