import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, CheckCircle, Clock, Calendar, Battery, Filter } from 'lucide-react';
import { useSmartLocks, useRooms } from '../../hooks';
import { useDataStore } from '../../stores';
import { cn, formatDate, isPast } from '../../utils';
import { getLockStatus } from '../../utils/smartLock';
import { SmartLock as SmartLockType } from '../../types';

type FilterType = 'all' | 'expiring' | 'battery' | 'expired';

export function SmartLocks() {
  const { smartLocks, rooms } = useDataStore();
  const { checkExpiringLocks } = useSmartLocks();
  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<{ expiring: number; battery: number }>({ expiring: 0, battery: 0 });

  useEffect(() => {
    checkExpiringLocks()
      .then(({ expiringPasswords, batteryIssues }) => {
        setNotifications({ expiring: expiringPasswords.length, battery: batteryIssues.length });
      })
      .catch((error) => {
        console.error('Failed to check expiring locks:', error);
      });
  }, [checkExpiringLocks, smartLocks]);


  const filteredLocks = smartLocks.filter(lock => {
    const status = getLockStatus(lock);
    switch (filter) {
      case 'expiring': return status === 'warning';
      case 'battery': return getLockStatus(lock) === 'critical' && isPast(lock.nextBatteryReplacementDate);
      case 'expired': return status === 'critical';
      default: return true;
    }
  });

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all",
        filter === type
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Smart Locks</h1>
        <p className="text-slate-600">Quản lý khóa cửa thông minh</p>
      </div>

      {/* Notifications */}
      {(notifications.expiring > 0 || notifications.battery > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
            <AlertCircle size={20} />
            <span>Cần chú ý</span>
          </div>
          <div className="text-sm text-amber-700">
            {notifications.expiring > 0 && (
              <div>• {notifications.expiring} khóa sắp hết hạn hoặc đã hết hạn password</div>
            )}
            {notifications.battery > 0 && (
              <div>• {notifications.battery} khóa cần thay pin</div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton type="all" label="Tất cả" />
        <FilterButton type="expiring" label="Sắp hết hạn" />
        <FilterButton type="battery" label="Cần thay pin" />
        <FilterButton type="expired" label="Đã hết hạn" />
      </div>

      {/* Locks List */}
      {filteredLocks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <Lock size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-semibold">Không có khóa nào</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLocks.map((lock) => {
            const status = getLockStatus(lock);
            const room = rooms.find(r => r.id === lock.roomId);

            const statusConfig = {
              critical: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertCircle, label: 'Cần chú ý' },
              warning: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Sắp hết hạn' },
              ok: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Bình thường' }
            };
            const config = statusConfig[status];
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={lock.id}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "rounded-2xl p-6 border transition-all",
                  config.color
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock size={24} />
                      <h3 className="text-xl font-bold">Phòng {room?.number || 'N/A'}</h3>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold", config.color)}>
                        {config.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password Info */}
                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock size={16} />
                          <span className="font-semibold text-sm">Mật khẩu</span>
                        </div>
                        <p className="font-mono text-lg mb-1">{lock.password}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={12} />
                          <span>Hết hạn: {formatDate(lock.passwordExpiryDate)}</span>
                        </div>
                      </div>

                      {/* Battery Info */}
                      <div className="bg-white/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Battery size={16} />
                          <span className="font-semibold text-sm">Pin</span>
                        </div>
                        <p className="text-sm mb-1">
                          Thay: {formatDate(lock.batteryReplacementDate)}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={12} />
                          <span>
                            Tiếp theo: {formatDate(lock.nextBatteryReplacementDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIcon size={20} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
