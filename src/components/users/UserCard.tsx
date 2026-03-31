import { motion } from 'motion/react';
import { Edit3, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { AppUser } from '../../types/user';

interface UserCardProps {
  user: AppUser;
  onEdit: (user: AppUser) => void;
  onDelete: (userId: string) => void | Promise<void>;
  key?: string; // React key prop
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const getRoleIcon = () => {
    switch (user.role) {
      case 'admin':
        return <Shield className="text-blue-500" size={18} />;
      case 'manager':
        return <Shield className="text-purple-500" size={18} />;
      default:
        return <UserIcon size={18} />;
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      default:
        return 'User';
    }
  };

  const getRoleGradient = () => {
    switch (user.role) {
      case 'admin':
        return 'from-blue-500/20 to-cyan-500/20';
      case 'manager':
        return 'from-purple-500/20 to-pink-500/20';
      default:
        return 'from-gray-500/20 to-slate-500/20';
    }
  };

  const createdDate = new Date(user.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      {/* Glassmorphism card with gradient border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getRoleGradient()} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getRoleGradient()} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                {getRoleIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">
                  {user.name || 'Không có tên'}
                </h3>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onEdit(user)}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors"
                title="Chỉnh sửa"
              >
                <Edit3 size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(user.id)}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
                title="Xóa"
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Role Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700">
              {getRoleIcon()}
              {getRoleLabel()}
            </span>
          </div>

          {/* Notes */}
          {user.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ghi chú</p>
              <p className="text-sm text-gray-700 line-clamp-2">{user.notes}</p>
            </div>
          )}

          {/* Created Date */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Được tạo vào {createdDate}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
