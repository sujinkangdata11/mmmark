import React, { useState } from 'react';
import { AutomationConfig, Subreddit } from '../../types';
import { generateText } from '../../shared/services/geminiService';
import RedditService from './redditService';
import BaseAutomationPanel from '../../shared/components/common/BaseAutomationPanel';
import PromptEditor from '../../shared/components/common/PromptEditor';
import PostCard from '../../shared/components/common/PostCard';
import { useApiKeys, usePrompts, useLogger, useAutomation } from '../../shared/hooks';
import LogDisplay from '../../shared/components/common/LogDisplay';

interface RedditDashboardProps {
  config: AutomationConfig;
  onBack: () => void;
  hideBackButton?: boolean;
}

const RedditDashboard: React.FC<RedditDashboardProps> = ({ config, onBack, hideBackButton }) => {
  const { getApiKey } = useApiKeys(['clientId', 'clientSecret', 'username', 'redditAccount', 'redditPassword']);
  const { getPrompt, updatePrompt, resetPrompt, interpolatePrompt } = usePrompts('reddit');
  const { logs, addLog, clearLogs } = useLogger();
  const { isAutomating, startAutomation, stopAutomation, isRunning } = useAutomation();
  
  const [subreddits, setSubreddits] = useState<Subreddit[]>([
    { id: '1', url: 'https://www.reddit.com/r/newtuber/' },
    { id: '2', url: 'https://www.reddit.com/r/NewTubers/' },
    { id: '3', url: 'https://www.reddit.com/r/newtube/' }
  ]);
  const [newSubredditUrl, setNewSubredditUrl] = useState('');
  const [sortType, setSortType] = useState<'hot' | 'new'>('new');
  const [postCount, setPostCount] = useState<number>(5);
  const [redditService, setRedditService] = useState<RedditService | null>(null);
  const [fetchedPosts, setFetchedPosts] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'idle' | 'fetched'>('idle');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [suitabilityResult, setSuitabilityResult] = useState<string>('');
  const [isSuitabilityAnalyzing, setIsSuitabilityAnalyzing] = useState<boolean>(false);
  const [suitablePosts, setSuitablePosts] = useState<any[]>([]);
  const [generatedComments, setGeneratedComments] = useState<{postIndex: number, comment: string}[]>([]);
  const [currentCommentIndex, setCurrentCommentIndex] = useState<number>(0);
  const [isGeneratingComment, setIsGeneratingComment] = useState<boolean>(false);
  const [translatedComments, setTranslatedComments] = useState<{postIndex: number, originalComment: string, translatedComment: string, relatedPost: any}[]>([]);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const [translationLoadingMessage, setTranslationLoadingMessage] = useState<string>('');
  const [deployingIndex, setDeployingIndex] = useState<number | null>(null);
  const [deployedComments, setDeployedComments] = useState<{postIndex: number, redditLink: string, commentId: string, translatedComment: string}[]>([]);

  // Reddit 서비스 초기화
  React.useEffect(() => {
    console.log('🔍 사이드바에서 API 키 검색 중...');
    
    const username = getApiKey('username');
    console.log(username ? `✅ 사용자명을 찾았습니다: ${username}` : '⚠️ 사용자명이 설정되지 않음 (선택사항)');
    
    const clientId = getApiKey('clientId');
    console.log(clientId ? `✅ Client ID를 찾았습니다: ${clientId.substring(0, 8)}...` : '❌ Client ID를 찾지 못했습니다');
    
    const clientSecret = getApiKey('clientSecret');
    console.log(clientSecret ? `✅ Client Secret을 찾았습니다: ${clientSecret.substring(0, 8)}...` : '❌ Client Secret을 찾지 못했습니다');
    
    const redditAccount = getApiKey('redditAccount');
    console.log(redditAccount ? `✅ Reddit 계정을 찾았습니다: ${redditAccount}` : '❌ Reddit 계정이 설정되지 않음');
    
    const redditPassword = getApiKey('redditPassword');
    console.log(redditPassword ? `✅ Reddit 비밀번호가 설정됨` : '❌ Reddit 비밀번호가 설정되지 않음');
    
    const geminiKey = getApiKey('gemini');
    console.log(geminiKey ? `✅ Gemini API 키를 찾았습니다: ${geminiKey.substring(0, 8)}...` : '❌ Gemini API 키를 찾지 못했습니다');
    
    setRedditService(new RedditService(username || 'anonymous', clientId || '', clientSecret || '', redditAccount || '', redditPassword || ''));
  }, [getApiKey('username'), getApiKey('clientId'), getApiKey('clientSecret'), getApiKey('redditAccount'), getApiKey('redditPassword')]);


  const handleAddSubreddit = () => {
    if (newSubredditUrl.trim() === '') return;
    try {
      const url = new URL(newSubredditUrl);
      if (!url.hostname.includes('reddit.com')) {
        return;
      }
      const newSub: Subreddit = {
        id: new Date().toISOString(),
        url: newSubredditUrl.trim()
      };
      setSubreddits(prev => [...prev, newSub]);
      setNewSubredditUrl('');
    } catch (error) {
      // Invalid URL
    }
  };

  const handleDeleteSubreddit = (id: string) => {
    setSubreddits(prev => prev.filter(sub => sub.id !== id));
  };

  // API 연결 테스트
  const handleTestConnection = () => {
    clearLogs();
    startAutomation(async () => {
      addLog('Reddit API 연결을 테스트하는 중...', 'info');

      if (!redditService) {
        addLog('Reddit 서비스 초기화 중 오류가 발생했습니다.', 'error');
        return;
      }

      addLog(`설정된 사용자명: ${getApiKey('username') || 'anonymous'}`, 'info');

      const testResult = await redditService.testConnection();
      if (testResult.success) {
        addLog(testResult.message, 'success');
      } else {
        addLog(testResult.message, 'error');
        addLog(`상세 정보: ${JSON.stringify(testResult.details, null, 2)}`, 'info');
      }
    });
  };

  // 1단계: 게시물 가져오기
  const handleFetchPosts = () => {
    console.log('🚀 handleFetchPosts 함수 실행됨!');
    clearLogs();
    setCurrentStep('idle');
    startAutomation(async () => {
      console.log('🔥 startAutomation 내부 실행됨!');
      addLog('Reddit에서 게시물을 가져오는 중...', 'info');

      console.log('🔍 redditService 상태:', redditService);
      if (!redditService) {
        console.log('❌ redditService가 null입니다!');
        addLog('Reddit 서비스 초기화 중 오류가 발생했습니다.', 'error');
        return;
      }
      console.log('✅ redditService 존재함');

      // 디버깅 정보 추가
      addLog(`사용자명: ${getApiKey('username') || 'anonymous'}`, 'info');
      addLog(`정렬 기준: ${sortType === 'new' ? '최신' : '인기'}`, 'info');
      addLog(`타겟 서브레딧: ${subreddits.map(s => s.url).join(', ')}`, 'info');

      console.log('📋 subreddits 배열:', subreddits);
      console.log('🔄 for 루프 시작');

      try {
        const allPosts = [];
        for (const subredditConfig of subreddits) {
          console.log('🎯 처리 중인 서브레딧:', subredditConfig);
          console.log('⚡ isRunning() 체크:', isRunning());
          if (!isRunning()) {
            console.log('🛑 isRunning()이 false여서 루프 중단');
            break;
          }
          
          addLog(`${subredditConfig.url}에서 게시물 가져오는 중...`, 'info');
          
          const subredditName = redditService.extractSubredditFromUrl(subredditConfig.url);
          console.log('📞 RedditService 호출 시작:', subredditName, sortType, `${postCount}개`);
          const posts = await redditService.getSubredditPosts(subredditName, sortType, postCount);
          console.log('✅ RedditService 응답:', posts.length, '개 게시물');
          
          addLog(`${posts.length}개의 게시물을 가져왔습니다.`, 'success');
          allPosts.push(...posts);
        }
        
        setFetchedPosts(allPosts);
        setCurrentStep('fetched');
        addLog(`총 ${allPosts.length}개의 게시물을 가져왔습니다. 아래에서 확인 후 댓글 작성을 진행하세요.`, 'success');
        
      } catch (error) {
        addLog(`에러 발생: ${error instanceof Error ? error.message : '알 수 없는 에러'}`, 'error');
      }
    });
  };

  // 적합성 판단 기능
  const handleSuitabilityAnalysis = async () => {
    if (fetchedPosts.length === 0) {
      setSuitabilityResult('먼저 게시물을 가져와주세요.');
      return;
    }

    const geminiApiKey = getApiKey('gemini');
    if (!geminiApiKey) {
      setSuitabilityResult('Gemini API 키가 설정되지 않았습니다. 사이드바에서 API 키를 설정해주세요.');
      return;
    }

    setIsSuitabilityAnalyzing(true);
    setSuitabilityResult('');

    try {
      // 모든 게시물에 대한 정보를 합쳐서 분석
      let allPostsInfo = '가져온 게시물 목록:\n\n';
      fetchedPosts.forEach((post, index) => {
        allPostsInfo += `${index + 1}. 제목: ${post.title}\n`;
        allPostsInfo += `   내용: ${post.selftext || '(링크 게시물)'}\n`;
        allPostsInfo += `   작성자: ${post.author}, 점수: ${post.score}, 댓글: ${post.num_comments}\n\n`;
      });

      const finalSuitabilityPrompt = interpolatePrompt('reddit-suitability', {
        POST_COUNT: fetchedPosts.length.toString(),
        POST_TITLE: '전체 게시물 목록',
        POST_CONTENT: allPostsInfo
      });

      const result = await generateText(finalSuitabilityPrompt, undefined, geminiApiKey);
      setSuitabilityResult(result);
      
      // 적합한 게시물들 추출
      const suitable = extractSuitablePosts(result);
      setSuitablePosts(suitable);
      setCurrentCommentIndex(0);
      setGeneratedComments([]);
    } catch (error) {
      setSuitabilityResult(`오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSuitabilityAnalyzing(false);
    }
  };

  // 적합성 분석 결과에서 OK인 게시물들 추출
  const extractSuitablePosts = (suitabilityText: string): any[] => {
    const lines = suitabilityText.split('\n');
    const suitable = [];
    
    console.log('🔍 Parsing suitability text:', suitabilityText);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 다양한 형식 지원: "1번", "1.", "1 ", "*1*", "**1.**" 등
      const numberMatch = line.match(/(?:\*\*)?(\d+)(?:\.|\번|\.?\s|\)|)(?:\*\*)?/);
      const hasOK = /\*\*OK\.\*\*|OK\.|OK/i.test(line);
      
      if (numberMatch && hasOK) {
        const postNumber = parseInt(numberMatch[1]) - 1; // 0-based index
        console.log(`✅ Found suitable post: ${numberMatch[1]} (index: ${postNumber})`);
        
        if (postNumber >= 0 && postNumber < fetchedPosts.length) {
          // 근거 부분을 찾기 위해 다음 몇 줄 확인
          let reason = line;
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].includes('근거') || lines[j].includes('이유')) {
              reason += '\n' + lines[j];
              break;
            }
          }
          
          suitable.push({
            ...fetchedPosts[postNumber],
            originalIndex: postNumber + 1,
            reason: reason
          });
        }
      }
    }
    
    console.log('🎯 Extracted suitable posts:', suitable);
    return suitable;
  };

  // 개별 댓글 생성
  const handleGenerateComment = async (postIndex: number) => {
    if (!suitablePosts[postIndex]) return;
    
    const geminiApiKey = getApiKey('gemini');
    if (!geminiApiKey) {
      alert('Gemini API 키가 설정되지 않았습니다.');
      return;
    }

    setIsGeneratingComment(true);

    try {
      const post = suitablePosts[postIndex];
      const reason = post.reason || '';
      
      const commentPrompt = interpolatePrompt('reddit-comment', {
        POST_INDEX: (post.originalIndex || postIndex + 1).toString(),
        REASON: reason,
        POST_TITLE: post.title,
        POST_CONTENT: post.selftext || '(링크 게시물)'
      });

      const generatedComment = await generateText(commentPrompt, undefined, geminiApiKey);
      
      setGeneratedComments(prev => [...prev, { 
        postIndex: post.originalIndex, 
        comment: generatedComment 
      }]);
      
      setCurrentCommentIndex(prev => prev + 1);
    } catch (error) {
      alert(`댓글 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsGeneratingComment(false);
    }
  };

  // 댓글 직접 수정
  const handleUpdateComment = (index: number, newComment: string) => {
    setGeneratedComments(prev => 
      prev.map((item, idx) => 
        idx === index ? { ...item, comment: newComment } : item
      )
    );
  };

  // 댓글 영어로 번역하기
  const handleTranslateComment = async (commentIndex: number, comment: string) => {
    const geminiApiKey = getApiKey('gemini');
    if (!geminiApiKey) {
      alert('Gemini API 키가 설정되지 않았습니다.');
      return;
    }

    setTranslatingIndex(commentIndex);
    const loadingMessages = [
      '작성중...',
      '곧 7번카드에 내용이 나옵니다...',
      '번역 중...',
      '거의 완료되었습니다...'
    ];
    
    let messageIndex = 0;
    const loadingInterval = setInterval(() => {
      setTranslationLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
      messageIndex++;
    }, 1500);

    try {
      const translationPrompt = interpolatePrompt('reddit-translation', {
        COMMENT: comment
      });

      const translatedComment = await generateText(translationPrompt, undefined, geminiApiKey);
      const commentItem = generatedComments[commentIndex];
      const relatedPost = suitablePosts.find(p => p.originalIndex === commentItem.postIndex);
      
      setTranslatedComments(prev => [...prev, {
        postIndex: commentItem.postIndex,
        originalComment: comment,
        translatedComment: translatedComment,
        relatedPost: relatedPost
      }]);
    } catch (error) {
      alert(`번역 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      clearInterval(loadingInterval);
      setTranslatingIndex(null);
      setTranslationLoadingMessage('');
    }
  };

  // 실제 댓글 배포하기
  const handleDeployComment = async (commentData: {postIndex: number, originalComment: string, translatedComment: string, relatedPost: any}, commentIndex: number) => {
    if (!redditService) {
      alert('Reddit 서비스가 초기화되지 않았습니다.');
      return;
    }

    const redditAccount = getApiKey('redditAccount');
    const redditPassword = getApiKey('redditPassword');
    
    if (!redditAccount || !redditPassword) {
      alert('Reddit 계정 정보가 설정되지 않았습니다. 사이드바에서 Reddit 계정명과 비밀번호를 입력해주세요.');
      return;
    }

    setDeployingIndex(commentIndex);

    try {
      console.log(`🚀 댓글 배포 시작: ${commentData.postIndex}번 게시글`);
      console.log(`📝 게시물 ID: ${commentData.relatedPost.name || commentData.relatedPost.id}`);
      console.log(`💬 댓글 내용: ${commentData.translatedComment}`);

      // Reddit의 fullname 형식 (t3_postid)
      const postFullname = commentData.relatedPost.name || `t3_${commentData.relatedPost.id}`;
      
      const result = await redditService.postComment(postFullname, commentData.translatedComment);
      
      if (result.success) {
        // 성공한 댓글을 목록에서 제거하거나 상태 표시
        setTranslatedComments(prev => 
          prev.map((item, idx) => 
            idx === commentIndex 
              ? { ...item, deployed: true, commentId: result.commentId }
              : item
          )
        );
        
        // 8번 카드에 배포된 댓글 정보 추가
        const redditLink = `https://www.reddit.com${commentData.relatedPost.permalink}`;
        setDeployedComments(prev => [...prev, {
          postIndex: commentData.postIndex,
          redditLink: redditLink,
          commentId: result.commentId || 'N/A',
          translatedComment: commentData.translatedComment
        }]);
      } else {
        alert(`❌ 실패\n\n${result.message}`);
      }
      
    } catch (error) {
      console.error('❌ 댓글 배포 중 오류:', error);
      alert(`댓글 배포 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setDeployingIndex(null);
    }
  };

  // 번역된 댓글 수정
  const handleUpdateTranslatedComment = (index: number, newTranslatedComment: string) => {
    setTranslatedComments(prev => 
      prev.map((item, idx) => 
        idx === index ? { ...item, translatedComment: newTranslatedComment } : item
      )
    );
  };

  // 모든 댓글을 Discord로 한번에 알림 보내기
  const handleSendAllDiscordNotifications = async (allComments: {postIndex: number, redditLink: string, commentId: string, translatedComment: string}[]) => {
    const webhookUrl = getApiKey('discordWebhook');
    
    if (!webhookUrl) {
      alert('Discord Webhook URL이 설정되지 않았습니다. 사이드바에서 설정해주세요.');
      return;
    }

    try {
      // 메인 요약 Embed
      const mainEmbed = {
        title: "🎯 Reddit 마케팅 자동화 완료!",
        description: `AutoVid 홍보 댓글이 성공적으로 배포되었습니다.`,
        color: 0x00d4aa, // 청록색
        fields: [
          {
            name: "📊 배포 통계",
            value: `총 **${allComments.length}개** 댓글 작성 완료`,
            inline: true
          },
          {
            name: "⏰ 완료 시간",
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true
          }
        ],
        thumbnail: {
          url: "https://cdn-icons-png.flaticon.com/512/174/174857.png" // Reddit 아이콘
        },
        timestamp: new Date().toISOString(),
        footer: {
          text: "AI Marketing Automation Hub",
          icon_url: "https://cdn-icons-png.flaticon.com/512/2099/2099058.png"
        }
      };

      // 각 댓글별 상세 Embed
      const commentEmbeds = allComments.map((comment, index) => ({
        title: `${comment.postIndex}번 게시글 댓글`,
        description: `\`\`\`${comment.translatedComment.substring(0, 300)}${comment.translatedComment.length > 300 ? '...' : ''}\`\`\``,
        color: 0x5865f2, // Discord 블루
        fields: [
          {
            name: "🆔 댓글 ID",
            value: `\`${comment.commentId}\``,
            inline: true
          },
          {
            name: "🔗 게시글 링크",
            value: `[Reddit에서 보기](${comment.redditLink})`,
            inline: true
          },
          {
            name: "📏 댓글 길이",
            value: `${comment.translatedComment.length}자`,
            inline: true
          }
        ]
      }));

      const payload = {
        content: null,
        embeds: [mainEmbed, ...commentEmbeds].slice(0, 10) // Discord는 최대 10개 embed까지
      };

      console.log('🚀 Discord로 메시지 전송 중...', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('✅ Discord로 알림이 성공적으로 전송되었습니다!');
      } else {
        const errorText = await response.text();
        throw new Error(`Discord API 에러: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.error('❌ Discord 알림 전송 실패:', error);
      alert(`Discord 알림 전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // 2단계: 댓글 작성
  const handleStartCommenting = () => {
    startAutomation(async () => {
      addLog('댓글 작성을 시작합니다...', 'info');

      const geminiApiKey = getApiKey('gemini');
      if (!geminiApiKey) {
        addLog('Gemini API 키가 설정되지 않았습니다. 사이드바에서 API 키를 설정해주세요.', 'error');
        return;
      }

      try {
        for (const post of fetchedPosts) {
          if (!isRunning()) break;
          
          addLog(`[${post.author}]의 게시글 확인 중: "${post.title}"`, 'info');
          
          // 기본 적합성 검사
          if (!redditService?.isPostSuitableForComment(post)) {
            addLog('게시물이 댓글 작성에 적합하지 않습니다.', 'info');
            continue;
          }
          
          // AI 적합성 판단
          addLog('게시글 적합성 판단을 위해 AI 호출 중...', 'generating');
          const finalSuitabilityPrompt = interpolatePrompt('reddit-suitability', {
            POST_COUNT: fetchedPosts.length.toString(),
            POST_TITLE: post.title,
            POST_CONTENT: post.selftext || '(링크 게시물)'
          });

          const suitabilityResult = await generateText(finalSuitabilityPrompt, undefined, geminiApiKey);

          if (!suitabilityResult.toUpperCase().includes('YES')) {
            addLog(`게시글이 적합하지 않아 건너뜁니다. (AI 응답: ${suitabilityResult.trim()})`, 'info');
            continue;
          }

          addLog('게시글이 적합합니다. 댓글 생성을 시작합니다.', 'success');

          // 댓글 생성
          addLog('댓글 생성을 위해 AI 호출 중...', 'generating');
          const finalCommentPrompt = interpolatePrompt('reddit-comment', {
            POST_TITLE: post.title,
            POST_CONTENT: post.selftext || '(링크 게시물)'
          });
          
          const generatedComment = await generateText(finalCommentPrompt, undefined, geminiApiKey);
          addLog(`AI가 생성한 댓글: "${generatedComment.substring(0, 50)}..."`, 'success');

          // 시뮬레이션된 댓글 게시
          addLog('Reddit에 댓글을 게시하는 중... (시뮬레이션)', 'generating');
          await new Promise(res => setTimeout(res, 1000));
          addLog(`"${post.title}" 게시글에 댓글 게시 완료. 확인: ${post.url}`, 'success');
          
          // 연속 요청 방지를 위한 대기
          await new Promise(res => setTimeout(res, 2000));
        }
        
        addLog('댓글 작성이 완료되었습니다.', 'success');
        setCurrentStep('idle');
        setFetchedPosts([]);
        
      } catch (error) {
        addLog(`에러 발생: ${error instanceof Error ? error.message : '알 수 없는 에러'}`, 'error');
      }
    });
  };

  // 카드 데이터 정의
  const steps = [
    {
      id: 'logs-info',
      title: '로그 & 정보',
      description: 'Reddit 자동화 작업 로그와 API 사용 안내를 확인합니다.',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              📌 <strong>게시물 가져오기</strong>는 API 키 없이 가능합니다.<br/>
              📌 <strong>댓글 작성</strong>을 위해서는 Reddit API 키가 필요합니다.
            </p>
          </div>
          <div style={{ height: '300px' }}>
            <LogDisplay logs={logs} />
          </div>
        </div>
      )
    },
    {
      id: 'subreddit-setup',
      title: '타겟 서브레딧 설정',
      description: '댓글을 작성할 서브레딧을 선택하고 정렬 방식을 설정합니다.',
      content: (
        <div className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newSubredditUrl}
              onChange={(e) => setNewSubredditUrl(e.target.value)}
              placeholder="e.g., https://www.reddit.com/r/askreddit"
              className="w-full p-2 bg-gray-50 rounded-md text-gray-700 border border-gray-300 focus:ring-2 focus:ring-cyan-500"
            />
            <button 
              onClick={handleAddSubreddit} 
              className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 whitespace-nowrap"
            >
              추가
            </button>
          </div>
          
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</span>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value="new"
                  checked={sortType === 'new'}
                  onChange={() => setSortType('new')}
                  className="form-radio h-4 w-4 text-cyan-500"
                />
                <span className="ml-2 text-gray-700">최신 (New)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value="hot"
                  checked={sortType === 'hot'}
                  onChange={() => setSortType('hot')}
                  className="form-radio h-4 w-4 text-cyan-500"
                />
                <span className="ml-2 text-gray-700">인기 (Hot)</span>
              </label>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">가져올 게시물 개수</span>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 10, 15, 20].map(count => (
                <label key={count} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="postCount"
                    value={count}
                    checked={postCount === count}
                    onChange={() => setPostCount(count)}
                    className="form-radio h-4 w-4 text-cyan-500"
                  />
                  <span className="ml-1 text-gray-700">{count}개</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            {subreddits.map(sub => (
              <div key={sub.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                <span className="text-sm text-gray-700 truncate">{sub.url}</span>
                <button 
                  onClick={() => handleDeleteSubreddit(sub.id)} 
                  className="text-red-600 hover:text-red-800 text-xl"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'fetch-posts',
      title: '게시물 가져오기',
      description: 'Reddit에서 최신 게시물을 가져와 댓글 작성 대상을 확인합니다.',
      content: (
        <div className="space-y-4">
          <div className="space-y-4">
            <p className="text-gray-600">API 연결을 테스트하고 게시물을 가져옵니다.</p>
            
            <button 
              onClick={handleTestConnection}
              disabled={isAutomating}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
            >
              {isAutomating ? '테스트 중...' : '🔧 API 연결 테스트'}
            </button>
            
            <button 
              onClick={handleFetchPosts}
              disabled={isAutomating}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
            >
              {isAutomating ? '가져오는 중...' : '📥 게시물 가져오기'}
            </button>
            
            {currentStep === 'fetched' && (
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-800 font-medium">✅ {fetchedPosts.length}개 게시물을 가져왔습니다!</p>
                <p className="text-green-700 text-sm mt-1">다음 단계에서 댓글 작성을 진행하세요.</p>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'posts-review',
      title: '게시물 검토',
      description: '가져온 게시물들을 검토하고 댓글 작성을 시작합니다.',
      content: (
        <div className="space-y-4">
          {fetchedPosts.length > 0 ? (
            <>
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-semibold text-blue-900 mb-2">가져온 게시물 ({fetchedPosts.length}개)</h3>
                <p className="text-blue-800 text-sm">아래 게시물들을 검토하고 댓글 작성을 시작하세요.</p>
              </div>
              
              <div className="space-y-2">
                {fetchedPosts.map((post, index) => (
                  <div key={post.id} className="bg-white border border-gray-200 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {index + 1}. {post.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          작성자: {post.author} | 점수: {post.score} | 댓글: {post.num_comments}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-2 relative z-10">
                        <a 
                          href={`https://www.reddit.com${post.permalink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-600 hover:text-cyan-700 font-medium px-2 py-1 bg-white border border-cyan-200 rounded hover:bg-cyan-50 transition-colors"
                        >
                          링크
                        </a>
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        >
                          전문
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button 
                  onClick={() => { setCurrentStep('idle'); setFetchedPosts([]); }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition-colors"
                >
                  다시 가져오기
                </button>
                <button 
                  onClick={handleStartCommenting}
                  disabled={isAutomating}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
                >
                  {isAutomating ? '작성 중...' : '댓글 작성 시작'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-md text-center">
              <p className="text-yellow-800">먼저 이전 단계에서 게시물을 가져와주세요.</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'suitability-prompt',
      title: '적합성 판단 프롬프트',
      description: 'AI가 게시물의 적합성을 판단할 프롬프트를 설정합니다.',
      content: (
        <div className="space-y-4">
          {getPrompt('reddit-suitability') && (
            <PromptEditor
              prompt={getPrompt('reddit-suitability')!}
              value={getPrompt('reddit-suitability')!.template}
              onChange={(value) => updatePrompt('reddit-suitability', value)}
              onReset={() => resetPrompt('reddit-suitability')}
            />
          )}
          
          <button 
            onClick={handleSuitabilityAnalysis}
            disabled={isSuitabilityAnalyzing || fetchedPosts.length === 0}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
          >
            {isSuitabilityAnalyzing ? 'AI 분석 중...' : '적합성 판단하기'}
          </button>
          
          {(suitabilityResult || isSuitabilityAnalyzing) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">AI 분석 결과:</h4>
              {isSuitabilityAnalyzing ? (
                <div className="text-sm text-gray-600">분석 중입니다...</div>
              ) : (
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{suitabilityResult}</div>
              )}
            </div>
          )}
          
          {fetchedPosts.length === 0 && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              먼저 3번 카드에서 게시물을 가져와주세요.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'comment-generation',
      title: '댓글 생성',
      description: '적합하다고 판단된 게시물들에 대해 순차적으로 댓글을 생성합니다.',
      content: (
        <div className="space-y-4">
          {/* 댓글 작성 프롬프트 편집기 */}
          {getPrompt('reddit-comment') ? (
            <PromptEditor
              prompt={getPrompt('reddit-comment')!}
              value={getPrompt('reddit-comment')!.template}
              onChange={(value) => updatePrompt('reddit-comment', value)}
              onReset={() => resetPrompt('reddit-comment')}
            />
          ) : (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              댓글 프롬프트를 로드할 수 없습니다.
            </div>
          )}
          
          {suitablePosts.length === 0 ? (
            <div className="text-center text-gray-500 bg-gray-50 p-4 rounded-md">
              먼저 5번 카드에서 적합성 판단을 완료해주세요.
            </div>
          ) : (
            <>
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-green-800 text-sm font-medium">
                  ✅ {suitablePosts.length}개 게시물이 적합하다고 판단되었습니다
                </p>
              </div>
              
              {/* 현재 진행 상황 */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-blue-800 text-sm">
                  진행 상황: {generatedComments.length}/{suitablePosts.length}
                </p>
              </div>
              
              {/* 다음 댓글 생성 버튼 */}
              {currentCommentIndex < suitablePosts.length && (
                <button
                  onClick={() => handleGenerateComment(currentCommentIndex)}
                  disabled={isGeneratingComment}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400"
                >
                  {isGeneratingComment 
                    ? 'AI가 댓글 생성 중...' 
                    : `${currentCommentIndex + 1}번 시작하기`}
                </button>
              )}
              
              {/* 생성된 댓글들 표시 */}
              {generatedComments.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700">생성된 댓글들:</h4>
                  {generatedComments.map((item, index) => {
                    const relatedPost = suitablePosts.find(p => p.originalIndex === item.postIndex);
                    return (
                      <div key={index} className="bg-white p-4 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {item.postIndex}번 게시물 댓글
                            </span>
                            {relatedPost && (
                              <div className="flex space-x-1">
                                <a
                                  href={`https://www.reddit.com${relatedPost.permalink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium px-2 py-1 bg-white border border-cyan-200 rounded hover:bg-cyan-50 transition-colors"
                                >
                                  링크
                                </a>
                                <button
                                  onClick={() => setSelectedPost(relatedPost)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                                >
                                  전문
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {item.comment.length}자
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <textarea
                            value={item.comment}
                            onChange={(e) => handleUpdateComment(index, e.target.value)}
                            className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white"
                            rows={4}
                            placeholder="댓글을 수정하세요..."
                          />
                          
                          <div className="text-center space-y-2">
                            <button
                              onClick={() => handleTranslateComment(index, item.comment)}
                              disabled={translatingIndex === index}
                              className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors font-medium flex items-center justify-center gap-2"
                            >
                              {translatingIndex === index && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              )}
                              {translatingIndex === index ? '번역 중...' : '이 글을 영어로 번역하기'}
                            </button>
                            
                            {translatingIndex === index && (
                              <div className="text-sm text-blue-600 animate-pulse">
                                {translationLoadingMessage}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* 완료 메시지 */}
              {currentCommentIndex >= suitablePosts.length && (
                <div className="bg-green-100 p-4 rounded-md text-center">
                  <p className="text-green-800 font-medium">
                    🎉 모든 적합한 게시물의 댓글 생성이 완료되었습니다!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )
    },
    {
      id: 'comment-deployment',
      title: '댓글 배포하기',
      description: '번역된 댓글을 실제 Reddit에 게시합니다.',
      content: (
        <div className="space-y-4">
          {/* 영어 번역 프롬프트 편집기 */}
          {getPrompt('reddit-translation') ? (
            <PromptEditor
              prompt={getPrompt('reddit-translation')!}
              value={getPrompt('reddit-translation')!.template}
              onChange={(value) => updatePrompt('reddit-translation', value)}
              onReset={() => resetPrompt('reddit-translation')}
            />
          ) : (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              영어 번역 프롬프트를 로드할 수 없습니다.
            </div>
          )}
          
          {translatedComments.length === 0 ? (
            <div className="text-center text-gray-500 bg-gray-50 p-4 rounded-md">
              먼저 6번 카드에서 댓글을 번역해주세요.
            </div>
          ) : (
            <div className="space-y-4">
              {translatedComments.map((item: any, index) => (
                <div key={index} className={`bg-white p-4 rounded-md border ${(item as any).deployed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium text-gray-900">
                      {item.postIndex}번 게시글
                    </span>
                    {(item as any).deployed && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                        ✅ 배포 완료
                      </span>
                    )}
                    {item.relatedPost && (
                      <div className="flex space-x-1">
                        <a
                          href={`https://www.reddit.com${item.relatedPost.permalink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-600 hover:text-cyan-700 font-medium px-2 py-1 bg-white border border-cyan-200 rounded hover:bg-cyan-50 transition-colors"
                        >
                          링크
                        </a>
                        <button
                          onClick={() => setSelectedPost(item.relatedPost)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        >
                          전문
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-semibold text-blue-700">영어 번역 댓글:</h4>
                      <span className="text-xs text-gray-500">
                        {item.translatedComment.length}자
                      </span>
                    </div>
                    <textarea
                      value={item.translatedComment}
                      onChange={(e) => handleUpdateTranslatedComment(index, e.target.value)}
                      className="w-full p-3 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-blue-50"
                      rows={4}
                      placeholder="번역된 댓글을 수정하세요..."
                      disabled={(item as any).deployed}
                    />
                  </div>
                  
                  <div className="text-center">
                    {(item as any).deployed ? (
                      <div className="text-green-600 font-medium">
                        🎉 댓글이 성공적으로 게시되었습니다!
                        {(item as any).commentId && (
                          <div className="text-xs text-gray-600 mt-1">
                            댓글 ID: {(item as any).commentId}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeployComment(item, index)}
                        disabled={deployingIndex === index}
                        className="px-6 py-3 text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors font-semibold flex items-center justify-center gap-2 mx-auto"
                      >
                        {deployingIndex === index && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {deployingIndex === index ? '배포 중...' : '실제 댓글 배포하기'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'discord-notification',
      title: '디스코드로 알림주기',
      description: '배포된 댓글의 Reddit 링크를 Discord로 알림을 보냅니다.',
      content: (
        <div className="space-y-4">
          {deployedComments.length === 0 ? (
            <div className="text-center text-gray-500 bg-gray-50 p-4 rounded-md">
              먼저 7번 카드에서 댓글을 배포해주세요.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-green-800 text-sm font-medium">
                  ✅ {deployedComments.length}개 댓글이 성공적으로 배포되었습니다
                </p>
              </div>
              
              <div className="space-y-3">
                {deployedComments.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-md border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-900">
                        {item.postIndex}번 게시글 배포 완료
                      </span>
                      <span className="text-xs text-gray-500">
                        댓글 ID: {item.commentId}
                      </span>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-md">
                      <h4 className="text-xs font-semibold text-blue-700 mb-2">Reddit 링크:</h4>
                      <a
                        href={item.redditLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {item.redditLink}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-6">
                <button
                  onClick={() => handleSendAllDiscordNotifications(deployedComments)}
                  className="px-8 py-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors font-semibold text-lg"
                >
                  모든 댓글을 Discord로 한번에 알림하기 ({deployedComments.length}개)
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="w-full bg-white">
      {/* 가로 스크롤 카드 컨테이너 */}
      <div className="overflow-x-auto pb-6 bg-white">
        <div className="flex space-x-6 min-w-max pl-6 pr-32 bg-white">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`bg-white rounded-xl border border-gray-200 p-8 w-96 flex-shrink-0 hover:shadow-lg transition-shadow flex flex-col ${
                step.id === 'posts-review' ? 'min-h-fit' : 'min-h-[650px]'
              }`}
            >
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">{step.description}</p>
              
              <div className="space-y-4 flex-1">
                {step.content}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 전문 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedPost.title}</h2>
                <p className="text-sm text-gray-500">
                  작성자 <span className="font-medium text-gray-700">{selectedPost.author}</span> • 점수: {selectedPost.score} • 댓글: {selectedPost.num_comments}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            
            {/* 모달 본문 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 본문 텍스트 */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {selectedPost.selftext || '본문이 없습니다.'}
                </div>
              </div>
              
              {/* 외부 링크가 있는 경우 */}
              {selectedPost.url && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-cyan-500">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <span>🔗</span>
                    <span className="font-medium">외부 링크</span>
                  </div>
                  <a 
                    href={selectedPost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 break-all"
                  >
                    {selectedPost.url}
                  </a>
                </div>
              )}
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>⬆️ {selectedPost.score}점</span>
                <span>💬 {selectedPost.num_comments}댓글</span>
              </div>
              <div className="flex space-x-3">
                <a 
                  href={selectedPost.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  원본 링크
                </a>
                <a
                  href={`https://www.reddit.com${selectedPost.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                >
                  Reddit에서 보기
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 스크롤 힌트 */}
      <div className="text-center text-gray-500 text-sm">
        ← → 좌우로 스크롤하여 각 단계를 진행하세요
      </div>
    </div>
  );
};

export default RedditDashboard;