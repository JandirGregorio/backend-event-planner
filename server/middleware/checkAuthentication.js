const checkAuthentication = (req, res, next) => {
  const { userId } = req.session;

  // No session: user is not logged in, cut off the request before continuing to the controller
  if (!userId) {
    return res.status(401).send({ message: 'You must be logged in to do that.' });
  }

  // Session is valid: continue to the controller and execute the protected endpoint
  next();
};

module.exports = checkAuthentication;