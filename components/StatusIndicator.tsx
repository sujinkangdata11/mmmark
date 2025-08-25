
import React from 'react';

interface StatusIndicatorProps {
  isOnline: boolean;
  text: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isOnline, text }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="relative flex h-3 w-3">
        <span className={`animate-pulse-fast absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-cyan-400' : 'bg-red-400'} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-cyan-500' : 'bg-red-500'}`}></span>
      </span>
      <span>{text}</span>
    </div>
  );
};

export default StatusIndicator;
