// EVN Tiers (approximate)
const EVN_TIERS = [
  { limit: 50, price: 1806 },
  { limit: 100, price: 1866 },
  { limit: 200, price: 2167 },
  { limit: 300, price: 2729 },
  { limit: 400, price: 3050 },
  { limit: Infinity, price: 3151 }
];

export const calculateElectricity = (used: number): number => {
  let total = 0;
  let remaining = used;
  let prevLimit = 0;

  for (const tier of EVN_TIERS) {
    const tierLimit = tier.limit - prevLimit;
    const currentUsed = Math.min(remaining, tierLimit);
    total += currentUsed * tier.price;
    remaining -= currentUsed;
    prevLimit = tier.limit;
    if (remaining <= 0) break;
  }
  return total;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
