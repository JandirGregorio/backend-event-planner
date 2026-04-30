const eventModel = require('../models/eventModel');

// GET /api/events
module.exports.listEvents = async (req, res, next) => {
  try {
    const events = await eventModel.listEvents();
    res.send(events);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:user_id/events
module.exports.listUserEvents = async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);
    const events = await eventModel.listEventByUser(userId);
    res.send(events);
  } catch (err) {
    next(err);
  }
};

// POST /api/events { title, description, date, location, event_type, max_capacity }
module.exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, event_type, max_capacity } = req.body;

    if (!title || !date || !location || !event_type || !max_capacity) {
      return res.status(400).send({ error: 'Title, date, location, event type, and max capacity are required.'});
    }
    const event = await eventModel.createEvent(title, description, date, location, event_type, max_capacity, req.session.userId);
    res.status(201).send(event);
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).send( { error: 'Invalid event type.' });
    }
    next(err);
  }
};

// PATCH /api/events/:event_id any subset of { title, description, date, location, event_type, max_capacity }
module.exports.updateEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.event_id);

    const existing = await eventModel.findEvent(eventId);
    if (!existing) {
      return res.status(404).send({ message: 'Event not found'});
    }

    if (existing.user_id !== req.session.userId) {
      return res.status(403).send({message: 'You can only update your own events.' });
    }

    const { title, description, date, location, event_type, max_capacity } = req.body;
    const event = await eventModel.updateEvent(eventId, title, description, date, location, event_type, max_capacity);
    res.send(event);
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).send( { error: 'Invalid event type.' });
    }
    next(err);
  }
};

// DELETE /api/events/:event_id
module.exports.deleteEvent = async (req, res, next) => {
  try {
    const eventId = Number(req.params.event_id);

    const existing = await eventModel.findEvent(eventId);
    if (!existing) {
      return res.status(404).send({ message: 'Event not found' });
    }

    if (existing.user_id !== req.session.userId) {
      return res.status(403).send({message: 'You can only delete your own events.' });
    }

    const event = await eventModel.destroyEvent(eventId);
    res.send(event);
  } catch (err) {
    next(err);
  }
};
