# Smart Lock Management System Design

**Date:** 2026-03-28
**Status:** Approved
**Approach:** Separate SmartLock Entity (Approach 2)

## Overview

Add smart lock management functionality to the Mai House apartment management system. Admins can manage door locks for individual rooms, including password management, expiry tracking, and battery replacement tracking.

### Key Features
- Track smart locks per room (not all rooms have locks)
- Manage current password and expiry dates
- Track battery replacement schedule (45-day intervals)
- In-app notifications for expiring passwords and battery replacements
- Add/remove smart locks from rooms flexibly

---

## Data Model

### SmartLock Type

```typescript
interface SmartLock {
  id: string;
  roomId: string;              // Reference to Room
  password: string;            // Current password
  passwordExpiryDate: Date;    // Password expiration date

  // Battery tracking
  batteryReplacementDate: Date;      // Last battery replacement date
  nextBatteryReplacementDate: Date;  // Next replacement date (+45 days)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### Room Type Updates

```typescript
interface Room {
  // ... existing fields
  smartLockId?: string;        // Optional reference to SmartLock
  hasSmartLock?: boolean;      // Quick check without populating
}
```

### Firebase Structure

```
/smartLocks/{lockId}
  - roomId: "room_123"
  - password: "123456"
  - passwordExpiryDate: "2026-06-28"
  - batteryReplacementDate: "2026-03-15"
  - nextBatteryReplacementDate: "2026-04-29"
  - createdAt: timestamp
  - updatedAt: timestamp
```

---

## UI Components

### 2.1 Smart Lock Tab in Room Details

Display current lock information:
- Password (with show/hide toggle)
- Password expiry date with status badge (valid/expiring/expired)
- Battery replacement date + next replacement date

Actions:
- "Cập nhật password" - Update password and expiry
- "Cập nhật ngày thay pin" - Update battery replacement date
- "Xóa lock" - Remove lock from room (with confirmation)

### 2.2 Smart Locks Page (New)

**Route:** `/smart-locks`
**Sidebar Link:** "Smart Locks" with badge count (locks needing attention)

**Table displays:**
- Room number
- Password expiry status (valid/expiring soon/expired)
- Battery status (OK/need replacement)
- Actions (edit, delete)

**Filters:** All | Expiring Soon | Need Battery Replacement | Expired

### 2.3 Modal Components

**`SetupSmartLockModal`**
- For rooms without a lock
- Create new SmartLock with roomId
- Enter initial password + expiry date
- Enter last battery replacement date (optional)

**`UpdatePasswordModal`**
- Update existing password
- Choose expiry method: specific date OR duration (3/6 months from check-in)
- Auto-calculate if duration selected

**`UpdateBatteryModal`**
- Enter last battery replacement date
- Auto-calculate next replacement date (+45 days)

**`DeleteLockConfirmationModal`**
- Confirm before removing lock
- Warning about data loss
- Prevent deletion if room has active guests

### 2.4 Room Status Indicators

- **RoomCard & RoomList:** Display 🔒 icon if room has smart lock
  - Green: All OK
  - Yellow: Expiring soon (within 7 days)
  - Red: Expired OR needs battery replacement

### 2.5 Smart Lock Setup Flows

**Add Smart Lock (Room without lock):**
1. In Room Details, click "Thêm Smart Lock" button (shown when `hasSmartLock = false`)
2. Open `SetupSmartLockModal`
3. Create SmartLock with roomId
4. Enter password + expiry date
5. Enter battery replacement date (optional)

**Remove Smart Lock:**
1. In Room Details Smart Lock tab, click "Xóa Smart Lock"
2. Show confirmation dialog
3. Update Room: `smartLockId = null`, `hasSmartLock = false`

---

## Service Layer & Business Logic

### 3.1 New Hook: `useSmartLocks`

```typescript
const {
  smartLocks,           // List of all locks
  getLockByRoomId,      // Get lock for specific room
  createLock,           // Add lock to room
  updatePassword,       // Update password + expiry
  updateBattery,        // Update battery replacement date
  deleteLock,           // Remove lock
  checkExpiringLocks    // Get locks needing attention
} = useSmartLocks();
```

### 3.2 Firebase Service: `smartLockService`

```typescript
// CRUD operations
createSmartLock(roomId: string, data: Partial<SmartLock>)
updateSmartLock(lockId: string, data: Partial<SmartLock>)
deleteSmartLock(lockId: string)
getSmartLockByRoom(roomId: string): Promise<SmartLock | null>
getAllSmartLocks(): Promise<SmartLock[]>

