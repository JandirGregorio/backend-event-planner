const pool = require('../db/pool');

module.exports.listEvents = async () => {
  const query = `
    SELECT events.*, users.user_id, users.username, COUNT(rsvps.rsvp_id) AS rsvp_count
    FROM events
      INNER JOIN users
      ON events.user_id = users.user_id
      LEFT JOIN rsvps
      ON rsvps.event_id = events.event_id
    GROUP BY events.event_id, users.user_id, users.username
    ORDER BY events.date
  `;

  const { rows } = await pool.query(query);
  return rows;
};

module.exports.listEventByUser = async (user_id) => {
  const query = `
    SELECT events.*, users.username, COUNT(rsvps.rsvp_id) AS rsvp_count
    FROM events
      INNER JOIN users
      ON events.user_id = users.user_id
      LEFT JOIN rsvps
      ON rsvps.event_id = events.event_id
    WHERE users.user_id = $1
    GROUP BY events.event_id, users.user_id, users.username
    ORDER BY events.date
  `;

  const { rows } = await pool.query(query, [user_id]);
  return rows;
};

module.exports.createEvent = async (title, description, date, location, event_type, max_capacity, user_id) => {
  const query = `
      INSERT INTO events (title, description, date, location, event_type, max_capacity, user_id) VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING event_id, title, description, date, location, event_type, max_capacity, user_id
  `;
  const { rows } = await pool.query(query, [title, description, date, location, event_type, max_capacity, user_id]);

  return rows[0];
};

module.exports.findEvent = async (event_id) => {
  const query = `
    SELECT event_id, title, description, date, location, event_type, max_capacity, user_id
    FROM events
    WHERE event_id = $1
  `;
  const { rows } = await pool.query(query, [event_id]);
  return rows[0] || null;
};

module.exports.updateEvent = async (event_id, title, description, date, location, event_type, max_capacity) => {
  const query = `
  UPDATE events SET
    title         = COALESCE($1, title),
    description   = COALESCE($2, description),
    date          = COALESCE($3, date),
    location      = COALESCE($4, location),
    event_type    = COALESCE($5, event_type),
    max_capacity  = COALESCE($6, max_capacity)
  WHERE event_id  = $7
  RETURNING event_id, title, description, date, location, event_type, max_capacity
  `;

  const values = [
    title ?? null,
    description ?? null,
    date ?? null,
    location ?? null,
    event_type ?? null,
    max_capacity ?? null,
    event_id
  ];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

module.exports.destroyEvent = async (event_id) => {
  const query = `
    DELETE from events
    WHERE event_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [event_id]);
  return rows[0] || null;
};
