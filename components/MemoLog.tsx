
import React from 'react';
import { Memo } from '../types';

interface MemoLogProps {
  memos: Memo[];
}

const MemoLog: React.FC<MemoLogProps> = ({ memos }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">메모 기록</h3>
      {memos.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-500">
          기록된 메모가 없습니다.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-grow pr-2">
          {memos.map((memo) => (
            <div key={memo.id} className="bg-gray-700 p-3 rounded-md">
              <p className="text-gray-300 whitespace-pre-wrap">{memo.text}</p>
              <p className="text-xs text-gray-500 mt-2 text-right">{memo.timestamp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoLog;
