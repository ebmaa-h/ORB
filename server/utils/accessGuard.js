function accessGuard(featureName) {

  // change to permissions being frontend supplied to backend supplied, with only user_id provided.
  return (req, res, next) => {
    const match = req.user?.features?.find(f => 
      f.feature_name === featureName
    );

    if (!match) {
      console.log('🔒 Access to ', featureName, ' DENIED.');
    return res.status(403).json({ 
      message: 'Feature access denied', 
      code: 'FEATURE_ACCESS_DENIED' 
    });
    }

    console.log('🔒 Access to ', featureName, ' granted.');

    next();
  };
}

module.exports = { accessGuard };
