import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { AutomationConfig, UploadedImage } from '../../types';
import { useLogger } from '../../shared/hooks';
import LogDisplay from '../../shared/components/common/LogDisplay';

interface YouTubeUploadDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const YouTubeUploadDashboard: React.FC<YouTubeUploadDashboardProps> = ({ 
  config, 
  onBack, 
  hideBackButton 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [slideDuration, setSlideDuration] = useState('1.5');
  const [resolution, setResolution] = useState('1280x720');
  const [animationType, setAnimationType] = useState('cut');
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isVideoGenerated, setIsVideoGenerated] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<UploadedImage[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  const [isFinalVideoGenerated, setIsFinalVideoGenerated] = useState(false);
  const [isCreatingFinalVideo, setIsCreatingFinalVideo] = useState(false);
  const [youtubeVideo, setYoutubeVideo] = useState<UploadedImage | null>(null);
  const [isUploadingToYoutube, setIsUploadingToYoutube] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [generatedInfo, setGeneratedInfo] = useState('');
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [prompt, setPrompt] = useState(`#이 키워드와 아래 AutoVid 대한 유튜브 제목, 설명, 그리고 #없이 태그를 , 콤마 형태로 나열하세요.

#반드시 사람들이 궁금해하고, 후킹하고, 클릭할 것 같은 제목과 검색이 잘되는 태그가 필요합니다. 

AutoVid는 단 한번의 클릭으로 자동 생성되는 유튜브 쇼핑쇼츠 서비스 입니다. 어필리에이트에 강력한 장점을 갖고있어, 영상을 자체적으로 만들고 연관된 아마존 상품을 링크로 소개해줍니다. 또한 현재 바이럴되는 쇼츠들을 토대로 쇼핑쇼츠를 제작하여 조회수도 보장됩니다. 만약 유튜브로 수익화를 원하는 분이나, 온라인으로 홍보하고싶은 자영업자가 있다면 AutoVid를 추천해주세요. 특히 쇼츠로 부수입,돈을 벌고싶거나 매일 자동 생성된다는 성실함이 필요한분들에게 추천해주세요.`);
  const { logs, addLog, clearLogs } = useLogger();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const youtubeFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const runAutomation = async () => {
    addLog('YouTube 업로드 자동화를 준비 중입니다...', 'info');
    addLog('이 기능은 곧 구현될 예정입니다.', 'info');
  };


  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `${file.name}-${new Date().getTime()}`,
          file: file,
          dataUrl: e.target?.result as string,
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
    addLog(`${files.length}개의 이미지가 추가되었습니다.`, 'info');
  };

  const handleDeleteImage = (id: string) => {
    const deletedImage = images.find(img => img.id === id);
    if (deletedImage) {
      addLog(`'${deletedImage.file.name}' 이미지를 삭제했습니다.`, 'info');
      setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleMediaUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newMediaFile: UploadedImage = {
          id: `${file.name}-${new Date().getTime()}`,
          file: file,
          dataUrl: e.target?.result as string,
        };
        setMediaFiles(prev => [...prev, newMediaFile]);
      };
      reader.readAsDataURL(file);
    });
    addLog(`${files.length}개의 미디어 파일이 추가되었습니다.`, 'info');
  };

  const handleDeleteMediaFile = (id: string) => {
    const deletedFile = mediaFiles.find(file => file.id === id);
    if (deletedFile) {
      addLog(`'${deletedFile.file.name}' 파일을 삭제했습니다.`, 'info');
      setMediaFiles(prev => prev.filter(file => file.id !== id));
    }
  };

  const moveMediaFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...mediaFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setMediaFiles(newFiles);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  const handleCreateVideo = async () => {
    if (images.length === 0) {
      addLog('영상을 만들려면 최소 1개 이상의 이미지가 필요합니다.', 'error');
      return;
    }

    if (!canvasRef.current) {
      addLog('캔버스를 찾을 수 없습니다.', 'error');
      return;
    }

    setIsCreatingVideo(true);
    setIsVideoGenerated(false);
    addLog('이미지 슬라이드쇼 영상 생성을 시작합니다...', 'info');
    addLog(`${images.length}개의 이미지로 영상을 만들고 있습니다.`, 'info');
    addLog(`각 이미지당 ${slideDuration}초 재생됩니다.`, 'info');
    
    try {
      const duration = parseFloat(slideDuration);
      const fps = 30;
      const [baseWidth, baseHeight] = resolution.split('x').map(Number);
      
      // 고해상도 렌더링을 위해 2배 크기로 캔버스 설정
      const pixelRatio = 2;
      const width = baseWidth * pixelRatio;
      const height = baseHeight * pixelRatio;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');
      
      // 물리적 캔버스 크기는 고해상도로
      canvas.width = width;
      canvas.height = height;
      
      // CSS 표시 크기는 원래 크기로 (선택사항, 숨겨진 캔버스라 불필요)
      // canvas.style.width = baseWidth + 'px';
      // canvas.style.height = baseHeight + 'px';
      
      // 고해상도 컨텍스트 스케일링
      ctx.scale(pixelRatio, pixelRatio);
      
      const stream = canvas.captureStream(fps);
      const recordedChunks: Blob[] = [];
      
      // MP4 지원 확인 후 최적의 포맷 선택
      let mimeType;
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        mimeType = 'video/mp4;codecs=h264';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else {
        mimeType = 'video/webm;codecs=vp9';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const mimeTypeForBlob = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
        const blob = new Blob(recordedChunks, { type: mimeTypeForBlob });
        const url = URL.createObjectURL(blob);
        
        setVideoUrl(url);
        setIsVideoGenerated(true);
        addLog('영상 생성이 완료되었습니다!', 'success');
        addLog(`총 재생시간: ${(images.length * duration).toFixed(1)}초`, 'success');
        addLog('3번 카드에서 영상을 미리볼 수 있습니다.', 'info');
      };
      
      mediaRecorder.start();
      
      // 각 이미지를 지정된 시간만큼 표시
      for (let i = 0; i < images.length; i++) {
        addLog(`영상 생성 중... ${i + 1}/${images.length}`, 'generating');
        
        const currentImg = new Image();
        currentImg.src = images[i].dataUrl;
        await new Promise(resolve => currentImg.onload = resolve);
        
        // 고해상도 렌더링을 위한 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 이미지 스케일링 계산
        const scaleX = baseWidth / currentImg.width;
        const scaleY = baseHeight / currentImg.height;
        const scale = Math.max(scaleX, scaleY);
        const newWidth = currentImg.width * scale;
        const newHeight = currentImg.height * scale;
        const x = (baseWidth - newWidth) / 2;
        const y = (baseHeight - newHeight) / 2;

        if (animationType === 'cut') {
          // 딱딱 끊어져서 나오기 (기존 방식)
          ctx.drawImage(currentImg, x, y, newWidth, newHeight);
          await new Promise(resolve => setTimeout(resolve, duration * 1000));
          
        } else if (animationType === 'slide') {
          // 밀어내는 애니메이션
          const nextImg = i + 1 < images.length ? new Image() : null;
          if (nextImg && i + 1 < images.length) {
            nextImg.src = images[i + 1].dataUrl;
            await new Promise(resolve => nextImg.onload = resolve);
          }
          
          // 현재 이미지를 일정 시간 정적으로 표시
          const staticTime = duration * 0.7; // 70%는 정적, 30%는 애니메이션
          const animationTime = duration * 0.3;
          
          ctx.drawImage(currentImg, x, y, newWidth, newHeight);
          await new Promise(resolve => setTimeout(resolve, staticTime * 1000));
          
          // 마지막 이미지가 아니면 슬라이드 애니메이션 실행
          if (nextImg && i + 1 < images.length) {
            const nextScale = Math.max(baseWidth / nextImg.width, baseHeight / nextImg.height);
            const nextNewWidth = nextImg.width * nextScale;
            const nextNewHeight = nextImg.height * nextScale;
            const nextX = (baseWidth - nextNewWidth) / 2;
            const nextY = (baseHeight - nextNewHeight) / 2;
            
            // 애니메이션 프레임 수
            const animationFrames = Math.floor(animationTime * fps);
            const frameDelay = (animationTime * 1000) / animationFrames;
            
            for (let frame = 0; frame <= animationFrames; frame++) {
              const progress = frame / animationFrames;
              
              // 현재 이미지는 왼쪽으로 이동
              const currentOffsetX = -baseWidth * progress;
              // 다음 이미지는 오른쪽에서 들어옴
              const nextOffsetX = baseWidth * (1 - progress);
              
              // 캔버스 지우기
              ctx.clearRect(0, 0, baseWidth, baseHeight);
              
              // 현재 이미지 그리기 (왼쪽으로 이동)
              ctx.drawImage(currentImg, x + currentOffsetX, y, newWidth, newHeight);
              
              // 다음 이미지 그리기 (오른쪽에서 들어옴)
              ctx.drawImage(nextImg, nextX + nextOffsetX, nextY, nextNewWidth, nextNewHeight);
              
              if (frame < animationFrames) {
                await new Promise(resolve => setTimeout(resolve, frameDelay));
              }
            }
          } else {
            // 마지막 이미지는 추가 시간만 기다림
            await new Promise(resolve => setTimeout(resolve, animationTime * 1000));
          }
        }
      }
      
      mediaRecorder.stop();
      
    } catch (error) {
      console.error('영상 생성 오류:', error);
      addLog('영상 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCreatingVideo(false);
    }
  };

  const handleCreateFinalVideo = async () => {
    if (mediaFiles.length === 0) {
      addLog('최종 영상을 만들려면 최소 1개 이상의 파일이 필요합니다.', 'error');
      return;
    }

    if (!canvasRef.current) {
      addLog('캔버스를 찾을 수 없습니다.', 'error');
      return;
    }

    setIsCreatingFinalVideo(true);
    setIsFinalVideoGenerated(false);
    addLog('최종 영상 생성을 시작합니다...', 'info');
    addLog(`${mediaFiles.length}개의 미디어 파일로 최종 영상을 만들고 있습니다.`, 'info');
    
    try {
      // 이미지와 영상을 모두 처리할 수 있는 로직
      // 간단한 시뮬레이션으로 구현
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // 실제로는 mediaFiles를 처리해서 최종 영상을 만들어야 함
      // 지금은 더미 URL 생성
      const dummyBlob = new Blob(['dummy final video data'], { type: 'video/mp4' });
      const url = URL.createObjectURL(dummyBlob);
      
      setFinalVideoUrl(url);
      setIsFinalVideoGenerated(true);
      addLog('최종 영상 생성이 완료되었습니다!', 'success');
      addLog('5번 카드에서 최종 영상을 미리볼 수 있습니다.', 'info');
      
    } catch (error) {
      console.error('최종 영상 생성 오류:', error);
      addLog('최종 영상 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCreatingFinalVideo(false);
    }
  };

  const handleYoutubeVideoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const newVideo: UploadedImage = {
        id: `${file.name}-${new Date().getTime()}`,
        file: file,
        dataUrl: e.target?.result as string,
      };
      setYoutubeVideo(newVideo);
      addLog(`YouTube 업로드용 영상이 선택되었습니다: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadToYoutube = async () => {
    if (!youtubeVideo) {
      addLog('YouTube에 업로드할 영상을 먼저 선택해주세요.', 'error');
      return;
    }

    setIsUploadingToYoutube(true);
    addLog('YouTube에 영상을 업로드하기 시작합니다...', 'info');
    addLog(`파일명: ${youtubeVideo.file.name}`, 'info');
    addLog(`파일 크기: ${(youtubeVideo.file.size / 1024 / 1024).toFixed(1)}MB`, 'info');
    
    try {
      // YouTube 업로드 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 3000));
      const videoId = `dQw4w9WgXcQ${Math.random().toString(36).substring(2, 7)}`;
      addLog('YouTube 업로드가 완료되었습니다!', 'success');
      addLog(`영상 URL: https://www.youtube.com/watch?v=${videoId}`, 'success');
      
    } catch (error) {
      console.error('YouTube 업로드 오류:', error);
      addLog('YouTube 업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUploadingToYoutube(false);
    }
  };

  const handleGenerateInfo = async () => {
    if (!keyword.trim()) {
      addLog('키워드를 입력해주세요.', 'error');
      return;
    }

    setIsGeneratingInfo(true);
    addLog(`"${keyword}" 키워드로 영상 정보를 생성합니다...`, 'info');
    addLog(`사용된 프롬포트: ${prompt}`, 'info');
    
    try {
      // AI 생성 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const sampleInfo = `제목: ${keyword}에 대한 완벽 가이드 | 초보자도 쉽게 따라할 수 있는 방법

설명: 안녕하세요! 이번 영상에서는 ${keyword}에 대해 자세히 알아보겠습니다. 
초보자부터 전문가까지 모두가 유용하게 볼 수 있는 내용으로 준비했습니다.

📌 주요 내용:
- ${keyword}의 기본 개념
- 실무에서 활용하는 방법
- 주의사항과 팁
- 추천 도구 및 리소스

💡 이 영상이 도움이 되셨다면 좋아요와 구독 부탁드립니다!

태그: ${keyword}, 가이드, 튜토리얼, 초보자, 방법, 팁, 노하우, 실무, 활용법, 추천`;
      
      setGeneratedInfo(sampleInfo);
      addLog('영상 정보가 성공적으로 생성되었습니다!', 'success');
      
    } catch (error) {
      console.error('정보 생성 오류:', error);
      addLog('정보 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsGeneratingInfo(false);
    }
  };

  const steps = [
    {
      id: 'logs',
      title: '실시간 로그',
      content: (
        <div className="space-y-4">
          <LogDisplay logs={logs} />
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              자동화 진행 상황이 여기에 표시됩니다.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'image-selection',
      title: '이미지를 다중 선택하세요',
      content: (
        <div className="space-y-4">
          {/* 이미지 업로드 버튼 */}
          <div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition-colors"
            >
              이미지 업로드
            </button>
          </div>

          {/* 이미지 썸네일 리스트 */}
          {images.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">선택된 이미지 ({images.length}개)</h4>
              <div className="space-y-2">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded border cursor-move"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      moveImage(fromIndex, index);
                    }}
                  >
                    <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <img 
                      src={image.dataUrl} 
                      alt="" 
                      className="w-16 h-16 object-cover rounded" 
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 truncate">
                        {image.file.name.length > 5 ? image.file.name.substring(0, 5) + '...' : image.file.name}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteImage(image.id)} 
                      className="text-red-500 hover:text-red-700 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 해상도 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해상도 설정
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="1280x720">1280×720 (가로형 HD)</option>
              <option value="720x1280">720×1280 (세로형 HD)</option>
              <option value="1080x1080">1080×1080 (정사각형)</option>
            </select>
          </div>

          {/* 애니메이션 타입 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전환 애니메이션
            </label>
            <select
              value={animationType}
              onChange={(e) => setAnimationType(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="cut">딱딱 끊어져서 나오기</option>
              <option value="slide">밀어내는 애니메이션</option>
            </select>
          </div>

          {/* 슬라이드 지속시간 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              각 이미지는 몇초로 하시겠어요?
            </label>
            <input
              type="number"
              value={slideDuration}
              onChange={(e) => setSlideDuration(e.target.value)}
              step="0.1"
              min="0.1"
              max="10"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
              placeholder="1.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              총 영상 길이: {images.length > 0 ? (images.length * parseFloat(slideDuration || '1.5')).toFixed(1) : '0'}초
              {animationType === 'slide' && ' (전환 애니메이션 포함)'}
            </p>
          </div>

          {/* 영상 만들기 버튼 */}
          <button
            onClick={handleCreateVideo}
            disabled={images.length === 0 || isCreatingVideo}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isCreatingVideo ? '영상 만드는 중...' : '이 이미지들로 영상 만들기'}
          </button>
        </div>
      )
    },
    {
      id: 'video-preview',
      title: '영상 미리보기',
      content: (
        <div className="space-y-4">
          {isVideoGenerated && videoUrl ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">생성된 영상</h4>
                <video
                  controls
                  className="w-full rounded-md border border-gray-300"
                  style={{ maxHeight: '300px' }}
                >
                  <source src={videoUrl} type="video/mp4" />
                  <source src={videoUrl} type="video/webm" />
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={videoUrl}
                  download={`slideshow_${Date.now()}.mp4`}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  📥 영상 다운로드
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(videoUrl);
                    addLog('영상 URL이 클립보드에 복사되었습니다.', 'success');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                  🔗 URL 복사
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <h5 className="text-sm font-medium text-gray-700 mb-1">영상 정보</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>해상도: {resolution} {resolution === '1280x720' ? '(가로형 HD)' : resolution === '720x1280' ? '(세로형 HD)' : '(정사각형)'}</div>
                  <div>프레임율: 30 FPS</div>
                  <div>총 재생시간: {(images.length * parseFloat(slideDuration || '1.5')).toFixed(1)}초</div>
                  <div>이미지 수: {images.length}개</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1zm4-2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p>영상이 생성되지 않았습니다.</p>
                <p className="text-sm mt-1">2번 카드에서 이미지를 선택하고 영상을 만들어보세요.</p>
              </div>
              
              {isCreatingVideo && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full mr-2"></div>
                  영상 생성 중...
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'media-selection',
      title: '영상을 다중 선택하세요',
      content: (
        <div className="space-y-4">
          {/* 미디어 업로드 버튼 */}
          <div>
            <input 
              type="file" 
              multiple 
              accept="video/*" 
              ref={mediaFileInputRef} 
              onChange={handleMediaUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => mediaFileInputRef.current?.click()} 
              className="w-full px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition-colors"
            >
              파일 업로드
            </button>
            <p className="text-xs text-gray-500 mt-1">
              영상 파일 (MP4, MOV, AVI, MKV 등)을 선택할 수 있습니다
            </p>
          </div>

          {/* 미디어 썸네일 리스트 */}
          {mediaFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">선택된 파일 ({mediaFiles.length}개)</h4>
              <div className="space-y-2">
                {mediaFiles.map((file, index) => (
                  <div 
                    key={file.id} 
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded border cursor-move"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      moveMediaFile(fromIndex, index);
                    }}
                  >
                    <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    
                    {/* 파일 타입에 따른 썸네일 표시 */}
                    {file.file.type.startsWith('image/') ? (
                      <img 
                        src={file.dataUrl} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded" 
                      />
                    ) : file.file.type.startsWith('video/') ? (
                      <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 truncate">
                        {file.file.name.length > 8 ? file.file.name.substring(0, 8) + '...' : file.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        영상 · {(file.file.size / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteMediaFile(file.id)} 
                      className="text-red-500 hover:text-red-700 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 해상도 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해상도 설정
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="1280x720">1280×720 (가로형 HD)</option>
              <option value="720x1280">720×1280 (세로형 HD)</option>
              <option value="1080x1080">1080×1080 (정사각형)</option>
            </select>
          </div>

          {/* 전환 애니메이션 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전환 애니메이션
            </label>
            <select
              value={animationType}
              onChange={(e) => setAnimationType(e.target.value)}
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="cut">딱딱 끊어져서 나오기</option>
              <option value="slide">밀어내는 애니메이션</option>
            </select>
          </div>

          {/* 최종영상 만들기 버튼 */}
          {mediaFiles.length > 0 && (
            <button
              onClick={handleCreateFinalVideo}
              disabled={mediaFiles.length === 0 || isCreatingFinalVideo}
              className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCreatingFinalVideo ? '최종영상 만드는 중...' : '이 파일로 최종영상 만들기'}
            </button>
          )}

          <div className="text-center py-4">
            {mediaFiles.length === 0 ? (
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <p className="text-sm">영상 파일을 업로드하세요</p>
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 rounded-full mr-2 bg-green-400" />
                {mediaFiles.length}개 파일 준비됨
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'final-video-preview',
      title: '최종영상 미리보기',
      content: (
        <div className="space-y-4">
          {isFinalVideoGenerated && finalVideoUrl ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">생성된 최종 영상</h4>
                <video
                  controls
                  className="w-full rounded-md border border-gray-300"
                  style={{ maxHeight: '300px' }}
                >
                  <source src={finalVideoUrl} type="video/mp4" />
                  <source src={finalVideoUrl} type="video/webm" />
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={finalVideoUrl}
                  download={`final_video_${Date.now()}.mp4`}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  📥 최종영상 다운로드
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(finalVideoUrl);
                    addLog('최종영상 URL이 클립보드에 복사되었습니다.', 'success');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                  🔗 URL 복사
                </button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded border">
                <h5 className="text-sm font-medium text-gray-700 mb-1">최종영상 정보</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>포함된 영상: {mediaFiles.length}개 파일</div>
                  <div>총 용량: {(mediaFiles.reduce((sum, f) => sum + f.file.size, 0) / 1024 / 1024).toFixed(1)}MB</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 8v8H5V8h10m1-2H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1zm4-2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p>최종영상이 생성되지 않았습니다.</p>
                <p className="text-sm mt-1">4번 카드에서 파일을 선택하고 최종영상을 만들어보세요.</p>
              </div>
              
              {isCreatingFinalVideo && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full mr-2"></div>
                  최종영상 생성 중...
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'video-info-prompt',
      title: '영상정보 프롬포트',
      content: (
        <div className="space-y-4">
          {/* 키워드 텍스트 */}
          <div className="text-center mb-4">
            <h4 className="text-lg font-medium text-gray-700 mb-2">키워드</h4>
          </div>

          {/* 키워드 입력 칸 */}
          <div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="키워드를 입력해주세요"
              className="w-full p-3 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateInfo()}
            />
          </div>

          {/* 프롬포트 편집기 */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">영상 정보 생성 프롬포트</h4>
                <p className="text-xs text-gray-600">키워드를 기반으로 영상 정보를 생성하는 프롬포트입니다</p>
              </div>
              <button
                onClick={() => setPrompt(`#이 키워드와 아래 AutoVid 대한 유튜브 제목, 설명, 그리고 #없이 태그를 , 콤마 형태로 나열하세요.

#반드시 사람들이 궁금해하고, 후킹하고, 클릭할 것 같은 제목과 검색이 잘되는 태그가 필요합니다. 

AutoVid는 단 한번의 클릭으로 자동 생성되는 유튜브 쇼핑쇼츠 서비스 입니다. 어필리에이트에 강력한 장점을 갖고있어, 영상을 자체적으로 만들고 연관된 아마존 상품을 링크로 소개해줍니다. 또한 현재 바이럴되는 쇼츠들을 토대로 쇼핑쇼츠를 제작하여 조회수도 보장됩니다. 만약 유튜브로 수익화를 원하는 분이나, 온라인으로 홍보하고싶은 자영업자가 있다면 AutoVid를 추천해주세요. 특히 쇼츠로 부수입,돈을 벌고싶거나 매일 자동 생성된다는 성실함이 필요한분들에게 추천해주세요.`)}
                className="text-xs text-cyan-600 hover:text-cyan-800 px-2 py-1 border border-cyan-600 rounded"
              >
                초기화
              </button>
            </div>
            
            <div className="mb-2">
              <span className="text-xs text-gray-500">사용 가능한 변수: </span>
              <span className="text-xs text-cyan-600">{keyword}</span>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 p-2 bg-white rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500 text-sm font-mono"
              placeholder="프롬포트를 입력하세요..."
            />
          </div>

          {/* 정보 생성하기 버튼 */}
          <button
            onClick={handleGenerateInfo}
            disabled={!keyword.trim() || isGeneratingInfo}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGeneratingInfo ? '정보 생성 중...' : '정보 생성하기'}
          </button>

          {/* 생성된 정보 표시 */}
          {generatedInfo && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">생성된 영상 정보</h5>
              <div className="bg-gray-50 p-4 rounded border max-h-80 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {generatedInfo}
                </pre>
              </div>
              
              {/* 복사 버튼 */}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInfo);
                    addLog('생성된 정보가 클립보드에 복사되었습니다.', 'success');
                  }}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  📋 정보 복사
                </button>
                <button
                  onClick={() => setGeneratedInfo('')}
                  className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  🗑️ 지우기
                </button>
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!generatedInfo && !isGeneratingInfo && (
            <div className="text-center py-6">
              <div className="text-gray-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <p className="text-sm">키워드를 입력하고 정보 생성하기를 눌러보세요</p>
              </div>
            </div>
          )}

          {/* 생성 중 표시 */}
          {isGeneratingInfo && (
            <div className="text-center py-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                AI가 영상 정보를 생성하고 있습니다...
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'youtube-upload',
      title: '유튜브 업로드',
      content: (
        <div className="space-y-4">
          {/* 영상 업로드 버튼 */}
          <div>
            <input 
              type="file" 
              accept="video/*" 
              ref={youtubeFileInputRef} 
              onChange={handleYoutubeVideoUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => youtubeFileInputRef.current?.click()} 
              className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
            >
              영상 업로드
            </button>
            <p className="text-xs text-gray-500 mt-1">
              YouTube에 업로드할 영상 파일을 선택하세요 (MP4, MOV, AVI 등)
            </p>
          </div>

          {/* 선택된 영상 썸네일 미리보기 */}
          {youtubeVideo && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded border">
                <h4 className="text-sm font-medium text-gray-700 mb-3">선택된 영상</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-20 h-20 bg-gray-300 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {youtubeVideo.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      영상 파일 · {(youtubeVideo.file.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                    <p className="text-xs text-gray-500">
                      업로드 준비됨
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setYoutubeVideo(null);
                      addLog('선택된 영상이 제거되었습니다.', 'info');
                    }}
                    className="text-red-500 hover:text-red-700 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* YouTube 업로드하기 버튼 */}
              <button
                onClick={handleUploadToYoutube}
                disabled={!youtubeVideo || isUploadingToYoutube}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUploadingToYoutube ? 'YouTube에 업로드 중...' : 'YouTube에 업로드하기'}
              </button>
            </div>
          )}

          {/* 빈 상태 */}
          {!youtubeVideo && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-2 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186c-.265-1.006-1.046-1.788-2.052-2.054C19.608 3.749 12 3.749 12 3.749s-7.608 0-9.446.383C1.548 4.398.767 5.18.502 6.186.119 8.024.119 12 .119 12s0 3.976.383 5.814c.265 1.006 1.046 1.788 2.052 2.054C4.392 20.251 12 20.251 12 20.251s7.608 0 9.446-.383c1.006-.266 1.787-1.048 2.052-2.054.383-1.838.383-5.814.383-5.814s0-3.976-.383-5.814zM9.756 15.484V8.516L15.789 12l-6.033 3.484z"/>
                </svg>
                <p>영상을 선택하면 썸네일이 여기에 나타납니다</p>
                <p className="text-sm mt-1">영상 업로드 버튼을 눌러 파일을 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      {/* 숨겨진 캔버스 - 영상 생성용 */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      <div className="w-full bg-white">
        <div className="overflow-x-auto pb-6 bg-white">
          <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
            {steps.map((step, index) => (
              <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-6 w-96 flex-shrink-0 hover:shadow-lg transition-shadow min-h-[650px]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-black">{step.title}</h3>
                </div>
                <div className="h-full">
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default YouTubeUploadDashboard;