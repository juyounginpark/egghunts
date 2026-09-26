/** JSON-safe exact decimal currency; small integers retain legacy numeric saves. */
export type Money = number | string;
type Decimal = { c: bigint; e: number };
function decimal(value: Money): Decimal {
  const m = String(value).match(/^([+-]?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
  if (!m || (typeof value === 'number' && !Number.isFinite(value))) throw Error('Invalid money');
  const e = Number(m[4] ?? 0) - (m[3]?.length ?? 0);
  if (!Number.isSafeInteger(e) || Math.abs(e) > 100000) throw Error('Money exponent exceeds storage budget');
  return { c: BigInt((m[1] === '-' ? '-' : '') + m[2] + (m[3] ?? '')), e };
}
const power = (n: number) => 10n ** BigInt(n);
function align(a: Decimal, b: Decimal) { const e = Math.min(a.e, b.e); return { a: a.c * power(a.e - e), b: b.c * power(b.e - e), e }; }
function compareDecimal(a: Decimal, b: Decimal) { const v = align(a, b); return v.a < v.b ? -1 : v.a > v.b ? 1 : 0; }
function pack({ c, e }: Decimal): Money {
  if (!c) return 0;
  while (c % 10n === 0n) { c /= 10n; e++; }
  const raw = `${c}e${e}`, n = Number(raw);
  if (Number.isSafeInteger(n) && compareDecimal(decimal(n), { c, e }) === 0) return n;
  return raw;
}
export const money = (v: Money): Money => pack(decimal(v));
export const compare = (a: Money, b: Money) => compareDecimal(decimal(a), decimal(b));
export function add(a: Money, b: Money): Money { const v = align(decimal(a), decimal(b)); return pack({ c: v.a + v.b, e: v.e }); }
export function subtract(a: Money, b: Money): Money { const v = align(decimal(a), decimal(b)); return pack({ c: v.a - v.b, e: v.e }); }
export function multiply(a: Money, b: Money): Money { const x = decimal(a), y = decimal(b); return pack({ c: x.c * y.c, e: x.e + y.e }); }
/** Division truncates beyond 24 fractional digits; wallet addition/subtraction is exact. */
export function divide(a: Money, b: Money): Money { const x = decimal(a), y = decimal(b); if (!y.c) throw Error('Division by zero'); return pack({ c: x.c * power(24) / y.c, e: x.e - y.e - 24 }); }
export function floorMoney(value: Money): Money { const v = decimal(value); if (v.e >= 0) return pack(v); const d = power(-v.e), q = v.c / d; return pack({ c: q - (v.c < 0 && v.c % d ? 1n : 0n), e: 0 }); }
export function validMoney(value: unknown): value is Money { try { return (typeof value === 'number' || typeof value === 'string') && compare(value, 0) >= 0; } catch { return false; } }
export function magnitude(value: Money) { const v = decimal(value); return v.c === 0n ? 0 : v.c.toString().replace('-', '').length - 1 + v.e; }
export function exactMoney(value: Money): string {
  const v = decimal(value), sign = v.c < 0 ? '-' : '', digits = v.c.toString().replace('-', ''), point = digits.length + v.e;
  if (Math.abs(v.e) > 1000) return `${v.c}e${v.e}`;
  return sign + (point <= 0 ? '0.' + '0'.repeat(-point) + digits : point >= digits.length ? digits + '0'.repeat(point - digits.length) : digits.slice(0, point) + '.' + digits.slice(point));
}
