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
  const data = {
    title,
    description,
    date,
    location,
    event_type,
    max_capacity,
  };

  // Filters out only allowed fields to prevent SQL injection and fields that have values in it
  const filteredFields = Object.keys(data).filter((key) => data[key] !== undefined);
  const paramaterizedQueries = filteredFields
                                    .map((key, index) => `${key} = $${index + 1}`)
                                    .join(', ');

  const values = [...filteredFields.map((key) => data[key]), event_id];

  const query = `
    UPDATE events
    SET ${paramaterizedQueries}
    WHERE event_id = $${values.length}
    RETURNING event_id, title, description, date, location, event_type, max_capacity
  `;
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
