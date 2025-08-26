import React, { useState } from 'react';

interface Post {
  id: string;
  title: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  selftext?: string;
  thumbnail?: string;
  permalink: string;
}

interface PostCardProps {
  post: Post;
  index: number;
}

const formatTimeAgo = (utcTimestamp: number): string => {
  const now = new Date();
  const postDate = new Date(utcTimestamp * 1000);
  const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "년 전";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "달 전";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "일 전";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "시간 전";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "분 전";
  return Math.floor(seconds) + "초 전";
};

const formatScore = (score: number): string => {
  if (score >= 1000) {
    return (score / 1000).toFixed(1) + 'k';
  }
  return score.toString();
};

const PostCard: React.FC<PostCardProps> = ({ post, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const isSelfPost = post.selftext && post.selftext.length > 0;
  const hasLongText = post.selftext && post.selftext.length > 200;
  
  // YouTube URL 감지 및 임베드 ID 추출
  const getYouTubeEmbedId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const youtubeId = getYouTubeEmbedId(post.url);
  const isYouTube = !!youtubeId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {/* 썸네일 또는 아이콘 */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          {post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' ? (
            <img 
              src={post.thumbnail} 
              alt="Post thumbnail" 
              className="w-full h-full object-cover rounded-lg" 
            />
          ) : (
            <div className="text-2xl">
              {isSelfPost ? '📝' : '🔗'}
            </div>
          )}
        </div>

        {/* 게시물 내용 */}
        <div className="flex-grow min-w-0">
          {/* 제목 */}
          <h3 className="font-semibold text-gray-900 mb-1 leading-tight">
            <a
              href={`https://www.reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600 transition-colors"
            >
              {index + 1}. {post.title}
            </a>
          </h3>

          {/* 메타 정보 */}
          <p className="text-sm text-gray-500 mb-2">
            작성자 <span className="font-medium text-gray-700">{post.author}</span> • {formatTimeAgo(post.created_utc)}
          </p>

          {/* YouTube 임베딩 */}
          {isYouTube && (
            <div className="mb-3">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={post.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* 게시물 텍스트 (있다면) */}
          {post.selftext && (
            <div className="mb-3">
              <div className={`text-sm text-gray-700 ${!isExpanded && hasLongText ? 'line-clamp-3' : ''}`}>
                {isExpanded || !hasLongText 
                  ? post.selftext 
                  : post.selftext.substring(0, 200) + '...'
                }
              </div>
              {hasLongText && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-cyan-600 text-sm font-medium mt-1 hover:text-cyan-700"
                >
                  {isExpanded ? '숨기기' : '더보기'}
                </button>
              )}
            </div>
          )}

          {/* 링크 미리보기 (YouTube가 아닌 경우) */}
          {!isYouTube && !isSelfPost && post.url && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-cyan-500">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                <span>🔗</span>
                <span className="font-medium">외부 링크</span>
              </div>
              <a 
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700 text-sm break-all"
              >
                {post.url.length > 60 ? post.url.substring(0, 60) + '...' : post.url}
              </a>
            </div>
          )}

          {/* 점수 및 댓글 */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <span>⬆️</span>
              <span>{formatScore(post.score)}점</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{post.num_comments}댓글</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🔗</span>
              <a 
                href={post.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700"
              >
                원본 링크
              </a>
            </div>
            {/* 더보기 버튼 */}
            <button
              onClick={() => setShowTextModal(true)}
              className="flex items-center space-x-1 text-cyan-600 hover:text-cyan-700 font-medium"
            >
              <span>📄</span>
              <span>더보기</span>
            </button>
          </div>
        </div>
      </div>

      {/* 텍스트 전체보기 모달 */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-sm text-gray-500">
                  작성자 <span className="font-medium text-gray-700">{post.author}</span> • {formatTimeAgo(post.created_utc)}
                </p>
              </div>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            
            {/* 모달 본문 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* YouTube 임베딩 (모달) */}
              {isYouTube && (
                <div className="mb-6">
                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={post.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* 외부 링크 (YouTube가 아닌 경우) */}
              {!isYouTube && !isSelfPost && post.url && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-cyan-500">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <span>🔗</span>
                    <span className="font-medium">외부 링크</span>
                  </div>
                  <a 
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 break-all"
                  >
                    {post.url}
                  </a>
                </div>
              )}

              {/* 본문 텍스트 */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {post.selftext || '본문이 없습니다.'}
                </div>
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>⬆️ {formatScore(post.score)}점</span>
                <span>💬 {post.num_comments}댓글</span>
              </div>
              <div className="flex space-x-3">
                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  원본 링크
                </a>
                <a
                  href={`https://www.reddit.com${post.permalink}`}
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
    </div>
  );
};

export default PostCard;