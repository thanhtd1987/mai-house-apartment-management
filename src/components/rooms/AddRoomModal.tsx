import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Home, Settings, User, Calendar, DollarSign, Check, Edit2 } from 'lucide-react';
import { Room, Facility } from '../../types';
import { cn, formatCurrency } from '../../utils';
import { useDataStore } from '../../stores';
import { PricingSelectorPopup } from '../pricing/PricingSelectorPopup';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomData: Partial<Room>) => Promise<void>;
  room?: Partial<Room>;
  facilities: Facility[];
}

type RoomStep = 'basic' | 'details' | 'facilities' | 'confirm';

export function AddRoomModal({ isOpen, onClose, onSave, room, facilities }: AddRoomModalProps) {
  const { utilityPricing } = useDataStore();
  const [step, setStep] = useState<RoomStep>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPricingSelector, setShowPricingSelector] = useState(false);
  const [selectedWaterPricingId, setSelectedWaterPricingId] = useState<string>('');
  const [selectedElectricityPricingId, setSelectedElectricityPricingId] = useState<string>('');
  const [formData, setFormData] = useState({
    number: '',
    meterId: '',
    type: 'single' as 'single' | 'double',
    status: 'available' as 'available' | 'occupied' | 'maintenance',
    price: 0,
    lastElectricityMeter: 0,
    paymentStatus: 'paid' as 'paid' | 'unpaid' | 'debt',
    waterPrice: 0,
    electricityPrice: 0,
    facilities: [] as string[]
  });

  // Update formData when room prop changes
  useEffect(() => {
    if (room) {
      setFormData({
        number: room.number || '',
        meterId: room.meterId || '',
        type: room.type || 'single',
        status: room.status || 'available',
        price: room.price || 0,
        lastElectricityMeter: room.lastElectricityMeter || 0,
        paymentStatus: room.paymentStatus || 'paid',
        waterPrice: room.waterPrice || 0,
        electricityPrice: room.electricityPrice || 0,
        facilities: room.facilities || []
      });
    } else {
      // Reset to default values when adding new room
      setFormData({
        number: '',
        meterId: '',
        type: 'single',
        status: 'available',
        price: 0,
        lastElectricityMeter: 0,
        paymentStatus: 'paid',
        waterPrice: 0,
        electricityPrice: 0,
        facilities: []
      });
    }
    // Reset step to basic when modal opens with different room
    setStep('basic');
  }, [room, isOpen]);

  // Auto-select first active pricing when modal opens
  useEffect(() => {
    if (isOpen && utilityPricing.length > 0) {
      // Only auto-select if editing room with no pricing, or creating new room
      const isNewRoom = !room?.id;
      const hasNoPricing = !room?.waterPrice && !room?.electricityPrice;

      if (isNewRoom || hasNoPricing) {
        const firstWaterPricing = utilityPricing.find(u => u.type === 'water' && u.isActive);
        const firstElectricityPricing = utilityPricing.find(u => u.type === 'electricity' && u.isActive);

        if (firstWaterPricing && !selectedWaterPricingId) {
          setSelectedWaterPricingId(firstWaterPricing.id);
          setFormData(prev => ({ ...prev, waterPrice: firstWaterPricing.basePrice }));
        }

        if (firstElectricityPricing && !selectedElectricityPricingId) {
          setSelectedElectricityPricingId(firstElectricityPricing.id);
          setFormData(prev => ({ ...prev, electricityPrice: firstElectricityPricing.basePrice }));
        }
      } else if (room?.waterPrice || room?.electricityPrice) {
        // Find matching pricing IDs for existing room prices
        if (room.waterPrice) {
          const waterPricing = utilityPricing.find(u => u.type === 'water' && u.basePrice === room.waterPrice);
          if (waterPricing) setSelectedWaterPricingId(waterPricing.id);
        }
        if (room.electricityPrice) {
          const electricityPricing = utilityPricing.find(u => u.type === 'electricity' && u.basePrice === room.electricityPrice);
          if (electricityPricing) setSelectedElectricityPricingId(electricityPricing.id);
        }
      }
    }
  }, [isOpen, utilityPricing, room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePricing = async (waterPrice: number, electricityPrice: number) => {
    // Use functional update to avoid closure issues
    setFormData(prev => ({
      ...prev,
      waterPrice,
      electricityPrice
    }));

    // Update selected IDs
    const waterPricing = utilityPricing.find(u => u.basePrice === waterPrice && u.type === 'water');
    const electricityPricing = utilityPricing.find(u => u.basePrice === electricityPrice && u.type === 'electricity');

    if (waterPricing) setSelectedWaterPricingId(waterPricing.id);
    if (electricityPricing) setSelectedElectricityPricingId(electricityPricing.id);

    setShowPricingSelector(false);
  };

  const isEditMode = !!room?.id;

  if (!isOpen) return null;

  const steps = [
    { key: 'basic', label: 'Cơ bản', icon: Home },
    { key: 'details', label: 'Chi tiết', icon: Settings },
    { key: 'facilities', label: 'Tiện nghi', icon: User },
    { key: 'confirm', label: 'Xác nhận', icon: Check }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
              </h2>
              <p className="text-blue-100 text-sm">
                {isEditMode ? 'Cập nhật thông tin phòng' : 'Tạo phòng mới vào hệ thống'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, idx) => (
              <button
                key={s.key}
                onClick={() => setStep(s.key as RoomStep)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer text-sm",
                  step === s.key
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <s.icon size={16} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <form id="room-form" onSubmit={handleSubmit} className="space-y-6">
            {step === 'basic' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Home size={20} className="text-blue-600" />
                  Thông tin cơ bản
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mã đồng hồ điện</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.meterId}
                        onChange={(e) => setFormData({ ...formData, meterId: e.target.value })}
                        placeholder="VD: DH-001"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Số phòng <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="VD: 101, 201"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Loại phòng</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'single' })}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                          formData.type === 'single'
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 hover:border-blue-300 bg-white"
                        )}
                      >
                        <p className="font-bold">Phòng đơn</p>
                        <p className="text-xs text-slate-500">1-2 người</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'double' })}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                          formData.type === 'double'
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-slate-200 hover:border-purple-300 bg-white"
                        )}
                      >
                        <p className="font-bold">Phòng đôi</p>
                        <p className="text-xs text-slate-500">3-4 người</p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'available', label: 'Trống', color: 'bg-slate-100 text-slate-700' },
                        { value: 'occupied', label: 'Đang ở', color: 'bg-green-100 text-green-700' },
                        { value: 'maintenance', label: 'Bảo trì', color: 'bg-amber-100 text-amber-700' }
                      ].map(status => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: status.value as any })}
                          className={cn(
                            "px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                            formData.status === status.value
                              ? status.color
                              : "bg-white border-2 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Tiếp theo
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Settings size={20} className="text-purple-600" />
                  Chi tiết thông tin
                </h3>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-200">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <DollarSign size={16} className="text-blue-600" />
                      Giá thuê (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="VD: 5000000"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border border-cyan-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                          💧 Giá nước
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPricingSelector(true)}
                          className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1"
                        >
                          <Edit2 size={12} />
                          Chỉnh sửa
                        </button>
                      </div>
                      {selectedWaterPricingId ? (() => {
                        const pricing = utilityPricing.find(u => u.id === selectedWaterPricingId);
                        return pricing ? (
                          <div>
                            <p className="text-lg font-bold text-cyan-700">{formatCurrency(pricing.basePrice)}/người</p>
                            <p className="text-xs text-slate-500">{pricing.name}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Chưa chọn</p>
                        );
                      })() : (
                        <p className="text-sm text-slate-400">Chưa chọn</p>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                          ⚡ Giá điện
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPricingSelector(true)}
                          className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
                        >
                          <Edit2 size={12} />
                          Chỉnh sửa
                        </button>
                      </div>
                      {selectedElectricityPricingId ? (() => {
                        const pricing = utilityPricing.find(u => u.id === selectedElectricityPricingId);
                        return pricing ? (
                          <div>
                            <p className="text-lg font-bold text-amber-700">{formatCurrency(pricing.basePrice)}/kWh</p>
                            <p className="text-xs text-slate-500">{pricing.name}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">Chưa chọn</p>
                        );
                      })() : (
                        <p className="text-sm text-slate-400">Chưa chọn</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <User size={16} className="text-purple-600" />
                        Số điện hiện tại (kWh)
                      </label>
                      <input
                        type="number"
                        value={formData.lastElectricityMeter}
                        onChange={(e) => setFormData({ ...formData, lastElectricityMeter: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg font-bold"
                      />
                    </div>

                    <div className={cn(
                      "rounded-2xl p-5 border transition-all",
                      formData.paymentStatus === 'paid'
                        ? "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200"
                        : formData.paymentStatus === 'unpaid'
                          ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200"
                          : "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
                    )}>
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Calendar size={16} className="text-slate-600" />
                        Thanh toán
                      </label>
                      <select
                        value={formData.paymentStatus}
                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-semibold"
                      >
                        <option value="paid">Đã thanh toán</option>
                        <option value="unpaid">Chưa thanh toán</option>
                        <option value="debt">Nợ cũ</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('basic')}
                    className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('facilities')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Tiếp theo
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'facilities' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <User size={20} className="text-pink-600" />
                  Cơ sở vật chất
                </h3>

                <div className="bg-slate-50 rounded-2xl p-5">
                  {facilities.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      Chưa có cơ sở vật chất nào. Vui lòng thêm cơ sở vật chất trước.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {facilities.map(facility => (
                        <label
                          key={facility.id}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            formData.facilities?.includes(facility.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-blue-300 bg-white"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={formData.facilities?.includes(facility.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  facilities: [...(formData.facilities || []), facility.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  facilities: formData.facilities?.filter(id => id !== facility.id) || []
                                });
                              }
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{facility.name}</p>
                            <p className="text-xs text-slate-500">{facility.description || 'Không có mô tả'}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('confirm')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Tiếp theo
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Check size={20} className="text-green-600" />
                  Xác nhận thông tin
                </h3>

                <div className="bg-gradient-to-br from-green-50 to-blue-50/30 rounded-2xl p-6 border border-green-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Số phòng</p>
                      <p className="text-lg font-bold text-slate-800">{formData.number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Loại</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formData.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Giá thuê</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(formData.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Trạng thái</p>
                      <p className="text-sm font-semibold text-slate-700 capitalize">{formData.status}</p>
                    </div>
                  </div>

                  {/* Pricing info */}
                  <div className="border-t border-green-200 pt-4">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-3">Giá điện & nước</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Giá nước</p>
                        <p className="text-base font-bold text-cyan-700">
                          {formData.waterPrice ? formatCurrency(formData.waterPrice) + '/người' : 'Chưa thiết lập'}
                        </p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Giá điện</p>
                        <p className="text-base font-bold text-amber-700">
                          {formData.electricityPrice ? formatCurrency(formData.electricityPrice) + '/kWh' : 'Chưa thiết lập'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-3">
                    Cơ sở vật chất đã chọn ({formData.facilities?.length || 0})
                  </p>
                  {formData.facilities && formData.facilities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.facilities.map(fid => {
                        const fac = facilities.find(f => f.id === fid);
                        return fac ? (
                          <span
                            key={fid}
                            className="px-3 py-1 bg-white border border-purple-200 rounded-full text-xs font-semibold text-purple-700"
                          >
                            {fac.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Chưa chọn cơ sở vật chất nào</p>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('facilities')}
                    className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Xác nhận & Lưu'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>

        {/* Pricing Selector Popup */}
        {showPricingSelector && (
          <PricingSelectorPopup
            room={{
              id: 'temp',
              number: formData.number || 'New Room',
              type: formData.type,
              status: formData.status,
              price: formData.price,
              lastElectricityMeter: formData.lastElectricityMeter,
              paymentStatus: formData.paymentStatus,
              waterPrice: formData.waterPrice,
              electricityPrice: formData.electricityPrice
            } as Room}
            onClose={() => setShowPricingSelector(false)}
            onSave={handleSavePricing}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
