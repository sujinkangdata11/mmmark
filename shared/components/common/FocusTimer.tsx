import React, { useState, useEffect, useRef } from 'react';

interface FocusTimerProps {
  onComplete?: () => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            // 타이머 완료 알림
            if (typeof window !== 'undefined' && 'Notification' in window) {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('🎯 집중 타이머 완료!', {
                    body: '5분 집중 시간이 완료되었습니다. 잠시 휴식을 취하세요!',
                    icon: '/favicon.ico'
                  });
                }
              });
            }
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, onComplete]);

  const handleStart = () => {
    if (!isActive && timeLeft > 0) {
      setIsActive(true);
      setIsCompleted(false);
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(300);
    setIsCompleted(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((300 - timeLeft) / 300) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-900">
          🎯 집중 타이머
        </h3>
        <div className="text-lg font-mono font-bold text-blue-800">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full bg-blue-100 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isCompleted 
              ? 'bg-green-500' 
              : isActive 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                : 'bg-gray-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 상태 메시지 */}
      <div className="text-center mb-3">
        {isCompleted ? (
          <span className="text-green-600 text-sm font-medium">
            ✅ 집중 시간 완료! 잘하셨습니다!
          </span>
        ) : isActive ? (
          <span className="text-blue-600 text-sm font-medium">
            🔥 집중하고 있습니다... 화이팅!
          </span>
        ) : (
          <span className="text-gray-600 text-sm">
            집중이 필요할 때 타이머를 시작해보세요
          </span>
        )}
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="flex gap-2 justify-center">
        {!isActive && timeLeft === 300 ? (
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            타이머 시작
          </button>
        ) : !isActive && timeLeft > 0 && !isCompleted ? (
          <>
            <button
              onClick={handleStart}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              계속
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              리셋
            </button>
          </>
        ) : isActive ? (
          <>
            <button
              onClick={handlePause}
              className="px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
            >
              일시정지
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              리셋
            </button>
          </>
        ) : (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            다시 시작
          </button>
        )}
      </div>
    </div>
  );
};

export default FocusTimer;