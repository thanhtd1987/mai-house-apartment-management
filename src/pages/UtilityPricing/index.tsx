import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Droplets, Zap, Edit2, X, Save } from 'lucide-react';
import { UtilityPricing } from '../../types/utilityPricing';
import { formatCurrency } from '../../utils';
import { useDataStore } from '../../stores';

interface UtilityPricingPageProps {
  onUpdatePricing: (id: string, data: any) => Promise<void>;
  onCreatePricing: (data: any) => Promise<void>;
  onDeletePricing: (id: string) => Promise<void>;
}

export function UtilityPricingPage({
  onUpdatePricing,
  onCreatePricing
}: UtilityPricingPageProps) {
  const { utilityPricing } = useDataStore();
  const [editingWater, setEditingWater] = useState(false);
  const [editingElectricity, setEditingElectricity] = useState(false);
  const [waterPrice, setWaterPrice] = useState(60000);
  const [electricityPrice, setElectricityPrice] = useState(3500);
  const [saving, setSaving] = useState(false);

  const waterPricing = utilityPricing.find(u => u.type === 'water' && u.isActive);
  const electricityPricing = utilityPricing.find(u => u.type === 'electricity' && u.isActive);

  // Initialize prices from data
  React.useEffect(() => {
    if (waterPricing?.basePrice) {
      setWaterPrice(waterPricing.basePrice);
    }
    if (electricityPricing?.basePrice) {
      setElectricityPrice(electricityPricing.basePrice);
    }
  }, [waterPricing, electricityPricing]);

  const handleSaveWater = async () => {
    setSaving(true);
    try {
      if (waterPricing) {
        await onUpdatePricing(waterPricing.id, { basePrice: waterPrice });
      } else {
        await onCreatePricing({
          type: 'water',
          name: 'Tiền nước',
          description: 'Giá nước sinh hoạt',
          pricingModel: 'fixed_per_person',
          basePrice: waterPrice,
          tieredPricing: [],
          usageTiers: [],
          isActive: true,
          effectiveDate: new Date().toISOString().split('T')[0]
        });
      }
      setEditingWater(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveElectricity = async () => {
    setSaving(true);
    try {
      if (electricityPricing) {
        await onUpdatePricing(electricityPricing.id, { basePrice: electricityPrice });
      } else {
        await onCreatePricing({
          type: 'electricity',
          name: 'Tiền điện',
          description: 'Giá điện sinh hoạt',
          pricingModel: 'usage_based',
          basePrice: electricityPrice,
          tieredPricing: [],
          usageTiers: [],
          isActive: true,
          effectiveDate: new Date().toISOString().split('T')[0]
        });
      }
      setEditingElectricity(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cấu Hình Giá Dịch Vụ</h1>
        <p className="text-gray-500 mt-1 md:mt-2">
          Thiết lập giá nước và giá điện cho hóa đơn
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Water Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />

          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Droplets className="text-white w-5 h-5 md:w-6 md:h-6" size={20} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Tiền nước</h3>
                  <p className="text-xs md:text-sm text-gray-500">Tính theo số người</p>
                </div>
              </div>

              {!editingWater && (
                <button
                  onClick={() => setEditingWater(true)}
                  className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={16} className="w-4 h-4 md:w-4.5 md:h-4.5" />
                </button>
              )}
            </div>

            {/* Display Mode */}
            {!editingWater ? (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 md:p-6 border border-blue-100">
                <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Giá hiện tại</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black text-gray-900">
                    {formatCurrency(waterPricing?.basePrice || waterPrice)}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500">/người</span>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 md:p-6 border border-blue-100">
                <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Cập nhật giá</p>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="text-xs md:text-sm text-gray-600 block mb-2">Giá mỗi người (VND)</label>
                    <input
                      type="number"
                      value={waterPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWaterPrice(Number(e.target.value))}
                      className="w-full p-3 md:p-4 bg-white border-2 border-blue-200 rounded-xl text-xl md:text-2xl font-bold text-center"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingWater(false);
                        if (waterPricing?.basePrice) setWaterPrice(waterPricing.basePrice);
                      }}
                      disabled={saving}
                      className="flex-1 p-2 md:p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm md:text-base"
                    >
                      <X size={16} className="inline mr-1 md:mr-2 w-4 h-4 md:w-4.5 md:h-4.5" />
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveWater}
                      disabled={saving}
                      className="flex-1 p-2 md:p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm md:text-base"
                    >
                      {saving ? (
                        <>Đang lưu...</>
                      ) : (
                        <>
                          <Save size={16} className="inline mr-1 md:mr-2 w-4 h-4 md:w-4.5 md:h-4.5" />
                          Lưu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Electricity Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />

          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Zap className="text-white w-5 h-5 md:w-6 md:h-6" size={20} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Tiền điện</h3>
                  <p className="text-xs md:text-sm text-gray-500">Tính theo số kWh</p>
                </div>
              </div>

              {!editingElectricity && (
                <button
                  onClick={() => setEditingElectricity(true)}
                  className="p-2 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                >
                  <Edit2 size={16} className="w-4 h-4 md:w-4.5 md:h-4.5" />
                </button>
              )}
            </div>

            {/* Display Mode */}
            {!editingElectricity ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 md:p-6 border border-amber-100">
                <p className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Giá hiện tại</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black text-gray-900">
                    {formatCurrency(electricityPricing?.basePrice || electricityPrice)}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500">/kWh</span>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 md:p-6 border border-amber-100">
                <p className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Cập nhật giá</p>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="text-xs md:text-sm text-gray-600 block mb-2">Giá mỗi kWh (VND)</label>
                    <input
                      type="number"
                      value={electricityPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setElectricityPrice(Number(e.target.value))}
                      className="w-full p-3 md:p-4 bg-white border-2 border-amber-200 rounded-xl text-xl md:text-2xl font-bold text-center"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingElectricity(false);
                        if (electricityPricing?.basePrice) setElectricityPrice(electricityPricing.basePrice);
                      }}
                      disabled={saving}
                      className="flex-1 p-2 md:p-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm md:text-base"
                    >
                      <X size={16} className="inline mr-1 md:mr-2 w-4 h-4 md:w-4.5 md:h-4.5" />
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveElectricity}
                      disabled={saving}
                      className="flex-1 p-2 md:p-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm md:text-base"
                    >
                      {saving ? (
                        <>Đang lưu...</>
                      ) : (
                        <>
                          <Save size={16} className="inline mr-1 md:mr-2 w-4 h-4 md:w-4.5 md:h-4.5" />
                          Lưu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Extra Services Info */}
      <div className="mt-6 md:mt-8 p-4 md:p-6 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">ℹ️</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Dịch vụ thêm</h4>
            <p className="text-sm text-gray-600">
              Khi tạo hóa đơn, bạn có thể thêm các dịch vụ khác như:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Giặt ủi: 50.000 VND/lần</li>
              <li>• Dọn phòng: 30.000 VND/lần</li>
              <li>• Thay ga trải giường: 100.000 VND/bộ</li>
              <li>• ...và các dịch vụ khác</li>
            </ul>
            <p className="mt-2 text-xs text-blue-600 font-semibold">
              💡 Nhập trực tiếp trong modal tạo hóa đơn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
