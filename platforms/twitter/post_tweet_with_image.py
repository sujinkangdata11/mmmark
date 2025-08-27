#!/usr/bin/env python3
import os
import sys
import tweepy
import json

def post_tweet_with_image(text, image_path=None):
    """텍스트와 이미지로 트윗을 게시하는 함수"""
    try:
        # API 키 설정
        api_key = "OM9c8GsZeEKClBEjtJlJ25rZ4"
        api_secrets = "TD4mZjpiOXl7pSdlpcLjFYBous6QQR5XdUaO9UA1YJAp3M1hve"
        access_token = "1908069288256352256-ZviFYgShfvOynS5Bzbvuu2LeVgpLNQ"
        access_secret = "weDYIiqViNBuCaSh6t7noOoG3y5Sye2mlwmrzIv1ioTXd"

        print(f'[TWEEPY] 트윗 게시 시작...')
        print(f'[TWEEPY] 텍스트 길이: {len(text)} 글자')
        print(f'[TWEEPY] 텍스트 미리보기: {text[:100]}...')
        
        if image_path:
            print(f'[TWEEPY] 이미지 파일: {image_path}')
            
            # 파일이 존재하는지 확인
            if not os.path.exists(image_path):
                raise Exception(f'이미지 파일을 찾을 수 없습니다: {image_path}')
        
        # OAuth 1.0a 인증 (이미지 업로드용)
        auth = tweepy.OAuth1UserHandler(
            consumer_key=api_key,
            consumer_secret=api_secrets,
            access_token=access_token,
            access_token_secret=access_secret
        )
        api = tweepy.API(auth)

        # OAuth 2.0 Client (트윗 생성용)
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secrets,
            access_token=access_token,
            access_token_secret=access_secret
        )

        media_ids = []
        
        # 이미지 업로드 (경로 문제 해결됨)
        if image_path and os.path.exists(image_path):
            print('[TWEEPY] 이미지 업로드 중...')
            
            # 파일 확장자로 미디어 타입 결정
            if image_path.lower().endswith(('.mp4', '.mov', '.avi')):
                # 비디오 파일
                media = api.media_upload(image_path, chunked=True, media_category="tweet_video")
            else:
                # 이미지 파일
                media = api.media_upload(image_path)
            
            media_ids.append(media.media_id)
            print(f'[TWEEPY] 미디어 업로드 성공, ID: {media.media_id}')
        else:
            print('[TWEEPY] 텍스트 전용 모드')

        # 트윗 게시 (성공한 방식 그대로)
        print('[TWEEPY] 트윗 생성 중...')
        
        if media_ids:
            result = client.create_tweet(text=text, media_ids=media_ids)
        else:
            result = client.create_tweet(text=text)
        
        print(f'[TWEEPY] ✅ 트윗 성공!')
        print(f'[TWEEPY] Tweet ID: {result.data["id"]}')
        print(f'[TWEEPY] Tweet URL: https://twitter.com/user/status/{result.data["id"]}')
        
        return {
            'success': True,
            'tweet_id': result.data['id'],
            'url': f'https://twitter.com/user/status/{result.data["id"]}',
            'has_media': len(media_ids) > 0,
            'media_count': len(media_ids)
        }
        
    except Exception as e:
        print(f'[TWEEPY] ❌ 트윗 실패: {e}')
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    print(f'[DEBUG] 전체 sys.argv: {sys.argv}')
    print(f'[DEBUG] sys.argv 개수: {len(sys.argv)}')
    
    if len(sys.argv) < 2:
        print('사용법:')
        print('  텍스트만: python post_tweet_with_image.py "트윗할 내용"')
        print('  이미지와 함께: python post_tweet_with_image.py "트윗할 내용" "이미지파일경로"')
        sys.exit(1)
    
    # 명령행 인수에서 텍스트와 이미지 경로 가져오기
    tweet_text = sys.argv[1]
    image_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f'[DEBUG] 받은 텍스트: "{tweet_text}"')
    print(f'[DEBUG] 받은 이미지 경로: "{image_path}"')
    
    # 트윗 게시
    result = post_tweet_with_image(tweet_text, image_path)
    
    # JSON 형태로 결과 출력
    print(json.dumps(result, ensure_ascii=False))