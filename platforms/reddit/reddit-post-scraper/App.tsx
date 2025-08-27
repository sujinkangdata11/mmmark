
import React, { useState, useCallback } from 'react';
import type { RedditPost } from './types';
import PostCard from './components/PostCard';

const Loader: React.FC = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
    <p>{message}</p>
  </div>
);

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!url) {
      setError('레딧 URL을 입력해주세요.');
      return;
    }
  
    const subredditRegex = /reddit\.com\/r\/([a-zA-Z0-9_]+)/;
    const match = url.match(subredditRegex);
  
    if (!match || !match[1]) {
      setError('유효한 레딧 r/subreddit URL 형식이 아닙니다.');
      return;
    }
  
    const subreddit = match[1];
    const fetchUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=25`;
  
    setLoading(true);
    setError(null);
    setPosts([]);
  
    try {
      const response = await fetch(fetchUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP 에러! 상태: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data?.data?.children) {
        throw new Error('예상치 못한 API 응답 형식입니다.');
      }

      const fetchedPosts: RedditPost[] = data.data.children.map((child: any) => child.data);
      setPosts(fetchedPosts);
    } catch (err: any) {
      console.error("Fetching error:", err);
      setError(`게시글을 가져오는 데 실패했습니다: ${err.message}. CORS 문제일 수 있습니다.`);
    } finally {
      setLoading(false);
    }
  }, [url, sort]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">Reddit 게시글 스크래퍼</h1>
          <p className="text-slate-400 mt-2">원하는 서브레딧의 게시글을 손쉽게 확인하세요.</p>
        </header>

        <main>
          <div className="bg-slate-800/50 p-6 rounded-xl shadow-2xl backdrop-blur-sm border border-slate-700 mb-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="reddit-url" className="block text-lg font-medium text-slate-300 mb-2">
                  레딧 주소
                </label>
                <input
                  id="reddit-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="예: https://www.reddit.com/r/reactjs"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                />
              </div>

              <div className="mb-6">
                <span className="block text-lg font-medium text-slate-300 mb-2">정렬 기준</span>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="hot"
                      checked={sort === 'hot'}
                      onChange={() => setSort('hot')}
                      className="form-radio h-5 w-5 text-cyan-500 bg-slate-700 border-slate-600 focus:ring-cyan-500"
                    />
                    <span className="ml-2 text-slate-300">인기 (Hot)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="new"
                      checked={sort === 'new'}
                      onChange={() => setSort('new')}
                      className="form-radio h-5 w-5 text-cyan-500 bg-slate-700 border-slate-600 focus:ring-cyan-500"
                    />
                    <span className="ml-2 text-slate-300">최신 (New)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? '불러오는 중...' : '게시글 가져오기'}
              </button>
            </form>
          </div>
          
          <div className="space-y-4">
            {loading && <Loader />}
            {error && <ErrorMessage message={error} />}
            {!loading && !error && posts.length === 0 && (
               <div className="text-center py-10 text-slate-500">
                <p>레딧 URL을 입력하고 정렬 옵션을 선택한 후 버튼을 클릭하세요.</p>
               </div>
            )}
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
