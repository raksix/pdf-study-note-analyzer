import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize client
// Note: In a real production app, ensure this key is secure or proxy via backend.
// For this environment, we use process.env.API_KEY as strictly instructed.
const ai = new GoogleGenAI({ apiKey });

export const analyzePdfContent = async (base64Data: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const modelId = 'gemini-3-flash-preview'; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Bu PDF belgesini detaylı bir şekilde analiz et. 
            
            Görevlerin:
            1. İçeriğin kısa ve öz bir özetini çıkar (Türkçe).
            2. Belgede geçen ana konu başlıklarını listele.
            3. Bir öğrenci için "Neye Çalışmalıyım?" sorusunu cevaplayan detaylı bir çalışma planı oluştur. Her madde için öncelik seviyesi belirle (Yüksek, Orta, Düşük).
            
            Yanıtı sadece geçerli JSON formatında ver.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Belgenin genel özeti."
            },
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Belgedeki ana konu başlıkları."
            },
            studyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING, description: "Çalışılması gereken konu." },
                  action: { type: Type.STRING, description: "Bu konuya nasıl çalışılmalı, nelere dikkat edilmeli?" },
                  priority: { 
                    type: Type.STRING, 
                    enum: ["Yüksek", "Orta", "Düşük"],
                    description: "Çalışma önceliği."
                  }
                },
                required: ["topic", "action", "priority"]
              },
              description: "Öğrenci için çalışma planı."
            }
          },
          required: ["summary", "topics", "studyPlan"]
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("API boş yanıt döndürdü.");
    }

    const data = JSON.parse(textResponse) as AnalysisResult;
    return data;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};