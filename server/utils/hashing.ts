import crypto from "crypto";

export function generateTransactionHash(
  sourceId: string,
  externalId: string,
  amountMinor: bigint,
  transactionDate: Date
): string {
  const hash = crypto.createHash("sha256");
  const dataString = `${sourceId}||${externalId}||${amountMinor.toString()}||${transactionDate.toISOString().split("T")[0]}`;
  hash.update(dataString);
  return hash.digest("hex");
}
