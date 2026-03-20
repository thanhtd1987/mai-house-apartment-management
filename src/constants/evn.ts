// EVN Electricity Tiers (Vietnam Electricity)
export const EVN_TIERS = [
  { limit: 50, price: 1806 },
  { limit: 100, price: 1866 },
  { limit: 200, price: 2167 },
  { limit: 300, price: 2729 },
  { limit: 400, price: 3050 },
  { limit: Infinity, price: 3151 }
] as const;

export type EVNTier = typeof EVN_TIERS[number];
