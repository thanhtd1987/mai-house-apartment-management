# 🏗️ Frontend Architecture Review & Recommendations

## Current Structure Analysis

### ✅ Strengths
- Clear separation of concerns (components, hooks, services, utils)
- Modular and reusable components
- Custom hooks for business logic
- TypeScript for type safety
- Services abstraction layer

### 🔧 Areas for Improvement

## 1. Missing Critical Folders

### 📁 `src/constants/`
**Problem:** Magic values scattered across codebase
```typescript
// ❌ Current - Magic numbers/strings
waterPrice = 50000
aspectRatio = 3 / 4
```

**Solution:**
```typescript
// ✅ Proposed - Constants
// src/constants/invoice.ts
export const WATER_PRICE = 50000;
export const CROP_ASPECT_RATIO = 3 / 4;

// src/constants/evn.ts
export const EVN_TIERS = [...];
```

### 📁 `src/config/`
**Problem:** App configuration mixed with code
```typescript
// ❌ Current
process.env.GEMINI_API_KEY || ''
```

**Solution:**
```typescript
// ✅ Proposed
// src/config/index.ts
export const config = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
  firebase: firebaseConfig,
  app: {
    name: 'Mai House',
    version: '1.0.0'
  }
};
```

### 📁 `src/assets/`
**Problem:** No dedicated folder for static assets
```
src/assets/
├── images/
├── icons/
└── fonts/
```

### 📁 `src/types/` → Split into multiple files
**Problem:** Single `types.ts` file will grow large
```
src/types/
├── index.ts          # Export all types
├── room.ts           # Room-related types
├── guest.ts          # Guest-related types
├── invoice.ts        # Invoice-related types
├── facility.ts       # Facility-related types
└── common.ts         # Common types (API, UI, etc.)
```

### 📁 `src/lib/` or `src/core/`
**Problem:** Core utilities mixed with business utils
```
src/lib/
├── firebase/         # Firebase wrappers
├── api/              # API clients
└── logger/           # Logging utilities
```

---

## 2. Component Organization Issues

### 🎨 Missing Design System Components

**Problem:** Common UI patterns not reusable enough
```typescript
// ❌ Current - Repeated patterns
<div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
```

**Solution:**
```typescript
// ✅ Proposed - Design system components
// src/components/design/Card.tsx
export function Card({ children, variant = 'default', ...props }) {
  return (
    <div className={cn(cardVariants[variant])} {...props}>
      {children}
    </div>
  );
}
```

**Add to `src/components/design/`:**
- `Card.tsx`
- `Badge.tsx`
- `Avatar.tsx`
- `Table.tsx`
- `Form/` (FormGroup, FormLabel, FormError)

---

## 3. Routing & Navigation

### 🛣️ Replace Switch Case with Route Config

**Problem:** Hardcoded routing logic
```typescript
// ❌ Current
const renderContent = () => {
  switch (activeTab) {
    case 'dashboard': return <Dashboard ... />;
    case 'rooms': return <RoomsManager ... />;
    // ...
  }
};
```

**Solution:**
```typescript
// ✅ Proposed - Route config
// src/config/routes.ts
export const ROUTES = {
  dashboard: {
    path: '/dashboard',
    component: () => import('../pages/Dashboard'),
    title: 'Tổng quan',
    icon: LayoutDashboard,
    requiredPermissions: []
  },
  rooms: {
    path: '/rooms',
    component: () => import('../pages/Rooms'),
    title: 'Phòng & Trạng thái',
    icon: Bed,
    requiredPermissions: ['rooms:read']
  },
  // ...
} as const;

export type RouteKey = keyof typeof ROUTES;
```

---

## 4. State Management

### 📊 Missing Global State Strategy

**Problem:** Props drilling through components
```typescript
// ❌ Current
<App>
  <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
  <Header activeTab={activeTab} />
  <Content activeTab={activeTab} />
</App>
```

**Solution Options:**

**Option A: Context API (Simple)**
```typescript
// src/context/AppContext.tsx
export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    activeTab: 'dashboard',
    sidebarOpen: true,
    user: null
  });

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
};
```

