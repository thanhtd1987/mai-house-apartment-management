import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Loader2, ChevronDown, ChevronUp, Info, Sparkles, Plus, Minus, Trash2 } from 'lucide-react';
import { Room, ExtraService } from '../../types';
import { ExtraServiceConfig } from '../../types/extraService';
import { Invoice } from '../../types/invoice';
import { cn, formatCurrency, calculateElectricity, filterRoomsWithoutInvoice } from '../../utils';
import { useOCR, useRoomServiceUsages } from '../../hooks';
import { AddInvoiceServiceModal } from './AddInvoiceServiceModal';
import { getCurrentMonth } from '../../types/roomServiceUsage';
import { useDataStore } from '../../stores';

// Constants
const WATER_FALLBACK_PRICE = 60000;
const EDITED_BADGE_TEXT = 'Đã chỉnh';
const ACTUAL_GUESTS_LABEL = 'Thực tế:';

interface InvoiceService {
  name: string;
  price: number;
  quantity: number;
  serviceId?: string;
  isPaid?: boolean;
}

interface QuickInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string; // NEW: Pre-selected room ID for room page
  guestCount?: number;
  onCreateInvoice: (data: InvoiceData) => Promise<void>;
  utilityPricing?: UtilityPricingConfig;
  invoices?: Invoice[]; // NEW: All invoices for filtering
  availableServices?: ExtraServiceConfig[];
}

export interface UtilityPricingConfig {
  water: {
    pricePerPerson: number;
  };
  electricity: {
    pricePerKwh: number;
  };
}

export interface InvoiceData {
  roomId: string;
  meterId?: string;
  month: number;
  year: number;
  electricityOld: number;
  electricityNew: number;
  waterPrice: number;
  electricityPrice: number;
  extraServices: ExtraService[];
  totalPrice: number;
}

