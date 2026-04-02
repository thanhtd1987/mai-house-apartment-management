import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Zap, Plus, Edit2, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import { UtilityPricing } from '../../types/utilityPricing';
import { formatCurrency } from '../../utils';

type TabType = 'all' | 'water' | 'electricity';

interface UtilityPricingPageProps {
  onUpdatePricing: (id: string, data: any) => Promise<void>;
  onCreatePricing: (data: any) => Promise<void>;
  onDeletePricing: (id: string) => Promise<void>;
  utilityPricing: UtilityPricing[];
}

export function UtilityPricingPage({
  onUpdatePricing,
  onCreatePricing,
  onDeletePricing,
  utilityPricing
}: UtilityPricingPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New pricing form state
  const [newPricing, setNewPricing] = useState({
    type: 'water' as 'water' | 'electricity',
    name: '',
    basePrice: 0
  });

  const tabs = [
    { key: 'all' as TabType, label: 'Tất cả', icon: null },
    { key: 'water' as TabType, label: 'Nước', icon: Droplets },
    { key: 'electricity' as TabType, label: 'Điện', icon: Zap }
  ];

  // Filter pricing by tab
  const filteredPricing = utilityPricing.filter(p => {
    if (activeTab === 'all') return true;
    return p.type === activeTab;
  });

  // Sort: active first, then by date
  const sortedPricing = [...filteredPricing].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
  });

  const handleCreatePricing = async () => {
    if (!newPricing.name || newPricing.basePrice <= 0) return;

    setSaving(true);
    try {
      await onCreatePricing({
        type: newPricing.type,
        name: newPricing.name,
        description: `Giá ${newPricing.type === 'water' ? 'nước' : 'điện'}`,
        pricingModel: newPricing.type === 'water' ? 'fixed_per_person' : 'usage_based',
        basePrice: newPricing.basePrice,
        tieredPricing: [],
        usageTiers: [],
        isActive: true,
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      setNewPricing({ type: 'water', name: '', basePrice: 0 });
      setShowCreateModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pricing: UtilityPricing) => {
    setSaving(true);
    try {
      await onUpdatePricing(pricing.id, { isActive: !pricing.isActive });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bảng giá này?')) return;
    setSaving(true);
    try {
      await onDeletePricing(id);
    } finally {
      setSaving(false);
    }
  };

  const getPricingTypeLabel = (type: string) => {
    return type === 'water' ? 'Nước' : 'Điện';
  };

  const getPricingUnit = (type: string) => {
    return type === 'water' ? '/người' : '/kWh';
  };

  const getPricingColor = (type: string) => {
    return type === 'water'
      ? 'from-blue-500 to-cyan-500'
      : 'from-amber-500 to-orange-500';
  };

  const getPricingBgColor = (type: string) => {
    return type === 'water'
      ? 'from-blue-50 to-cyan-50 border-blue-100'
      : 'from-amber-50 to-orange-50 border-amber-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Giá Điện & Nước</h1>
          <p className="text-gray-500 mt-1">
            Quản lý các bảng giá điện và nước cho hóa đơn
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 self-start"
        >
          <Plus size={18} />
          Thêm giá mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon size={16} className={activeTab === tab.key ? 'text-blue-600' : ''} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Pricing List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedPricing.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 bg-white rounded-2xl border border-gray-200"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                {activeTab === 'electricity' ? (
                  <Zap size={32} className="text-gray-400" />
                ) : (
                  <Droplets size={32} className="text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Chưa có bảng giá {activeTab === 'all' ? '' : activeTab === 'water' ? 'nước' : 'điện'}
              </h3>
              <p className="text-gray-500 mb-4">
                Hãy tạo bảng giá đầu tiên để bắt đầu sử dụng
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Thêm bảng giá
              </button>
            </motion.div>
          ) : (
            sortedPricing.map((pricing) => (
              <motion.div
                key={pricing.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className={`h-1.5 bg-gradient-to-r ${getPricingColor(pricing.type)}`} />
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {pricing.name}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          pricing.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {pricing.isActive ? 'Đang dùng' : 'Ngưng dùng'}
                        </span>
                      </div>
                      <div className={`inline-flex items-baseline gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-br ${getPricingBgColor(pricing.type)} border`}>
                        <span className="text-2xl font-black text-gray-900">
                          {formatCurrency(pricing.basePrice)}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">
                          {getPricingUnit(pricing.type)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {getPricingTypeLabel(pricing.type)} • Hiệu lực từ {new Date(pricing.effectiveDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(pricing)}
                        disabled={saving}
                        className={`p-2 rounded-lg transition-colors ${
                          pricing.isActive
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        } disabled:opacity-50`}
                        title={pricing.isActive ? 'Ngưng dùng' : 'Kích hoạt'}
                      >
                        {pricing.isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      </button>
                      <button
                        onClick={() => setEditingId(pricing.id)}
                        disabled={saving}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(pricing.id)}
                        disabled={saving}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Thêm bảng giá mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Loại giá <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPricing({ ...newPricing, type: 'water' })}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${
                      newPricing.type === 'water'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Droplets size={24} className="mx-auto mb-2" />
                    Nước
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPricing({ ...newPricing, type: 'electricity' })}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${
                      newPricing.type === 'electricity'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Zap size={24} className="mx-auto mb-2" />
                    Điện
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tên bảng giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPricing.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPricing({ ...newPricing, name: e.target.value })}
                  placeholder="VD: Giá nước 2024"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Giá cơ sở (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newPricing.basePrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPricing({ ...newPricing, basePrice: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-bold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Đơn vị: {newPricing.type === 'water' ? 'VND/người' : 'VND/kWh'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreatePricing}
                  disabled={saving || !newPricing.name || newPricing.basePrice <= 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Đang lưu...' : 'Tạo bảng giá'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal (simplified - just edit name and price) */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa bảng giá</h3>
              <button
                onClick={() => setEditingId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {(() => {
              const pricing = utilityPricing.find(p => p.id === editingId);
              if (!pricing) return null;

              const [editName, setEditName] = useState(pricing.name);
              const [editPrice, setEditPrice] = useState(pricing.basePrice);

              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên bảng giá <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Giá cơ sở (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPrice(Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-bold"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Đơn vị: {pricing.type === 'water' ? 'VND/người' : 'VND/kWh'}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={saving}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={async () => {
                        if (!editName || editPrice <= 0) return;
                        setSaving(true);
                        try {
                          await onUpdatePricing(editingId, {
                            name: editName,
                            basePrice: editPrice
                          });
                          setEditingId(null);
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving || !editName || editPrice <= 0}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
