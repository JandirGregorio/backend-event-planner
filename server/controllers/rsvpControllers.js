const rsvpModel = require('../models/rsvpModel');

// GET /api/users/:user_id/rsvps
module.exports.listUserRsvps = async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);
    const rsvps = await rsvpModel.listRsvpByUser(userId);
    res.send(rsvps);
  } catch (err) {
    next(err);
  }
};

// POST /api/events/:event_id/rsvps
module.exports.createRsvp = async (req, res, next) => {
  try {
    const eventId = Number(req.params.event_id);
    const rsvp = await rsvpModel.createRsvp(req.session.userID, eventId);
    res.status(201).send(rsvp);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:event_id/rsvps
module.exports.deleteRsvp = async (req, res, next) => {
  try {
    const eventId = Number(req.params.event_id);
    const rsvp = await rsvpModel.destroyRsvp(req.session.userId, eventId);
    res.send(rsvp);
  } catch (err) {
    next(err);
  }
};
