// Route configuration
export const ROUTES = {
  DASHBOARD: 'dashboard',
  ROOMS: 'rooms',
  GUESTS: 'guests',
  FACILITIES: 'facilities',
  INVOICES: 'invoices',
  UTILITY_PRICING: 'utility-pricing',
  SERVICES: 'services'
} as const;

export type RouteKey = typeof ROUTES[keyof typeof ROUTES];

export const ROUTE_TITLES = {
  [ROUTES.DASHBOARD]: 'Tổng quan',
  [ROUTES.ROOMS]: 'Phòng & Trạng thái',
  [ROUTES.GUESTS]: 'Khách lưu trú',
  [ROUTES.FACILITIES]: 'Cơ sở vật chất',
  [ROUTES.INVOICES]: 'Hóa đơn & Thanh toán',
  [ROUTES.UTILITY_PRICING]: 'Giá Dịch Vụ',
  [ROUTES.SERVICES]: 'Dịch Vụ Thêm'
} as const;
