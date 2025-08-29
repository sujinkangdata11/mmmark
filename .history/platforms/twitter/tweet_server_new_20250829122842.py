#!/usr/bin/env python3
"""
간소화된 Flask 트위터 자동화 서버
브라우저에서 요청 -> 이 서버에서 직접 tweepy 실행
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import json
import tweepy
import re

app = Flask(__name__)
CORS(app)  # 브라우저에서 접근 허용

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({
        'status': 'ok',
        'message': 'Flask Twitter Server is running'
    })

@app.route('/tweet', methods=['POST'])
def tweet_with_image():
    """이미지와 함께 트윗 게시"""
    try:
        print('[FLASK SERVER] 트윗 요청 받음')
        
        # 요청에서 텍스트와 이미지 파일 가져오기
        text = request.form.get('text')
        image_file = request.files.get('image')
        
        if not text:
            return jsonify({
                'success': False,
                'error': '트윗 텍스트가 필요합니다'
            }), 400
        
        print(f'[FLASK SERVER] 텍스트: {text[:50]}...')
        print(f'[FLASK SERVER] 이미지: {image_file.filename if image_file else "없음"}')
        
        # Twitter API 설정
        api_key = "OM9c8GsZeEKClBEjtJlJ25rZ4"
        api_secrets = "TD4mZjpiOXl7pSdlpcLjFYBous6QQR5XdUaO9UA1YJAp3M1hve"
        access_token = "1908069288256352256-ZviFYgShfvOynS5Bzbvuu2LeVgpLNQ"
        access_secret = "weDYIiqViNBuCaSh6t7noOoG3y5Sye2mlwmrzIv1ioTXd"
        
        print(f'[TWEEPY] 트윗 게시 시작...')
        print(f'[TWEEPY] 텍스트 길이: {len(text)} 글자')
        print(f'[TWEEPY] 텍스트 미리보기: {text[:100]}...')
        
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
        image_path = None
        
        # 이미지가 있으면 처리
        if image_file:
            # 메인 프로젝트 폴더에 저장 (../../ 를 통해 ai-marketing-automation-hub로)
            main_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            # 파일 확장자만 유지
            file_ext = os.path.splitext(image_file.filename)[1] or '.png'
            image_path = os.path.join(main_dir, f'twitter_temp_image{file_ext}')
            
            # 이미지 저장
            image_file.save(image_path)
            print(f'[TWEEPY] 이미지 저장: {image_path}')
            
            # 이미지 업로드
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

        # 트윗 게시
        print('[TWEEPY] 트윗 생성 중...')
        
        if media_ids:
            result = client.create_tweet(text=text, media_ids=media_ids)
        else:
            result = client.create_tweet(text=text)
        
        print(f'[TWEEPY] ✅ 트윗 성공!')
        print(f'[TWEEPY] Tweet ID: {result.data["id"]}')
        print(f'[TWEEPY] Tweet URL: https://twitter.com/user/status/{result.data["id"]}')
        
        # 임시 파일 삭제
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
            print('[FLASK SERVER] 임시 파일 삭제 완료')
        
        response_data = {
            'success': True,
            'tweet_id': result.data['id'],
            'url': f'https://twitter.com/user/status/{result.data["id"]}',
            'has_media': len(media_ids) > 0,
            'media_count': len(media_ids)
        }
        
        print(f'[FLASK SERVER] 최종 결과: {response_data}')
        return jsonify(response_data)
        
    except Exception as e:
        # 임시 파일 삭제
        if 'image_path' in locals() and image_path and os.path.exists(image_path):
            os.remove(image_path)
            print('[FLASK SERVER] 임시 파일 삭제 완료')
            
        print(f'[TWEEPY] ❌ 트윗 실패: {e}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print('=' * 50)
    print('🚀 간소화된 Flask Twitter 자동화 서버 시작')
    print('📍 URL: http://localhost:3001')
    print('📋 사용법: 브라우저에서 "트위터 발행하기" 버튼 클릭')
    print('⏹️  종료: Ctrl+C')
    print('=' * 50)
    
    app.run(
        host='127.0.0.1',
        port=3001,
        debug=True,
        use_reloader=False  # 파일 변경 시 자동 재시작 비활성화
    )