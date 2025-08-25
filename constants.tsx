
import { AutomationConfig } from './types';

const RedditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v2h-2v-2zm-2 4h6v6h-6v-6z"/>
        <path d="M12.026 2.002c-5.518 0-9.998 4.48-9.998 9.998s4.48 9.998 9.998 9.998 9.998-4.48 9.998-9.998-4.48-9.998-9.998-9.998zm4.848 12.358c-.39-.39-.902-.585-1.414-.585-.512 0-1.024.195-1.414.585l-2.121 2.121-2.121-2.121c-.781-.781-2.047-.781-2.828 0-.781.781-.781 2.047 0 2.828l2.121 2.121-2.121 2.121c-.781.781-.781 2.047 0 2.828.39.39.902.585 1.414.585.512 0 1.024-.195 1.414-.585l2.121-2.121 2.121 2.121c.39.39.902.585 1.414.585.512 0 1.024-.195 1.414-.585.781-.781.781-2.047 0-2.828l-2.121-2.121 2.121-2.121c.781-.781.781-2.047 0-2.828zM10.5 12.5c0-1.381 1.119-2.5 2.5-2.5s2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5-2.5-1.119-2.5-2.5z"/>
    </svg>
);


const TwitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.298 1.634 4.215 3.803 4.653-.623.169-1.282.235-1.956.183.606 1.885 2.364 3.256 4.45 3.294-1.711 1.342-3.869 2.143-6.225 2.143-.404 0-.802-.023-1.195-.069 2.203 1.412 4.823 2.235 7.616 2.235 9.138 0 14.14-7.564 14.14-14.142 0-.213-.005-.426-.014-.637.97-.699 1.811-1.572 2.479-2.569z" />
    </svg>
);

const TwitterThreadsIcon = () => (
    <div className="flex -space-x-4 items-center">
      <TwitterIcon />
      {/* A simple representation for Threads */}
      <div className="h-8 w-8 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <path d="M16 12v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1" />
            <path d="M16 12a4 4 0 0 0-4-4h-1" />
        </svg>
      </div>
    </div>
);

const YouTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

export const AUTOMATION_CONFIGS: AutomationConfig[] = [
    {
        id: 'reddit-comment',
        title: 'Reddit 자동 댓글',
        description: '지정된 서브레딧의 게시물에 AI가 생성한 댓글을 자동으로 답니다.',
        icon: <RedditIcon />,
        defaultPrompt: 'You are a helpful and witty Reddit commenter. Write a comment that is relevant to the post title, adds value, and is likely to get upvoted. Keep it concise and engaging.'
    },
    {
        id: 'twitter-post',
        title: 'Twitter & Threads 자동 포스팅',
        description: 'AI가 생성한 이미지와 텍스트를 Twitter와 Threads에 동시에 발행합니다.',
        icon: <TwitterThreadsIcon />,
        defaultPrompt: 'You are a social media expert. Write a short, engaging post for an image. Include relevant hashtags. Maximum 280 characters.'
    },
    {
        id: 'youtube-comment',
        title: 'YouTube 자동 댓글',
        description: '타겟 채널의 새 동영상에 AI가 생성한 댓글을 자동으로 답니다.',
        icon: <YouTubeIcon />,
        defaultPrompt: 'You are a friendly YouTube viewer. Watch a video about [Video Topic] and write a positive and insightful comment. Mention a specific part you liked.'
    },
    {
        id: 'youtube-upload',
        title: 'YouTube 자동 업로드',
        description: 'AI를 사용하여 동영상 스크립트와 제목을 생성하고 업로드를 준비합니다.',
        icon: <YouTubeIcon />,
        defaultPrompt: 'You are a YouTube content strategist. Create a compelling title and a 50-word description for a video about [Video Topic]. The tone should be exciting and clickable.'
    }
];
