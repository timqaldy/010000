export const PRODUCT_CONFIG = {
  publish: {
    minimumConfidence: 0.72,
    minimumImportance: 0.55,
  },
  resolver: {
    maximumHoursApart: 36,
    minimumTokenSimilarity: 0.34,
  },
  scheduler: {
    timeoutMs: 8_000,
  },
} as const;
