const pool = require('../db/pool');

module.exports.listRsvpByUser = async (user_id) => {
  const query = `
    SELECT events.*, users.username,
      (
        SELECT COUNT(*) 
        FROM rsvps
        WHERE rsvps.event_id = events.event_id
      ) AS rsvp_count
    FROM events
      INNER JOIN users
      ON events.user_id = users.user_id
      INNER JOIN rsvps
      ON rsvps.event_id = events.event_id
    WHERE rsvps.user_id = $1
    ORDER BY events.event_id
  `;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
};

module.exports.createRsvp = async (user_id, event_id) => {
  const query = `
    INSERT INTO rsvps(user_id, event_id) VALUES 
      ($1, $2)
    RETURNING user_id, event_id
  `;

  const { rows } = await pool.query(query, [user_id, event_id]);
  return rows[0] || null;
};

module.exports.destroyRsvp = async (user_id, event_id) => {
  const query = `
    DELETE FROM rsvps
    WHERE user_id = $1 AND event_id = $2
    RETURNING user_id, event_id
  `;

  const { rows } = await pool.query(query, [user_id, event_id]);
  return rows[0] || null;
};

module.exports.findRsvp = async (rsvp_id) => {
  const query = `
    SELECT rsvp_id, user_id, event_id FROM rsvps WHERE rsvp_id = $1
  `;
  const { rows } = await pool.query(query, [rsvp_id]);
  return rows[0] || null;
};
