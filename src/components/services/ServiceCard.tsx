import React from 'react';
import { motion } from 'motion/react';
import { Edit3, Trash2, TrendingUp } from 'lucide-react';
import { ExtraServiceConfig } from '../../types/extraService';
import { CATEGORY_CONFIG } from '../../types/extraService';
import { cn, formatCurrency } from '../../utils';

interface ServiceCardProps {
  service: ExtraServiceConfig;
  onEdit: (service: ExtraServiceConfig) => void;
  onDelete: (serviceId: string) => void;
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const categoryConfig = CATEGORY_CONFIG[service.category];

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-all duration-200 relative overflow-hidden group"
    >
      {/* Category gradient accent */}
      <div className={`h-1.5 bg-gradient-to-r ${categoryConfig.gradient}`} />

      <div className="mt-4">
        {/* Header: Icon + Name + Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryConfig.gradient} flex items-center justify-center text-white text-2xl shadow-lg`}>
              {service.icon || categoryConfig.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{service.name}</h3>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1",
                categoryConfig.bgColor,
                categoryConfig.textColor
              )}>
                {categoryConfig.icon} {categoryConfig.label}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(service)}
              className="p-2 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors"
              aria-label={`Chỉnh sửa ${service.name}`}
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="p-2 hover:bg-rose-50 rounded-xl text-gray-400 hover:text-rose-600 transition-colors"
              aria-label={`Xóa ${service.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Price */}
        <div className={`bg-gradient-to-br ${categoryConfig.bgColor} rounded-xl p-4 mb-4 border ${categoryConfig.borderColor}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Giá dịch vụ</p>
          <p className="text-2xl font-black text-gray-900">
            {formatCurrency(service.price)}
          </p>
        </div>

        {/* Usage Stats */}
        {service.usageCount !== undefined && service.usageCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp size={14} className="text-green-600" />
            <span>Đã dùng <strong className="text-gray-700">{service.usageCount}</strong> lần</span>
            {service.revenueGenerated && (
              <>
                <span>•</span>
                <span>Doanh thu: <strong className="text-gray-700">{formatCurrency(service.revenueGenerated)}</strong></span>
              </>
            )}
          </div>
        )}

        {service.description && (
          <p className="text-sm text-gray-500 mt-3 line-clamp-2">
            {service.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
