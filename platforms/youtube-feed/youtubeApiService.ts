export interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  channelId: string;
  viewCount: number;
  publishedAt: string;
  thumbnail: string;
  url: string;
  description: string;
  duration?: number; // 영상 길이 (초 단위)
}

export interface YouTubeSearchParams {
  keyword: string;
  maxResults: number;
  order: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  pageToken?: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults: number;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  thumbnail: string;
  customUrl?: string;
  uploadFrequency: string; // 계산된 업로드 빈도
  averageViews: number; // 평균 조회수
  recentVideos: {
    title: string;
    viewCount: number;
    publishedAt: string;
  }[];
}

export interface YouTubeVideoDetails {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId: string;
  duration: string;
  likeCount: number;
  commentCount: number;
}

export interface YouTubeComment {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  replyCount: number;
}

class YouTubeApiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ISO 8601 duration을 초 단위로 변환
  private parseDuration(isoDuration: string): number {
    // PT4M13S -> 4분 13초 = 253초
    // PT1H2M3S -> 1시간 2분 3초 = 3723초
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  async searchVideos(params: YouTubeSearchParams): Promise<YouTubeSearchResult> {
    if (!this.apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    try {
      // YouTube Data API v3 검색 엔드포인트
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?` + new URLSearchParams({
        part: 'snippet',
        q: params.keyword,
        type: 'video',
        maxResults: params.maxResults.toString(),
        order: params.order,
        key: this.apiKey,
        ...(params.pageToken && { pageToken: params.pageToken })
      });

      console.log('[YOUTUBE API] 검색 요청:', searchUrl);

      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`YouTube 검색 실패: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      // 비디오 ID들 추출
      const videoIds = searchData.items.map((item: any) => item.id.videoId).filter(Boolean);
      
      if (videoIds.length === 0) {
        return {
          videos: [],
          nextPageToken: searchData.nextPageToken,
          prevPageToken: searchData.prevPageToken,
          totalResults: searchData.pageInfo?.totalResults || 0
        };
      }

      // 비디오 상세 정보 (조회수, 길이 포함) 가져오기
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?` + new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
        key: this.apiKey
      });

      console.log('[YOUTUBE API] 비디오 정보 요청:', videosUrl);

      const videosResponse = await fetch(videosUrl);
      if (!videosResponse.ok) {
        throw new Error(`YouTube 비디오 정보 조회 실패: ${videosResponse.status}`);
      }

      const videosData = await videosResponse.json();

      // 데이터 변환
      const videos: YouTubeVideo[] = videosData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        viewCount: parseInt(item.statistics.viewCount || '0'),
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        description: item.snippet.description || '',
        duration: this.parseDuration(item.contentDetails?.duration || 'PT0S')
      }));

      // 정렬은 클라이언트에서 처리

      return {
        videos,
        nextPageToken: searchData.nextPageToken,
        prevPageToken: searchData.prevPageToken,
        totalResults: searchData.pageInfo?.totalResults || 0
      };

    } catch (error) {
      console.error('[YOUTUBE API] 오류:', error);
      throw error;
    }
  }

  // Mock 데이터 (API 키가 없을 때 사용)
  async searchVideosMock(params: YouTubeSearchParams): Promise<YouTubeSearchResult> {
    console.log('[YOUTUBE API] Mock 모드로 실행');
    
    await new Promise(resolve => setTimeout(resolve, 500)); // 네트워크 지연 시뮬레이션

    const mockVideos: YouTubeVideo[] = [
      {
        id: 'dQw4w9WgXcQ1',
        title: `${params.keyword} 관련 영상 1 - 초보자를 위한 가이드`,
        channelName: 'Learning Channel',
        channelId: 'UC123456789',
        viewCount: 45,
        publishedAt: '2024-08-26T10:00:00Z',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ1',
        description: `${params.keyword}에 대한 초보자 친화적인 설명입니다.`,
        duration: 45 // 45초 (쇼츠)
      },
      {
        id: 'dQw4w9WgXcQ2',
        title: `${params.keyword} 실제 후기 - 3개월 사용기`,
        channelName: 'Review Master',
        channelId: 'UC987654321',
        viewCount: 128,
        publishedAt: '2024-08-25T15:30:00Z',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ2',
        description: `실제로 ${params.keyword}를 3개월간 사용해본 솔직한 후기입니다.`,
        duration: 380 // 6분 20초 (롱폼)
      },
      {
        id: 'dQw4w9WgXcQ3',
        title: `${params.keyword} 완전 정복 - 고급 기법`,
        channelName: 'Pro Tips',
        channelId: 'UC111222333',
        viewCount: 89,
        publishedAt: '2024-08-24T09:15:00Z',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ3',
        description: `${params.keyword}의 고급 활용법을 알려드립니다.`,
        duration: 58 // 58초 (쇼츠)
      },
      {
        id: 'dQw4w9WgXcQ4',
        title: `${params.keyword} 비교 분석 - 어떤 걸 선택해야 할까?`,
        channelName: 'Compare Everything',
        channelId: 'UC444555666',
        viewCount: 203,
        publishedAt: '2024-08-23T14:20:00Z',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ4',
        description: `다양한 ${params.keyword} 옵션들을 비교 분석했습니다.`,
        duration: 720 // 12분 (롱폼)
      },
      {
        id: 'dQw4w9WgXcQ5',
        title: `${params.keyword} 꿀팁 모음 - 이것만 알면 끝`,
        channelName: 'Tips & Tricks',
        channelId: 'UC777888999',
        viewCount: 67,
        publishedAt: '2024-08-22T11:45:00Z',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ5',
        description: `${params.keyword}와 관련된 유용한 꿀팁들을 모았습니다.`,
        duration: 30 // 30초 (쇼츠)
      },
      {
        id: 'dQw4w9WgXcQ6',
        title: `${params.keyword} 15초 요약`,
        channelName: 'Quick Shorts',
        channelId: 'UC101112131',
        viewCount: 1200,
        publishedAt: '2024-08-27T08:00:00Z', // 오늘
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ6',
        description: `${params.keyword}를 15초로 요약했습니다.`,
        duration: 15 // 15초 (쇼츠)
      },
      {
        id: 'dQw4w9WgXcQ7',
        title: `${params.keyword} 완벽 가이드 - 30분 집중 강의`,
        channelName: 'Deep Learning',
        channelId: 'UC141516171',
        viewCount: 850,
        publishedAt: '2024-08-20T16:30:00Z', // 7일 전
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ7',
        description: `${params.keyword}에 대한 상세한 30분 강의입니다.`,
        duration: 1800 // 30분 (롱폼)
      },
      {
        id: 'dQw4w9WgXcQ8',
        title: `${params.keyword} 1분 챌린지`,
        channelName: 'Challenge Channel',
        channelId: 'UC181920212',
        viewCount: 320,
        publishedAt: '2024-08-25T12:00:00Z', // 2일 전
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ8',
        description: `${params.keyword} 1분 챌린지에 도전했습니다!`,
        duration: 55 // 55초 (쇼츠)
      }
    ];

    // 정렬은 클라이언트에서 처리

    return {
      videos: mockVideos,
      nextPageToken: 'next_page_token_mock',
      totalResults: 50
    };
  }

  // 채널 정보 가져오기
  async getChannelInfo(channelId: string): Promise<YouTubeChannelInfo> {
    if (!this.apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    try {
      console.log('[YOUTUBE API] 채널 정보 요청:', channelId);

      // 채널 기본 정보 가져오기
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?` + new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: channelId,
        key: this.apiKey
      });

      const channelResponse = await fetch(channelUrl);
      if (!channelResponse.ok) {
        throw new Error(`채널 정보 조회 실패: ${channelResponse.status}`);
      }

      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('채널을 찾을 수 없습니다.');
      }

      const channel = channelData.items[0];
      const statistics = channel.statistics;
      const snippet = channel.snippet;

      // 채널의 최근 동영상들 가져오기 (업로드 빈도 계산용)
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      let recentVideos: YouTubeChannelInfo['recentVideos'] = [];
      let uploadFrequency = '알 수 없음';

      if (uploadsPlaylistId) {
        try {
          const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?` + new URLSearchParams({
            part: 'snippet',
            playlistId: uploadsPlaylistId,
            maxResults: '10',
            key: this.apiKey
          });

          const playlistResponse = await fetch(playlistUrl);
          if (playlistResponse.ok) {
            const playlistData = await playlistResponse.json();
            
            if (playlistData.items && playlistData.items.length > 0) {
              // 최근 비디오 ID들 추출
              const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId);
              
              // 비디오 상세 정보 (조회수 포함) 가져오기
              const videosUrl = `https://www.googleapis.com/youtube/v3/videos?` + new URLSearchParams({
                part: 'snippet,statistics',
                id: videoIds.join(','),
                key: this.apiKey
              });

              const videosResponse = await fetch(videosUrl);
              if (videosResponse.ok) {
                const videosData = await videosResponse.json();
                
                recentVideos = videosData.items.map((video: any) => ({
                  title: video.snippet.title,
                  viewCount: parseInt(video.statistics.viewCount || '0'),
                  publishedAt: video.snippet.publishedAt
                }));

                // 업로드 빈도 계산
                if (recentVideos.length >= 2) {
                  const dates = recentVideos.map(v => new Date(v.publishedAt)).sort((a, b) => b.getTime() - a.getTime());
                  const daysBetween = (dates[0].getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
                  const avgDaysBetween = daysBetween / (dates.length - 1);
                  
                  if (avgDaysBetween < 1) {
                    uploadFrequency = '매일 업로드';
                  } else if (avgDaysBetween < 7) {
                    uploadFrequency = `주 ${Math.round(7 / avgDaysBetween)}회 업로드`;
                  } else if (avgDaysBetween < 30) {
                    uploadFrequency = `월 ${Math.round(30 / avgDaysBetween)}회 업로드`;
                  } else {
                    uploadFrequency = `${Math.round(avgDaysBetween)}일에 1회 업로드`;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('[YOUTUBE API] 최근 동영상 정보 가져오기 실패:', error);
        }
      }

      // 평균 조회수 계산
      const totalViews = parseInt(statistics.viewCount || '0');
      const videoCount = parseInt(statistics.videoCount || '1');
      const averageViews = Math.round(totalViews / videoCount);

      return {
        id: channel.id,
        title: snippet.title,
        description: snippet.description || '',
        subscriberCount: parseInt(statistics.subscriberCount || '0'),
        videoCount: parseInt(statistics.videoCount || '0'),
        viewCount: parseInt(statistics.viewCount || '0'),
        publishedAt: snippet.publishedAt,
        thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url || '',
        customUrl: snippet.customUrl,
        uploadFrequency,
        averageViews,
        recentVideos
      };

    } catch (error) {
      console.error('[YOUTUBE API] 채널 정보 조회 오류:', error);
      throw error;
    }
  }

  // 비디오 상세 정보 가져오기 (태그, 설명 포함)
  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails> {
    if (!this.apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    try {
      console.log('[YOUTUBE API] 비디오 상세 정보 요청:', videoId);

      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?` + new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: videoId,
        key: this.apiKey
      });

      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`비디오 정보 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('비디오를 찾을 수 없습니다.');
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const statistics = video.statistics;
      const contentDetails = video.contentDetails;

      return {
        id: video.id,
        title: snippet.title,
        description: snippet.description || '',
        tags: snippet.tags || [],
        categoryId: snippet.categoryId,
        duration: contentDetails.duration,
        likeCount: parseInt(statistics.likeCount || '0'),
        commentCount: parseInt(statistics.commentCount || '0')
      };

    } catch (error) {
      console.error('[YOUTUBE API] 비디오 상세 정보 조회 오류:', error);
      throw error;
    }
  }

  // 비디오 댓글 가져오기
  async getVideoComments(videoId: string, maxResults: number = 20): Promise<YouTubeComment[]> {
    if (!this.apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    try {
      console.log('[YOUTUBE API] 댓글 요청:', videoId);

      const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?` + new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        maxResults: maxResults.toString(),
        order: 'relevance',
        key: this.apiKey
      });

      const response = await fetch(commentsUrl);
      if (!response.ok) {
        throw new Error(`댓글 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items) {
        return [];
      }

      return data.items.map((item: any) => {
        const comment = item.snippet.topLevelComment.snippet;
        return {
          id: item.id,
          authorDisplayName: comment.authorDisplayName,
          authorProfileImageUrl: comment.authorProfileImageUrl,
          textOriginal: comment.textOriginal,
          likeCount: parseInt(comment.likeCount || '0'),
          publishedAt: comment.publishedAt,
          replyCount: parseInt(item.snippet.totalReplyCount || '0')
        };
      });

    } catch (error) {
      console.error('[YOUTUBE API] 댓글 조회 오류:', error);
      throw error;
    }
  }

  // Mock 비디오 상세 정보
  async getVideoDetailsMock(videoId: string): Promise<YouTubeVideoDetails> {
    console.log('[YOUTUBE API] Mock 비디오 상세 정보 생성');
    
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      id: videoId,
      title: 'Mock 비디오 제목 - 테스트용',
      description: '이것은 Mock 데이터입니다. 실제 YouTube API 키를 설정하면 실제 비디오 설명을 볼 수 있습니다.\n\n이 비디오에서는 다양한 내용을 다루고 있으며, 시청자들에게 유용한 정보를 제공합니다.',
      tags: ['테스트', '모크데이터', '유튜브', 'API', '자동화'],
      categoryId: '22',
      duration: 'PT5M30S',
      likeCount: 1250,
      commentCount: 89
    };
  }

  // Mock 댓글 데이터
  async getVideoCommentsMock(videoId: string, maxResults: number = 20): Promise<YouTubeComment[]> {
    console.log('[YOUTUBE API] Mock 댓글 생성');
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockComments: YouTubeComment[] = [
      {
        id: 'comment1',
        authorDisplayName: '댓글러1',
        authorProfileImageUrl: 'https://yt3.ggpht.com/ytc/default_profile.jpg',
        textOriginal: '정말 유익한 영상이네요! 많은 도움이 되었습니다. 감사합니다.',
        likeCount: 15,
        publishedAt: '2024-08-25T10:30:00Z',
        replyCount: 2
      },
      {
        id: 'comment2',
        authorDisplayName: 'TestUser',
        authorProfileImageUrl: 'https://yt3.ggpht.com/ytc/default_profile.jpg',
        textOriginal: '이런 내용 찾고 있었는데 딱 맞는 영상이에요. 구독하고 갑니다!',
        likeCount: 8,
        publishedAt: '2024-08-25T12:15:00Z',
        replyCount: 0
      },
      {
        id: 'comment3',
        authorDisplayName: '학습자',
        authorProfileImageUrl: 'https://yt3.ggpht.com/ytc/default_profile.jpg',
        textOriginal: '설명이 정말 자세하고 이해하기 쉬워요. 다음 영상도 기대됩니다.',
        likeCount: 12,
        publishedAt: '2024-08-26T09:20:00Z',
        replyCount: 1
      },
      {
        id: 'comment4',
        authorDisplayName: '뷰어123',
        authorProfileImageUrl: 'https://yt3.ggpht.com/ytc/default_profile.jpg',
        textOriginal: '와 이거 진짜 신기하네요. 몰랐던 정보들이 많아서 놀랐습니다.',
        likeCount: 6,
        publishedAt: '2024-08-26T14:45:00Z',
        replyCount: 0
      },
      {
        id: 'comment5',
        authorDisplayName: '초보자',
        authorProfileImageUrl: 'https://yt3.ggpht.com/ytc/default_profile.jpg',
        textOriginal: '초보도 따라하기 쉽게 설명해주셔서 감사해요. 질문이 있는데 답변 부탁드려요!',
        likeCount: 9,
        publishedAt: '2024-08-27T08:10:00Z',
        replyCount: 3
      }
    ];

    return mockComments.slice(0, maxResults);
  }

  // Mock 채널 정보 (API 키가 없을 때 사용)
  async getChannelInfoMock(channelId: string): Promise<YouTubeChannelInfo> {
    console.log('[YOUTUBE API] Mock 채널 정보 생성');
    
    await new Promise(resolve => setTimeout(resolve, 800)); // 네트워크 지연 시뮬레이션

    return {
      id: channelId,
      title: '테스트 채널',
      description: '이것은 테스트용 Mock 채널입니다. 실제 YouTube API 키를 설정하면 실제 채널 정보를 볼 수 있습니다.',
      subscriberCount: 15420,
      videoCount: 89,
      viewCount: 2847539,
      publishedAt: '2020-05-15T08:30:00Z',
      thumbnail: 'https://yt3.ggpht.com/ytc/AKedOLT8N9J0XhO8JE8J0YZZ4Zx3lqo8j7mUOg4PYzXFqg=s176-c-k-c0x00ffffff-no-rj',
      customUrl: '@testchannel',
      uploadFrequency: '주 2-3회 업로드',
      averageViews: 31984,
      recentVideos: [
        {
          title: '최근 업로드 영상 1',
          viewCount: 45230,
          publishedAt: '2024-08-25T14:30:00Z'
        },
        {
          title: '최근 업로드 영상 2', 
          viewCount: 28947,
          publishedAt: '2024-08-23T09:15:00Z'
        },
        {
          title: '최근 업로드 영상 3',
          viewCount: 52163,
          publishedAt: '2024-08-20T16:45:00Z'
        }
      ]
    };
  }
}

export default YouTubeApiService;