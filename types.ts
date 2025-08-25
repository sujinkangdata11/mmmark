export type AutomationType = 'reddit-comment' | 'twitter-post' | 'youtube-comment' | 'youtube-upload';

export interface AutomationConfig {
  id: AutomationType;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultPrompt: string;
}

export interface Memo {
  id: string;
  text: string;
  timestamp: string;
}

export interface DailyStat {
  id: AutomationType;
  completed: number;
  goal: number;
}

export interface EnrichedStat extends AutomationConfig {
  completed: number;
  goal: number;
}

export interface Subreddit {
  id: string;
  url: string;
}

export interface MockRedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'generating';
}

export interface UploadedImage {
  id: string;
  file: File;
  dataUrl: string;
}

export interface MockYouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  viewCount: number;
}
