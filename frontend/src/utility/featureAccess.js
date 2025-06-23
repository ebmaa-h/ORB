// Maps feature names to high-level categories
const featureCategoryMap = {
  accounts: 'main',
  invoices: 'main',
  // crq: 'main',
  records: 'other',
  profiles: 'other',
};

// Labels for display purposes
export const featureLabels = {
  accounts: 'Accounts',
  invoices: 'Invoices',
  // crq: 'CRQ',
  records: 'Records',
  profiles: 'Profiles',
};

// Maps specific routes to feature categories
const routeToCategoryMap = {
  '/dashboard': 'dash',
  '/accounts': 'main',
  '/invoices': 'main',
  '/records': 'other',
  '/profiles': 'other',
};

// Helper to get category based on current path
export function getCategoryByRoute(pathname) {
  return routeToCategoryMap[pathname];
}

// Returns only active features for a user within a specific category
export function getAccessibleFeaturesByCategory(user, category) {
  if (!user?.features) return [];

  // Filter user's features by:
  // 1. Active status
  // 2. Matching category (e.g., 'main', 'other') using the map
  return user.features.filter(
    (feature) =>
      feature.is_active &&
      featureCategoryMap[feature.feature_name] === category
  );
}