export function QuickInvoiceModal({
  isOpen,
  onClose,
  roomId, // NEW: Pre-selected room ID
  guestCount = 0,
  onCreateInvoice,
  utilityPricing,
  invoices = [], // NEW: All invoices for filtering
}: QuickInvoiceModalProps) {
  const { rooms, extraServices } = useDataStore(); // Get rooms and extraServices from store
  
  const [electricityNew, setElectricityNew] = useState<number>(0);
  const [meterImage, setMeterImage] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<InvoiceService[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [billedGuestCount, setBilledGuestCount] = useState<number>(guestCount);
  const hasUserEditedBilledCount = useRef(false);

  // Load monthly service usages - get services from hook for real-time updates
  const { services: monthlyServiceUsages } = useRoomServiceUsages({
    roomId: selectedRoom?.id || '',
    month: selectedRoom ? getCurrentMonth() : undefined
  });

  const { isScanning: isProcessingOCR, scanMeter } = useOCR();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Determine mode
  const isRoomMode = !!roomId; // Mode 2: Create for specific room (from room/guest pages)
  const isDashboardMode = !roomId; // Mode 1: Create new (from invoices page)

  // Load services when selectedRoom changes or modal opens
  useEffect(() => {
    if (!selectedRoom || !isOpen) {
      setSelectedServices([]);
      return;
    }

    setElectricityNew(selectedRoom.lastElectricityMeter);
    setMeterImage(null);

    // Auto-load services from monthly usage (including payment status)
    if (monthlyServiceUsages.length > 0 && extraServices.length > 0) {
      const services: InvoiceService[] = monthlyServiceUsages.map(usage => {
        const serviceConfig = extraServices.find(s => s.id === usage.serviceId);
        return {
          name: serviceConfig?.name || 'Dịch vụ',
          price: serviceConfig?.price || 0,
          quantity: usage.quantity,
          serviceId: usage.serviceId,
          isPaid: usage.status === 'paid'
        };
      });
      setSelectedServices(services);
    } else {
      setSelectedServices([]);
    }
  // Only re-run when selectedRoom or isOpen changes, NOT when service data changes
  // This prevents infinite loops while still allowing manual service updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom, isOpen]);

  // Pre-select room when roomId prop is provided (Mode 2)
  useEffect(() => {
    if (roomId && isOpen) {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setSelectedRoom(room);
      }
    } else if (!roomId && isOpen) {
      // Mode 1: Clear selection when opening from dashboard
      setSelectedRoom(null);
    }
  }, [roomId, isOpen, rooms]);

  // Sync billed guest count when guestCount changes (only if user hasn't manually edited)
  useEffect(() => {
    if (!hasUserEditedBilledCount.current) {
      setBilledGuestCount(prev => prev !== guestCount ? guestCount : prev);
    }
  }, [guestCount]);

  if (!isOpen) return null;

  const electricityOld = selectedRoom?.lastElectricityMeter || 0;
  const electricityUsed = Math.max(0, electricityNew - electricityOld);

  // Calculate water price - use billed guest count (editable)
  const waterPrice = useMemo(() => {
    if (!utilityPricing || billedGuestCount === 0) return WATER_FALLBACK_PRICE;
    return billedGuestCount * utilityPricing.water.pricePerPerson;
  }, [utilityPricing, billedGuestCount]);

  // Calculate electricity price
  const electricityPrice = useMemo(() => {
    return utilityPricing
      ? electricityUsed * utilityPricing.electricity.pricePerKwh
      : calculateElectricity(electricityUsed);
  }, [utilityPricing, electricityUsed]);
  
  // Calculate services total - ONLY UNPAID services
  const servicesTotal = selectedServices
    .filter((s: InvoiceService) => !s.isPaid)
    .reduce((acc: number, service: InvoiceService) => acc + (service.price * service.quantity), 0);
  const totalPrice = (selectedRoom?.price || 0) + electricityPrice + waterPrice + servicesTotal;

  const handleOCRMeter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await scanMeter(file);
    if (result?.data?.reading) {
      setElectricityNew(Number(result.data.reading));
    }
    if (result?.image) {
      setMeterImage(result.image);
    }
  };

  const handleRoomChange = (room: Room | null) => {
    setSelectedRoom(room);
    if (room) {
      setElectricityNew(room.lastElectricityMeter);
      setMeterImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRoom) return;

    setIsSubmitting(true);
    try {
      // Convert selected services to ExtraService format
      const extraServices: ExtraService[] = selectedServices.map((s: InvoiceService) => ({
        serviceId: s.serviceId || '',
        serviceName: s.name,
        unitPrice: s.price,
        quantity: s.quantity,
        totalPrice: s.price * s.quantity
      }));

      await onCreateInvoice({
        roomId: selectedRoom.id,
        meterId: selectedRoom.meterId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        electricityOld,
        electricityNew,
        waterPrice,
        electricityPrice,
        extraServices,
        totalPrice
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceAdded = (newService: InvoiceService) => {
    setSelectedServices(prev => [...prev, newService]);
  };

  const updateServiceQuantity = (index: number, delta: number) => {
    setSelectedServices(prev => {
      const updated = [...prev];
      const newQuantity = Math.max(1, updated[index].quantity + delta);
      updated[index] = { ...updated[index], quantity: newQuantity };
      return updated;
    });
  };

  const removeService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  // Guest count handlers with memoization
  const decrementGuestCount = useCallback(() => {
    hasUserEditedBilledCount.current = true;
    setBilledGuestCount(prev => Math.max(1, prev - 1));
  }, []);

  const incrementGuestCount = useCallback(() => {
    hasUserEditedBilledCount.current = true;
    setBilledGuestCount(prev => prev + 1);
  }, []);

  // Filter available rooms for Mode 1 (Dashboard)
  // Only show rooms that DON'T have an invoice for current month
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const availableRooms = useMemo(() => {
    if (!isDashboardMode) return [];
    return filterRoomsWithoutInvoice(rooms, invoices, currentMonth, currentYear);
  }, [isDashboardMode, rooms, invoices, currentMonth, currentYear]);

  // Memoize comparison to avoid repeated evaluations
  const isBilledCountModified = billedGuestCount !== guestCount;

  // Edited badge component
  const EditedBadge = useMemo(() => (
    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 font-semibold rounded-full flex items-center gap-1">
      <Info size={8} />
      {EDITED_BADGE_TEXT}
    </span>
  ), []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            className="relative w-[95vw] sm:w-[calc(100%-2rem)] lg:w-[1024px] max-w-[1024px] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] rounded-t-3xl overflow-hidden flex flex-col"
          >
            {/* Main Card with Gradient Border */}
            <div className="relative bg-white flex flex-col h-full overflow-hidden">
              {/* Animated Top Gradient */}
              <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Header */}
              <div className="p-3 sm:p-8 pb-3 sm:pb-6 border-b border-gray-100 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                      <Sparkles className="text-white" size={20} sm:size={28} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-black text-gray-900">
                        {isRoomMode ? 'Tạo hóa đơn cho phòng' : 'Tạo hóa đơn nhanh'}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {selectedRoom && (
                          <span>
                            Phòng <span className="font-bold text-emerald-600">{selectedRoom.number}</span>
                            {guestCount > 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                {guestCount} khách
                              </span>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
                  >
                    <X size={20} sm:size={24} className="text-gray-400" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 overflow-y-auto flex-1 min-h-0">
                {/* Left Column - Input */}
                <div className="space-y-6">
                  {/* Room Selection - Only in Dashboard Mode */}
                  {isDashboardMode && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0 }}
                      className="space-y-3"
                    >
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider">
                        <Info size={16} className="text-emerald-500" />
                        Chọn phòng
                      </label>
                      <select
                        value={selectedRoom?.id || ''}
                        onChange={(e) => {
                          const room = rooms.find(r => r.id === e.target.value) || null;
                          handleRoomChange(room);
                        }}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                      >
                        <option value="">-- Chọn phòng --</option>
                        {availableRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            Phòng {room.number}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {/* Electricity Input */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
                      <Info size={14} className="text-emerald-500 sm:size={16}" />
                      Chỉ số điện mới
                    </label>
                    <div className="flex gap-2 sm:gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={electricityNew}
                          onChange={(e) => setElectricityNew(Number(e.target.value))}
                          disabled={!selectedRoom}
                          className={cn(
                            "w-full p-3 sm:p-4 pr-12 sm:pr-16 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-bold text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all",
                            !selectedRoom && "opacity-50 cursor-not-allowed"
                          )}
                          placeholder="0"
                        />
                        <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-gray-400">kWh</span>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shrink-0",
                          isProcessingOCR || !selectedRoom ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-lg"
                        )}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleOCRMeter}
                          disabled={isProcessingOCR || !selectedRoom}
                          className="hidden"
                          accept="image/*"
                        />
                        {isProcessingOCR ? <Loader2 size={20} className="animate-spin sm:size={24}" /> : <Camera size={20} className="sm:size={24}" />}
                      </motion.button>
                    </div>
                    {meterImage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-xl sm:rounded-2xl overflow-hidden border-2 border-emerald-200"
                      >
                        <img src={meterImage} alt="Meter" className="w-full h-24 sm:h-32 object-cover" />
                      </motion.div>
                    )}
                    {selectedRoom && (
                      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                        <span className="text-gray-400">Cũ: <strong className="text-gray-700">{electricityOld}</strong> kWh</span>
                        <span className="text-gray-300">|</span>
                        <span className={cn(
                          "font-bold",
                          electricityUsed > 0 ? "text-emerald-600" : "text-gray-400"
                        )}>
                          Đã dùng: <strong>{electricityUsed}</strong> kWh
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* Water Price - Editable Guest Count */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
                      <Info size={14} className="text-emerald-500 sm:size={16}" />
                      Tiền nước
                    </label>
                    <div className={cn(
                      "bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 transition-all",
                      isBilledCountModified
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm sm:text-base">Số khách tính tiền</span>
                          {isBilledCountModified && EditedBadge}
                        </div>
                        <p className="font-black text-base sm:text-lg text-emerald-600 tabular-nums">
                          {formatCurrency(waterPrice)}
                        </p>
                      </div>

                      {isBilledCountModified && (
                        <div className="text-xs text-amber-600 flex items-center gap-1 mb-2">
                          <Info size={10} />
                          {ACTUAL_GUESTS_LABEL} {guestCount} khách
                        </div>
                      )}

                      {/* Inline Stepper */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <motion.button
                          whileHover={{ scale: billedGuestCount > 1 ? 1.05 : 1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={decrementGuestCount}
                          disabled={billedGuestCount <= 1 || !selectedRoom}
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all",
                            billedGuestCount <= 1 || !selectedRoom
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          )}
                          aria-label="Giảm số khách tính tiền nước"
                        >
                          <Minus size={16} className="sm:size={18}" />
                        </motion.button>

                        <div className="flex-1 text-center">
                          <span className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
                            {billedGuestCount}
                          </span>
                          <span className="text-xs text-gray-400 block">khách</span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={incrementGuestCount}
                          disabled={!selectedRoom}
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all shadow-lg",
                            !selectedRoom
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30"
                          )}
                          aria-label="Tăng số khách tính tiền nước"
                        >
                          <Plus size={16} className="sm:size={18}" />
                        </motion.button>
                      </div>

                      {/* Helper text */}
                      <p className="text-xs text-gray-400 mt-2">
                        {isBilledCountModified
                          ? `${ACTUAL_GUESTS_LABEL} ${guestCount} khách → Tính cho ${billedGuestCount} khách`
                          : `Tính ${formatCurrency(utilityPricing?.water.pricePerPerson || WATER_FALLBACK_PRICE)}/khách`
                        }
                      </p>
                    </div>
                  </motion.div>

                  {/* Extra Services - Simple List */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">
                        Dịch vụ thêm
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAddServiceModalOpen(true)}
                        disabled={!selectedRoom}
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30",
                          !selectedRoom && "opacity-50 cursor-not-allowed"
                        )}
                        aria-label="Thêm dịch vụ"
                      >
                        <Plus size={14} sm:size={18} />
                      </motion.button>
                    </div>

                    {/* Services List - Only name and quantity */}
                    <div className="space-y-2">
                      {selectedServices.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-500">Chưa có dịch vụ nào</p>
                        </div>
                      ) : (
                        <AnimatePresence>
                          {selectedServices.map((service, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className={cn(
                                "flex items-center gap-2 p-3 bg-white border-2 rounded-xl transition-all",
                                service.isPaid ? "border-green-200 opacity-75" : "border-emerald-100"
                              )}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "font-bold text-sm",
                                    service.isPaid ? "text-gray-500 line-through" : "text-gray-900"
                                  )}>
                                    {service.name}
                                  </p>
                                  {service.isPaid && (
                                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-full">
                                      Đã chi trả
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400">{service.quantity} lần</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <motion.button
                                  whileHover={{ scale: service.isPaid ? 1 : 1.1 }}
                                  whileTap={{ scale: service.isPaid ? 1 : 0.9 }}
                                  onClick={() => updateServiceQuantity(index, -1)}
                                  disabled={service.isPaid || !selectedRoom}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    service.isPaid || !selectedRoom
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  )}
                                >
                                  <Minus size={14} />
                                </motion.button>
                                <span className={cn(
                                  "w-8 text-center font-bold",
                                  service.isPaid ? "text-gray-400" : "text-emerald-600"
                                )}>
                                  {service.quantity}
                                </span>
                                <motion.button
                                  whileHover={{ scale: service.isPaid ? 1 : 1.1 }}
                                  whileTap={{ scale: service.isPaid ? 1 : 0.9 }}
                                  onClick={() => updateServiceQuantity(index, 1)}
                                  disabled={service.isPaid || !selectedRoom}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    service.isPaid || !selectedRoom
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                                  )}
                                >
                                  <Plus size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: service.isPaid ? 1 : 1.1 }}
                                  whileTap={{ scale: service.isPaid ? 1 : 0.9 }}
                                  onClick={() => removeService(index)}
                                  disabled={service.isPaid || !selectedRoom}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center ml-2",
                                    service.isPaid || !selectedRoom
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-red-100 text-red-600 hover:bg-red-200"
                                  )}
                                >
                                  <Trash2 size={14} />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Right Column - Cost Breakdown */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-[2rem] p-6 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                      Chi tiết hóa đơn
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      {showBreakdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </motion.button>
                  </div>

                  <AnimatePresence mode="wait">
                    {showBreakdown ? (
                      <motion.div
                        key="breakdown"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 flex-1"
                      >
                        {/* Room Price */}
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0 }}
                          className="bg-white rounded-2xl p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-900">Tiền phòng</p>
                              <p className="text-xs text-gray-400">{selectedRoom?.type === 'single' ? 'Phòng đơn' : 'Phòng đôi'}</p>
                            </div>
                            <p className="font-black text-lg text-gray-900">{formatCurrency(selectedRoom?.price || 0)}</p>
                          </div>
                        </motion.div>

                        {/* Water Price */}
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className={cn(
                            "bg-white rounded-2xl p-4 border transition-all",
                            isBilledCountModified
                              ? "border-amber-200 bg-amber-50"
                              : "border-gray-200"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900">Tiền nước</p>
                                {isBilledCountModified && (
                                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 font-semibold rounded-full">
                                    {EDITED_BADGE_TEXT}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                {billedGuestCount} khách
                                {isBilledCountModified && (
                                  <span className="text-amber-600"> (thực tế {guestCount})</span>
                                )}
                              </p>
                            </div>
                            <p className="font-black text-lg text-emerald-600">{formatCurrency(waterPrice)}</p>
                          </div>
                        </motion.div>

                        {/* Electricity Price */}
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white rounded-2xl p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-900">Tiền điện</p>
                              <p className="text-xs text-gray-400">{electricityUsed} kWh ({electricityOld} → {electricityNew})</p>
                            </div>
                            <p className="font-black text-lg text-gray-900">{formatCurrency(electricityPrice)}</p>
                          </div>
                        </motion.div>

                        {/* Extra Services - Show details here */}
                        {selectedServices.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl p-4 border border-gray-200"
                          >
                            <p className="font-bold text-gray-900 mb-2">Dịch vụ thêm</p>
                            <div className="space-y-2">
                              {selectedServices.map((service, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className={service.isPaid ? "line-through opacity-50" : ""}>
                                      {service.name}
                                    </span>
                                    <span className="text-xs text-gray-400">×{service.quantity}</span>
                                    {service.isPaid && (
                                      <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 font-semibold rounded-full">
                                        Đã chi trả
                                      </span>
                                    )}
                                  </div>
                                  <span className={cn(
                                    "font-bold",
                                    service.isPaid ? "text-green-600 line-through opacity-50" : ""
                                  )}>
                                    {formatCurrency(service.price * service.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Total - Prominent in right column */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-gray-200 shrink-0"
                  >
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tổng thanh toán</p>
                    <h3 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                      {formatCurrency(totalPrice)}
                    </h3>
                  </motion.div>
                </motion.div>
              </div>

              {/* Footer - Action buttons with proper labels */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-t border-gray-100 shrink-0">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 min-h-[44px] px-4 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: isSubmitting || !selectedRoom || electricityNew <= electricityOld ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedRoom || electricityNew <= electricityOld}
                    className={cn(
                      "flex-1 min-h-[44px] px-4 rounded-xl sm:rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base",
                      isSubmitting || !selectedRoom || electricityNew <= electricityOld
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-xl hover:shadow-emerald-500/30"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} sm:size={18} className="animate-spin" />
                        <span className="hidden sm:inline"> Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} sm:size={18} />
                        <span>Tạo hóa đơn</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Add Service Modal */}
            <AddInvoiceServiceModal
              isOpen={isAddServiceModalOpen}
              onClose={() => setIsAddServiceModalOpen(false)}
              onAdd={handleServiceAdded}
              availableServices={extraServices}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
