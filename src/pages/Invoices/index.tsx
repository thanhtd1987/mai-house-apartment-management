import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit3, Trash2, X, Camera, Download, Loader2, FileText } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services';
import { Room, Invoice } from '../../types';
import { Modal, Button } from '../../components/common';
import { useOCR } from '../../hooks';
import { formatCurrency, calculateElectricity, cn } from '../../utils';
import { toPng } from 'html-to-image';
import { useDataStore } from '../../stores';

export function InvoicesManager() {
  const { rooms, invoices } = useDataStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [electricityNew, setElectricityNew] = useState<number>(0);
  const [electricityOld, setElectricityOld] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);
  const [meterImage, setMeterImage] = useState<string | null>(null);
  const [extraServices, setExtraServices] = useState<{ name: string; price: number }[]>([]);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const { isScanning: isProcessingOCR, scanMeter } = useOCR();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateInvoiceClick = () => {
    setEditingInvoice(null);
    setSelectedRoom(null);
    setElectricityNew(0);
    setElectricityOld(0);
    setExtraServices([]);
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const room = rooms.find(r => r.id === invoice.roomId) || null;
    setSelectedRoom(room);
    setElectricityNew(invoice.electricityNew);
    setElectricityOld(invoice.electricityOld);
    setExtraServices(invoice.extraServices);
    setIsModalOpen(true);
  };

  const handleOCRMeter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await scanMeter(file);
    if (result) {
      setMeterImage(result.image);
      if (result.data) {
        if (result.data.reading) setElectricityNew(Number(result.data.reading));
        if (result.data.meterId && selectedRoom) {
          await updateDoc(doc(db, 'rooms', selectedRoom.id), { meterId: result.data.meterId });
        }
      }
    }
  };

  const electricityUsed = selectedRoom ? Math.max(0, electricityNew - electricityOld) : 0;
  const electricityPrice = calculateElectricity(electricityUsed);
  const waterPrice = 50000;
  const servicesTotal = extraServices.reduce((acc, curr) => acc + curr.price, 0);
  const totalPrice = (selectedRoom?.price || 0) + electricityPrice + waterPrice + servicesTotal;

  const handleCreateInvoice = async () => {
    if (!selectedRoom) return;

    const invoiceData = {
      roomId: selectedRoom.id,
      meterId: selectedRoom.meterId || '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      electricityOld,
      electricityNew,
      electricityUsed: electricityNew - electricityOld,
      electricityPrice,
      waterPrice,
      extraServices,
      totalPrice,
      status: 'unpaid',
      createdAt: new Date().toISOString()
    };

    if (editingInvoice) {
      await updateDoc(doc(db, 'invoices', editingInvoice.id), invoiceData);
    } else {
      await addDoc(collection(db, 'invoices'), invoiceData);
      await updateDoc(doc(db, 'rooms', selectedRoom.id), {
        lastElectricityMeter: electricityNew,
        paymentStatus: 'unpaid'
      });
    }
    setIsModalOpen(false);
    setSelectedRoom(null);
    setElectricityNew(0);
    setElectricityOld(0);
    setExtraServices([]);
    setEditingInvoice(null);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Quản lý hóa đơn và lịch sử thanh toán.</p>
        <Button onClick={handleCreateInvoiceClick} icon={<Plus size={18} />}>
          Tạo hóa đơn tháng
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {invoices.map(invoice => {
          const room = rooms.find(r => r.id === invoice.roomId);
          return (
            <div
              key={invoice.id}
              id={`invoice-card-${invoice.id}`}
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
              onClick={() => setViewingInvoice(invoice)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Phòng {room?.number}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tháng {invoice.month}/{invoice.year}</p>
                  {invoice.meterId && <p className="text-[10px] text-gray-400 font-bold uppercase">Mã ĐH: {invoice.meterId}</p>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-export">
                  {invoice.status === 'unpaid' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditInvoice(invoice); }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(invoice); }}
                        className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); exportInvoice(invoice.id); }}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
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
                  className="w-full py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
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
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Trạng thái thanh toán:</span>
                <span className={cn(
                  "px-4 py-2 rounded-xl font-bold text-sm",
                  viewingInvoice.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {viewingInvoice.status === 'paid' ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
                </span>
              </div>

              {/* Invoice Details */}
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

              {/* Cost Breakdown */}
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

              {/* Total */}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingInvoice(null); }}
        title={editingInvoice ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Chọn phòng</label>
              <select
                value={selectedRoom?.id || ''}
                onChange={(e) => {
                  const room = rooms.find(r => r.id === e.target.value) || null;
                  setSelectedRoom(room);
                  if (room && !editingInvoice) {
                    setElectricityOld(room.lastElectricityMeter);
                  }
                }}
                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black"
              >
                <option value="">-- Chọn phòng --</option>
                {rooms
                  .filter(r =>
                    !invoices.some(inv => inv.roomId === r.id && inv.month === new Date().getMonth() + 1 && inv.year === new Date().getFullYear())
                    || (editingInvoice && r.id === editingInvoice.roomId)
                  )
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.number}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Mã đồng hồ điện (No.)</label>
              <input
                type="text"
                value={selectedRoom?.meterId || ''}
                onChange={(e) => setSelectedRoom(prev => prev ? {...prev, meterId: e.target.value} : null)}
                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Số điện mới</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={electricityNew}
                  onChange={(e) => setElectricityNew(Number(e.target.value))}
                  className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    isProcessingOCR ? "bg-gray-100 text-gray-400" : "bg-black text-white hover:bg-gray-800"
                  )}
                  disabled={isProcessingOCR}
                >
                  {isProcessingOCR ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleOCRMeter} className="hidden" accept="image/*" />
              </div>
              {meterImage && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ảnh đồng hồ điện:</p>
                  <img src={meterImage} alt="Meter" className="w-full h-32 object-cover rounded-xl border border-gray-200" />
                </div>
              )}
              {selectedRoom && (
                <div className="text-xs text-gray-500">
                  <p>Số điện cũ: {selectedRoom.lastElectricityMeter} kWh</p>
                  {selectedRoom.meterId && <p className="font-bold">Mã ĐH: {selectedRoom.meterId}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Dịch vụ thêm</label>
              <div className="flex gap-2">
                <input id="service-name" placeholder="Tên dịch vụ" className="flex-1 p-3 bg-gray-50 border-none rounded-xl text-sm" />
                <input id="service-price" type="number" placeholder="Giá" className="w-24 p-3 bg-gray-50 border-none rounded-xl text-sm" />
                <button
                  onClick={() => {
                    const name = (document.getElementById('service-name') as HTMLInputElement).value;
                    const price = Number((document.getElementById('service-price') as HTMLInputElement).value);
                    if (name && price) {
                      setExtraServices([...extraServices, { name, price }]);
                      (document.getElementById('service-name') as HTMLInputElement).value = '';
                      (document.getElementById('service-price') as HTMLInputElement).value = '';
                    }
                  }}
                  className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-1 mt-2">
                {extraServices.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded-lg">
                    <span>{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatCurrency(s.price)}</span>
                      <button onClick={() => setExtraServices(extraServices.filter((_, idx) => idx !== i))} className="text-rose-500">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-[2rem] p-6 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Xem trước hóa đơn</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tiền phòng:</span>
                  <span className="font-bold">{formatCurrency(selectedRoom?.price || 0)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tiền điện ({electricityUsed} kWh):</span>
                    <span className="font-bold">{formatCurrency(electricityPrice)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Chỉ số: {electricityOld} → {electricityNew}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tiền nước:</span>
                  <span className="font-bold">{formatCurrency(waterPrice)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500">Dịch vụ:</span>
                  {extraServices.map((s, i) => (
                    <div key={i} className="flex justify-between text-xs pl-2">
                      <span>{s.name}</span>
                      <span>{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200 mt-6">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tổng thanh toán</p>
              <h4 className="text-3xl font-black">{formatCurrency(totalPrice)}</h4>
              <Button
                onClick={handleCreateInvoice}
                disabled={!selectedRoom}
                size="lg"
                className="w-full mt-6"
              >
                {editingInvoice ? 'Cập nhật hóa đơn' : 'Xuất hóa đơn'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
