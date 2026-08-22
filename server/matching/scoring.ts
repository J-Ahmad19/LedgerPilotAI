import stringSimilarity from "string-similarity";

export function calculateAmountScore(sourceAmountMinor: bigint, targetAmountMinor: bigint): number {
  const diff = sourceAmountMinor > targetAmountMinor
    ? sourceAmountMinor - targetAmountMinor
    : targetAmountMinor - sourceAmountMinor;

  if (diff === 0n) return 1.0;
  if (diff <= 100n) return 0.95; // <= 1 diff
  if (diff <= 1000n) return 0.80; // <= 10 diff
  return 0.0;
}

export function calculateDateScore(sourceDate: Date, targetDate: Date): number {
  const diffMs = Math.abs(sourceDate.getTime() - targetDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) return 1.0;
  if (diffDays <= 1) return 0.90;
  if (diffDays <= 2) return 0.70;
  return 0.0;
}

export function calculateReferenceScore(sourceTx: any, targetTx: any): number {
  const sRef = sourceTx.normalizedReference || "";
  const tRef = targetTx.normalizedReference || "";

  if (sRef && tRef && sRef === tRef) return 1.0;

  const sDesc = sourceTx.normalizedDescription || "";
  const tDesc = targetTx.normalizedDescription || "";

  if (sRef && tDesc.includes(sRef)) return 0.95;
  if (tRef && sDesc.includes(tRef)) return 0.95;

  if (sRef && tRef) {
    const similarity = stringSimilarity.compareTwoStrings(sRef, tRef);
    if (similarity > 0.8) return 0.60;
  }

  return 0.0;
}

export function calculateDescriptionScore(sourceTx: any, targetTx: any): number {
  const sDesc = sourceTx.normalizedDescription || sourceTx.merchantName || "";
  const tDesc = targetTx.normalizedDescription || targetTx.merchantName || "";

  if (!sDesc || !tDesc) return 0.0;
  return stringSimilarity.compareTwoStrings(sDesc, tDesc);
}

export function calculateCompositeScore(sourceTx: any, targetTx: any) {
  const amountScore = calculateAmountScore(sourceTx.amountMinor, targetTx.amountMinor);
  const dateScore = calculateDateScore(new Date(sourceTx.transactionDate), new Date(targetTx.transactionDate));
  const referenceScore = calculateReferenceScore(sourceTx, targetTx);
  const descriptionScore = calculateDescriptionScore(sourceTx, targetTx);

  const compositeScore = (0.40 * amountScore) + (0.30 * referenceScore) + (0.15 * dateScore) + (0.15 * descriptionScore);

  return {
    compositeScore,
    amountScore,
    dateScore,
    referenceScore,
    descriptionScore
  };
}
