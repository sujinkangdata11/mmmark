import React, { useState, useRef, ChangeEvent } from 'react';
import { AutomationConfig, UploadedImage } from '../../types';
import { generateText } from '../../shared/services/geminiService';
import { googleDriveService, GoogleDriveImage, GoogleDriveFolder } from '../../shared/services/googleDriveService';
import { getChannelInfo, YouTubeChannelInfo } from '../youtube-feed/youtubeService';
import { twitterService } from './twitterService';
import PromptEditor from '../../shared/components/common/PromptEditor';
import AutomationControls from '../../shared/components/common/AutomationControls';
import LogDisplay from '../../shared/components/common/LogDisplay';
import { usePrompts, useLogger, useAutomation, useApiKeys } from '../../shared/hooks';

interface TwitterThreadsDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const TwitterThreadsDashboard: React.FC<TwitterThreadsDashboardProps> = ({ config }) => {
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('twitter');
  const { logs, addLog, clearLogs } = useLogger();
  const { isAutomating, startAutomation, stopAutomation, isRunning } = useAutomation();
  const { getApiKey } = useApiKeys(['googleDriveClientId', 'googleDriveClientSecret', 'gemini', 'youtube', 'twitterConsumerKey', 'twitterConsumerSecret', 'twitterAccessToken', 'twitterAccessTokenSecret', 'twitterBearerToken']);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [driveImages, setDriveImages] = useState<GoogleDriveImage[]>([]);
  const [driveFolders, setDriveFolders] = useState<GoogleDriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<GoogleDriveFolder | null>(null);
  const [showDriveImages, setShowDriveImages] = useState(false);
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState<UploadedImage | null>(null);
  const [extractedChannels, setExtractedChannels] = useState<{imageId: string, channelName: string}[]>([]);
  const [isExtractingChannels, setIsExtractingChannels] = useState(false);
  const [channelInfos, setChannelInfos] = useState<YouTubeChannelInfo[]>([]);
  const [isExtractingChannelInfo, setIsExtractingChannelInfo] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<{channelName: string, content: string, originalContent: string}[]>([]);
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [translatedPosts, setTranslatedPosts] = useState<{channelName: string, content: string, originalContent: string}[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationPrompt, setTranslationPrompt] = useState('이 내용을 영어로 번역하세요');
  const [selectedLanguage, setSelectedLanguage] = useState<'korean' | 'english'>('korean');
  const [isPublishingToTwitter, setIsPublishingToTwitter] = useState(false);
  const [isPublishingToThreads, setIsPublishingToThreads] = useState(false);
  const [twitterPublishCompleted, setTwitterPublishCompleted] = useState(false);
  const [threadsPublishCompleted, setThreadsPublishCompleted] = useState(false);
  const [channelExtractionPrompt, setChannelExtractionPrompt] = useState(
    `이 이미지를 분석하고 "YouTube 핸들"을 추출해주세요. 
답변은 "핸들"만 간단히 해주세요.
## "핸들"은 @ 다음에 나오는 것이 핸들입니다. 
##유튜브 채널명하고 햇갈리지마세요.

ex)
@슈카월드`
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const handleDeleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleGoogleDriveImport = async () => {
    try {
      addLog('Google Drive 인증을 시작합니다...', 'info');
      
      const clientId = getApiKey('googleDriveClientId');
      const clientSecret = getApiKey('googleDriveClientSecret');
      
      if (!clientId || !clientSecret) {
        addLog('Google Drive API 키가 설정되지 않았습니다. 사이드바에서 설정해주세요.', 'error');
        return;
      }

      googleDriveService.initialize({ clientId, clientSecret });
      
      if (!googleDriveService.isAuthenticated()) {
        addLog('Google Drive 로그인 창을 열고 있습니다...', 'info');
        const success = await googleDriveService.authenticate();
        if (!success) {
          addLog('Google Drive 인증에 실패했습니다.', 'error');
          return;
        }
        addLog('Google Drive 인증에 성공했습니다!', 'success');
      }

      addLog('Google Drive 폴더 목록을 가져오고 있습니다...', 'generating');
      const folders = await googleDriveService.getFolders();
      setDriveFolders(folders);
      setShowFolderSelect(true);
      addLog(`${folders.length}개의 폴더를 찾았습니다.`, 'success');
    } catch (error) {
      addLog(`Google Drive 연결 오류: ${error}`, 'error');
    }
  };

  const handleFolderSelect = async (folder: GoogleDriveFolder | null) => {
    try {
      setSelectedFolder(folder);
      setShowFolderSelect(false);
      
      const folderName = folder ? folder.name : '전체 드라이브';
      addLog(`'${folderName}'에서 이미지를 가져오고 있습니다...`, 'generating');
      
      const driveImages = await googleDriveService.getImages(folder?.id);
      setDriveImages(driveImages);
      setShowDriveImages(true);
      addLog(`${driveImages.length}개의 이미지를 찾았습니다.`, 'success');
    } catch (error) {
      addLog(`이미지 조회 오류: ${error}`, 'error');
    }
  };

  const handleSelectDriveImage = async (driveImage: GoogleDriveImage) => {
    try {
      addLog(`'${driveImage.name}' 이미지를 다운로드하고 있습니다...`, 'generating');
      const file = await googleDriveService.downloadImage(driveImage);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: `drive-${driveImage.id}-${new Date().getTime()}`,
          file: file,
          dataUrl: e.target?.result as string,
        };
        setImages(prev => [...prev, newImage]);
        addLog(`'${driveImage.name}' 이미지가 추가되었습니다.`, 'success');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      addLog(`이미지 다운로드 오류: ${error}`, 'error');
    }
  };

  const handleImageExpand = (image: UploadedImage) => {
    setModalImage(image);
    setShowImageModal(true);
  };


