# Flutter App Design Specification
## Mai House Apartment Management - Mobile Application

**Project:** Mai House Apartment Management
**Platform:** Flutter (Android + iOS)
**Date:** 2026-03-28
**Version:** 1.0
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Feature Modules](#feature-modules)
5. [State Management](#state-management)
6. [UI/UX Design System](#uiux-design-system)
7. [Internationalization](#internationalization)
8. [Data Layer & Firebase Integration](#data-layer--firebase-integration)
9. [Navigation & User Flows](#navigation--user-flows)
10. [Technical Stack](#technical-stack)
11. [Development Phases](#development-phases)
12. [Testing Strategy](#testing-strategy)
13. [Security Considerations](#security-considerations)
14. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

### Purpose
Build a native mobile application for landlords/hostel owners to manage their properties on-the-go. The app provides full functionality of the existing web application with enhanced mobile experience.

### Target Users
- Primary: Landlords, hostel owners, property managers
- Secondary: Property management staff

### Key Features
- Room management (status, details, assignments)
- Quick invoice creation with OCR meter reading
- Guest management (check-in/out, history)
- Invoice tracking and sharing (image export)
- Dashboard with real-time statistics
- Multi-language support (Vietnamese, English)

### Platforms
- Android 6.0+ (API level 23+)
- iOS 12.0+

---

## Project Overview

### Current State
- Existing React web application with Firebase backend
- Features: Rooms, Guests, Invoices, Services, Dashboard, Settings
- Database: Firebase Firestore
- Authentication: Firebase Auth

### Mobile App Objectives
1. **Portability:** Manage properties anywhere, anytime
2. **Quick Actions:** Create invoices on-site with OCR
3. **Real-time Updates:** Sync with web app via Firebase
4. **Native Experience:** Smooth, responsive mobile UI
5. **Offline Support:** Basic functionality without internet

### Success Criteria
- Feature parity with web app (Phase 1)
- App Store & Play Store approval
- < 3s loading time for all screens
- 4.5+ star rating after 100 reviews
- 500+ DAU within 3 months

---

## Architecture

### Approach: Feature-First Modular Architecture

**Rationale:**
- Scalable for 9+ feature modules
- Team can work on features in parallel
- Clear boundaries, easy to test
- Reusable core components

### Directory Structure

```
lib/
├── main.dart
│
├── core/                          # Shared layer
│   ├── config/
│   │   ├── firebase_config.dart
│   │   ├── routes.dart
│   │   └── constants.dart
│   ├── theme/
│   │   ├── app_theme.dart
│   │   ├── colors.dart
│   │   ├── typography.dart
│   │   └── spacing.dart
│   ├── widgets/
│   │   ├── buttons/
│   │   ├── cards/
│   │   ├── forms/
│   │   └── loaders/
│   ├── providers/
│   │   ├── firebase_provider.dart
│   │   ├── auth_provider.dart
│   │   └── language_provider.dart
│   └── utils/
│       ├── formatters.dart
│       ├── validators.dart
│       └── helpers.dart
│
├── features/                      # Feature modules
│   ├── auth/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── models/
│   ├── rooms/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── repository/
│   ├── guests/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── repository/
│   ├── invoices/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── widgets/
│   │   ├── repository/
│   │   └── services/
│   │       └── ocr_service.dart
│   ├── services/
│   │   ├── providers/
│   │   ├── screens/
│   │   └── widgets/
│   ├── facilities/
│   │   ├── providers/
│   │   └── screens/
│   ├── dashboard/
│   │   ├── providers/
│   │   ├── screens/
│   │   └── widgets/
│   ├── utility_pricing/
│   │   ├── providers/
│   │   └── screens/
│   └── settings/
│       ├── providers/
│       └── screens/
│
├── shared/                        # Cross-feature data
│   ├── models/
│   │   ├── room.dart
│   │   ├── guest.dart
│   │   ├── invoice.dart
│   │   ├── extra_service.dart
│   │   └── facility.dart
│   ├── services/
│   │   ├── firebase_service.dart
│   │   ├── firestore_service.dart
│   │   └── storage_service.dart
│   └── repositories/
│       ├── room_repository.dart
│       ├── guest_repository.dart
│       └── invoice_repository.dart
│
└── l10n/                          # Internationalization
    ├── en.json
    └── vi.json
```

### Architecture Principles

1. **Feature Isolation:** Each feature is self-contained with its own providers, screens, widgets
2. **Shared Core:** Common UI components, utilities, and configuration in `core/`
3. **Data Abstraction:** Repository pattern isolates data layer from business logic
4. **State Management:** Riverpod providers handle all async state and business logic
5. **Type Safety:** Leverage Dart's strong typing throughout

---

## Feature Modules

### 1. Authentication (`auth/`)

**Purpose:** User authentication and authorization

**Screens:**
- LoginScreen
- RegisterScreen
- ForgotPasswordScreen
- BiometricAuthScreen (optional)

**Key Features:**
- Email/password authentication
- Biometric login (fingerprint, face ID)
- Auto-login with saved credentials
- Session management

**Providers:**
- `authControllerProvider` - Manages auth state
- `authStateProvider` - Stream<User?> for auth state changes

---

### 2. Room Management (`rooms/`) ⭐ PRIORITY

**Purpose:** Manage room inventory and status

**Screens:**
- RoomListScreen
- RoomDetailScreen
- RoomFilterScreen

**Key Features:**
- List all rooms with status indicators
- Real-time status updates (available, occupied, reserved)
- Room details (capacity, type, current guest, meter readings)
- Filter/search by status, type, floor
- Quick actions from list (swipe to edit/delete)

**Providers:**
- `roomListProvider` - Stream<List<Room>>
- `roomProvider(roomId)` - Future<Room>
- `roomFilterProvider` - Filter state

**Widgets:**
- RoomCard - Display room with status color coding
- RoomStatusBadge - Visual status indicator
- RoomListTile - Swipeable list item

---

### 3. Guest Management (`guests/`)

**Purpose:** Manage guest information and history

**Screens:**
- GuestListScreen
- GuestDetailScreen
- AddGuestScreen
- EditGuestScreen

**Key Features:**
- Guest directory with search
- Guest details (contact, room assignment, history)
- Check-in/check-out functionality
- Payment history tracking
- Guest search by name, phone, room

**Providers:**
- `guestListProvider` - Stream<List<Guest>>
- `guestProvider(guestId)` - Future<Guest>
- `guestHistoryProvider(guestId)` - Stream<List<Invoice>>

---

### 4. Invoice Management (`invoices/`) ⭐ PRIORITY

**Purpose:** Create and manage invoices

**Screens:**
- InvoiceListScreen
- InvoiceDetailScreen
- CreateInvoiceScreen (multi-step wizard)
- EditInvoiceScreen

**Key Features:**
- **Quick Invoice Creation:**
  - Step 1: Select room
  - Step 2: Enter meter readings (with OCR)
  - Step 3: Confirm water & services
  - Step 4: Review & create
- Invoice list with filters (all, pending, paid, overdue)
- Invoice details with line items
- Edit invoice (before payment)
- Export invoice as image (PNG)
- Share invoice (Zalo, Messenger, email)
- Payment status tracking

**Providers:**
- `invoiceListProvider` - Stream<List<Invoice>>
- `invoiceProvider(invoiceId)` - Future<Invoice>
- `createInvoiceProvider` - Action provider
- `invoiceFilterProvider` - Filter state

**Services:**
- `OcrService` - ML Kit text recognition for meter readings

**Widgets:**
- InvoiceCard - Invoice list item with status badge
- InvoiceSummary - Total amount breakdown
- MeterReadingInput - Input field with OCR button
- ShareBottomSheet - Share options sheet

---

### 5. Extra Services (`services/`)

**Purpose:** Manage additional services (laundry, motorbike parking, etc.)

**Screens:**
- ServiceListScreen
- ServiceDetailScreen
- AddServiceScreen

**Key Features:**
- Service catalog with pricing
- Add service to guest
- Service usage tracking
- Service history

**Providers:**
- `serviceListProvider` - Stream<List<ExtraService>>
- `serviceUsageProvider(guestId)` - Stream<List<ServiceUsage>>

---

### 6. Facilities (`facilities/`)

**Purpose:** Manage room facilities and amenities

**Screens:**
- FacilityListScreen
- FacilityDetailScreen

**Key Features:**
- Facility inventory (AC, washing machine, etc.)
- Facility availability per room
- Maintenance status tracking

---

### 7. Dashboard (`dashboard/`)

**Purpose:** Overview statistics and insights

**Screens:**
- DashboardScreen (main)

**Key Features:**
- Revenue overview (today, month, year)
- Room occupancy rate
- Pending invoices count
- Revenue charts (bar, line, pie)
- Quick stats cards
- Alerts (overdue invoices, expiring leases)

**Providers:**
- `dashboardStatsProvider` - Dashboard statistics
- `revenueChartProvider` - Chart data
- `alertsProvider` - Active alerts

**Widgets:**
- StatsCard - Metric display
- RevenueChart - fl_chart integration
- AlertCard - Warning/notification card

---

### 8. Utility Pricing (`utility_pricing/`)

**Purpose:** Configure electricity and water pricing

**Screens:**
- PricingConfigScreen
- PricingHistoryScreen

**Key Features:**
- Set electricity price per kWh
- Set water price per person
- Pricing history
- Bulk price updates

**Providers:**
- `utilityPricingProvider` - Current pricing
- `pricingHistoryProvider` - Historical data

---

### 9. Settings (`settings/`)

**Purpose:** App configuration and user preferences

**Screens:**
- SettingsScreen
- ProfileScreen
- LanguageSelectorScreen
- NotificationsSettingsScreen

**Key Features:**
- User profile management
- Language selection (VI/EN)
- Notification preferences
- Theme selection (light/dark)
- About app
- Logout

**Providers:**
- `settingsProvider` - User settings
- `languageProvider` - Current locale

---

## State Management

### Solution: Riverpod 2.6+

**Why Riverpod:**
- Type-safe at compile time
- Less boilerplate than Bloc
- Excellent Firebase integration
- Easy to test
- Modern, recommended by Flutter team

### Provider Types

**1. Notifier Providers (State + Actions)**
```dart
@provider
class RoomListNotifier extends AutoDisposeNotifier<AsyncValue<List<Room>>> {
  @override
  List<Room> build(RoomListNotifierProviderRef ref) {
    final repo = ref.read(roomRepositoryProvider);
    return repo.getRooms();
  }
}
```

**2. Future Providers (Single async value)**
```dart
@provider
FutureProvider<Room> roomProvider(Ref ref, String roomId) {
  return ref.read(roomRepositoryProvider).getRoom(roomId);
}
```

**3. Stream Providers (Real-time updates)**
```dart
@provider
StreamProvider<List<Invoice>> invoiceListProvider(Ref ref) {
  return ref.read(invoiceRepositoryProvider).watchInvoices();
}
```

**4. Regular Providers (Immutable values)**
```dart
@provider
String appTitleProvider(Ref ref) {
  return 'Mai House';
}
```

### Provider Examples

**Auth Provider:**
```dart
@provider
class AuthController extends AutoDisposeNotifier<AsyncValue<User?>> {
  @override
  User? build(AuthControllerProviderRef ref) {
    return FirebaseAuth.instance.currentUser;
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final credential = await FirebaseAuth.instance
          .signInWithEmailAndPassword(email: email, password: password);
      return credential.user;
    });
  }

  Future<void> logout() async {
    await FirebaseAuth.instance.signOut();
    state = const AsyncValue.data(null);
  }
}
```

**Invoice Creation Provider:**
```dart
@provider
class CreateInvoiceNotifier extends AutoDisposeNotifier<AsyncValue<void>> {
  Future<void> create(InvoiceData data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await ref.read(invoiceRepositoryProvider).createInvoice(data);
    });
  }
}
```

### Usage in Widgets

**Watching State:**
```dart
class RoomListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roomsAsync = ref.watch(roomListProvider);

    return roomsAsync.when(
      data: (rooms) => ListView.builder(
        itemCount: rooms.length,
        itemBuilder: (context, index) => RoomCard(room: rooms[index]),
      ),
      loading: () => CircularProgressIndicator(),
      error: (err, stack) => ErrorWidget(err.toString()),
    );
  }
}
```

**Performing Actions:**
```dart
FloatingActionButton(
  onPressed: () {
    ref.read(createInvoiceProvider.notifier).create(invoiceData);
  },
  child: Icon(Icons.add),
)
```

### Local State vs Global State

**Global State (Riverpod):**
- Authentication
- Data lists (rooms, guests, invoices)
- User settings, preferences
- Firebase Firestore streams

**Local State (StatefulWidget):**
- Form field values (TextEditingController)
- UI toggles (checkbox, switch)
- Temporary selections
- Animation states

---

## UI/UX Design System

### Design Philosophy
- Clean & Minimal
- Thumb-Friendly (actions within reach)
- Fast & Responsive (instant feedback)
- Clear Visual Hierarchy

### Color Palette

**Primary Colors:**
- Primary: `#10B981` (Emerald 500)
- Secondary: `#0F766E` (Teal 600)
- Accent: `#F59E0B` (Amber 500)

**Neutral Colors:**
- Background: `#F9FAFB` (Gray 50)
- Surface: `#FFFFFF` (White)
- Text: `#111827` (Gray 900)
- Subtext: `#6B7280` (Gray 500)

**Semantic Colors:**
- Success: `#10B981` (Emerald 500)
- Warning: `#F59E0B` (Amber 500)
- Error: `#EF4444` (Red 500)
- Info: `#3B82F6` (Blue 500)

### Typography

**Font Family:** Inter (Google Fonts)

**Scale:**
- H1: 32px, Bold (Screen titles)
- H2: 24px, SemiBold (Section headers)
- H3: 20px, Medium (Card titles)
- Body Large: 16px, Regular
- Body: 14px, Regular
- Caption: 12px, Regular
- Tabular Numbers: 20-28px, Bold (Prices, meters)

### Spacing (8pt Grid)

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

### Component Specifications

**Bottom Navigation Bar:**
- Height: 56px
- 5 tabs: Home, Stats, Quick, Invoice, Settings
- Active color: Primary (#10B981)
- Floating Action Button: 56px, elevated

**Buttons:**
- Primary: Height 48px, full width, background #10B981
- Secondary: Height 48px, outline 2px #10B981
- Radius: 12px

**Cards:**
- Border radius: 16px
- Elevation: 2dp
- Padding: 16px
- Subtle box-shadow

**Room Status Cards:**
- Green background: Available (#10B981)
- Blue background: Occupied (#3B82F6)
- Yellow background: Reserved (#F59E0B)

**Invoice List Item:**
- Room name + month
- Guest name
- Total amount
- Status badge (Paid/Pending/Overdue)

### UX Patterns

**Swipe Actions:**
- Swipe left: Edit
- Swipe right: Delete
- Long press: Context menu

**Pull to Refresh:**
- All list screens support pull-to-refresh

**Empty States:**
- Friendly illustration + message
- Call-to-action button

**Loading States:**
- Skeleton screens (shimmer effect)
- Not just spinners

**Feedback:**
- Toast messages (bottom)
- In-app notifications
- Haptic feedback on important actions
- Confirmation dialogs for destructive actions

---

## Internationalization

### Solution: easy_localization

**Languages:**
- Vietnamese (vi) - Default
- English (en)

### File Structure

```
assets/translations/
├── en.json
└── vi.json
```

### Key Structure

```json
{
  "appName": "Mai House",
  "home": {
    "title": "Home",
    "greeting": "Hello, {{name}}"
  },
  "rooms": {
    "title": "Rooms",
    "status": {
      "available": "Available",
      "occupied": "Occupied",
      "reserved": "Reserved"
    }
  },
  "invoice": {
    "title": "Invoice",
    "create": "Create Invoice"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

### Usage

```dart
// Basic translation
Text('home.title'.tr())

// With parameters
Text('home.greeting'.tr(namedArgs: {'name': 'John'}))

// Pluralization
Text('room.count'.tr(plural: roomCount, namedArgs: {'count': roomCount}))
```

### Language Switcher

Runtime language switching in Settings screen:
```dart
ref.read(languageProvider.notifier).setLanguage(const Locale('en'));
```

---

## Data Layer & Firebase Integration

### Firebase Services

**Firestore Database:**
```
collections/
├── users/{userId}
├── rooms/{roomId}
├── guests/{guestId}
├── invoices/{invoiceId}
├── extra_services/{serviceId}
├── facilities/{facilityId}
└── utility_pricing/{pricingId}
```

**Authentication:**
- Email/Password
- Biometric (local, optional)

**Storage:**
- Meter reading photos
- Room photos
- Invoice images (exported)

### Repository Pattern

**RoomRepository:**
```dart
class RoomRepository {
  final FirebaseService _firebase;

  Stream<List<Room>> getRooms() {
    return _firestore
      .collection('rooms')
      .snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => Room.fromFirestore(doc)));
  }

  Future<Room> getRoom(String roomId) {
    return _firestore.collection('rooms').doc(roomId).get()
      .then((doc) => Room.fromFirestore(doc));
  }

  Future<void> updateRoom(Room room) {
    return _firestore.collection('rooms').doc(room.id).update(room.toJson());
  }
}
```

**InvoiceRepository:**
```dart
class InvoiceRepository {
  Future<void> createInvoice(InvoiceData data) {
    return _firestore.collection('invoices').add(data.toJson());
  }

  Stream<List<Invoice>> watchInvoices() {
    return _firestore.collection('invoices').snapshots()
      .map((snapshot) => snapshot.docs.map((doc) => Invoice.fromFirestore(doc)));
  }
}
```

### Data Models

```dart
class Room {
  final String id;
  final String number;
  final RoomType type;
  final int capacity;
  final int price;
  final RoomStatus status;
  final int lastElectricityMeter;

  Room({...});

  factory Room.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Room(
      id: doc.id,
      number: data['number'],
      type: RoomType.values.firstWhere((e) => e.name == data['type']),
      // ... other fields
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'number': number,
      'type': type.name,
      // ... other fields
    };
  }
}
```

---

## Navigation & User Flows

### Primary Navigation

**Bottom Tab Bar (5 tabs):**
1. 🏠 Home (Dashboard)
2. 📊 Stats (Dashboard)
3. ➕ Quick (Action Hub)
4. 📄 Invoice (Bills)
5. ⚙️ Menu (Settings)

### Key User Flows

**1. Launch App → Dashboard**
- Splash screen (2s)
- Login (if not authenticated)
- Onboarding (first time, skippable)
- Home screen (dashboard)

**2. Quick Invoice Creation** (Most Important)
- Tap ➕ button → Quick Invoice Options
- Select "Tạo hóa đơn"
- Step 1: Select room (pill selector)
- Step 2: Enter meter reading (with OCR)
- Step 3: Confirm water & services
- Step 4: Review & create
- Success dialog with share option

**3. View & Share Invoice**
- Invoice list → Tap invoice
- Invoice detail screen
- Tap "Chia sẻ" → Export image
- Share sheet (Zalo, Messenger, etc.)

**4. Room Management**
- Room list with status indicators
- Filter by status
- Tap room → Room detail
- Quick actions (create invoice, edit room)

**5. Dashboard**
- Quick stats (rooms, revenue, pending)
- Revenue charts
- Alerts (overdue, expiring)
- Pull to refresh

---

## Technical Stack

### Core Framework
- **Flutter:** 3.24+
- **Dart:** 3.5+
- **Platforms:** Android 6.0+, iOS 12.0+

### State Management
- **Riverpod:** 2.6+
- **AsyncNotifier** for async state
- **AutoDispose** for memory optimization

### Backend & Data
- **Firebase Firestore:** NoSQL database
- **Firebase Authentication:** User auth
- **Firebase Storage:** File storage
- **Cloud Functions:** (Optional Phase 2)

### UI/UX
- **Material Design 3:** Design system
- **Inter:** Font family
- **fl_chart:** Charts/graphs
- **flutter_slidable:** Swipe actions
- **flutter_pull_to_refresh:** Pull-to-refresh

### Internationalization
- **easy_localization:** i18n solution
- **flutter_localizations:** Official support

### Features
- **google_ml_kit:** OCR for meter reading
- **image_gallery_saver:** Invoice image export
- **url_launcher:** Open links, send emails
- **share_plus:** Share content
- **shared_preferences:** Local storage

### Development Tools
- **VS Code + Flutter extension**
- **Firebase CLI**
- **flutter_launcher_icons**
- **flutter_native_splash**

### Testing
- **flutter_test:** Unit & widget tests
- **mockito:** Mocking
- **integration_test:** E2E tests

---

## Development Phases

### Phase 1: MVP (2-3 months) ⭐

**Must-Have Features:**
- Authentication (login, register)
- Room management (list, details, status)
- Quick invoice creation (OCR included)
- Invoice list & detail
- Basic dashboard
- Vietnamese + English

**Deliverables:**
- Android APK + iOS IPA
- TestFlight (iOS) + Internal Testing (Android)
- Core functionality complete

---

### Phase 2: Enhancement (1-2 months)

**Additional Features:**
- Guest management (check-in/out)
- Extra services
- Advanced dashboard (charts)
- Push notifications
- Offline mode support

**Deliverables:**
- Public store releases
- Analytics integration
- Performance optimization

---

### Phase 3: Advanced (1-2 months)

**Advanced Features:**
- Facility management
- Utility pricing config
- Reports export (Excel/PDF)
- Payment integration (Momo, Banking)
- Multi-language expansion

**Deliverables:**
- Full feature parity with web
- Enterprise features
- Marketing push

---

## Testing Strategy

### Unit Tests (70% coverage target)

**Repositories:**
- Mock FirebaseService
- Test CRUD operations
- Test error handling

**Providers:**
- Mock repositories
- Test state changes
- Test actions

**Utils:**
- Test formatters (currency, date)
- Test validators

### Widget Tests (50% coverage)

**Key Screens:**
- HomeScreen
- RoomListScreen
- CreateInvoiceScreen (all steps)
- InvoiceDetailScreen

**Important Widgets:**
- RoomCard
- InvoiceCard
- MeterReadingInput

### Integration Tests

**Critical Flows:**
- Login → Create Invoice → Share
- Change language → Verify all text
- Create invoice → Verify in list

---

## Security Considerations

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;
    }

    // Rooms: authenticated users can read, admins can write
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Invoices: authenticated users can read, creators can write
    match /invoices/{invoiceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
                           && resource.data.creatorId == request.auth.uid;
    }
  }
}
```

### Best Practices

- Validate all user inputs
- Sanitize data before storing
- Use HTTPS for all network requests
- Implement proper error handling
- Never expose API keys in client code
- Use Firebase Authentication for all data access
- Implement rate limiting (Cloud Functions)

---

## Deployment Strategy

### Development

**Firebase Project:**
- Separate dev project
- Test on real devices (Android + iOS)
- Internal testing track

### Production

**Firebase Project:**
- Separate prod project
- Migrate data/rules from dev

**App Stores:**
- Play Store: Staged rollout (20% → 50% → 100%)
- App Store: TestFlight → Production

### Post-Launch

**Monitoring:**
- Firebase Crashlytics (crash reports)
- Firebase Analytics (user behavior)
- Performance monitoring (slow screens)

**Support:**
- In-app feedback form
- Email support
- FAQ in app

---

## Appendix

### Firebase Schema (Existing)

**Room Document:**
```json
{
  "number": "101",
  "type": "single",
  "capacity": 2,
  "price": 500000,
  "status": "available",
  "lastElectricityMeter": 1000,
  "currentGuestId": "guest123" (optional)
}
```

**Invoice Document:**
```json
{
  "roomId": "room123",
  "guestId": "guest123",
  "month": 3,
  "year": 2026,
  "electricityOld": 1000,
  "electricityNew": 1234,
  "waterPrice": 120000,
  "electricityPrice": 468000,
  "extraServices": [...],
  "totalPrice": 1428000,
  "status": "pending",
  "createdAt": "2026-03-27T00:00:00Z",
  "creatorId": "user123"
}
```

### Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.6.0
  riverpod_annotation: ^2.6.0

  # Firebase
  firebase_core: ^3.0.0
  firebase_auth: ^5.0.0
  cloud_firestore: ^5.0.0
  firebase_storage: ^12.0.0

  # Internationalization
  easy_localization: ^3.0.7

  # UI Components
  fl_chart: ^0.68.0
  flutter_slidable: ^3.0.0
  pull_to_refresh: ^2.0.0

  # ML Kit (OCR)
  google_mlkit_text_recognition: ^0.11.0

  # Utilities
  url_launcher: ^6.2.0
  share_plus: ^7.2.0
  shared_preferences: ^2.2.0
  image_gallery_saver: ^2.0.0

  # Fonts
  google_fonts: ^6.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  mockito: ^5.4.0
  build_runner: ^2.4.0
  riverpod_generator: ^2.6.0
```

---

## Document Metadata

**Author:** Claude Sonnet 4.6
**Last Updated:** 2026-03-28
**Version:** 1.0
**Status:** Draft - Pending Review

---

## Next Steps

1. ✅ Design document complete
2. ⏳ User review and approval
3. ⏳ Create implementation plan (writing-plans skill)
4. ⏳ Begin Phase 1 development
