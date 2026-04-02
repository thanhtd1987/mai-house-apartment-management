# Spec: Giá Điện & Nước - Flexible Pricing System

**Date:** 2026-04-03
**Status:** Design Approved

## Table of Contents
1. [Overview](#overview)
2. [Data Model](#data-model)
3. [UI Components](#ui-components)
4. [Workflows](#workflows)
5. [Error Handling](#error-handling)
6. [Implementation Steps](#implementation-steps)
7. [Testing Checklist](#testing-checklist)

---

## Overview

### Mục tiêu
Cho phép gán giá điện/nước khác nhau cho từng phòng, thay vì dùng 1 giá cố định cho toàn bộ.

### Vấn đề hiện tại
- Chỉ có 1 giá điện và 1 giá nước áp dụng cho tất cả phòng
- Không thể tùy chỉnh giá theo loại phòng, vị trí, hoặc khách hàng
- Hardcoded fallback values trong code

### Giải pháp
- Tạo nhiều pricing plans (giá điện, giá nước)
- Gán pricing plan cho từng phòng
- Lưu trực tiếp giá vào Room document (đơn giản, không cần reference)

### Lợi ích
- Linh hoạt: Phòng VIP có giá cao hơn, phòng thường có giá thấp hơn
- Đơn giản: Không cần lookup pricing table, đọc trực tiếp từ Room
- Dễ maintain: Mỗi phòng tự quản lý giá của mình

---

## Data Model

### 1. Room Interface Updates

**File:** `src/types/room.ts`

```typescript
export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double';
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
  price: number;              // Giá thuê phòng
  lastElectricityMeter: number;
  meterId?: string;
  paymentStatus: 'paid' | 'unpaid' | 'debt';
  
  // NEW: Giá điện & nước trực tiếp
  waterPrice?: number;       // Giá nước (VND/người)
  electricityPrice?: number; // Giá điện (VND/kWh)
  
  guests?: RoomGuest[];
  facilities?: string[];
  smartLockId?: string;
  hasSmartLock?: boolean;
}
```

**Notes:**
- `undefined` = chưa gán giá
- `0` = giá miễn phí (miễn phí)
- Logic tính toán vẫn giữ nguyên: `số người × waterPrice`

### 2. UtilityPricing Interface (Không đổi)

**File:** `src/types/utilityPricing.ts`

```typescript
interface UtilityPricing {
  id: string;
  type: 'water' | 'electricity';
  name: string;              // Ví dụ: "Giá nước Tháng 4", "Giá điện VIP"
  description?: string;
  pricingModel: 'fixed_per_person' | 'usage_based';
  basePrice: number;        // Giá cơ bản (VND/người hoặc VND/kWh)
  tieredPricing?: TieredPricing[];
  usageTiers?: UsageTier[];
  isActive: boolean;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

**Không cần thay đổi interface này!**

---

## UI Components

### Component 1: QuickInvoiceModal Updates

**File:** `src/components/invoices/QuickInvoiceModal.tsx`

#### 1.1. Thêm State cho Pricing Selector

```typescript
const [showPricingSelector, setShowPricingSelector] = useState(false);
```

#### 1.2. Thêm Section Hiển Thị Giá Hiện Tại

**Vị trí:** Sau phần chọn phòng, trước phần nhập chỉ số điện

```tsx
{/* Hiển thị giá hiện tại của phòng */}
<div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
  <div className="flex justify-between items-center">
    <div>
      <h4 className="font-semibold text-gray-900">Giá Điện & Nước</h4>
      <div className="text-sm text-gray-600">
        {room.waterPrice ? (
          <span>Giá nước: {formatCurrency(room.waterPrice)}/người</span>
        ) : (
          <span className="text-amber-600">Chưa có giá nước</span>
        )}
        <span className="mx-2">|</span>
        {room.electricityPrice ? (
          <span>Giá điện: {formatCurrency(room.electricityPrice)}/kWh</span>
        ) : (
          <span className="text-amber-600">Chưa có giá điện</span>
        )}
      </div>
    </div>
    <button
      onClick={() => setShowPricingSelector(true)}
      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
    >
      Chỉnh sửa
    </button>
  </div>
</div>
```

#### 1.3 Pricing Selector Popup

```tsx
{showPricingSelector && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-bold mb-4">Thiết lập giá điện/nước</h3>
      
      {/* Giá nước */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Giá nước <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedWaterPricingId}
          onChange={(e) => setSelectedWaterPricingId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="">-- Chọn giá nước --</option>
          {utilityPricing
            .filter(u => u.type === 'water' && u.isActive)
            .map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatCurrency(p.basePrice)}/người
              </option>
            ))
          }
        </select>
      </div>
      
      {/* Giá điện */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Giá điện <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedElectricityPricingId}
          onChange={(e) => setSelectedElectricityPricingId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="">-- Chọn giá điện --</option>
          {utilityPricing
            .filter(u => u.type === 'electricity' && u.isActive)
            .map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - {formatCurrency(p.basePrice)}/kWh
              </option>
            ))
          }
        </select>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCancelPricingSelection}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          onClick={handleSavePricingSelection}
          disabled={!selectedWaterPricingId || !selectedElectricityPricingId}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Lưu
        </button>
      </div>
    </div>
  </div>
)}
```

#### 1.4 Logic Xử Lý

```typescript
// Lấy pricing từ IDs
const selectedWaterPricing = utilityPricing.find(u => u.id === selectedWaterPricingId);
const selectedElectricityPricing = utilityPricing.find(u => u.id === selectedElectricityPricingId);

// Lưu vào Room
const handleSavePricingSelection = async () => {
  if (!selectedWaterPricing || !selectedElectricityPricing) return;
  
  try {
    await updateDoc(doc(db, 'rooms', room.id), {
      waterPrice: selectedWaterPricing.basePrice,
      electricityPrice: selectedElectricityPricing.basePrice
    });
    
    addToast('Đã cập nhật giá điện/nước', 'success');
    setShowPricingSelector(false);
  } catch (error) {
    addToast('Không thể cập nhật giá', 'error');
  }
};

// Check xem phòng đã có giá chưa
const roomHasPricing = room.waterPrice && room.electricityPrice;

// Auto-show popup nếu thiếu
useEffect(() => {
  if (isOpen && !roomHasPricing) {
    setShowPricingSelector(true);
  }
}, [isOpen, room]);
```

---

### Component 2: Room Details Updates

**File:** `src/components/rooms/RoomDetails.tsx`

#### 2.1 Thêm Section "Giá Điện & Nước"

**Vị trí:** Sau phần thông tin cơ bản, trước phần khách ở

```tsx
{/* Giá Điện & Nước */}
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
  <div className="flex justify-between items-start">
    <div className="flex-1">
      <h3 className="font-bold text-gray-900 mb-2">Giá Điện & Nước</h3>
      
      {/* Giá nước */}
      <div className="mb-2">
        <p className="text-xs text-gray-500">Giá nước</p>
        <div className="flex items-center gap-2">
          {room.waterPrice ? (
            <>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(room.waterPrice)}
              </span>
              <span className="text-sm text-gray-600">/người</span>
            </>
          ) : (
            <span className="text-sm text-amber-600 italic">Chưa thiết lập</span>
          )}
        </div>
      </div>
      
      {/* Giá điện */}
      <div>
        <p className="text-xs text-gray-500">Giá điện</p>
        <div className="flex items-center gap-2">
          {room.electricityPrice ? (
            <>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(room.electricityPrice)}
              </span>
              <span className="text-sm text-gray-600">/kWh</span>
            </>
          ) : (
            <span className="text-sm text-amber-600 italic">Chưa thiết lập</span>
          )}
        </div>
      </div>
    </div>
    
    <button
      onClick={() => setShowPricingModal(true)}
      className="px-3 py-1.5 text-sm bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50"
    >
      Chỉnh sửa
    </button>
  </div>
