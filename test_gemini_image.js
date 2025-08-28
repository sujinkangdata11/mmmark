import { GoogleGenAI, Modality } from "@google/genai";
import fs from 'fs';
import path from 'path';

// 새로 발급받은 API 키
const API_KEY = "AIzaSyBrm_2vcqvVhvntLueFCmiBU1QC0_Rpltc";

const ai = new GoogleGenAI({ apiKey: API_KEY });

// 이미지 파일을 base64로 변환
const imageToBase64 = (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
};

// 미디엄샷 생성 테스트
const testMediumShot = async () => {
  try {
    console.log('🔄 Gemini API 이미지 생성 테스트 시작...');
    
    const imagePath = '/Users/sujin/Desktop/ai-marketing-automation-hub/4e79340f-5793-4789-8d14-20101f87b197.png';
    const base64Image = imageToBase64(imagePath);
    
    console.log(`✅ 이미지 로드 완료: ${imagePath}`);
    console.log(`📊 Base64 길이: ${base64Image.length} characters`);
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/png',
      },
    };

    const textPart = { 
      text: "Based on the provided character image, recreate the character with the following camera perspective: Medium Shot (MS)."
    };

    console.log('🚀 Gemini API 호출 중...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    console.log('✅ API 응답 받음!');
    
    let imageUrl = null;
    let text = null;
    
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    console.log(`📦 응답 파트 수: ${parts.length}`);

    for (const part of parts) {
      if (part.text) {
        text = (text || '') + part.text;
        console.log(`💬 텍스트 응답: ${part.text.substring(0, 100)}...`);
      } else if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
        console.log(`🖼️ 이미지 생성됨! MIME: ${mimeType}, 크기: ${base64ImageBytes.length} chars`);
      }
    }
    
    if (imageUrl) {
      // 생성된 이미지를 파일로 저장
      const base64Data = imageUrl.split(',')[1];
      const outputPath = '/Users/sujin/Desktop/ai-marketing-automation-hub/generated_medium_shot.png';
      fs.writeFileSync(outputPath, base64Data, 'base64');
      console.log(`💾 생성된 이미지 저장됨: ${outputPath}`);
      console.log('🎉 테스트 성공!');
    } else {
      console.log('❌ 이미지가 생성되지 않았습니다.');
      console.log('📝 응답 텍스트:', text || 'No text available');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.response) {
      console.error('📄 응답 상세:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

// 테스트 실행
testMediumShot();