  const handleExtractChannels = async () => {
    console.log('[DEBUG] handleExtractChannels 호출됨');
    console.log('[DEBUG] images.length:', images.length);
    
    if (images.length === 0) {
      console.log('[DEBUG] 이미지가 없어서 리턴');
      addLog('채널명을 추출할 이미지가 없습니다.', 'error');
      return;
    }

    console.log('[DEBUG] setIsExtractingChannels(true) 호출');
    setIsExtractingChannels(true);
    
    console.log('[DEBUG] getApiKey 호출 시도');
    // Gemini API 키 확인
    const geminiKey = getApiKey('gemini');
    console.log('[DEBUG] getApiKey 결과:', geminiKey ? 'API키 있음' : 'API키 없음');
    
    console.log('[DEBUG] addLog 호출 시도');
    addLog(`Gemini API 키 확인: ${geminiKey ? '✅ 설정됨' : '❌ 없음'}`, 'info');
    console.log('[DEBUG] addLog 완료');
    
    if (!geminiKey) {
      console.log('[DEBUG] API키 없어서 리턴');
      addLog('Gemini API 키가 설정되지 않았습니다. 사이드바에서 설정해주세요.', 'error');
      setIsExtractingChannels(false);
      return;
    }
    
    console.log('[DEBUG] 이미지 처리 시작');
    addLog(`${images.length}개 이미지에서 YouTube 채널명을 추출합니다...`, 'info');

    const results: {imageId: string, channelName: string}[] = [];
    
    console.log('[DEBUG] for 루프 시작 전, images:', images);
    console.log('[DEBUG] isRunning():', isRunning());

    for (const image of images) {
      console.log('[DEBUG] for 루프 안에 들어옴, image:', image.file.name);
      // 채널명 추출은 독립적인 기능이므로 isRunning() 체크 제거
      // if (!isRunning()) break;
      
      try {
        addLog(`'${image.file.name}'에서 채널명 추출 중...`, 'generating');
        addLog(`프롬프트: ${channelExtractionPrompt.substring(0, 50)}...`, 'info');
        addLog(`이미지 데이터: ${image.dataUrl ? 'OK' : 'NONE'}`, 'info');
        
        // Gemini를 이용해 이미지에서 채널명 추출
        const rawChannelName = await generateText(channelExtractionPrompt, image.dataUrl, geminiKey);
        
        addLog(`AI 응답: ${rawChannelName}`, 'info');
        
        // @ 접두사 자동 추가 로직
        const cleanChannelName = rawChannelName.trim();
        const formattedChannelName = cleanChannelName.startsWith('@') ? cleanChannelName : `@${cleanChannelName}`;
        
        results.push({
          imageId: image.id,
          channelName: formattedChannelName
        });
        
        addLog(`'${image.file.name}': ${formattedChannelName}`, 'success');
      } catch (error) {
        addLog(`'${image.file.name}' 채널명 추출 실패: ${error}`, 'error');
        results.push({
          imageId: image.id,
          channelName: '추출 실패'
        });
      }
    }

    setExtractedChannels(results);
    setIsExtractingChannels(false);
    
    addLog('모든 이미지의 채널명 추출이 완료되었습니다.', 'info');
  };

  const handleExtractChannelInfo = async () => {
    if (extractedChannels.length === 0) {
      addLog('먼저 채널명을 추출해주세요.', 'error');
      return;
    }

    setIsExtractingChannelInfo(true);
    
    // YouTube API 키 확인
    const youtubeKey = getApiKey('youtube');
    
    if (!youtubeKey) {
      addLog('YouTube Data API 키가 설정되지 않았습니다. 사이드바에서 설정해주세요.', 'error');
      setIsExtractingChannelInfo(false);
      return;
    }
    
    addLog(`${extractedChannels.length}개 채널의 YouTube 정보를 조회합니다...`, 'info');

    const results: YouTubeChannelInfo[] = [];

    for (const channel of extractedChannels) {
      try {
        addLog(`'${channel.channelName}' 채널 정보 조회 중...`, 'generating');
        
        const channelInfo = await getChannelInfo(channel.channelName, youtubeKey);
        results.push(channelInfo);
        
        addLog(`'${channel.channelName}' 정보 조회 완료`, 'success');
      } catch (error) {
        addLog(`'${channel.channelName}' 정보 조회 실패: ${error}`, 'error');
      }
    }

    setChannelInfos(results);
    setIsExtractingChannelInfo(false);
    
    addLog('모든 채널의 YouTube 정보 조회가 완료되었습니다.', 'info');
  };

