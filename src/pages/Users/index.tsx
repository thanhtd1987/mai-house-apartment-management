import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Activity, Clock } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AppUser } from '../../types/user';
import { useAuthStore, useDataStore } from '../../stores';
import { isSuperAdmin } from '../../utils/permissions';
import { Button, ConfirmDialog, StatCard } from '../../components/common';
import { UserCard, AddUserModal } from '../../components/users';
import { useToast } from '../../hooks/useToast';

export function UsersManager() {
  const { users, userActivities } = useDataStore();
  const { user: currentUser } = useAuthStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const toast = useToast();

  // Debug: Check super admin status
  console.log('🔐 UsersManager - Current user:', currentUser?.email);
  console.log('🔐 UsersManager - isSuperAdmin:', isSuperAdmin(currentUser));

  // Verify super admin access
  if (!isSuperAdmin(currentUser)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  // Debug: Test if super admin config exists in Firestore
  useEffect(() => {
    const testConfigAccess = async () => {
      if (!currentUser?.email) return;

      const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'thanhtd1987@gmail.com';
      const configRef = doc(db, 'superAdmins', SUPER_ADMIN_EMAIL);

      console.log('🔍 Testing config access:', configRef.path);

      try {
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          console.log('✅ Super admin config exists:', docSnap.data());
        } else {
          console.log('❌ Super admin config NOT found');
        }
      } catch (error) {
        console.error('❌ Error accessing config:', error);
      }
    };

    testConfigAccess();
  }, [currentUser]);

  // Calculate stats
  const stats = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = users.filter(u => {
      if (!u.lastLoginAt) return false;
      return new Date(u.lastLoginAt) > sevenDaysAgo;
    }).length;

    const neverLoggedIn = users.filter(u => !u.lastLoginAt).length;

    return {
      total: users.length,
      active: activeUsers,
      neverLoggedIn
    };
  }, [users]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsInviteModalOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUser(user);
    setIsInviteModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<AppUser>) => {
    try {
      if (editingUser?.id) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          ...userData,
          createdAt: editingUser.createdAt,
          invitedBy: editingUser.invitedBy,
          lastLoginAt: editingUser.lastLoginAt
        });
        toast.success(`Đã cập nhật user ${userData.email}!`);
      } else {
        if (!currentUser?.uid) {
          throw new Error('Not authenticated');
        }
        // Use email as document ID to match isWhitelisted() check
        if (!userData.email) {
          throw new Error('Email is required');
        }
        await setDoc(doc(db, 'users', userData.email), {
          email: userData.email,
          name: userData.name || '',
          role: userData.role || 'manager',
          phone: userData.phone || '',
          notes: userData.notes || '',
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
          invitedBy: currentUser.uid
        }, { merge: false }); // Don't merge - create new document
        toast.success(`Đã thêm ${userData.email} vào whitelist!`);
      }
      setIsInviteModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`Lỗi: ${error instanceof Error ? error.message : 'Không thể lưu user'}`);
      throw error;
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const userToRemove = users.find(u => u.id === userId);
    if (!userToRemove) return;

    // Store user data for potential undo
    const deletedUserData = { ...userToRemove };

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa user',
      message: `Bạn có chắc chắn muốn xóa user ${userToRemove.email}? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));

          // Show toast with undo action
          toast.withAction(
            `Đã xóa ${userToRemove.email} khỏi whitelist!`,
            'Hoàn tác',
            async () => {
              // Undo: restore the user
              try {
                await setDoc(doc(db, 'users', userToRemove.email), {
                  email: deletedUserData.email,
                  name: deletedUserData.name,
                  role: deletedUserData.role,
                  phone: deletedUserData.phone || '',
                  notes: deletedUserData.notes || '',
                  createdAt: deletedUserData.createdAt,
                  lastLoginAt: deletedUserData.lastLoginAt || null,
                  invitedBy: deletedUserData.invitedBy
                }, { merge: false });
                toast.success(`Đã khôi phục ${userToRemove.email}!`);
              } catch (error) {
                console.error('Error undoing delete:', error);
                toast.error('Không thể khôi phục user');
              }
            },
            'success',
            5000 // Longer duration for undo
          );
        } catch (error) {
          console.error('Error removing user:', error);
          toast.error(`Lỗi: ${error instanceof Error ? error.message : 'Không thể xóa user'}`);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Tổng Users" value={stats.total} icon={Users} color="blue" />
        <StatCard label="Đang Hoạt Động" value={stats.active} icon={Activity} color="green" subLabel="(7 ngày qua)" />
        <StatCard label="Chưa Login" value={stats.neverLoggedIn} icon={Clock} color="orange" />
      </div>

      {/* Add User Button */}
      <div className="flex justify-end">
        <Button onClick={handleAddUser} size="lg" className="gap-2">
          <Plus size={18} />
          Thêm User
        </Button>
      </div>

      {/* Users Grid */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Chưa có user nào
          </h3>
          <p className="text-slate-500 mb-4">
            Thêm user để họ có thể truy cập hệ thống
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <UserCard key={user.id} user={user} onEdit={handleEditUser} onDelete={handleRemoveUser} />
          ))}
        </motion.div>
      )}

      {/* Add/Edit User Modal */}
      <AddUserModal
        isOpen={isInviteModalOpen}
        onClose={() => { setIsInviteModalOpen(false); setEditingUser(null); }}
        onSave={handleSaveUser}
        user={editingUser || undefined}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
}

// Helper component for stat cards
function StatCard({ label, value, icon: Icon, color, subLabel }: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange';
  subLabel?: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500'
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center text-white`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
          {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
        </div>
      </div>
    </div>
  );
}
