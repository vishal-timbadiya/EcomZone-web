import { prisma } from './prisma';

/**
 * Server-side shipping calculation.
 *
 * The shipping charge used to be taken from the request body, so a client could
 * post zero (or a negative number) and pay nothing for delivery - or push the
 * order total below the minimum-order check. It is now derived here from the
 * rate table and the real product weights.
 *
 * The arithmetic intentionally mirrors what the checkout page shows the user:
 * total weight in kilograms, rounded up to the next whole kilogram, times the
 * applicable per-kg rate.
 */

export interface WeighedItem {
  weightGrams: number;
  units: number;
}

export function calculateTotalWeightKg(items: WeighedItem[]): number {
  const totalGrams = items.reduce((sum, item) => sum + item.units * (item.weightGrams || 0), 0);
  return totalGrams / 1000;
}

/**
 * Resolve the per-kg rate for a destination. A city-specific rate wins over the
 * state-wide rate, matching the checkout page's lookup order.
 */
export async function resolveRatePerKg(state?: string, city?: string): Promise<number | null> {
  if (!state) return null;

  const rates = await prisma.shippingRate.findMany({
    where: {
      isActive: true,
      state: { equals: state, mode: 'insensitive' },
    },
    select: { city: true, ratePerKg: true },
  });

  if (rates.length === 0) return null;

  if (city) {
    const cityRate = rates.find(
      (rate) => rate.city && rate.city.toLowerCase() === city.toLowerCase()
    );
    if (cityRate) return cityRate.ratePerKg;
  }

  const stateRate = rates.find((rate) => !rate.city);
  return stateRate ? stateRate.ratePerKg : null;
}

/**
 * Compute the shipping charge for an order. Returns 0 when no rate is
 * configured for the destination, which is the same behaviour the checkout page
 * shows the customer.
 */
export async function calculateShippingCharge(params: {
  totalWeightKg: number;
  state?: string;
  city?: string;
}): Promise<number> {
  const { totalWeightKg, state, city } = params;

  if (totalWeightKg <= 0) return 0;

  const ratePerKg = await resolveRatePerKg(state, city);

  if (ratePerKg === null || ratePerKg <= 0) return 0;

  return Math.ceil(totalWeightKg) * ratePerKg;
}
