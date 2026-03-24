# Mai House Apartment Management - Design System

## Generated from UI/UX Pro Max Skill

### Pattern
- **Type**: Real-Time / Operations Landing
- **Conversion**: For ops/security/iot products. Demo or sandbox link. Trust signals.
- **CTA**: Primary CTA in nav + After metrics
- **Sections**:
  1. Hero (product + live preview or status)
  2. Key metrics/indicators
  3. How it works
  4. CTA (Start trial / Contact)

### Style
- **Style**: Glassmorphism
- **Keywords**: Frosted glass, transparent, blurred background, layered, vibrant background, light source, depth, multi-layer
- **Best For**: Modern SaaS, financial dashboards, high-end corporate, lifestyle apps, modal overlays, navigation
- **Performance**: ⚠ Good | **Accessibility**: ⚠ Ensure 4.5:1

### Color Palette
- **Primary (Blue for Rooms)**: `#2563EB` (blue-600)
- **Secondary**: `#3B82F6` (blue-500)
- **CTA**: `#F97316` (orange-500)
- **Background**: `#F8FAFC` (slate-50)
- **Text**: `#1E293B` (slate-800)
- **Guest Color (Purple)**: `#9333EA` (purple-600)
- **Success**: `#22C55E` (green-500)
- **Warning**: `#EAB308` (yellow-500)
- **Error**: `#EF4444` (red-500)

### Typography
- **Font Family**: Fira Code / Fira Sans
- **Mood**: dashboard, data, analytics, code, technical, precise
- **Best For**: Dashboards, analytics, data visualization, admin panels
- **Google Fonts**: https://fonts.google.com/share?selection?family=Fira+Code:wght@400;500;600;700|Fira+Sans:wght@300;400;500;600;700

### Key Effects
- Backdrop blur (10-20px)
- Subtle border (1px solid rgba white 0.2)
- Light reflection
- Z-depth layering

### Anti-Patterns to Avoid
- Slow updates + No automation
- Emojis as icons (use SVG: Heroicons/Lucide)
- Missing cursor-pointer on clickable elements
- No hover states
- Light mode text contrast < 4.5:1
- Missing focus states
- Not respecting prefers-reduced-motion

### Responsive Breakpoints
- 375px (small phone)
- 768px (tablet)
- 1024px (desktop)
- 1440px (large desktop)

### Accessibility Requirements
- ✅ No emojis as icons (use SVG)
- ✅ cursor-pointer on all clickable elements
- ✅ Hover states with smooth transitions (150-300ms)
- ✅ Light mode: text contrast 4.5:1 minimum
- ✅ Focus states visible for keyboard nav
- ✅ prefers-reduced-motion respected
- ✅ Responsive: 375px, 768px, 1024px, 1440px

### Component Specifications

#### Room Card
- **Style**: Glassmorphism card with backdrop-blur
- **Border**: 1px solid rgba(255,255,255,0.2)
- **Shadow**: Subtle depth
- **Hover**: Scale 1.02, shadow increase
- **Colors**:
  - Room info: Blue (#2563EB)
  - Guest info: Purple (#9333EA)
  - Status badges with semantic colors

#### Status Badges
- **Occupied**: Green background, green text
- **Upcoming**: Yellow background, yellow text
- **Empty**: Gray background, gray text

#### Buttons
- **Primary**: Orange CTA (#F97316)
- **Secondary**: Blue (#2563EB)
- **Hover**: Darken by 10%
- **Transition**: 200ms ease-out

#### Modals
- **Backdrop**: rgba(0,0,0,0.5) with backdrop-blur
- **Content**: White glassmorphism card
- **Animation**: Scale + fade in (150ms)

#### Avatar Groups
- **Overlap**: -8px
- **Border**: 2px solid white
- **Size**: 32px or 40px

#### Tables
- **Header**: Bold, uppercase, tracking-wide
- **Rows**: Border bottom, hover background
- **Alignment**: Left align text, right align numbers
