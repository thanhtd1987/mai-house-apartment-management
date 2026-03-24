import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Loader2, ChevronDown, ChevronUp, Info, Sparkles, Plus, Minus, Trash2 } from 'lucide-react';
import { Room, ExtraService } from '../../types';
import { cn, formatCurrency, calculateElectricity } from '../../utils';
import { useOCR, useRoomServiceUsages } from '../../hooks';
import { AddInvoiceServiceModal } from './AddInvoiceServiceModal';
import { ExtraServiceConfig } from '../../types/extraService';
import { getCurrentMonth } from '../../types/roomServiceUsage';

interface InvoiceService {
  name: string;
  price: number;
  quantity: number;
  serviceId?: string; // Optional: link to extraService config
  isPaid?: boolean; // Optional: payment status
}

interface QuickInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  guestCount?: number;
  onCreateInvoice: (data: InvoiceData) => Promise<void>;
  utilityPricing?: UtilityPricingConfig;
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
  room,
  guestCount = 0,
  onCreateInvoice,
  utilityPricing,
  availableServices = [],
}: QuickInvoiceModalProps) {
  const [electricityNew, setElectricityNew] = useState<number>(0);
  const [meterImage, setMeterImage] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<InvoiceService[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

  // Load monthly service usages
  const { services: monthlyServiceUsages, loading: loadingServices } = useRoomServiceUsages({
    roomId: room?.id || '',
    month: room ? getCurrentMonth() : undefined
  });

  const { isScanning: isProcessingOCR, scanMeter } = useOCR();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load services from monthly usages when modal opens
  useEffect(() => {
    const loadServicesFromUsages = async () => {
      if (!room || !isOpen) return;

      setElectricityNew(room.lastElectricityMeter);
      setMeterImage(null);

      // Auto-load services from monthly usage (including payment status)
      if (monthlyServiceUsages.length > 0 && availableServices.length > 0) {
        const services: InvoiceService[] = monthlyServiceUsages.map(usage => {
          const serviceConfig = availableServices.find(s => s.id === usage.serviceId);
          return {
            name: serviceConfig?.name || 'Dịch vụ',
            price: serviceConfig?.price || 0,
            quantity: usage.quantity,
            serviceId: usage.serviceId,
            isPaid: usage.status === 'paid' // Track payment status
          };
        });
        setSelectedServices(services);
      } else {
        setSelectedServices([]);
      }
    };

    loadServicesFromUsages();
  }, [room, isOpen, monthlyServiceUsages, availableServices]);

  if (!room || !isOpen) return null;

  const electricityOld = room.lastElectricityMeter;
  const electricityUsed = Math.max(0, electricityNew - electricityOld);

  // Calculate water price - uniform rate per person
  const calculateWaterPrice = (): number => {
    if (!utilityPricing || guestCount === 0) return 60000; // fallback
    return guestCount * utilityPricing.water.pricePerPerson;
  };

  const waterPrice = calculateWaterPrice();
  const electricityPrice = utilityPricing ? electricityUsed * utilityPricing.electricity.pricePerKwh : calculateElectricity(electricityUsed);

  // Calculate services total - CHỈ tính UNPAID services
  const servicesTotal = selectedServices
    .filter((s: InvoiceService) => !s.isPaid) // Bỏ qua paid services
    .reduce((acc: number, service: InvoiceService) => acc + (service.price * service.quantity), 0);
  const totalPrice = room.price + electricityPrice + waterPrice + servicesTotal;

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

  const handleSubmit = async () => {
    if (!room) return;

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
        roomId: room.id,
        meterId: room.meterId,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden"
          >
            {/* Main Card with Gradient Border */}
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
              {/* Animated Top Gradient */}
              <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
                <motion.div
                  className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Header */}
              <div className="p-8 pb-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Sparkles className="text-white" size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Tạo Hóa Đơn Nhanh</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Phòng <span className="font-bold text-emerald-600">{room.number}</span>
                        {guestCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            {guestCount} khách
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-gray-400" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-[calc(90vh-180px)] overflow-y-auto">
                {/* Left Column - Input */}
                <div className="space-y-6">
                  {/* Electricity Input */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                  >
                    <label className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-wider">
                      <Info size={16} className="text-emerald-500" />
                      Chỉ số điện mới
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={electricityNew}
                          onChange={(e) => setElectricityNew(Number(e.target.value))}
                          className="w-full p-4 pr-16 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-bold text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">kWh</span>
                      </div>
                      <motion.label
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "p-4 rounded-2xl transition-all",
                          isProcessingOCR ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-lg"
                        )}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleOCRMeter}
                          className="hidden"
                          accept="image/*"
                          disabled={isProcessingOCR}
                        />
                        {isProcessingOCR ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                      </motion.label>
                    </div>
                    {meterImage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-2xl overflow-hidden border-2 border-emerald-200"
                      >
                        <img src={meterImage} alt="Meter" className="w-full h-32 object-cover" />
                      </motion.div>
                    )}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-400">Cũ: <strong className="text-gray-700">{electricityOld}</strong> kWh</span>
                      <span className="text-gray-300">|</span>
                      <span className={cn(
                        "font-bold",
                        electricityUsed > 0 ? "text-emerald-600" : "text-gray-400"
                      )}>
                        Đã dùng: <strong>{electricityUsed}</strong> kWh
                      </span>
                    </div>
                  </motion.div>

                  {/* Extra Services - Simple List */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-black text-gray-400 uppercase tracking-wider">
                        Dịch vụ thêm
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsAddServiceModalOpen(true)}
                        className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30"
                        aria-label="Thêm dịch vụ"
                      >
                        <Plus size={18} />
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
                                  disabled={service.isPaid}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    service.isPaid
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
                                  disabled={service.isPaid}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    service.isPaid
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
                                  disabled={service.isPaid}
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center ml-2",
                                    service.isPaid
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
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">
                      Chi Tiết Hóa Đơn
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
                        <CostBreakdownItem
                          label="Tiền phòng"
                          detail={`Phòng ${room.number}`}
                          amount={room.price}
                          delay={0}
                        />

                        {/* Water Price */}
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-2xl p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-gray-900">Tiền nước</p>
                              <p className="text-xs text-gray-400">{guestCount} khách</p>
                            </div>
                            <p className="font-black text-lg text-emerald-600">{formatCurrency(waterPrice)}</p>
                          </div>
                        </motion.div>

                        {/* Electricity Price */}
                        <CostBreakdownItem
                          label="Tiền điện"
                          detail={`${electricityUsed} kWh (${electricityOld} → ${electricityNew})`}
                          amount={electricityPrice}
                          delay={0.2}
                        />

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

                  {/* Total */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 pt-6 border-t-2 border-gray-200"
                  >
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tổng thanh toán</p>
                    <h3 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                      {formatCurrency(totalPrice)}
                    </h3>
                  </motion.div>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 p-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting || electricityNew <= electricityOld}
                    className={cn(
                      "flex-1 p-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                      isSubmitting || electricityNew <= electricityOld
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-xl hover:shadow-emerald-500/30"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Tạo hóa đơn
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
              availableServices={availableServices}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CostBreakdownItemProps {
  label: string;
  detail: string;
  amount: number;
  delay: number;
}

function CostBreakdownItem({ label, detail, amount, delay }: CostBreakdownItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-4 border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400">{detail}</p>
        </div>
        <p className="font-black text-lg text-gray-900">{formatCurrency(amount)}</p>
      </div>
    </motion.div>
  );
}
