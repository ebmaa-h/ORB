function accessGuard(featureName) {
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
