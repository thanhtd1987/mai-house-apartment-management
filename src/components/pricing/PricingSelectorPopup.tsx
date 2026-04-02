import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useDataStore } from '../../stores';
import { Room } from '../../types';
import { UtilityPricing } from '../../types/utilityPricing';
import { formatCurrency } from '../../utils';

interface PricingSelectorPopupProps {
  room: Room;
  onClose: () => void;
  onSave: (waterPrice: number, electricityPrice: number) => Promise<void>;
}

export function PricingSelectorPopup({ room, onClose, onSave }: PricingSelectorPopupProps) {
  const { utilityPricing } = useDataStore();
  const [selectedWaterPricingId, setSelectedWaterPricingId] = useState<string>('');
  const [selectedElectricityPricingId, setSelectedElectricityPricingId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Get selected pricing objects
  const selectedWaterPricing = utilityPricing.find(u => u.id === selectedWaterPricingId);
  const selectedElectricityPricing = utilityPricing.find(u => u.id === selectedElectricityPricingId);

  // Initialize with current room pricing
  useEffect(() => {
    if (room.waterPrice) {
      // Find pricing with matching basePrice
      const waterPricing = utilityPricing.find(u => u.type === 'water' && u.basePrice === room.waterPrice);
      if (waterPricing) {
        setSelectedWaterPricingId(waterPricing.id);
      }
    }
    if (room.electricityPrice) {
      const electricityPricing = utilityPricing.find(u => u.type === 'electricity' && u.basePrice === room.electricityPrice);
      if (electricityPricing) {
        setSelectedElectricityPricingId(electricityPricing.id);
      }
    }
  }, [room, utilityPricing]);

  const handleSave = async () => {
    if (!selectedWaterPricing || !selectedElectricityPricing) {
      setError('Vui lòng chọn cả giá điện và giá nước');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(selectedWaterPricing.basePrice, selectedElectricityPricing.basePrice);
      onClose();
    } catch (err) {
      setError('Không thể cập nhật giá. Vui lòng thử lại.');
      console.error('Error updating room pricing:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const waterPricingOptions = utilityPricing.filter(u => u.type === 'water' && u.isActive);
  const electricityPricingOptions = utilityPricing.filter(u => u.type === 'electricity' && u.isActive);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Thiết lập giá điện & nước</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Room info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Phòng: <span className="font-bold">{room.number}</span></p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Giá nước */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá nước <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedWaterPricingId}
            onChange={(e) => setSelectedWaterPricingId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          >
            <option key="water-placeholder" value="">-- Chọn giá nước --</option>
            {waterPricingOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatCurrency(p.basePrice)}/người
              </option>
            ))}
          </select>
          {selectedWaterPricing && (
            <p className="text-xs text-gray-500 mt-1">
              Hiển thị: {formatCurrency(selectedWaterPricing.basePrice)}/người
            </p>
          )}
        </div>

        {/* Giá điện */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá điện <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedElectricityPricingId}
            onChange={(e) => setSelectedElectricityPricingId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          >
            <option key="electricity-placeholder" value="">-- Chọn giá điện --</option>
            {electricityPricingOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatCurrency(p.basePrice)}/kWh
              </option>
            ))}
          </select>
          {selectedElectricityPricing && (
            <p className="text-xs text-gray-500 mt-1">
              Hiển thị: {formatCurrency(selectedElectricityPricing.basePrice)}/kWh
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedWaterPricingId || !selectedElectricityPricingId || isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            ℹ️ Giá này sẽ được gán cho phòng {room.number} và áp dụng cho các hóa đơn tạo sau này.
          </p>
        </div>
      </div>
    </div>
  );
}
