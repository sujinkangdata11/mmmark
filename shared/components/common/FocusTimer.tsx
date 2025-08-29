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
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
      {/* 버튼, 게이지바, 시간을 같은 줄로 */}
      <div className="flex items-center gap-3">
        {/* 컨트롤 버튼들 */}
        <div className="flex gap-2 flex-shrink-0">
          {!isActive && timeLeft === 300 ? (
            <button
              onClick={handleStart}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            >
              타이머 시작
            </button>
          ) : !isActive && timeLeft > 0 && !isCompleted ? (
            <>
              <button
                onClick={handleStart}
                className="px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
              >
                계속
              </button>
              <button
                onClick={handleReset}
                className="px-2 py-1.5 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
              >
                리셋
              </button>
            </>
          ) : isActive ? (
            <>
              <button
                onClick={handlePause}
                className="px-2 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
              >
                일시정지
              </button>
              <button
                onClick={handleReset}
                className="px-2 py-1.5 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors"
              >
                리셋
              </button>
            </>
          ) : (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            >
              다시 시작
            </button>
          )}
        </div>

        {/* 진행률 바 */}
        <div className="flex-1 mx-3">
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 시간 표시 (오른쪽) */}
        <div className="text-right flex-shrink-0">
          <div className="text-base font-mono font-bold text-blue-800">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;