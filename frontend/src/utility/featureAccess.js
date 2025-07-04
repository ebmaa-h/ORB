import { FEATURES } from "../config/featureConfig";

// Checks if a user has access to a specific feature 
export const findUserFeature = (user, name) =>
  user?.features?.some((f) => f.feature_name === name);

// Get features of user has access to based on current category
export const getUserFeaturesByCategory = (user, category) =>
  FEATURES.filter(f =>
    f.category === category &&
    findUserFeature(user, f.name)
  );

// Get currrent category based on frontend location 
export function getCategoryByRoute(pathname) {
    const feature = FEATURES.find(f => pathname.startsWith(f.path));
  return feature?.category || null;
}