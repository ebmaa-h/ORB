export function getAccessibleFeaturesByCategory(user, category) {
  console.log(user,category)
  if (!user?.features) return [];

  return user.features.filter(
    (feature) => feature.is_active && featureCategoryMap[feature.feature_name] === category
  );
}


const featureCategoryMap = {
  accounts: 'main',
  invoices: 'main',
  crq: 'main',

  records: 'other',
  profiles: 'other',
  
};



export const featureLabels = {
  accounts: 'Accounts',
  invoices: 'Invoices',
  crq: 'CRQ',
  
  records: 'Records',
  profiles: 'Profiles',
};
