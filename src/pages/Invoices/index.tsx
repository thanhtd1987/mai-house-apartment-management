import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, X, Download, FileText } from 'lucide-react';
import { collection, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Room, Invoice } from '../../types';
import { Modal, Button } from '../../components/common';
import { formatCurrency, cn } from '../../utils';
import { toPng } from 'html-to-image';
import { useDataStore, useToastStore } from '../../stores';
import { QuickInvoiceModal } from '../../components/invoices/QuickInvoiceModal';

export function InvoicesManager() {
  const { rooms, invoices } = useDataStore();
  const { addToast } = useToastStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleCreateInvoiceClick = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleCreateInvoice = async (data: any) => {
    const { roomId, month, year, electricityOld, electricityNew, electricityPrice, waterPrice, extraServices, totalPrice } = data;
    
    try {
      if (editingInvoice) {
        await updateDoc(doc(db, 'invoices', editingInvoice.id), {
          month,
          year,
          electricityOld,
          electricityNew,
          electricityUsed: electricityNew - electricityOld,
          electricityPrice,
          waterPrice,
          extraServices,
          totalPrice,
        });
      } else {
        await addDoc(collection(db, 'invoices'), {
          roomId,
          month,
          year,
          electricityOld,
          electricityNew,
          electricityUsed: electricityNew - electricityOld,
          electricityPrice,
          waterPrice,
          extraServices,
          totalPrice,
          status: 'unpaid',
          createdAt: new Date().toISOString()
        });
        await updateDoc(doc(db, 'rooms', roomId), {
          lastElectricityMeter: electricityNew,
          paymentStatus: 'unpaid'
        });
      }
      setIsModalOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error creating invoice:', error);
      addToast('Lỗi khi tạo hóa đơn', 'error');
    }
  };

  const exportInvoice = async (id: string) => {
    const element = document.getElementById(`invoice-card-${id}`);
    if (element) {
      const elementsToHide = element.querySelectorAll('.no-export');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');

      const dataUrl = await toPng(element);

      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');

      const link = document.createElement('a');
      const room = rooms.find(r => r.id === invoices.find(i => i.id === id)?.roomId);
      const invoice = invoices.find(i => i.id === id);
      link.download = `room${room?.number || 'unknown'}_thang_${invoice?.month || 'unknown'}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-gray-500 text-sm">Quản lý hóa đơn và lịch sử thanh toán.</p>
        <Button onClick={handleCreateInvoiceClick} icon={<Plus size={18} />}>
          Tạo hóa đơn tháng
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {invoices.map(invoice => {
          const room = rooms.find(r => r.id === invoice.roomId);
          return (
            <div
              key={invoice.id}
              id={`invoice-card-${invoice.id}`}
              className="bg-white p-4 md:p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
              onClick={() => setViewingInvoice(invoice)}
            >
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold">Phòng {room?.number}</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">Tháng {invoice.month}/{invoice.year}</p>
                  {invoice.meterId && <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Mã ĐH: {invoice.meterId}</p>}
                </div>
                <div className="flex gap-1 md:gap-2 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity no-export">
                  {invoice.status === 'unpaid' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditInvoice(invoice); }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      >
                        <Edit3 size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(invoice); }}
                        className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"
                      >
                        <Trash2 size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); exportInvoice(invoice.id); }}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <Download size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 md:space-y-2 mb-3 md:mb-4 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng cộng:</span>
                  <span className="font-bold">{formatCurrency(invoice.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={cn(
                    "font-bold",
                    invoice.status === 'paid' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {invoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>

              {invoice.status === 'unpaid' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await updateDoc(doc(db, 'invoices', invoice.id), { status: 'paid' });
                    const room = rooms.find(r => r.id === invoice.roomId);
                    if (room) {
                      await updateDoc(doc(db, 'rooms', room.id), { paymentStatus: 'paid' });
                    }
                  }}
                  className="w-full py-2 bg-black text-white rounded-xl font-bold text-xs md:text-sm hover:bg-gray-800 transition-all"
                >
                  Xác nhận đã thu
                </button>
              )}
            </div>
          );
        })}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm"
          >
            <h3 className="text-xl font-bold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6 text-sm">Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này sẽ hoàn tác cập nhật chỉ số điện của phòng.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 p-3 bg-gray-100 rounded-xl font-bold text-sm">Hủy</button>
              <button
                onClick={async () => {
                  if (confirmDelete) {
                    await deleteDoc(doc(db, 'invoices', confirmDelete.id));
                    const room = rooms.find(r => r.id === confirmDelete.roomId);
                    if (room) {
                      await updateDoc(doc(db, 'rooms', room.id), {
                        lastElectricityMeter: confirmDelete.electricityOld
                      });
                    }
                    setConfirmDelete(null);
                  }
                }}
                className="flex-1 p-3 bg-rose-600 text-white rounded-xl font-bold text-sm"
              >
                Xóa
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewingInvoice(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <FileText size={24} className="text-black" />
                    Chi tiết hóa đơn
                  </h3>
                  {(() => {
                    const room = rooms.find(r => r.id === viewingInvoice.roomId);
                    return (
                      <p className="text-sm text-gray-500 mt-1">Phòng {room?.number} - Tháng {viewingInvoice.month}/{viewingInvoice.year}</p>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Trạng thái thanh toán:</span>
                <span className={cn(
                  "px-4 py-2 rounded-xl font-bold text-sm",
                  viewingInvoice.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {viewingInvoice.status === 'paid' ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Thông tin hóa đơn</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Thời gian</p>
                    <p className="font-bold">Tháng {viewingInvoice.month}/{viewingInvoice.year}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Mã đồng hồ</p>
                    <p className="font-bold">{viewingInvoice.meterId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Chi tiết thanh toán</h4>
                <div className="space-y-3">
                  {(() => {
                    const room = rooms.find(r => r.id === viewingInvoice.roomId);
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Tiền phòng</p>
                            <p className="text-xs text-gray-400">Phòng {room?.number}</p>
                          </div>
                          <p className="font-bold">{formatCurrency(room?.price || 0)}</p>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Tiền điện</p>
                            <p className="text-xs text-gray-400">
                              {viewingInvoice.electricityUsed} kWh ({viewingInvoice.electricityOld} → {viewingInvoice.electricityNew})
                            </p>
                          </div>
                          <p className="font-bold">{formatCurrency(viewingInvoice.electricityPrice)}</p>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Tiền nước</p>
                            <p className="text-xs text-gray-400">Tiền cố định</p>
                          </div>
                          <p className="font-bold">{formatCurrency(viewingInvoice.waterPrice)}</p>
                        </div>

                        {viewingInvoice.extraServices.length > 0 && (
                          <div className="pt-3 border-t border-gray-200">
                            <p className="font-medium mb-2">Dịch vụ thêm:</p>
                            {viewingInvoice.extraServices.map((service, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm pl-4 py-1">
                                <span>{service.name}</span>
                                <span className="font-bold">{formatCurrency(service.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-black text-white rounded-2xl p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Tổng thanh toán</p>
                    <p className="text-3xl font-black mt-1">{formatCurrency(viewingInvoice.totalPrice)}</p>
                  </div>
                  <button
                    onClick={() => {
                      exportInvoice(viewingInvoice.id);
                    }}
                    className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <Download size={24} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <QuickInvoiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvoice(null);
        }}
        // No roomId prop - allow user to select room (Mode 1: from Invoices page)
        onCreateInvoice={handleCreateInvoice}
        invoices={invoices}
      />
    </div>
  );
}
