import { confirmedTotal, progressPercent, remainingAmount, toMoney } from '../src/logic';

function equal<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) throw new Error(message ?? `Expected ${expected}, received ${actual}`);
}

const days = [
  { id: 1, directAmount: 10_000, optionalSavedAmount: 30_000 },
  { id: 2, directAmount: 20_000, optionalSavedAmount: 0 },
  { id: 3, directAmount: 5_000, optionalSavedAmount: 15_000 },
];

equal(confirmedTotal(days), 80_000, 'direct savings and checked optional savings both count');
equal(confirmedTotal([{ ...days[0], directAmount: 40_000 }, ...days.slice(1)]), 110_000, 'editing direct savings replaces, rather than duplicates, the amount');
equal(confirmedTotal(days.map(day => day.id === 1 ? { ...day, optionalSavedAmount: 0 } : day)), 50_000, 'unchecking optional saving removes only that optional amount');
equal(remainingAmount(100_000, days), 20_000);
equal(progressPercent(100_000, days), 80);
equal(progressPercent(10_000, days), 100, 'progress is capped at 100%');
equal(toMoney('1.250.000 đ'), 1_250_000);
equal(toMoney('-10.000 đ'), -10_000, 'a leading minus is kept for direct-saving corrections');
equal(progressPercent(100_000, [{ id: 4, directAmount: -10_000, optionalSavedAmount: 0 }]), 0, 'progress never displays a negative percentage');
console.log('✓ Logic tiền tiết kiệm hoạt động đúng.');
