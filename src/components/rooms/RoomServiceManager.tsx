import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExtraServiceConfig, CATEGORY_CONFIG } from '../../types/extraService';
import { useRoomServiceUsages, getServiceDetails } from '../../hooks/useRoomServiceUsages';
import { getCurrentMonth, formatMonth, ServiceUsage } from '../../types/roomServiceUsage';
import { cn } from '../../utils';
import { useToastStore } from '../../stores';

interface RoomServiceManagerProps {
  roomId: string;
  extraServices: ExtraServiceConfig[];
  month?: string;
}

interface ServiceWithDetail {
  usage: ServiceUsage;
  config: ExtraServiceConfig;
  totalPrice: number;
}

export function RoomServiceManager({ roomId, extraServices, month }: RoomServiceManagerProps) {
  const { addToast } = useToastStore();
  const {
    usage,
    services,
    loading,
    error,
    addService,
    updateService,
    removeService,
    markServiceAsPaid
  } = useRoomServiceUsages({ roomId, month });

  const [serviceDetails, setServiceDetails] = useState<ServiceWithDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isPaying, setIsPaying] = useState<string | null>(null); // createdAt being paid
  const [isAddingService, setIsAddingService] = useState(false); // Loading when adding service
  const [isUpdatingService, setIsUpdatingService] = useState(false); // Loading when updating service

  // Load service details khi services thay đổi
  useEffect(() => {
    const loadDetails = async () => {
      if (services.length === 0) {
        setServiceDetails([]);
        return;
      }

      setLoadingDetails(true);
      try {
        const details = await getServiceDetails(services);
        const withPrices = details.map(detail => ({
          usage: detail.usage,
          config: detail.config,
          totalPrice: detail.config.price * detail.usage.quantity
        }));
        setServiceDetails(withPrices);
      } catch (err) {
        console.error('Error loading service details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usage?.id, usage?.updatedAt]); // Trigger khi usage document thay đổi, không phải services array

  const handleAddService = async () => {
    if (!selectedServiceId) return;

    setIsAddingService(true);
    try {
      await addService(selectedServiceId, quantity, notes);
      // Reset form
      setSelectedServiceId('');
      setQuantity(1);
      setNotes('');
      setIsAdding(false);
      addToast('Đã thêm dịch vụ', 'success');
    } catch (err) {
      console.error('Error adding service:', err);
      addToast('Lỗi khi thêm dịch vụ', 'error');
    } finally {
      setIsAddingService(false);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    setIsUpdatingService(true);
    try {
      // Update by createdAt (unique identifier) instead of serviceId
      await updateService(editingService, quantity, notes);
      setEditingService(null);
      setSelectedServiceId('');
      setQuantity(1);
      setNotes('');
      addToast('Đã cập nhật dịch vụ', 'success');
    } catch (err) {
      console.error('Error updating service:', err);
      addToast('Lỗi khi cập nhật dịch vụ', 'error');
    } finally {
      setIsUpdatingService(false);
    }
  };

  const handleRemoveService = async (createdAt: string) => {
    try {
      // Remove by createdAt (unique identifier) instead of serviceId
      await removeService(createdAt);
      addToast('Đã xóa dịch vụ', 'success');
    } catch (err) {
      console.error('Error removing service:', err);
      addToast('Lỗi khi xóa dịch vụ', 'error');
    }
  };

  const startEdit = (service: ServiceWithDetail) => {
    // Use createdAt as unique identifier for editing
    setEditingService(service.usage.createdAt);
    setSelectedServiceId(service.usage.serviceId);
    setQuantity(service.usage.quantity);
    setNotes(service.usage.notes || '');
    setIsAdding(false);
  };

  const handlePayment = async (createdAt: string) => {
    const service = serviceDetails.find(s => s.usage.createdAt === createdAt);
    if (!service) return;

    // Simple confirm dialog - có thể enhance thành Modal sau
    const paymentMethod = confirm('Chọn phương thức thanh toán:\nOK = Tiền mặt\nCancel = Chuyển khoản') ? 'cash' as const : 'transfer' as const;

    setIsPaying(createdAt);
    try {
      await markServiceAsPaid(createdAt, paymentMethod, service.totalPrice);
      addToast(`Đã xác nhận thanh toán ${service.totalPrice.toLocaleString('vi-VN')}đ (${paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'})`, 'success');
    } catch (err) {
      console.error('Error marking as paid:', err);
      addToast('Lỗi khi cập nhật trạng thái thanh toán', 'error');
    } finally {
      setIsPaying(null);
    }
  };

  const totalAmount = serviceDetails.reduce((sum, s) => sum + s.totalPrice, 0);
  const unpaidTotal = serviceDetails
    .filter(s => s.usage.status !== 'paid')
    .reduce((sum, s) => sum + s.totalPrice, 0);

  const targetMonth = month || getCurrentMonth();

  if (loading && !serviceDetails.length) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-purple-600" />
            Dịch vụ thêm - {formatMonth(targetMonth)}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Các dịch vụ phát sinh trong tháng chưa thanh toán
          </p>
        </div>
        {!isAdding && !editingService && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-200"
          >
            <Plus className="h-4 w-4" />
            Thêm dịch vụ
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(isAdding || editingService) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-4 space-y-3"
          >
            <h4 className="font-semibold text-purple-900">
              {editingService ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
            </h4>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dịch vụ
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- Chọn dịch vụ --</option>
                {extraServices
                  .filter(s => s.isActive)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.price.toLocaleString('vi-VN')}đ/{service.category === 'parking' ? 'tháng' : 'lần'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Số lần
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ghi chú (tùy chọn)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Gửi xe cả tháng"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={isAdding ? handleAddService : handleUpdateService}
                disabled={!selectedServiceId || quantity < 1 || isAddingService || isUpdatingService}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(isAddingService || isUpdatingService) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : editingService ? (
                  'Cập nhật'
                ) : (
                  'Thêm'
                )}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingService(null);
                  setSelectedServiceId('');
                  setQuantity(1);
                  setNotes('');
                }}
                disabled={isAddingService || isUpdatingService}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services List */}
      {loadingDetails ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : serviceDetails.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
          <Receipt className="h-12 w-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-500">Chưa có dịch vụ nào trong tháng này</p>
        </div>
      ) : (
        <div className="space-y-2">
          {serviceDetails.map((item) => {
            const categoryInfo = CATEGORY_CONFIG[item.config.category];
            const isPaid = item.usage.status === 'paid';
            const entryDate = new Date(item.usage.createdAt);

            return (
              <div
                key={item.usage.createdAt} // ← Unique key per entry
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  categoryInfo.borderBorderColor,
                  isPaid && "opacity-75"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xl",
                    categoryInfo.bgColor
                  )}>
                    {item.config.icon || categoryInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        categoryInfo.textColor
                      )}>
                        {item.config.name}
                      </h4>
                      <span className="text-[10px] text-gray-400">
                        {entryDate.toLocaleDateString('vi-VN')} {entryDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                      </span>
                      {isPaid && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                          Đã thanh toán
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.usage.quantity} × {item.config.price.toLocaleString('vi-VN')}đ
                      {item.usage.notes && ` • ${item.usage.notes}`}
                    </p>
                    {isPaid && item.usage.paidAt && (
                      <p className="text-[10px] text-green-600 font-medium">
                        {item.usage.paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'} • {new Date(item.usage.paidAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-bold text-lg",
                    categoryInfo.textColor,
                    isPaid && "line-through opacity-50"
                  )}>
                    {item.totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <div className="flex gap-1">
                    {!isPaid && (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          disabled={isPaying === item.usage.createdAt}
                        >
                          <Edit2 className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handlePayment(item.usage.createdAt)}
                          disabled={isPaying === item.usage.createdAt}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {isPaying === item.usage.createdAt ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <span>💵</span>
                              Thanh toán
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveService(item.usage.createdAt)}
                          className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                          disabled={isPaying === item.usage.createdAt}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </button>
                      </>
                    )}
                    {isPaid && (
                      <span className="text-[10px] text-green-600 font-semibold px-2 py-1 bg-green-50 rounded-lg">
                        ✓ Paid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="mt-4 space-y-2">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Tổng cộng tất cả:</span>
                <span className="text-2xl font-bold">
                  {totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
            {unpaidTotal < totalAmount && (
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Cần thanh toán:</span>
                  <span className="text-2xl font-bold">
                    {unpaidTotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