</div>
```

#### 2.2 Pricing Modal (giống QuickInvoiceModal)

```tsx
{showPricingModal && (
  <Modal onClose={() => setShowPricingModal(false)}>
    {/* Pricing Selector Popup - giống Component 1.3 */}
  </Modal>
)}
```

---

### Component 3: UtilityPricing Page Updates

**File:** `src/pages/UtilityPricing/index.tsx`

#### 3.1 Layout Structure

```tsx
export function UtilityPricingPage({ utilityPricing, ... }) {
  // State
  const [activeTab, setActiveTab] = useState<'water' | 'electricity'>('water');
  
  // Filter pricing by type
  const waterPricingList = utilityPricing.filter(u => u.type === 'water');
  const electricityPricingList = utilityPricing.filter(u => u.type === 'electricity');
  
  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button 
          className={activeTab === 'water' ? 'bg-blue-600 text-white' : 'bg-gray-100'}
          onClick={() => setActiveTab('water')}
        >
          Giá Nước
        </button>
        <button 
          className={activeTab === 'electricity' ? 'bg-blue-600 text-white' : 'bg-gray-100'}
          onClick={() => setActiveTab('electricity')}
        >
          Giá Điện
        </button>
      </div>
      
      {/* Pricing List */}
      {activeTab === 'water' ? (
        <WaterPricingList pricingList={waterPricingList} ... />
      ) : (
        <ElectricityPricingList pricingList={electricityPricingList} ... />
      )}
    </div>
  );
}
```

#### 3.2 Pricing Card Component

```tsx
function PricingCard({ pricing, onUpdate, onDelete }) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-900">{pricing.name}</h4>
          <p className="text-sm text-gray-500">
            {pricing.pricingModel === 'fixed_per_person' 
              ? `${formatCurrency(pricing.basePrice)}/người` 
              : 'Giá linh hoạt'}
          </p>
          <p className="text-xs text-gray-400">
            Hiệu lực từ: {new Date(pricing.effectiveDate).toLocaleDateString('vi-VN')}
          </p>
        </div>
        
        {/* Status badge */}
        <span className={`px-2 py-1 rounded text-xs ${
          pricing.isActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
        }`}>
          {pricing.isActive ? 'Đang áp dụng' : 'Ngưng áp dụng'}
        </span>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button onClick={() => handleEdit(pricing)}>
          <Edit2 size={16} />
        </button>
        <button onClick={() => handleDelete(pricing.id)}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
