import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface IDCardData {
  name?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
}

export interface MeterReadingData {
  reading?: string;
  meterId?: string;
}

export async function extractIDCardData(imageBase64: string): Promise<IDCardData | null> {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [
          { text: "Hãy trích xuất thông tin từ ảnh CCCD/Passport này. Trả về JSON gồm: name (họ tên), idNumber (số CCCD), phone (nếu có), email (nếu có). Chỉ trả về JSON." },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }
        ]
      }]
    });

    const text = result.text;
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
}

export async function extractMeterReading(imageBase64: string, mimeType: string): Promise<MeterReadingData | null> {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [
          { text: "Hãy đọc số điện và mã số đồng hồ (ID No.) từ ảnh này. Trả về JSON gồm: reading (số điện), meterId (mã số đồng hồ). Chỉ trả về JSON." },
          { inlineData: { mimeType, data: imageBase64.split(',')[1] } }
        ]
      }]
    });

    const text = result.text;
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
}

export async function generateContent(prompt: string, imageBase64?: string, mimeType?: string) {
  try {
    const parts: any[] = [{ text: prompt }];

    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: { mimeType, data: imageBase64.split(',')[1] }
      });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts }]
    });

    return result.text;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}
