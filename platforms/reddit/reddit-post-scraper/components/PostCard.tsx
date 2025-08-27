import React, { useState, useRef, useEffect } from 'react';
import { RedditPost } from '../types';
import { UpvoteIcon, CommentIcon, LinkIcon } from './Icons';

interface PostCardProps {
  post: RedditPost;
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

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const isSelfPost = post.selftext !== "";
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const textContentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textContentRef.current) {
      // 128px is the pixel value for tailwind's max-h-32 (8rem)
      if (textContentRef.current.scrollHeight > 128) {
        setNeedsTruncation(true);
      } else {
        setNeedsTruncation(false);
      }
    }
  }, [post.selftext]);

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex transition-transform transform hover:scale-[1.02] hover:shadow-cyan-500/20">
      <div className="w-24 bg-slate-900/50 flex-shrink-0 flex flex-col items-center justify-center p-2 text-center">
        {post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' ? (
          <img src={post.thumbnail} alt="Post thumbnail" className="w-16 h-16 object-cover rounded-md" />
        ) : (
            <div className="w-16 h-16 bg-slate-700 rounded-md flex items-center justify-center">
                {isSelfPost ? <span className="text-2xl text-slate-400">📝</span> : <LinkIcon className="w-8 h-8 text-slate-400" />}
            </div>
        )}
      </div>
      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <a
            href={`https://www.reddit.com${post.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {post.title}
          </a>
          <p className="text-sm text-slate-400 mt-1">
            작성자 <span className="font-medium text-slate-300">{post.author}</span> • {formatTimeAgo(post.created_utc)}
          </p>
          {post.selftext && (
            <div className="mt-4 text-sm text-slate-300">
              <div
                className={`relative overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-32'}`}
              >
                <p ref={textContentRef} className="whitespace-pre-wrap">{post.selftext}</p>
                {!isExpanded && needsTruncation && (
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-800 to-transparent pointer-events-none" aria-hidden="true"></div>
                )}
              </div>
              {needsTruncation && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? '숨기기' : '더보기'}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-6 mt-4 text-sm text-slate-400">
          <div className="flex items-center space-x-1">
            <UpvoteIcon className="w-4 h-4 text-orange-500" />
            <span>점수: {formatScore(post.score)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CommentIcon className="w-4 h-4 text-sky-500" />
            <span>댓글: {post.num_comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
