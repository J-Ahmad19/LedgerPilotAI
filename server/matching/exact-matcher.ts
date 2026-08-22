export function isExactMatch(sourceTx: any, targetTx: any): boolean {
  // Check exact amount and currency
  if (sourceTx.amountMinor !== targetTx.amountMinor) return false;
  if (sourceTx.currency !== targetTx.currency) return false;

  // Check exact reference
  if (
    sourceTx.normalizedReference &&
    targetTx.normalizedReference &&
    sourceTx.normalizedReference === targetTx.normalizedReference
  ) {
    return true;
  }

  // Check exact external ID (if they happen to share the exact same ID across systems)
  if (sourceTx.externalId === targetTx.externalId) {
    return true;
  }

  return false;
}
