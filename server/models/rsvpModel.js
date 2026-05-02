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

const isEventAtCapacity = async (event_id) => {
  const query = `
    SELECT COUNT(rsvps.rsvp_id) >= events.max_capacity AS capacity_reached
    FROM events
    LEFT JOIN rsvps ON rsvps.event_id = events.event_id
    WHERE events.event_id = $1
    GROUP BY events.max_capacity
  `;
  const { rows } = await pool.query(query, [event_id]);
  return rows[0]?.capacity_reached ?? false;
};

module.exports.createRsvp = async (user_id, event_id) => {
  if (await isEventAtCapacity(event_id)) {
    return null;
  }

  const query = `
    INSERT INTO rsvps(user_id, event_id) VALUES 
      ($1, $2) ON CONFLICT DO NOTHING
    RETURNING *
  `;
  const { rows } = await pool.query(query, [user_id, event_id]);
  return rows[0] || null;
};

module.exports.destroyRsvp = async (user_id, event_id) => {
  const query = `
    DELETE FROM rsvps
    WHERE user_id = $1 AND event_id = $2
  `;
  await pool.query(query, [user_id, event_id]);
};
