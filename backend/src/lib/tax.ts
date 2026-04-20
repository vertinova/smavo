import { TaxType } from '../generated/prisma/client.js';

const TAX_RATES: Record<string, number> = {
  PPN: 0.11,
  PPH21: 0.05,
  PPH22: 0.015,
  PPH23: 0.02,
  NONE: 0,
};

export function calculateTax(amount: number, taxType: TaxType): { taxAmount: number; totalAmount: number } {
  const rate = TAX_RATES[taxType] ?? 0;
  const taxAmount = Math.round(amount * rate);
  const totalAmount = amount + taxAmount;
  return { taxAmount, totalAmount };
}
