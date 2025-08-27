
export interface RedditPost {
  id: string;
  title: string;
  author: string;
  score: number;
  permalink: string;
  url: string;
  num_comments: number;
  created_utc: number;
  thumbnail: string;
  selftext: string;
}
