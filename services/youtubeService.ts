export interface YouTubeChannelInfo {
  channelName: string;
  channelId: string;
  createdAt: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  mostViewedVideoViews: string;
  mostViewedVideoTitle?: string;
}

export const getChannelInfo = async (channelHandle: string, apiKey: string): Promise<YouTubeChannelInfo> => {
  // @ 포함된 핸들에서 @ 제거
  const cleanHandle = channelHandle.replace('@', '');
  
  try {
    let channelId = '';
    
    // 1. 먼저 핸들로 직접 채널 조회 시도 (forHandle 파라미터 사용)
    try {
      const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
      const handleResponse = await fetch(handleUrl);
      const handleData = await handleResponse.json();
      
      if (handleData.items && handleData.items.length > 0) {
        channelId = handleData.items[0].id;
      }
    } catch (handleError) {
      console.log('핸들로 직접 조회 실패, 검색으로 시도:', handleError);
    }
    
    // 2. 핸들로 직접 조회가 실패하면 검색으로 채널 ID 찾기
    if (!channelId) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        throw new Error('채널을 찾을 수 없습니다.');
      }
      
      channelId = searchData.items[0].snippet.channelId;
    }
    
    // 2. 채널 상세 정보 가져오기
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const channelResponse = await fetch(channelUrl);
    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('채널 정보를 가져올 수 없습니다.');
    }
    
    const channel = channelData.items[0];
    
    // 3. 가장 인기 있는 동영상 찾기
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=viewCount&maxResults=1&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();
    
    let mostViewedVideoViews = '정보 없음';
    let mostViewedVideoTitle = '정보 없음';
    
    if (videosData.items && videosData.items.length > 0) {
      const videoId = videosData.items[0].id.videoId;
      mostViewedVideoTitle = videosData.items[0].snippet.title;
      
      // 동영상 상세 정보로 조회수 가져오기
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
      const videoResponse = await fetch(videoUrl);
      const videoData = await videoResponse.json();
      
      if (videoData.items && videoData.items.length > 0) {
        mostViewedVideoViews = parseInt(videoData.items[0].statistics.viewCount).toLocaleString();
      }
    }
    
    return {
      channelName: channel.snippet.title,
      channelId: channelId,
      createdAt: new Date(channel.snippet.publishedAt).toLocaleDateString('ko-KR'),
      subscriberCount: parseInt(channel.statistics.subscriberCount).toLocaleString(),
      viewCount: parseInt(channel.statistics.viewCount).toLocaleString(),
      videoCount: parseInt(channel.statistics.videoCount).toLocaleString(),
      mostViewedVideoViews: mostViewedVideoViews,
      mostViewedVideoTitle: mostViewedVideoTitle
    };
    
  } catch (error) {
    console.error('YouTube API 오류:', error);
    throw new Error(`YouTube 정보 조회 실패: ${error}`);
  }
};