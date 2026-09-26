import { magnitude, divide, multiply, compare, add, floorMoney, type Money } from './money';
export const NUMBER_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'];
export const numberSuffix = (index: number) => NUMBER_SUFFIXES[index] ?? `e${index * 3}`;
export function formatNumber(value: Money, decimals = 2) {
  const negative = compare(value, 0) < 0, positive = negative ? multiply(value, -1) : value;
  let exponent = Math.max(0, Math.floor(magnitude(positive) / 3) * 3);
  const scientific=exponent>=66,precision=10**Math.min(2,Math.max(0,Math.trunc(decimals)));
  if(scientific)exponent=magnitude(positive);
  let rounded = Number(floorMoney(add(multiply(divide(positive,`1e${exponent}`),precision),.5)))/precision;
  if(scientific&&rounded>=10){exponent++;rounded/=10;}
  if (rounded >= 1000) { exponent += 3; rounded /= 1000; }
  return (negative && rounded ? '-' : '') + rounded + (NUMBER_SUFFIXES[exponent / 3] ?? `e${exponent}`);
}
// D = 1: currency and physical values share notation, never an implicit multiplier.
export const formatCurrency = formatNumber;
export { exactMoney } from './money';