```

---

## Workflows

### Workflow 1: Tạo Pricing Plan Mới

1. User vào "Giá Điện & Nước" page
2. Chọn tab "Giá Nước" hoặc "Giá Điện"
3. Click button "+ Tạo giá nước mới" hoặc "+ Tạo giá điện mới"
4. Nhập form:
   - Tên (bắt buộc)
   - Loại (điện/nước) - tự động theo tab
   - Giá (bắt buộc, > 0)
   - Hiệu lực từ ngày (bắt buộc)
5. Click "Lưu"
6. System tạo document trong Firestore collection `utilityPricing`

### Workflow 2: Gán Giá Cho Phòng (từ Room Details)

1. User vào Rooms Manager
2. Click vào phòng → mở Room Details
3. Scroll xuống section "Giá Điện & Nước"
4. Click "Chỉnh sửa" button
5. Popup hiện lên với dropdown:
   - Chọn giá nước từ list
   - Chọn giá điện từ list
6. Click "Lưu"
7. System update Room document với `waterPrice` và `electricityPrice`

### Workflow 3: Gán Giá Cho Phòng (khi tạo hóa đơn)

1. User tạo hóa đơn từ QuickInvoiceModal
2. Chọn phòng
3. System kiểm tra:
   - Nếu phòng CÓ đủ 2 giá → Hiển thị normally
   - Nếu phòng THIẾU giá → Auto-show popup "Thiết lập giá điện/nước"
4. User chọn pricing plan cho cả điện và nước
5. Click "Lưu"
6. Popup đóng, user tiếp tục tạo hóa đơn bình thường

### Workflow 4: Tạo Hóa Đơn

1. User chọn phòng
2. System lấy giá từ `room.waterPrice` và `room.electricityPrice`
3. Tính toán:
   - Tiền nước = `số người × room.waterPrice`
   - Tiền điện = `số kWh × room.electricityPrice`
4. Hiển thị trong hóa đơn

---

## Error Handling

### 1. Validation Errors

#### Tạo Pricing Plan
- Tên trống → Error: "Vui lòng nhập tên pricing plan"
- Giá ≤ 0 → Error: "Giá phải lớn hơn 0"
- Ngày hiệu lực trong quá khứa → Error: "Ngày hiệu lực không hợp lệ"
- Tên trùng (cùng type + cùng tên) → Error: "Đã có pricing plan với tên này"

#### Gán Giá Cho Phòng
- Chưa chọn giá → Error: "Vui lòng chọn cả giá điện và giá nước"
- Invalid pricing ID → Error: "Giá không tồn tại"

### 2. Business Logic Errors

#### Khi xóa Pricing Plan đang được dùng
- Check: Có bao nhiêu phòng đang dùng pricing này?
- Warning: "Pricing này đang được {count} phòng dùng. Bạn có chắc chắn xóa?"
- Nếu xóa → Các phòng về trạng thái `waterPrice: undefined`, `electricityPrice: undefined`

#### Khi cập nhật Pricing Plan
- Không ảnh hưởng hóa đơn đã tạo (snapshot)
- Có ảnh hưởng các phòng đang dùng → Cần update
- Auto-show message: "{count} phòng đã được cập nhật giá mới"

### 3. Edge Cases

#### Phòng chưa có giá khi tạo hóa đơn
- **Block:** Không cho tạo hóa đơn
- **Action:** Show popup "Thiết lập giá điện/nước"
- **Message:** "Phòng này chưa có giá điện hoặc giá nước. Vui lòng thiết lập trước khi tạo hóa đơn."

#### Tất cả pricing plans bị de-active
- Warning: "Không có pricing plan nào đang hoạt động"
- Vẫn cho phép tạo, nhưng hiển thị warning

#### Room document không có field waterPrice/electricity (migration)
- Auto-check: Nếu field không tồn tại → treat là undefined
- Không crash, hiển thị "Chưa có giá"

---

## Implementation Steps

### Phase 1: Data Structure (15 phút)

**Step 1.1:** Update Room interface
```bash
# File: src/types/room.ts
```

```typescript
export interface Room {
  // ... existing fields
  waterPrice?: number;
  electricityPrice?: number;
}
```

**Step 1.2:** Update Firestore rules (đã done)
- Validation function `isValidUtilityPricing` đã cập nhật
- Deploy qua Firebase Console

### Phase 2: UI Components (60 phút)

**Step 2.1:** Create PricingSelectorPopup component
```bash
# File: src/components/pricing/PricingSelectorPopup.tsx
```

**Step 2.2:** Update QuickInvoiceModal
- Import PricingSelectorPopup
- Add state: `showPricingSelector`
- Add section hiển thị giá hiện tại
- Add logic auto-show popup khi thiếu giá
- Add button "Chỉnh sửa"

**Step 2.3:** Update RoomDetails
- Add section "Giá Điện & Nước"
- Add "Chỉnh sửa" button
- Integrate PricingSelectorPopup

**Step 2.4:** Update UtilityPricingPage
- Add tabs (Giá Nước / Giá Điện)
- Display pricing list by type
- Add create/edit/delete functions

### Phase 3: Integration (30 phút)

**Step 3.1:** Connect logic
- Pricing selector → update Room document
- QuickInvoiceModal → read giá từ Room
- RoomDetails → read giá từ Room

**Step 3.2:** Error handling
- Add validation for pricing selector
- Add warning when deleting active pricing
- Add toast notifications

### Phase 4: Testing (30 phút)

**Step 4.1:** Unit tests
- Component rendering tests
- Validation logic tests
- Integration tests

**Step 4.2:** Manual testing
- Tạo pricing plan mới
- Gán giá cho phòng
- Tạo hóa đơn
- Xóa pricing plan

---

## Testing Checklist

### Data Model
- [ ] Room interface có `waterPrice?: number` và `electricityPrice?: number`
- [ ] UtilityPricing interface không thay đổi
- [ ] Firestore rules deployed successfully

### UI Components
- [ ] PricingSelectorPopup component tạo
- [ ] QuickInvoiceModal hiển thị giá hiện tại
- [ ] QuickInvoiceModal có button "Chỉnh sửa"
- [ ] Popup auto-show khi phòng chưa có giá
- [ ] RoomDetails có section "Giá Điện & Nước"
- [ ] UtilityPricing Page có tabs (Giá Nước / Giá Điện)
- [ ] UtilityPricing Page list pricing plans theo type
- [ ] UtilityPricing Page có CRUD (create/read/update/delete)

### Workflows
- [ ] Tạo pricing plan mới thành công
- [ ] Gán giá cho phòng từ Room Details
- [ ] Gán giá cho phòng từ QuickInvoiceModal (khi thiếu giá)
- [ ] Tạo hóa đơn với phòng đã có giá
- [ ] Không thể tạo hóa đơn với phòng chưa có giá
- [ ] Xóa pricing plan hiển thị warning nếu đang được dùng
- [ ] Cập nhật pricing plan cập nhật các phòng đang dùng

### Error Handling
- [ ] Validation khi tạo pricing (tên, giá, ngày)
- [ ] Error khi chọn pricing không hợp lệ
- [ ] Warning khi xóa pricing đang được dùng
- [ ] Message khi phòng chưa có giá
- [ ] Toast notifications hiển thị đúng

### Edge Cases
- [ ] Phòng chưa có waterPrice/electricityPrice fields (migration)
- [ ] Tất cả pricing plans bị de-active
- [ ] Room có 1 giá (chỉ có nước hoặc chỉ có điện)
- [ ] Pricing selector hiển thị đúng pricing plans theo type

### Backward Compatibility
- [ ] Rooms cũ không có waterPrice/electricity → hiển thị "Chưa có giá"
- [ ] Hóa đơn cũ không bị ảnh hưởng
- [ ] Không crash khi field không tồn tại

---

## Migration Notes

### Rooms đã tồn tại
- **KHÔNG** cần migration script
- Rooms sẽ tự động có `waterPrice: undefined` và `electricityPrice: undefined`
- UI hiển thị "Chưa có giá" - cho phép user setup sau

### Database migration
- Không cần migration
- Fields mới là optional (`?`)

### Code migration
- QuickInvoiceModal: Cập nhật logic đọc giá từ Room
- UtilityPricingPage: Cập nhật để nhận prop từ App.tsx
- RoomDetails: Thêm UI components

---

## Related Files

### Data Types
- `src/types/room.ts` - Room interface

### Components
- `src/components/invoices/QuickInvoiceModal.tsx` - Main invoice creation modal
- `src/components/pricing/PricingSelectorPopup.tsx` - NEW - Pricing selector popup
- `src/components/rooms/RoomDetails.tsx` - Room detail view

### Pages
- `src/pages/UtilityPricing/index.tsx` - Pricing management page
- `src/pages/Rooms/index.tsx` - Rooms list page

### Stores
- `src/stores/dataStore.ts` - Utility pricing data

### Config
- `src/constants/routes.ts` - Menu title

---

## Success Criteria

### Functional Requirements
- ✅ Có thể tạo nhiều pricing plans (giá điện, giá nước)
- ✅ Có thể gán pricing plan cho từng phòng
- ✅ Khi tạo hóa đơn, dùng giá đã gán cho phòng
- ✅ Nếu phòng chưa có giá → block và yêu cầu set giá
- ✅ Có thể chỉnh giá cho phòng từ Room Details
- ✅ Có thể chỉnh giá cho phòng từ QuickInvoiceModal
- ✅ Có thể xóa pricing plans (với warning nếu đang được dùng)

### Non-Functional Requirements
- ✅ UI/UX rõ ràng, dễ sử dụng
- ✅ Error messages rõ ràng
- ✅ Loading states hiển thị đúng
- ✅ Không có hardcoded values
- ✅ Backward compatible với rooms cũ
- ✅ Performance không bị ảnh hưởng

---

## Notes

- Pricing plans là global, dùng cho nhiều phòng
- Giá lưu trực tiếp vào Room document (đơn giản, không cần lookup)
- Logic tính hóa đơn KHÔNG ĐỔI: vẫn là `số người × waterPrice`
- Rooms cũ tự động có giá = undefined
- Hóa đơn lưu snapshot, không affected khi pricing thay đổi
