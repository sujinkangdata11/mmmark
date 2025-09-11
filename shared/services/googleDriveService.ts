export interface GoogleDriveImage {
  id: string;
  name: string;
  thumbnailLink?: string;
  webViewLink: string;
  downloadUrl?: string;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
}

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private config: GoogleDriveConfig | null = null;

  initialize(config: GoogleDriveConfig) {
    this.config = config;
  }

  async authenticate(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Google Drive API 키가 설정되지 않았습니다.');
    }

    try {
      // Google OAuth2 인증 플로우
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.config.clientId}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&` +
        `access_type=online`;

      // 새 창에서 인증 진행
      const authWindow = window.open(authUrl, 'googleAuth', 'width=500,height=600');
      
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            reject(new Error('인증이 취소되었습니다.'));
          }
          
          // 팝업 창의 URL을 확인하여 토큰 추출
          try {
            const currentUrl = authWindow?.location.href;
            if (currentUrl && currentUrl.includes('access_token=')) {
              const hashParams = new URLSearchParams(currentUrl.split('#')[1]);
              const accessToken = hashParams.get('access_token');
              
              if (accessToken) {
                this.accessToken = accessToken;
                clearInterval(checkClosed);
                authWindow?.close();
                resolve(true);
              }
            }
          } catch (error) {
            // CORS 오류는 무시 (아직 리디렉션되지 않은 상태)
          }
        }, 500);
      });
    } catch (error) {
      console.error('Google Drive 인증 오류:', error);
      return false;
    }
  }

  async getFolders(): Promise<GoogleDriveFolder[]> {
    if (!this.accessToken) {
      throw new Error('Google Drive에 로그인이 필요합니다.');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q=${encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false")}&` +
        `fields=files(id,name)&` +
        `pageSize=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Drive API 오류: ${response.status}`);
      }

      const data = await response.json();
      return data.files.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
      }));
    } catch (error) {
      console.error('Google Drive 폴더 조회 오류:', error);
      throw error;
    }
  }

  async getImages(folderId?: string): Promise<GoogleDriveImage[]> {
    if (!this.accessToken) {
      throw new Error('Google Drive에 로그인이 필요합니다.');
    }

    try {
      let query = "mimeType contains 'image/' and trashed=false";
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q=${encodeURIComponent(query)}&` +
        `fields=files(id,name,thumbnailLink,webViewLink)&` +
        `pageSize=50`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Drive API 오류: ${response.status}`);
      }

      const data = await response.json();
      return data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        thumbnailLink: file.thumbnailLink,
        webViewLink: file.webViewLink,
        downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      }));
    } catch (error) {
      console.error('Google Drive 이미지 조회 오류:', error);
      throw error;
    }
  }

  async downloadImage(image: GoogleDriveImage): Promise<File> {
    if (!this.accessToken) {
      throw new Error('Google Drive에 로그인이 필요합니다.');
    }

    try {
      const response = await fetch(image.downloadUrl!, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.status}`);
      }

      const blob = await response.blob();
      return new File([blob], image.name, { type: blob.type });
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
      throw error;
    }
  }

  async moveImageToFolder(imageId: string, targetFolderId: string | null): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Google Drive에 로그인이 필요합니다.');
    }

    try {
      // 현재 이미지의 부모 폴더 정보 가져오기
      const fileResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${imageId}?fields=parents`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!fileResponse.ok) {
        throw new Error(`파일 정보 조회 실패: ${fileResponse.status}`);
      }

      const fileData = await fileResponse.json();
      const currentParents = fileData.parents || [];

      // 이미지를 새 폴더로 이동 (기존 부모에서 제거하고 새 부모 추가)
      const updateParams = new URLSearchParams();
      
      // 새 부모 폴더 추가 (null이면 루트 폴더)
      if (targetFolderId) {
        updateParams.append('addParents', targetFolderId);
      }
      
      // 기존 부모 폴더 제거
      if (currentParents.length > 0) {
        updateParams.append('removeParents', currentParents.join(','));
      }

      const moveResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${imageId}?${updateParams.toString()}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!moveResponse.ok) {
        throw new Error(`이미지 이동 실패: ${moveResponse.status}`);
      }

      console.log(`이미지 ${imageId}를 ${targetFolderId || 'root'} 폴더로 이동 완료`);
    } catch (error) {
      console.error('이미지 이동 오류:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout() {
    this.accessToken = null;
  }
}

export const googleDriveService = new GoogleDriveService();