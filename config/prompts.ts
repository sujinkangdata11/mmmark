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
      template: `전체 카드의 {POST_COUNT}게시물의 타이틀과 전문 내용을 파악해서 "AutoVid"사이트를 홍보에 적합한 게시물을 아웃풋으로 출력해주세요. 그 아래 근거도 달아주세요. 

AutoVid는 단 한번의 클릭으로 자동 생성되는 유튜브 쇼핑쇼츠 서비스 입니다. 어필리에이트에 강력한 장점을 갖고있어, 영상을 자체적으로 만들고 연관된 아마존 상품을 링크로 소개해줍니다. 또한 현재 바이럴되는 쇼츠들을 토대로 쇼핑쇼츠를 제작하여 조회수도 보장됩니다. 만약 유튜브로 수익화를 원하는 분이나, 온라인으로 홍보하고싶은 자영업자가 있다면 AutoVid를 추천해주세요. 특히 쇼츠로 부수입,돈을 벌고싶거나 매일 자동 생성된다는 성실함이 필요한분들에게 추천해주세요.

Post Title: "{POST_TITLE}"
Post Content: "{POST_CONTENT}"

예시:
1번 게시물 - OK. 근거 : 애니메이션 카테고리 영상의 경쟁이 치열함. 이 쇼츠생성 툴로 사용하면 도움이 됨.

2번 게시물 - OK. 근거 : 낮은 조회수로 고민일 때, 이 쇼츠생성툴로하면 적절한 조회수를 얻을 수 있음

3번 게시물 - OK. 근거 : 새로운 비디오를 올릴때, 이 쇼츠생성 툴도 고려해보는게 좋음. 다양한 툴을 써봐라.

**반드시 예시처럼 순차적으로 (숫자)번 게시물 - OK 혹은 NO. 로 표시하세요.**`,
      variables: ['POST_COUNT', 'POST_TITLE', 'POST_CONTENT']
    },
    {
      id: 'reddit-comment',
      name: '댓글 생성 프롬프트',
      description: 'Reddit 게시글에 대한 댓글 생성',
      template: `적합성 판단의 근거를 가지고 {POST_INDEX}번 게시물의 댓글을 자연스럽게 써주세요. 너무 인위적으로 홍보하면 반감이 생기니, 자연스럽게, 툭 던지듯 말해주세요. 댓글내용은 200자 이하로하고 레딧에서 흔히 볼수 있는 문체와 정중함이 살짝 곁들여진 내용으로 작성하세요.

적합성 판단 근거: {REASON}

게시물 제목: {POST_TITLE}
게시물 내용: {POST_CONTENT}`,
      variables: ['POST_INDEX', 'REASON', 'POST_TITLE', 'POST_CONTENT']
    },
    {
      id: 'reddit-translation',
      name: '영어 번역 프롬프트',
      description: '한국어 댓글을 영어로 번역',
      template: `다음 한국어 댓글을 자연스러운 영어로 번역해주세요. Reddit에서 사용할 댓글이므로 친근하고 자연스러운 톤으로 번역해주세요:

{COMMENT}

*반드시 이 내용만 번역하세요.추가로 문장을 붙이거나, 줄이면 안됩니다*`,
      variables: ['COMMENT']
    }
  ],
  
  twitter: [
    {
      id: 'twitter-post',
      name: '수익 분석 프롬프트',
      description: 'YouTube 채널 정보를 바탕으로 수익 분석 포스트 생성',
      template: `주어진 정보를 가지고 아래 [빈칸]을 채워서 예시처럼 만드세요.
-----------------------------
🚨 이 채널은 개설 [기간] 만에 '광고 + 쇼핑제휴' 합산 총 수익 약 [$총합]를 만들었을 가능성이 큽니다!

업로드 [업로드수]개 📌
💵 광고 수익(쇼츠 RPM $0.3 가정): 약 $[광고수익]
🛒 쇼핑제휴 수익(1만 뷰당 20건 · 평균가 $30 · 커미션 6%): 약 $[제휴수익]
= 합산 총 수익: 약 $[총합]
--------------------------------
[] 빈칸을 정확하게 수학적 계산을 통해 아래같은 예시를 만드세요. 
---------------------------------

ex)
🚨 이 채널은 개설 15일 만에 '광고 + 쇼핑제휴' 합산 총 수익 약 $13,038를 만들었을 가능성이 큽니다!

업로드 31개 📌
💵 광고 수익(쇼츠 RPM $0.33 가정): 약 $1,095
🛒 쇼핑제휴 수익(1만 뷰당 20건 · 평균가 $30 · 커미션 6%): 약 $11,944
= 합산 총 수익: 약 $13,038

리트윗하고 "LIKE"라고 댓글 다세요. 정말 쉬운 방법을 알려드립니다! (팔로우 필수) 🚨`,
      variables: ['CHANNEL_NAME', 'CREATED_DATE', 'SUBSCRIBER_COUNT', 'VIEW_COUNT', 'VIDEO_COUNT']
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