**Option B: Zustand (Lightweight)**
```typescript
// src/store/appStore.ts
import create from 'zustand';

export const useAppStore = create((set) => ({
  activeTab: 'dashboard',
  sidebarOpen: true,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }))
}));
```

---

## 5. Error Handling

### 🚨 Missing Error Boundaries

**Problem:** No error catching at component level

**Solution:**
```typescript
// src/components/common/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## 6. Component Composition Issues

### 🧩 App.tsx Too Large (Still)

**Problem:** Login logic, routing, state all in one place

**Solution:**
```typescript
// ✅ Proposed structure
src/
├── App.tsx                    # Just root + providers
├── components/
│   ├── app/
│   │   ├── AppLayout.tsx      # Main layout wrapper
│   │   ├── LoginPage.tsx      # Extract login page
│   │   ├── AppLoading.tsx     # Loading component
│   │   └── ProtectedRoute.tsx # Auth wrapper
│   ├── common/                # Reusable UI
│   └── features/              # Feature-specific components
```

**App.tsx becomes:**
```typescript
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

---

## 7. Hooks Organization

### 🪝 Split Large Hooks

**Problem:** `useFirestoreData` does too much

**Solution:**
```typescript
// ❌ Current
export function useFirestoreData(user) {
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [invoices, setInvoices] = useState([]);
  // 100+ lines...
}

// ✅ Proposed - Single responsibility
export function useRooms() { /* ... */ }
export function useGuests() { /* ... */ }
export function useFacilities() { /* ... */ }
export function useInvoices() { /* ... */ }

// OR use generic hook
export function useCollection<T>(collectionName: string) {
  // Generic hook for all collections
}
```

---

## 8. API Layer Improvements

### 🔌 Abstract Firebase Implementation

**Problem:** Firebase calls scattered in components

**Solution:**
```typescript
// ✅ Proposed - Repository pattern
// src/services/repositories/RoomRepository.ts
export class RoomRepository {
  static async getAll(filters?: RoomFilters): Promise<Room[]> {
    // Implementation
  }

  static async create(data: CreateRoomDTO): Promise<Room> {
    // Implementation
  }

  static async update(id: string, data: UpdateRoomDTO): Promise<void> {
    // Implementation
  }

  static async delete(id: string): Promise<void> {
    // Implementation
  }
}

// Usage in component:
const rooms = useRooms();
await RoomRepository.create(roomData);
```

---

## 9. Testing Structure

### 🧪 Add Test Framework Setup

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── integration/
│   └── e2e/
├── setupTests.ts
└── test-utils.tsx
```

---

## 10. Performance Optimizations

### ⚡ Add Code Splitting

**Problem:** All code loaded at once

**Solution:**
```typescript
// ✅ Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Rooms = lazy(() => import('./pages/Rooms'));

// With Suspense boundary
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

---

## 11. TypeScript Improvements

### 📘 Strict Typing

**Problem:** Some `any` types, loose typing

**Solution:**
```typescript
// ❌ Current
catch (err: any) { }

// ✅ Proposed
catch (err: unknown) {
  if (err instanceof Error) {
    // Handle error
  }
}

// Use proper utility types
type CreateRoomDTO = Omit<Room, 'id'>;
type UpdateRoomDTO = Partial<CreateRoomDTO>;
```

---

## 12. Styling Improvements

### 🎨 Add Theme System

**Problem:** Hardcoded colors, no dark mode support

**Solution:**
```typescript
// ✅ Proposed
// src/styles/theme.ts
export const theme = {
  colors: {
    primary: {
      50: '#f9fafb',
      // ... full palette
      900: '#111827'
    },
    // Semantic colors
    background: 'var(--color-bg-primary)',
    foreground: 'var(--color-text-primary)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    // ...
  },
  borderRadius: {
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '2.5rem'
  }
} as const;

// Use in components:
className="bg-primary-500 text-foreground"
```

---

## Proposed Final Structure