// Queries
getExpiringPasswords(daysThreshold: number = 7): Promise<SmartLock[]>
getLocksNeedingBatteryReplacement(): Promise<SmartLock[]>
```

### 3.3 Notification Logic

Run on Dashboard load:

```typescript
const checkLockNotifications = async () => {
  const expiringPasswords = await getExpiringPasswords(7);
  const batteryIssues = await getLocksNeedingBatteryReplacement();

  if (expiringPasswords.length > 0 || batteryIssues.length > 0) {
    // Show toast notification with counts
    // Display message: "X smart locks need attention"
  }
};
```

**Dashboard Card:** "Smart Locks Need Attention" with count and link to `/smart-locks`

### 3.4 Auto-calculate Logic

- **Battery replacement:** When admin updates `batteryReplacementDate`, automatically calculate `nextBatteryReplacementDate = inputDate + 45 days`
- **Password expiry:** When admin selects duration (3 months, 6 months), calculate `passwordExpiryDate = checkInDate + duration`
- **Specific date:** Direct input without calculation

---

## Error Handling & Edge Cases

### 4.1 Validation Rules

- Password cannot be empty
- Password expiry date must be after current date
- Battery replacement date cannot be too far in future (> 1 year)
- Cannot create 2 locks for the same room

### 4.2 Edge Cases

**Room has active guests + password expiring:**
- Warn admin if password expires before guest checkout
- Display in Room Details: "Password expires before guest checkout"

**Room transition: has lock → no lock:**
- Confirm dialog: "Xóa lock sẽ mất thông tin password. Tiếp tục?"
- Prevent deletion if room has active guests

**Expired lock:**
- Display red badge "Đã hết hạn" everywhere
- Priority #1 in notification list

### 4.3 Error Messages

- Network error on update: "Không thể cập nhật. Vui lòng thử lại."
- Invalid input: "Ngày hết hạn không hợp lệ"
- Conflict: "Phòng này đã có smart lock"

---

## Files to Create/Modify

### New Files

**Types:**
- `src/types/smartLock.ts` - SmartLock interface

**Hooks:**
- `src/hooks/useSmartLocks.ts` - SmartLock CRUD hook

**Services:**
- `src/services/smartLockService.ts` - Firebase operations

**Components (Smart Lock):**
- `src/components/smartLocks/SetupSmartLockModal.tsx`
- `src/components/smartLocks/UpdatePasswordModal.tsx`
- `src/components/smartLocks/UpdateBatteryModal.tsx`
- `src/components/smartLocks/DeleteLockConfirmationModal.tsx`

**Pages:**
- `src/pages/SmartLocks/index.tsx` - Smart locks management page

### Modified Files

**Types:**
- `src/types/room.ts` - Add `smartLockId` and `hasSmartLock` fields

**Components (Room):**
- `src/components/rooms/RoomDetails.tsx` - Add Smart Lock tab
- `src/components/rooms/RoomCard.tsx` - Add lock icon indicator

**Routes:**
- `src/constants/routes.ts` - Add SMART_LOCKS route

**Layout:**
- `src/components/layout/Sidebar.tsx` - Add Smart Locks link with badge

**Pages:**
- `src/pages/Dashboard/index.tsx` - Add lock notification check on load

**Utils:**
- `src/utils/date.ts` - Add date calculation helpers (+45 days, +3/6 months)

---

## Implementation Considerations

### Security Notes
- Passwords stored in Firebase should be considered visible to admins
- No encryption requirements for this phase (admin-only access)
- Lock passwords come from third-party lock app, not generated by our system

### Performance
- Query smart locks on dashboard load (small dataset expected)
- Consider pagination if lock count grows significantly
- Cache lock data per room to avoid repeated queries

### Future Enhancements (Out of Scope)
- Direct integration with lock manufacturer API
- Automatic password generation
- Multi-tenant support (different passwords for different guests in same room)
- Email/SMS notifications
- Mobile app for lock management