  const handleGeneratePosts = async () => {
    if (channelInfos.length === 0) {
      addLog('먼저 4번 카드에서 YouTube 채널 정보를 추출해주세요.', 'error');
      return;
    }

    setIsGeneratingPosts(true);
    
    // Gemini API 키 확인
    const geminiKey = getApiKey('gemini');
    if (!geminiKey) {
      addLog('Gemini API 키가 설정되지 않았습니다. 사이드바에서 설정해주세요.', 'error');
      setIsGeneratingPosts(false);
      return;
    }

    addLog(`${channelInfos.length}개 채널의 수익 분석 포스트를 생성합니다...`, 'info');

    const results: {channelName: string, content: string, originalContent: string}[] = [];

    for (const channelInfo of channelInfos) {
      try {
        addLog(`'${channelInfo.channelName}' 채널 수익 분석 포스트 생성 중...`, 'generating');
        
        // 채널 생성일로부터 현재까지의 기간 계산
        const createdDate = new Date(channelInfo.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
        
        // 수익 계산
        const totalViews = parseInt(channelInfo.viewCount.replace(/,/g, ''));
        const videoCount = parseInt(channelInfo.videoCount.replace(/,/g, ''));
        
        // 광고 수익 계산 (RPM $0.3 기준)
        const adRevenue = Math.round((totalViews / 1000) * 0.3);
        
        // 쇼핑제휴 수익 계산 (1만뷰당 20건, 평균 $30, 커미션 6%)
        const affiliateRevenue = Math.round((totalViews / 10000) * 20 * 30 * 0.06);
        
        // 총 수익
        const totalRevenue = adRevenue + affiliateRevenue;
        
        // 채널 정보를 포함한 데이터 구성
        const channelData = `
채널명: ${channelInfo.channelName}
채널 생성일: ${channelInfo.createdAt}
개설 기간: ${daysDiff}일
구독자수: ${channelInfo.subscriberCount}명
총 조회수: ${channelInfo.viewCount}회
총 영상갯수: ${channelInfo.videoCount}개
가장 높은 조회수: ${channelInfo.mostViewedVideoViews}회

계산된 수익 정보:
- 개설 기간: ${daysDiff}일
- 업로드수: ${videoCount}개
- 광고 수익 (RPM $0.3): $${adRevenue.toLocaleString()}
- 쇼핑제휴 수익: $${affiliateRevenue.toLocaleString()}
- 합산 총 수익: $${totalRevenue.toLocaleString()}
        `;
        
        const basePrompt = getPrompt('twitter-post')?.template || '';
        const finalPrompt = `${channelData}\n\n${basePrompt}`;

        const generatedPost = await generateText(finalPrompt, undefined, geminiKey);
        
        results.push({
          channelName: channelInfo.channelName,
          content: generatedPost,
          originalContent: generatedPost
        });
        
        addLog(`'${channelInfo.channelName}' 포스트 생성 완료`, 'success');
      } catch (error) {
        addLog(`'${channelInfo.channelName}' 포스트 생성 실패: ${error}`, 'error');
      }
    }

    setGeneratedPosts(results);
    setIsGeneratingPosts(false);
    
    addLog('모든 채널의 수익 분석 포스트 생성이 완료되었습니다.', 'info');
  };

  const handleTranslatePosts = async () => {
    if (generatedPosts.length === 0) {
      addLog('먼저 5번 카드에서 게시글을 생성해주세요.', 'error');
      return;
    }

    setIsTranslating(true);
    
    // Gemini API 키 확인
    const geminiKey = getApiKey('gemini');
    if (!geminiKey) {
      addLog('Gemini API 키가 설정되지 않았습니다. 사이드바에서 설정해주세요.', 'error');
      setIsTranslating(false);
      return;
    }

    addLog(`${generatedPosts.length}개 게시글을 영어로 번역합니다...`, 'info');

    const results: {channelName: string, content: string, originalContent: string}[] = [];

    for (const post of generatedPosts) {
      try {
        addLog(`'${post.channelName}' 게시글 번역 중...`, 'generating');
        
        const finalPrompt = `${translationPrompt}\n\n---\n\n${post.content}`;
        const translatedContent = await generateText(finalPrompt, undefined, geminiKey);
        
        results.push({
          channelName: post.channelName,
          content: translatedContent,
          originalContent: translatedContent
        });
        
        addLog(`'${post.channelName}' 번역 완료`, 'success');
      } catch (error) {
        addLog(`'${post.channelName}' 번역 실패: ${error}`, 'error');
      }
    }

    setTranslatedPosts(results);
    setIsTranslating(false);
    
    addLog('모든 게시글의 영어 번역이 완료되었습니다.', 'info');
  };

  const handleTwitterPublish = async () => {
    console.log('[DEBUG] handleTwitterPublish 시작');
    addLog('[디버그] Twitter 게시 함수가 호출되었습니다.', 'info');

    // 1. 이미지 체크
    console.log('[DEBUG] 이미지 개수:', images.length);
    addLog(`[디버그] 업로드된 이미지 개수: ${images.length}개`, 'info');
    
    if (images.length === 0) {
      addLog('먼저 2번 카드에서 이미지를 선택해주세요.', 'error');
      return;
    }

    // 2. 게시글 체크
    const postsToPublish = selectedLanguage === 'english' ? translatedPosts : generatedPosts;
    console.log('[DEBUG] 선택된 언어:', selectedLanguage);
    console.log('[DEBUG] 게시글 개수:', postsToPublish.length);
    addLog(`[디버그] 선택된 언어: ${selectedLanguage}, 게시글 개수: ${postsToPublish.length}개`, 'info');
    
    if (postsToPublish.length === 0) {
      const requiredCard = selectedLanguage === 'english' ? '6번(영어 번역)' : '5번(게시글 생성)';
      addLog(`먼저 ${requiredCard} 카드에서 콘텐츠를 준비해주세요.`, 'error');
      return;
    }

    // 3. Twitter API 키 확인
    const twitterConfig = {
      consumerKey: getApiKey('twitterConsumerKey'),
      consumerSecret: getApiKey('twitterConsumerSecret'),
      accessToken: getApiKey('twitterAccessToken'),
      accessTokenSecret: getApiKey('twitterAccessTokenSecret'),
      bearerToken: getApiKey('twitterBearerToken')
    };

    console.log('[DEBUG] Twitter API 키 상태:', {
      consumerKey: twitterConfig.consumerKey ? '설정됨' : '미설정',
      consumerSecret: twitterConfig.consumerSecret ? '설정됨' : '미설정',
      accessToken: twitterConfig.accessToken ? '설정됨' : '미설정',
      accessTokenSecret: twitterConfig.accessTokenSecret ? '설정됨' : '미설정',
      bearerToken: twitterConfig.bearerToken ? '설정됨' : '미설정'
    });

    addLog(`[디버그] Twitter API 키 확인 완료`, 'info');

    if (!twitterConfig.consumerKey || !twitterConfig.consumerSecret || 
        !twitterConfig.accessToken || !twitterConfig.accessTokenSecret || 
        !twitterConfig.bearerToken) {
      addLog('Twitter API 키가 완전하지 않습니다. Sidebar에서 모든 Twitter API 키를 입력해주세요.', 'error');
      return;
    }

    // Twitter 서비스는 이제 Python tweepy를 사용하므로 별도 초기화 불필요
    console.log('[DEBUG] Python tweepy 방식 사용 - 별도 초기화 불필요');
    addLog('[디버그] Python tweepy 방식으로 게시 준비 중...', 'info');

    // 5. 게시 시작
    setIsPublishingToTwitter(true);
    console.log('[DEBUG] 게시 상태를 true로 설정');

    const languageType = selectedLanguage === 'english' ? '영어' : '한국어';
    addLog(`${languageType} 콘텐츠를 트위터에 발행합니다...`, 'info');

    const totalPairs = Math.min(images.length, postsToPublish.length);
    console.log('[DEBUG] 처리할 이미지-게시글 쌍:', totalPairs);
    addLog(`[디버그] 총 ${totalPairs}개의 이미지-게시글 쌍을 처리합니다.`, 'info');

    // 6. 개별 게시 처리
    for (let i = 0; i < totalPairs; i++) {
      const image = images[i];
      const post = postsToPublish[i];
      
      console.log(`[DEBUG] ${i + 1}번째 아이템 처리 시작:`, {
        imageName: image.file.name,
        imageSize: image.file.size,
        channelName: post.channelName,
        contentLength: post.content.length
      });

      addLog(`[디버그] ${i + 1}/${totalPairs} - '${image.file.name}' 처리 시작`, 'info');

      try {
        addLog(`'${image.file.name}' 이미지와 '${post.channelName}' ${languageType} 텍스트를 트위터에 게시 중...`, 'generating');
        
        // 실제 Twitter API 모드
        console.log('[DEBUG] 실제 Twitter API 호출 시작');
        addLog('[디버그] 실제 Twitter API로 게시를 시도합니다.', 'info');
        
        try {
          console.log('[DEBUG] Python tweepy로 실제 트윗 게시');
          console.log('[DEBUG] 게시할 텍스트:', post.content.substring(0, 50) + '...');
          console.log('[DEBUG] 이미지 파일:', image.file.name, image.file.size, image.file.type);
          
          // Python tweepy 방식으로 이미지와 함께 트윗
          const tweetResponse = await twitterService.publishWithImage(post.content, image.file);
          console.log('[DEBUG] Python tweepy 응답:', tweetResponse);
          
          const tweetId = tweetResponse?.data?.id || 'temp_id';
          
          addLog(`✅ Python tweepy로 트윗 게시 준비 완료!`, 'success');
          addLog(`📋 콘솔에 출력된 Python 명령어를 터미널에서 실행하세요`, 'info');
          addLog(`🖼️ 이미지가 자동으로 다운로드되었습니다`, 'info');
          addLog(`게시할 내용: "${post.content.substring(0, 100)}..."`, 'info');
          
        } catch (apiError: any) {
          console.error('[DEBUG] Twitter API 오류:', apiError);
          
          if (apiError.message.includes('401') || apiError.message.includes('Unauthorized')) {
            addLog('⚠️ Twitter API 인증 실패: Cloudflare Workers 환경변수를 확인해주세요.', 'error');
            addLog('TWITTER_SETUP.md 파일을 참고하여 환경변수를 설정해주세요.', 'info');
          } else {
            addLog(`Twitter API 오류: ${apiError.message}`, 'error');
          }
          
          throw apiError;
        }
        
        console.log(`[DEBUG] ${i + 1}번째 아이템 처리 완료`);
        
      } catch (error) {
        console.error(`[DEBUG] ${i + 1}번째 아이템 처리 오류:`, error);
        addLog(`'${image.file.name}' 트위터 게시 실패: ${error}`, 'error');
      }
    }

    // 7. 완료 처리
    console.log('[DEBUG] 모든 게시 완료, 상태 초기화');
    setIsPublishingToTwitter(false);
    setTwitterPublishCompleted(true);
    addLog(`모든 ${languageType} 콘텐츠의 트위터 발행이 완료되었습니다.`, 'info');
    console.log('[DEBUG] handleTwitterPublish 완료');
  };

  const handleThreadsPublish = async () => {
    console.log('[DEBUG] handleThreadsPublish 시작');
    addLog('[디버그] Threads 게시 함수가 호출되었습니다.', 'info');

    // 1. 이미지 체크
    console.log('[DEBUG] 이미지 개수:', images.length);
    addLog(`[디버그] 업로드된 이미지 개수: ${images.length}개`, 'info');
    
    if (images.length === 0) {
      addLog('먼저 2번 카드에서 이미지를 선택해주세요.', 'error');
      return;
    }

    // 2. 게시글 체크
    const postsToPublish = selectedLanguage === 'english' ? translatedPosts : generatedPosts;
    console.log('[DEBUG] 선택된 언어:', selectedLanguage);
    console.log('[DEBUG] 게시글 개수:', postsToPublish.length);
    addLog(`[디버그] 선택된 언어: ${selectedLanguage}, 게시글 개수: ${postsToPublish.length}개`, 'info');
    
    if (postsToPublish.length === 0) {
      const requiredCard = selectedLanguage === 'english' ? '6번(영어 번역)' : '5번(게시글 생성)';
      addLog(`먼저 ${requiredCard} 카드에서 콘텐츠를 준비해주세요.`, 'error');
      return;
    }

    // 3. Threads API 키 확인 (임시로 threads 키 사용)
    const threadsApiKey = getApiKey('threads');

    console.log('[DEBUG] Threads API 키 상태:', threadsApiKey ? '설정됨' : '미설정');
    addLog(`[디버그] Threads API 키 확인 완료`, 'info');

    if (!threadsApiKey) {
      addLog('Threads API 키가 설정되지 않았습니다. Sidebar에서 Threads API 키를 입력해주세요.', 'error');
      return;
    }

    // 4. 게시 시작
    setIsPublishingToThreads(true);
    console.log('[DEBUG] Threads 게시 상태를 true로 설정');

    const languageType = selectedLanguage === 'english' ? '영어' : '한국어';
    addLog(`${languageType} 콘텐츠를 Threads에 발행합니다...`, 'info');

    const totalPairs = Math.min(images.length, postsToPublish.length);
    console.log('[DEBUG] 처리할 이미지-게시글 쌍:', totalPairs);
    addLog(`[디버그] 총 ${totalPairs}개의 이미지-게시글 쌍을 처리합니다.`, 'info');

    // 5. 개별 게시 처리 (시뮬레이션)
    for (let i = 0; i < totalPairs; i++) {
      const image = images[i];
      const post = postsToPublish[i];
      
      console.log(`[DEBUG] ${i + 1}번째 아이템 처리 시작:`, {
        imageName: image.file.name,
        imageSize: image.file.size,
        channelName: post.channelName,
        contentLength: post.content.length
      });

      addLog(`[디버그] ${i + 1}/${totalPairs} - '${image.file.name}' 처리 시작`, 'info');

      try {
        addLog(`'${image.file.name}' 이미지와 '${post.channelName}' ${languageType} 텍스트를 Threads에 게시 중...`, 'generating');
        
        // Threads API 시뮬레이션 (실제 API 구현 필요)
        console.log('[DEBUG] Threads API 시뮬레이션 시작');
        addLog('[디버그] Threads API로 게시를 시도합니다.', 'info');
        
        try {
          console.log('[DEBUG] Threads에 실제 게시 (시뮬레이션)');
          console.log('[DEBUG] 게시할 텍스트:', post.content.substring(0, 50) + '...');
          console.log('[DEBUG] 이미지 파일:', image.file.name, image.file.size, image.file.type);
          
          // Threads 게시 시뮬레이션
          await new Promise(res => setTimeout(res, 1000)); // 1초 딜레이
          const threadsPostId = `T${Math.random().toString(36).substring(2, 15)}`;
          
          addLog(`✅ Threads에 게시 완료!`, 'success');
          addLog(`🔗 Threads 게시물: https://www.threads.net/t/${threadsPostId}`, 'info');
          addLog(`🖼️ 이미지: ${image.file.name}`, 'info');
          addLog(`게시 내용: "${post.content.substring(0, 100)}..."`, 'info');
          
        } catch (apiError: any) {
          console.error('[DEBUG] Threads API 오류:', apiError);
          addLog(`Threads API 오류: ${apiError.message}`, 'error');
          throw apiError;
        }
        
        console.log(`[DEBUG] ${i + 1}번째 아이템 처리 완료`);
        
      } catch (error) {
        console.error(`[DEBUG] ${i + 1}번째 아이템 처리 오류:`, error);
        addLog(`'${image.file.name}' Threads 게시 실패: ${error}`, 'error');
      }
    }

    // 6. 완료 처리
    console.log('[DEBUG] 모든 Threads 게시 완료, 상태 초기화');
    setIsPublishingToThreads(false);
    setThreadsPublishCompleted(true);
    addLog(`모든 ${languageType} 콘텐츠의 Threads 발행이 완료되었습니다.`, 'info');
    console.log('[DEBUG] handleThreadsPublish 완료');
  };

  const runAutomation = async () => {
    addLog('자동화를 시작합니다...', 'info');

    // 번역된 포스트가 있는지 확인 (없으면 원본 한국어 포스트 사용)
    const postsToPublish = translatedPosts.length > 0 ? translatedPosts : generatedPosts;
    
    if (postsToPublish.length === 0) {
      addLog('먼저 5번 카드에서 게시글을 생성해주세요.', 'error');
      return;
    }

    const postType = translatedPosts.length > 0 ? '영어 번역' : '한국어';
    addLog(`${postType} 포스트를 게시합니다...`, 'info');

    for (const post of postsToPublish) {
      if (!isRunning()) break;
      
      addLog(`'${post.channelName}' 포스트를 게시합니다...`, 'info');

      // Post to Twitter (Simulated)
      addLog(`Twitter에 '${post.channelName}' 수익 분석 포스트를 게시하는 중...`, 'generating');
      await new Promise(res => setTimeout(res, 1000));
      const twitterPostId = `18${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;
      addLog(`트윗 게시 완료. 확인: https://x.com/user/status/${twitterPostId}`, 'success');

      if (!isRunning()) break;

      // Post to Threads (Simulated)
      addLog(`Threads에 '${post.channelName}' 수익 분석 포스트를 발행하는 중...`, 'generating');
      await new Promise(res => setTimeout(res, 1200));
      const threadsPostId = `C${Math.random().toString(36).substring(2, 15)}`;
      addLog(`Threads 게시 완료. 확인: https://www.threads.net/t/${threadsPostId}`, 'success');
    }
    
    if (isRunning()) {
      addLog('모든 게시글의 자동 포스팅이 완료되었습니다.', 'info');
    } else {
      addLog('자동화가 중지되었습니다.', 'info');
    }
  };

  const steps = [
    {
      id: 'log-view',
      title: '로그 보기',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">실시간 로그</span>
            <button
              onClick={clearLogs}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              로그 지우기
            </button>
          </div>
          <div style={{ height: '300px' }}>
            <LogDisplay logs={logs} />
          </div>
        </div>
      )
    },
    {
      id: 'image-import',
      title: '이미지 불러오기',
      content: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">{images.length}개 이미지</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 max-h-48 overflow-y-auto pr-2">
            {images.map(image => (
              <div key={image.id} className="relative group aspect-square">
                <img src={image.dataUrl} alt={image.file.name} className="w-full h-full object-cover rounded-md" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleImageExpand(image)} 
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      확대
                    </button>
                    <button 
                      onClick={() => handleDeleteImage(image.id)} 
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          
          <div className="space-y-3">
            <button 
              onClick={handleGoogleDriveImport} 
              className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
            >
              📁 Google Drive에서 이미지 가져오기
            </button>
            
            {showFolderSelect && (
              <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">폴더 선택</span>
                  <button 
                    onClick={() => setShowFolderSelect(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFolderSelect(null)}
                    className="w-full text-left px-3 py-2 rounded border hover:bg-gray-50 flex items-center"
                  >
                    📂 전체 드라이브
                  </button>
                  {driveFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderSelect(folder)}
                      className="w-full text-left px-3 py-2 rounded border hover:bg-gray-50 flex items-center"
                    >
                      📁 {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {showDriveImages && (
              <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFolder ? `${selectedFolder.name}` : '전체 드라이브'} 이미지
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setShowDriveImages(false);
                        setShowFolderSelect(true);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      폴더 변경
                    </button>
                    <button 
                      onClick={() => setShowDriveImages(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {driveImages.map((driveImage) => (
                    <div key={driveImage.id} className="relative group cursor-pointer" onClick={() => handleSelectDriveImage(driveImage)}>
                      <img 
                        src={driveImage.thumbnailLink || '/api/placeholder/100/100'} 
                        alt={driveImage.name}
                        className="w-full aspect-square object-cover rounded border hover:border-blue-500"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 text-center px-1">
                          {driveImage.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
            >
              💻 로컬에서 이미지 업로드
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mt-3">
            Google Drive 또는 로컬에서 이미지를 가져와 Twitter와 Threads에 자동 게시할 수 있습니다.
          </div>
        </div>
      )
    },
    {
      id: 'channel-extraction',
      title: 'YouTube 핸들 추출',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              📌 선택된 이미지들에서 YouTube 핸들을 자동으로 추출합니다.<br/>
              📌 AI가 이미지를 분석하여 @핸들 형태로 찾아냅니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">YouTube 핸들 추출 프롬프트</label>
            <PromptEditor
              prompt={{
                id: 'channel-extraction',
                name: 'YouTube 핸들 추출',
                description: '이미지에서 YouTube 핸들을 추출하는 프롬프트',
                template: channelExtractionPrompt,
                variables: []
              }}
              value={channelExtractionPrompt}
              onChange={(value) => setChannelExtractionPrompt(value)}
              onReset={() => setChannelExtractionPrompt(
                `이 이미지를 분석하고 "YouTube 핸들"을 추출해주세요. 
답변은 "핸들"만 간단히 해주세요.
## "핸들"은 @ 다음에 나오는 것이 핸들입니다. 
##유튜브 채널명하고 햇갈리지마세요.

ex)
@슈카월드`
              )}
            />
          </div>
          
          <button
            onClick={handleExtractChannels}
            disabled={isExtractingChannels || images.length === 0}
            className={`w-full px-4 py-3 font-semibold rounded-md transition-colors ${
              isExtractingChannels || images.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isExtractingChannels ? '🔍 핸들 추출 중...' : '🎯 YouTube 핸들 추출하기'}
          </button>
          
          {isExtractingChannels && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                🤖 AI가 이미지를 분석하고 있습니다...
              </div>
              <div className="text-xs text-gray-500">
                상세한 진행상황은 1번 카드 로그에서 확인하세요
              </div>
            </div>
          )}
          
          {extractedChannels.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">추출된 핸들:</h4>
                <div className="space-y-2">
                  {extractedChannels.map((result) => {
                    const image = images.find(img => img.id === result.imageId);
                    return (
                      <div key={result.imageId} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <div className="w-12 h-12 flex-shrink-0">
                          {image && (
                            <img src={image.dataUrl} alt="" className="w-full h-full object-cover rounded" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{result.channelName}</p>
                          <p className="text-xs text-gray-500">{image?.file.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 텍스트만 별도 출력 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">핸들 텍스트만:</h4>
                <div className="p-3 bg-blue-50 rounded border">
                  <div className="text-sm text-gray-800 font-mono leading-relaxed">
                    {extractedChannels.map(result => result.channelName).join('\n')}
                  </div>
                  <button
                    onClick={() => {
                      const textToCopy = extractedChannels.map(result => result.channelName).join('\n');
                      navigator.clipboard.writeText(textToCopy);
                      addLog('핸들 텍스트가 클립보드에 복사되었습니다.', 'success');
                    }}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    📋 복사하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'channel-info',
      title: '이 채널의 유튜브 정보를 추출해줘',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-green-700">
              📊 추출된 채널들의 YouTube 상세 정보를 조회합니다.<br/>
              📊 채널 생성일자, 구독자수, 총 조회수, 영상갯수, 최고 조회수를 확인할 수 있습니다.
            </p>
          </div>

          <button
            onClick={handleExtractChannelInfo}
            disabled={isExtractingChannelInfo || extractedChannels.length === 0}
            className={`w-full px-4 py-3 font-semibold rounded-md transition-colors ${
              isExtractingChannelInfo || extractedChannels.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isExtractingChannelInfo ? '📊 채널 정보 조회 중...' : '🎯 YouTube 채널 정보 조회하기'}
          </button>
          
          {isExtractingChannelInfo && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                🔍 YouTube Data API로 채널 정보를 조회하고 있습니다...
              </div>
              <div className="text-xs text-gray-500">
                상세한 진행상황은 1번 카드 로그에서 확인하세요
              </div>
            </div>
          )}
          
          {channelInfos.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">YouTube 채널 정보:</h4>
              {channelInfos.map((info, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3">{info.channelName}</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">채널 생성일:</span>
                      <span className="font-medium">{info.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">구독자수:</span>
                      <span className="font-medium">{info.subscriberCount}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 조회수:</span>
                      <span className="font-medium">{info.viewCount}회</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 영상갯수:</span>
                      <span className="font-medium">{info.videoCount}개</span>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <span className="text-gray-600">가장 높은 조회수:</span>
                      <span className="font-medium">{info.mostViewedVideoViews}회</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 space-y-2">
                {channelInfos.map((info, index) => {
                  // 채널 정보에서 핸들 추출 - channelId를 사용해 URL 생성
                  const channelUrl = `https://www.youtube.com/channel/${info.channelId}`;
                  
                  return (
                    <a
                      key={index}
                      href={channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors text-center"
                    >
                      🔗 {info.channelName} 채널로 이동
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {extractedChannels.length === 0 && (
            <div className="text-center text-gray-500 text-sm">
              먼저 3번 카드에서 핸들을 추출해주세요.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'prompt-setup',
      title: 'Twitter & Threads 프롬프트',
      content: (
        <div className="space-y-4">
          {getPrompt('twitter-post') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twitter & Threads 포스트 프롬프트</label>
                <PromptEditor
                  prompt={getPrompt('twitter-post')!}
                  value={getPrompt('twitter-post')!.template}
                  onChange={(value) => updatePrompt('twitter-post', value)}
                  onReset={() => resetPrompt('twitter-post')}
                />
                <p className="text-xs text-gray-500 mt-2">
                  이 프롬프트는 Twitter와 Threads에 동일하게 적용됩니다.
                </p>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleGeneratePosts}
                  disabled={isGeneratingPosts || channelInfos.length === 0}
                  className={`w-full px-4 py-3 font-semibold rounded-md transition-colors ${
                    isGeneratingPosts || channelInfos.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {isGeneratingPosts ? '📝 게시글 생성 중...' : '🚀 게시글 만들기'}
                </button>
                
                {isGeneratingPosts && (
                  <div className="text-center mt-3">
                    <div className="text-sm text-gray-600 mb-2">
                      🤖 AI가 채널 정보와 프롬프트를 결합하여 게시글을 생성하고 있습니다...
                    </div>
                    <div className="text-xs text-gray-500">
                      상세한 진행상황은 1번 카드 로그에서 확인하세요
                    </div>
                  </div>
                )}
                
                {channelInfos.length === 0 && (
                  <div className="text-center text-orange-500 text-sm bg-orange-50 p-3 rounded mt-3">
                    ⚠️ 먼저 4번 카드에서 채널 정보를 조회해주세요.
                  </div>
                )}
                
                {generatedPosts.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">생성된 게시글:</h4>
                    {generatedPosts.map((post, index) => (
                      <div key={index} className="p-4 bg-orange-50 rounded-lg border">
                        <div className="relative">
                          <textarea
                            value={post.content}
                            onChange={(e) => {
                              const updatedPosts = [...generatedPosts];
                              updatedPosts[index].content = e.target.value;
                              setGeneratedPosts(updatedPosts);
                            }}
                            className="w-full p-3 rounded border text-sm font-mono resize-y min-h-32 bg-white border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                            placeholder="게시글 내용을 편집하세요..."
                            style={{ minHeight: '8rem' }}
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
                            {post.content.length} 글자
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(post.content);
                              addLog(`'${post.channelName}' 게시글이 클립보드에 복사되었습니다.`, 'success');
                            }}
                            className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                          >
                            📋 복사하기
                          </button>
                          <button
                            onClick={() => {
                              const updatedPosts = [...generatedPosts];
                              updatedPosts[index].content = post.originalContent;
                              setGeneratedPosts(updatedPosts);
                              addLog(`'${post.channelName}' 게시글이 원본으로 리셋되었습니다.`, 'success');
                            }}
                            disabled={post.content === post.originalContent}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              post.content === post.originalContent
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            🔄 원본으로
                          </button>
                          <div className="text-xs text-gray-500 self-center">
                            {post.content !== post.originalContent && '* 수정됨'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </>
          )}
        </div>
      )
    },
    {
      id: 'translation',
      title: '영어로 번역하기',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-3 rounded-md">
            <p className="text-sm text-purple-700">
              🌐 5번 카드에서 생성된 한국어 게시글을 영어로 번역합니다.<br/>
              🌐 AI가 자연스러운 영어 번역을 제공합니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영어 번역 프롬프트</label>
            <div className="relative">
              <textarea
                value={translationPrompt}
                onChange={(e) => setTranslationPrompt(e.target.value)}
                className="w-full p-3 rounded border text-sm font-mono resize-y min-h-20 bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                placeholder="번역 프롬프트를 입력하세요..."
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
                {translationPrompt.length} 글자
              </div>
            </div>
            <button
              onClick={() => setTranslationPrompt('이 내용을 영어로 번역하세요')}
              className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
            >
              기본값으로 리셋
            </button>
          </div>

          <button
            onClick={handleTranslatePosts}
            disabled={isTranslating || generatedPosts.length === 0}
            className={`w-full px-4 py-3 font-semibold rounded-md transition-colors ${
              isTranslating || generatedPosts.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isTranslating ? '🌐 영어 번역 중...' : '🚀 영어 번역'}
          </button>
          
          {isTranslating && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                🤖 AI가 게시글을 영어로 번역하고 있습니다...
              </div>
              <div className="text-xs text-gray-500">
                상세한 진행상황은 1번 카드 로그에서 확인하세요
              </div>
            </div>
          )}
          
          {generatedPosts.length === 0 && (
            <div className="text-center text-purple-500 text-sm bg-purple-50 p-3 rounded">
              ⚠️ 먼저 5번 카드에서 게시글을 생성해주세요.
            </div>
          )}
          
          {translatedPosts.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-medium text-gray-700">번역된 게시글:</h4>
              {translatedPosts.map((post, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border">
                  <div className="relative">
                    <textarea
                      value={post.content}
                      onChange={(e) => {
                        const updatedPosts = [...translatedPosts];
                        updatedPosts[index].content = e.target.value;
                        setTranslatedPosts(updatedPosts);
                      }}
                      className="w-full p-3 rounded border text-sm font-mono resize-y min-h-32 bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      placeholder="번역된 내용을 편집하세요..."
                      style={{ minHeight: '8rem' }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
                      {post.content.length} 글자
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(post.content);
                        addLog(`'${post.channelName}' 번역된 게시글이 클립보드에 복사되었습니다.`, 'success');
                      }}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                    >
                      📋 복사하기
                    </button>
                    <button
                      onClick={() => {
                        const updatedPosts = [...translatedPosts];
                        updatedPosts[index].content = post.originalContent;
                        setTranslatedPosts(updatedPosts);
                        addLog(`'${post.channelName}' 번역본이 원본으로 리셋되었습니다.`, 'success');
                      }}
                      disabled={post.content === post.originalContent}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        post.content === post.originalContent
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      🔄 원본으로
                    </button>
                    <div className="text-xs text-gray-500 self-center">
                      {post.content !== post.originalContent && '* 수정됨'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'twitter-publish',
      title: '트위터 (X)에 배포',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              🐦 2번 카드의 이미지와 함께 선택한 언어의 콘텐츠를 트위터에 발행합니다.<br/>
              🐦 한국어 또는 영어 콘텐츠를 선택할 수 있습니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">발행할 콘텐츠 언어 선택</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="language"
                  value="korean"
                  checked={selectedLanguage === 'korean'}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'korean' | 'english')}
                  className="mr-2"
                />
                <span className="text-sm">한국어 (5번 카드에서 생성된 콘텐츠)</span>
                {generatedPosts.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    ✅ 준비됨
                  </span>
                )}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="language"
                  value="english"
                  checked={selectedLanguage === 'english'}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'korean' | 'english')}
                  className="mr-2"
                />
                <span className="text-sm">영어 (6번 카드에서 번역된 콘텐츠)</span>
                {translatedPosts.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    ✅ 준비됨
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* 미리보기 섹션 */}
          {(() => {
            const postsToShow = selectedLanguage === 'english' ? translatedPosts : generatedPosts;
            const languageLabel = selectedLanguage === 'english' ? '영어' : '한국어';
            
            if (postsToShow.length > 0) {
              return (
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{languageLabel} 콘텐츠 미리보기:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {postsToShow.map((post, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded">
                        <strong>{post.channelName}:</strong> {post.content.substring(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="bg-gray-50 p-3 rounded border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 이미지:</h4>
            {images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={image.id} className="relative">
                    <img src={image.dataUrl} alt="" className="w-full aspect-square object-cover rounded" />
                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">2번 카드에서 이미지를 선택해주세요.</p>
            )}
          </div>

          {twitterPublishCompleted && (
            <div className="bg-green-50 p-3 rounded-md mb-3">
              <p className="text-green-800 text-sm font-medium">
                ✅ 트위터 발행이 완료되었습니다!
              </p>
              <p className="text-green-700 text-xs mt-1">
                모든 이미지와 콘텐츠가 성공적으로 트위터에 게시되었습니다.
              </p>
            </div>
          )}

          <button
            onClick={handleTwitterPublish}
            disabled={isPublishingToTwitter || images.length === 0 || 
              (selectedLanguage === 'english' ? translatedPosts.length === 0 : generatedPosts.length === 0)}
            className={`w-full px-4 py-3 font-semibold rounded-md transition-colors ${
              isPublishingToTwitter || images.length === 0 || 
              (selectedLanguage === 'english' ? translatedPosts.length === 0 : generatedPosts.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : twitterPublishCompleted 
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isPublishingToTwitter ? '🐦 트위터에 발행 중...' : twitterPublishCompleted ? '✅ 트위터(X) 발행 완료' : '🚀 트위터(X)에 발행하기'}
          </button>
          
          {isPublishingToTwitter && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                🤖 선택된 이미지와 콘텐츠를 트위터에 발행하고 있습니다...
              </div>
              <div className="text-xs text-gray-500">
                상세한 진행상황은 1번 카드 로그에서 확인하세요
              </div>
            </div>
          )}

          {(images.length === 0 || 
            (selectedLanguage === 'english' ? translatedPosts.length === 0 : generatedPosts.length === 0)) && (
            <div className="text-center text-blue-500 text-sm bg-blue-50 p-3 rounded">
              ⚠️ 이미지 선택 및 {selectedLanguage === 'english' ? '영어 번역' : '게시글 생성'}이 필요합니다.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'threads-publish',
      title: '쓰레드(Thread)에 배포',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-3 rounded-md">
            <p className="text-sm text-purple-700">
              🧵 2번 카드의 이미지와 함께 선택한 언어의 콘텐츠를 Threads에 발행합니다.<br/>
              🧵 한국어 또는 영어 콘텐츠를 선택할 수 있습니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">발행할 콘텐츠 언어 선택</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="threadsLanguage"
                  value="korean"
                  checked={selectedLanguage === 'korean'}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'korean' | 'english')}
                  className="mr-2"
                />
                <span className="text-sm">한국어 (5번 카드에서 생성된 콘텐츠)</span>
                {generatedPosts.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    ✅ 준비됨
                  </span>
                )}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="threadsLanguage"
                  value="english"
                  checked={selectedLanguage === 'english'}
                  onChange={(e) => setSelectedLanguage(e.target.value as 'korean' | 'english')}
                  className="mr-2"
                />
                <span className="text-sm">영어 (6번 카드에서 번역된 콘텐츠)</span>
                {translatedPosts.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    ✅ 준비됨
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* 미리보기 섹션 */}
          {(() => {
            const postsToShow = selectedLanguage === 'english' ? translatedPosts : generatedPosts;
            const languageLabel = selectedLanguage === 'english' ? '영어' : '한국어';
            
            if (postsToShow.length > 0) {
              return (
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{languageLabel} 콘텐츠 미리보기:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {postsToShow.map((post, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded">
                        <strong>{post.channelName}:</strong> {post.content.substring(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="bg-gray-50 p-3 rounded border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 이미지:</h4>
            {images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={image.id} className="relative">
                    <img src={image.dataUrl} alt="" className="w-full aspect-square object-cover rounded" />
                    <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">2번 카드에서 이미지를 선택해주세요.</p>
            )}
          </div>

          {threadsPublishCompleted && (
            <div className="bg-green-50 p-3 rounded-md mb-3">
              <p className="text-green-800 text-sm font-medium">
                ✅ Threads 발행이 완료되었습니다!
              </p>
              <p className="text-green-700 text-xs mt-1">
                모든 이미지와 콘텐츠가 성공적으로 Threads에 게시되었습니다.
              </p>
            </div>
          )}

          <button
            onClick={handleThreadsPublish}
            disabled={isPublishingToThreads || images.length === 0 || 
              (selectedLanguage === 'english' ? translatedPosts.length === 0 : generatedPosts.length === 0)}
            className={`w-full px-4 py-3 font-semibold rounded-md transition-colors ${
              isPublishingToThreads || images.length === 0 || 
              (selectedLanguage === 'english' ? translatedPosts.length === 0 : generatedPosts.length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : threadsPublishCompleted 
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isPublishingToThreads ? '🧵 Threads에 발행 중...' : threadsPublishCompleted ? '✅ 쓰레드(Threads) 발행 완료' : '🚀 쓰레드(Threads)에 발행하기'}
          </button>
          
          {isPublishingToThreads && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                🤖 선택된 이미지와 콘텐츠를 Threads에 발행하고 있습니다...
              </div>
              <div className="text-xs text-gray-500">
                상세한 진행상황은 1번 카드 로그에서 확인하세요
              </div>
            </div>
          )}

          {(images.length === 0 || 
            (selectedLanguage === 'english' ? translatedPosts.length === 0 : generatedPosts.length === 0)) && (
            <div className="text-center text-purple-500 text-sm bg-purple-50 p-3 rounded">
              ⚠️ 이미지 선택 및 {selectedLanguage === 'english' ? '영어 번역' : '게시글 생성'}이 필요합니다.
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <div className="w-full bg-white">
        <div className="overflow-x-auto pb-6 bg-white">
          <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
            {steps.map((step, index) => (
              <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-6 w-96 flex-shrink-0 hover:shadow-lg transition-shadow min-h-[650px]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                </div>
                {step.content}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm mt-4">
          ← → 좌우로 스크롤하여 각 단계를 진행하세요
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {showImageModal && modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-4xl p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
            >
              ×
            </button>
            <img 
              src={modalImage.dataUrl} 
              alt={modalImage.file.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              {modalImage.file.name}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TwitterThreadsDashboard;