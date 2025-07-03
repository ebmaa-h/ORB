import { FEATURES } from "../config/featureConfig";

export const findUserFeature = (user, name) =>
  user?.features?.some((f) => f.feature_name === name && f.is_active);

export const getUserFeaturesByCategory = (user, category) =>
  FEATURES.filter(f =>
    f.category === category &&
    f.dashboard &&
    findUserFeature(user, f.name)
  );

export const getNavLinks = (user) =>
  FEATURES.filter(f =>
    f.nav &&
    findUserFeature(user, f.name)
  );
