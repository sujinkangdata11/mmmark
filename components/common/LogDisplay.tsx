import React from 'react';
import LogMessage from './LogMessage';
import { AutomationLog } from '../../types';

interface LogDisplayProps {
  logs: AutomationLog[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {
  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4 flex-grow h-96 flex flex-col border border-gray-300">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-2">실시간 로그</h3>
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