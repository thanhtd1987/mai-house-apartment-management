import { useState } from 'react';
import Cropper, { Area as CropArea } from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';

interface CropModalProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
  aspectRatio?: number;
}

export function CropModal({ image, onCropComplete, onClose, aspectRatio = 3 / 4 }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropCompleteHandler = (_: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    if (croppedAreaPixels) {
      setLoading(true);
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedImage);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="relative h-80 w-full">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteHandler}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleCrop}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Đang cắt ảnh...' : 'Cắt ảnh'}
          </button>
          <button onClick={onClose} disabled={loading} className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50">
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
