// Invoice-related constants
export const WATER_PRICE = 50000;

export const CROP_ASPECT_RATIO = 3 / 4;

export const IMAGE_COMPRESSION = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.7
} as const;

export const INVOICE_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid'
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
