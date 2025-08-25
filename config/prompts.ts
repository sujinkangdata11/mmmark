export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  template: string;
  variables?: string[];
}

export interface AutomationPrompts {
  [key: string]: PromptConfig[];
}

export const DEFAULT_PROMPTS: AutomationPrompts = {
  reddit: [
    {
      id: 'reddit-suitability',
      name: '적합성 판단 프롬프트',
      description: '게시글이 댓글 달기에 적합한지 판단',
      template: `Analyze the following Reddit post to see if a witty, helpful comment would be appropriate. The goal is to engage positively, not to advertise. Avoid promotional posts. Respond with only 'YES' or 'NO'.

Post Title: "{POST_TITLE}"
Post Content: "{POST_CONTENT}"`,
      variables: ['POST_TITLE', 'POST_CONTENT']
    },
    {
      id: 'reddit-comment',
      name: '댓글 생성 프롬프트',
      description: 'Reddit 게시글에 대한 댓글 생성',
      template: `Write a helpful and engaging comment for this Reddit post. Be genuine, add value to the conversation, and maintain a friendly tone. Keep it concise and relevant.

Post Title: "{POST_TITLE}"
Post Content: "{POST_CONTENT}"`,
      variables: ['POST_TITLE', 'POST_CONTENT']
    }
  ],
  
  twitter: [
    {
      id: 'twitter-post',
      name: '트윗 생성 프롬프트',
      description: '이미지와 함께 올릴 트윗 생성',
      template: `Create an engaging Twitter post for an image. The post should be catchy, include relevant hashtags, and encourage engagement. Keep it under 280 characters.

Image context: "{IMAGE_NAME}"
Topic focus: "{TOPIC}"`,
      variables: ['IMAGE_NAME', 'TOPIC']
    },
    {
      id: 'twitter-threads',
      name: '스레드 생성 프롬프트',
      description: '연속 트윗 스레드 생성',
      template: `Create a Twitter thread (2-5 tweets) about the given topic. Each tweet should be under 280 characters and flow naturally to the next. Include relevant hashtags and a call-to-action in the final tweet.

Topic: "{TOPIC}"
Key points to cover: "{KEY_POINTS}"`,
      variables: ['TOPIC', 'KEY_POINTS']
    }
  ],
  
  youtube: [
    {
      id: 'youtube-comment',
      name: '댓글 생성 프롬프트',
      description: 'YouTube 영상에 대한 댓글 생성',
      template: `Write a thoughtful comment for this YouTube video. The comment should add value, show genuine interest, and potentially drive traffic to our content. At the end, naturally mention visiting our website for more content on this topic.

Video Title: "{VIDEO_TITLE}"
Our website: "{WEBSITE_URL}"`,
      variables: ['VIDEO_TITLE', 'WEBSITE_URL']
    },
    {
      id: 'youtube-description',
      name: '영상 설명 프롬프트',
      description: 'YouTube 영상 설명 생성',
      template: `Create a compelling YouTube video description. Include a hook, key points covered, relevant hashtags, and a call-to-action. Optimize for SEO.

Video Title: "{VIDEO_TITLE}"
Key Topics: "{TOPICS}"
Target Keywords: "{KEYWORDS}"`,
      variables: ['VIDEO_TITLE', 'TOPICS', 'KEYWORDS']
    }
  ],
  
  general: [
    {
      id: 'content-generation',
      name: '범용 컨텐츠 생성',
      description: '다양한 용도의 컨텐츠 생성',
      template: `Create engaging content based on the following requirements. Be creative, helpful, and maintain a professional tone.

Requirements: "{REQUIREMENTS}"
Target audience: "{AUDIENCE}"
Tone: "{TONE}"`,
      variables: ['REQUIREMENTS', 'AUDIENCE', 'TONE']
    }
  ]
};