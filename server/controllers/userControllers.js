const userModel = require('../models/userModel');

// PATCH /api/users/:user_id { password }
module.exports.updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);

    if (userId !== req.session.userId) {
      return res.status(403).send({ message: 'You can only update your own account.' });
    }

    const { password } = req.body;
    const user = await userModel.updateUser(userId, password);
    if (!user) {
      return res.status(404).send({ message: 'User not found'} );
    }
    res.send(user);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:user_id
module.exports.deleteUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);

    if (userId !== req.session.userId) {
      return res.status(403).send({ message: 'You can only delete your own account'} );
    }

    const user = await userModel.destroyUser(userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.send(user);
  } catch (err) {
    next(err);
  }
};
