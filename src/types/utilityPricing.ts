export type PricingModel = 'fixed_per_person' | 'usage_based' | 'fixed_per_room';
export type UtilityType = 'water' | 'electricity' | 'gas' | 'internet';

export interface TieredPricing {
  upToGuests: number;
  price: number;
}

export interface UsageTier {
  threshold: number;  // kWh or other unit
  price: number;      // VND per unit
}

export interface UtilityPricing {
  id: string;
  type: UtilityType;
  name: string;
  description?: string;
  pricingModel: PricingModel;

  // For fixed_per_person
  basePrice: number;
  perPersonLimit?: number;
  tieredPricing?: TieredPricing[];

  // For usage_based (electricity)
  usageTiers?: UsageTier[];

  isActive: boolean;
  effectiveDate: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface UtilityPricingFormData {
  type: UtilityType;
  name: string;
  description?: string;
  pricingModel: PricingModel;
  basePrice: number;
  tieredPricing: TieredPricing[];
  usageTiers: UsageTier[];
  isActive: boolean;
  effectiveDate: string;
}
