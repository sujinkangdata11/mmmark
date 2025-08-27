#!/usr/bin/env python3
"""
Flask 트위터 자동화 서버
브라우저에서 요청 -> 이 서버 -> post_tweet_with_image.py 실행
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
        
        image_path = None
        
        # 이미지가 있으면 임시 파일로 저장
        if image_file:
            # 임시 파일 생성 (파일명을 안전하게 변경)
            temp_dir = tempfile.gettempdir()
            # 파일명에서 공백과 특수문자 제거
            safe_filename = image_file.filename.replace(' ', '_').replace('(', '').replace(')', '').replace(':', '_')
            # 한글 제거하고 영문/숫자만 남기기
            import re
            safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', safe_filename)
            image_path = os.path.join(temp_dir, f'twitter_upload_{safe_filename}')
            
            # 이미지 저장
            image_file.save(image_path)
            print(f'[FLASK SERVER] 이미지 저장: {image_path}')
        
        # subprocess로 별도 프로세스에서 Python 스크립트 실행
        print('[FLASK SERVER] Python 스크립트 실행 중...')
        
        # 명령어 구성 (가상환경 활성화 + python3 사용)
        # $ 문자를 escape 처리
        safe_text = text.replace('$', '\\$').replace('"', '\\"')
        
        # 현재 스크립트가 있는 디렉토리로 이동하여 실행
        script_dir = os.path.dirname(os.path.abspath(__file__))
        if image_path:
            cmd = ['bash', '-c', f'cd "{script_dir}" && source twitter_test/bin/activate && python post_tweet_with_image.py "{safe_text}" "{image_path}"']
        else:
            cmd = ['bash', '-c', f'cd "{script_dir}" && source twitter_test/bin/activate && python post_tweet_with_image.py "{safe_text}"']
        
        print(f'[FLASK SERVER] 실행 명령어: {" ".join(cmd)}')
        
        # Python 스크립트 실행
        try:
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            
            print(f'[FLASK SERVER] 실행 완료, 리턴 코드: {result.returncode}')
            print(f'[FLASK SERVER] 표준 출력: {result.stdout}')
            
            if result.stderr:
                print(f'[FLASK SERVER] 표준 에러: {result.stderr}')
            
            # JSON 결과 파싱
            if result.returncode == 0:
                # 마지막 줄이 JSON 결과
                lines = result.stdout.strip().split('\n')
                json_result = lines[-1]
                response_data = json.loads(json_result)
            else:
                response_data = {
                    'success': False,
                    'error': f'스크립트 실행 실패: {result.stderr or result.stdout}'
                }
                
        except subprocess.TimeoutExpired:
            response_data = {
                'success': False,
                'error': '스크립트 실행 시간 초과 (30초)'
            }
        except json.JSONDecodeError as e:
            response_data = {
                'success': False,
                'error': f'JSON 파싱 오류: {e}'
            }
        except Exception as e:
            response_data = {
                'success': False,
                'error': f'예상치 못한 오류: {e}'
            }
        
        # 임시 파일 삭제
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
            print('[FLASK SERVER] 임시 파일 삭제 완료')
        
        print(f'[FLASK SERVER] 최종 결과: {response_data}')
        return jsonify(response_data)
        
    except Exception as e:
        print(f'[FLASK SERVER] 오류: {e}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print('=' * 50)
    print('🚀 Flask Twitter 자동화 서버 시작')
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