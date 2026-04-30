const userModel = require('../models/userModel');

// POST /api/auth/register { username, password }
module.exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ error: 'Username and password are required.'});
    }

    const existingUser = await userModel.findUsername(username);
    if (existingUser) {
      return res.status(409).send({ message: 'Username already taken' });
    }

    const user = await userModel.createUser(username, password);

    req.session.userId = user.user_id;

    res.status(201).send(user);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login { username, password }
module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await userModel.validatePassword(username, password);

    if (!user) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }

    req.session.userId = user.user_id;

    res.send(user);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
module.exports.getMe = async (req, res, next) => {
  try {
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).send(null);
    }

    const user = await userModel.findUser(userId);
    if (!user) {
      return res.status(401).send(null);
    }
    res.send(user);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auth/logout
module.exports.logout = (req, res) => {
  req.session = null;
  res.send({ message: 'Logged out' });
};
