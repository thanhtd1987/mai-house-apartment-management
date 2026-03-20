import { useState } from 'react';
import { extractIDCardData, extractMeterReading } from '../services';

export function useOCR() {
  const [isScanning, setIsScanning] = useState(false);

  const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const scanIDCard = async (file: File): Promise<{ data: any, image: string } | null> => {
    setIsScanning(true);
    try {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const compressedBase64 = await compressImage(base64, 800, 800, 0.7);

          const data = await extractIDCardData(compressedBase64);
          setIsScanning(false);
          resolve({ data, image: compressedBase64 });
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      setIsScanning(false);
      console.error("Scan ID Error:", error);
      return null;
    }
  };

  const scanMeter = async (file: File): Promise<{ data: any, image: string } | null> => {
    setIsScanning(true);
    try {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const data = await extractMeterReading(base64, file.type);
          setIsScanning(false);
          resolve({ data, image: base64 });
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      setIsScanning(false);
      console.error("Scan Meter Error:", error);
      return null;
    }
  };

  return { isScanning, scanIDCard, scanMeter, compressImage };
}
