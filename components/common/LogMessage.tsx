import React from 'react';
import { AutomationLog } from '../../types';

interface LogMessageProps {
  log: AutomationLog;
}

const LogMessage: React.FC<LogMessageProps> = ({ log }) => {
  const colorClasses = {
    info: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    generating: 'text-cyan-600',
  };
  
  const icon = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    generating: '⏳',
  };

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = log.message.split(urlRegex);

  return (
    <div className="flex items-start space-x-3 text-sm">
      <span className="mt-0.5">{icon[log.type]}</span>
      <div className={`flex-1 ${colorClasses[log.type]}`}>
        <span className="text-gray-500 mr-2">{log.timestamp}</span>
        <span>
          {parts.map((part, index) => 
            urlRegex.test(part) ? 
            <a href={part} key={index} target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline hover:text-cyan-700">{part}</a> : 
            part
          )}
        </span>
      </div>
    </div>
  );
};

export default LogMessage;