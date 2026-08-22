export function toMinorUnits(amount: string): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const padded = `${fraction}00`.slice(0, 2);
  
  return BigInt(whole) * 100n + BigInt(padded);
}
