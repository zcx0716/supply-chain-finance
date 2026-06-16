import { PaymentInstallment } from '../types';

const MAX_INSTALLMENT_AMOUNT = 500000;
const MIN_INSTALLMENT_AMOUNT = 10000;

/**
 * 生成随机的回款金额，范围1万到50万之间
 */
function generateRandomInstallmentAmount(remainingAmount: number): number {
  const maxForThis = Math.min(MAX_INSTALLMENT_AMOUNT, remainingAmount);
  if (maxForThis <= MIN_INSTALLMENT_AMOUNT) {
    return maxForThis;
  }
  // 生成一个随机金额，在最小值和最大值之间
  const randomFactor = 0.3 + Math.random() * 0.7; // 30% to 100% of max
  return Math.min(maxForThis, Math.floor((MIN_INSTALLMENT_AMOUNT + (maxForThis - MIN_INSTALLMENT_AMOUNT) * randomFactor) / 1000) * 1000);
}

/**
 * 为总金额生成分期计划（小额多笔，每笔不超过50万）
 */
export function generateInstallments(totalAmount: number, startDate: Date = new Date()): PaymentInstallment[] {
  const installments: PaymentInstallment[] = [];
  let remainingAmount = totalAmount;
  let dayOffset = 0;

  while (remainingAmount > 0) {
    const installmentAmount = generateRandomInstallmentAmount(remainingAmount);
    const plannedDate = new Date(startDate);
    plannedDate.setDate(startDate.getDate() + dayOffset);

    installments.push({
      id: crypto.randomUUID(),
      amount: installmentAmount,
      plannedDate,
      status: 'pending',
    });

    remainingAmount -= installmentAmount;
    dayOffset++;
  }

  return installments;
}
