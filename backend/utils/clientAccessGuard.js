function clientAccessGuard(req, res, next) {
  const { clientId } = req.params;
  const user = req.user;

  const match = user?.client_access?.find(
    (c) => c.client_id === parseInt(clientId)
  );

  if (!match) {
    console.log(`🔒 Access to client ${clientId} denied for user ${user?.email}`);
    return res.status(403).json({ 
      message: 'Client access denied', 
      code: 'CLIENT_ACCESS_DENIED' 
    });
  }

    console.log(`🔒 Access to client ${clientId} granted for user ${user?.email}`);
  next();
}

module.exports = { clientAccessGuard };
