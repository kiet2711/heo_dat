export type DayPlan = { id: number; directAmount: number; optionalSavedAmount: number };

/** The confirmed total is always derived, never incremented in the UI. */
export const confirmedTotal = (days: DayPlan[]) =>
  days.reduce((sum, day) => sum + day.directAmount + day.optionalSavedAmount, 0);

export const remainingAmount = (target: number, days: DayPlan[]) =>
  Math.max(0, target - confirmedTotal(days));

export const progressPercent = (target: number, days: DayPlan[]) =>
  target <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((confirmedTotal(days) / target) * 100)));

/** Allows a leading minus for corrections in the “Đã gửi” field. */
export const toMoney = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  return (value.trim().startsWith('-') ? -1 : 1) * Number(digits);
};

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
