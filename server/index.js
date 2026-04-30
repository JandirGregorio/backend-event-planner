const path = require('path');
const express = require('express');

const cookieSession = require('cookie-session');

const logRoutes = require('./middleware/logRoutes');

const checkAuthentication = require('./middleware/checkAuthentication');

require('dotenv').config();

const { register, login, getMe, logout } = require('./controllers/authControllers');
const { updateUser, deleteUser } = require('./controllers/userControllers');
const { listEvents, listUserEvents, createEvent, updateEvent, deleteEvent } = require('./controllers/eventControllers');
const { listUserRsvps, createRsvp, deleteRsvp } = require('./controllers/rsvpControllers');

const app = express();

const PORT = 8080;

const BASE_URL = '/api';

const pathToFrontend = process.env.NODE_ENV === 'production' ? '../frontend/dist' : '../frontend';

app.use(logRoutes);

app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET,
  maxAge: 24 * 60 * 60 * 1000,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, pathToFrontend)));

// ====================================
// Auth routes (public)
// ====================================

app.post(`${BASE_URL}/auth/register`, register);
app.post(`${BASE_URL}/auth/login`, login);
app.get(`${BASE_URL}/auth/me`, getMe);
app.delete(`${BASE_URL}/auth/logout`, logout);

// ====================================
// User routes
// ====================================

app.get(`${BASE_URL}/users/:user_id/events`, listUserEvents);
app.get(`${BASE_URL}/users/:user_id/rsvps`, listUserRsvps);
app.patch(`${BASE_URL}/users/:user_id`, checkAuthentication, updateUser);
app.delete(`${BASE_URL}/users/:user_id`, checkAuthentication, deleteUser);

// ====================================
// Event routes
// ====================================

app.get(`${BASE_URL}/events`, listEvents);
app.post(`${BASE_URL}/events`, checkAuthentication, createEvent);
app.patch(`${BASE_URL}/events/:event_id`, checkAuthentication, updateEvent);
app.delete(`${BASE_URL}/events/:event_id`, checkAuthentication, deleteEvent);

// ====================================
// RSVP routes
// ====================================

app.post(`${BASE_URL}/events/:event_id/rsvps`, checkAuthentication, createRsvp);
app.delete(`${BASE_URL}/events/:event_id/rsvps`, checkAuthentication, deleteRsvp);

const handleError = (err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: 'Internal Server Error' });
};

app.use(handleError);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
