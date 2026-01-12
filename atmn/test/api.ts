// API helpers for test state verification
// These are lazy-loaded to ensure dotenv has run first

import type { Feature } from '../source/compose/models/featureModels.js';
import type { Plan } from '../source/compose/models/planModels.js';

// Re-export types for convenience
export type { Feature, Plan };

// Lazy import the API functions to ensure env is loaded first
let _getAllPlans: typeof import('../source/core/pull.js').getAllPlans;
let _getFeatures: typeof import('../source/core/pull.js').getFeatures;

async function loadApiModule() {
  if (!_getAllPlans || !_getFeatures) {
    const pullModule = await import('../source/core/pull.js');
    _getAllPlans = pullModule.getAllPlans;
    _getFeatures = pullModule.getFeatures;
  }
}

export async function getAllPlans(params?: { archived?: boolean }): Promise<Plan[]> {
  await loadApiModule();
  return _getAllPlans(params);
}

export async function getFeatures(params?: { includeArchived?: boolean }): Promise<Feature[]> {
  await loadApiModule();
  return _getFeatures(params);
}