```
src/
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
│
├── assets/                    # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/
│   ├── app/                   # App-level components
│   │   ├── AppLayout.tsx
│   │   ├── LoginPage.tsx
│   │   ├── AppLoading.tsx
│   │   └── ProtectedRoute.tsx
│   ├── common/                # Reusable UI
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── design/                # Design system
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── index.ts
│   └── features/              # Feature-specific
│       ├── rooms/             # Room-related components
│       │   ├── RoomCard.tsx
│       │   ├── RoomForm.tsx
│       │   └── RoomList.tsx
│       ├── guests/
│       ├── invoices/
│       └── facilities/
│
├── config/                    # Configuration
│   ├── routes.ts              # Route definitions
│   ├── theme.ts               # Theme config
│   ├── constants.ts           # App constants
│   └── index.ts
│
├── constants/                 # Constants
│   ├── evn.ts                 # EVN electricity tiers
│   ├── invoice.ts             # Invoice constants
│   └── index.ts
│
├── context/                   # React Context
│   ├── AuthContext.tsx
│   ├── AppContext.tsx
│   └── index.ts
│
├── hooks/                     # Custom hooks
│   ├── useAuth.ts
│   ├── useRooms.ts
│   ├── useInvoices.ts
│   └── index.ts
│
├── services/                  # External services
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── index.ts
│   ├── ai/
│   │   └── gemini.ts
│   ├── repositories/          # Data layer
│   │   ├── RoomRepository.ts
│   │   ├── GuestRepository.ts
│   │   └── index.ts
│   └── index.ts
│
├── pages/                     # Page components
│   ├── Dashboard/
│   ├── Rooms/
│   ├── Guests/
│   ├── Facilities/
│   └── Invoices/
│
├── types/                     # TypeScript types
│   ├── index.ts
│   ├── room.ts
│   ├── guest.ts
│   ├── invoice.ts
│   ├── facility.ts
│   └── common.ts
│
├── utils/                     # Utility functions
│   ├── currency.ts
│   ├── date.ts
│   ├── validation.ts
│   └── index.ts
│
├── styles/                    # Styles
│   ├── index.css
│   ├── theme.css
│   └── globals.css
│
└── __tests__/                 # Tests
    ├── unit/
    ├── integration/
    └── test-utils.tsx
```

---

## Priority Implementation Order

### 🔴 High Priority (Do Now)
1. ✅ Split `types.ts` into multiple files
2. ✅ Create `constants/` folder
3. ✅ Extract login page component
4. ✅ Add error boundary
5. ✅ Create loading components

### 🟡 Medium Priority (Do Soon)
6. ✅ Create route configuration
7. ✅ Add design system components (Card, Badge)
8. ✅ Implement theme system
9. ✅ Add repository pattern
10. ✅ Split large hooks

### 🟢 Low Priority (Nice to Have)
11. ⚪ Add state management (Zustand/Jotai)
12. ⚪ Add testing setup
13. ⚪ Implement code splitting
14. ⚪ Add i18n support
15. ⚪ Performance monitoring

---

## Quick Wins (Can be done in < 1 hour)

1. **Create constants folder**
   ```bash
   mkdir -p src/constants
   # Move EVN_TIERS, WATER_PRICE here
   ```

2. **Extract login component**
   ```bash
   # Move login JSX from App.tsx to components/app/LoginPage.tsx
   ```

3. **Split types.ts**
   ```bash
   mkdir -p src/types
   # Split into room.ts, guest.ts, etc.
   ```

4. **Add error boundary**
   ```bash
   # Create components/common/ErrorBoundary.tsx
   # Wrap App in ErrorBoundary
   ```

---

## Conclusion

Current structure is **good** but can be **excellent** with these improvements. Focus on:

1. **Constants** - Remove magic values
2. **Component extraction** - Reduce App.tsx complexity
3. **Type organization** - Split large type files
4. **Error handling** - Add boundaries
5. **Route config** - Replace switch cases

These changes will improve:
- 📈 **Maintainability** - Easier to find and fix code
- 🔄 **Reusability** - More shared components
- 🧪 **Testability** - Easier to test in isolation
- 📦 **Scalability** - Ready for future growth
- 🎯 **Developer Experience** - Clearer code organization
