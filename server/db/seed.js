// Dependencies
const bcrypt = require('bcrypt');
const pool = require('./pool');

const SALT_ROUNDS = 8;

const seed = async () => {
  await pool.query('DROP TABLE IF EXISTS rsvps');
  await pool.query('DROP TABLE IF EXISTS events');
  await pool.query('DROP TABLE IF EXISTS users');

  await pool.query(`
    CREATE TABLE users (
      user_id       SERIAL    PRIMARY KEY,
      username      TEXT      UNIQUE NOT NULL,
      password_hash TEXT      NOT NULL
    )
    `);

    await pool.query(`
      CREATE TABLE events (
        event_id      SERIAL    PRIMARY KEY,
        title         TEXT      NOT NULL,
        description   TEXT,
        date          TEXT      NOT NULL,
        location      TEXT      NOT NULL,
        event_type    TEXT      NOT NULL  CHECK (
                                  event_type IN (
                                    'conference',
                                    'workshop',
                                    'social',
                                    'networking',
                                    'concert',
                                    'sports',
                                    'fundraiser',
                                    'other'
                                  )
                                ),
        max_capacity  INTEGER   NOT NULL   CHECK (max_capacity > 0),
        user_id       INTEGER   REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE rsvps (
        rsvp_id       SERIAL     PRIMARY KEY,
        user_id       INTEGER    REFERENCES users(user_id) ON DELETE CASCADE,
        event_id      INTEGER    REFERENCES events(event_id) ON DELETE CASCADE,
        UNIQUE (user_id, event_id)
      )
    `);

  const luffyHash = await bcrypt.hash('joyboyishere', SALT_ROUNDS);
  const oliverHash = await bcrypt.hash('soccerfield', SALT_ROUNDS);
  const mikeHash = await bcrypt.hash('thriller123', SALT_ROUNDS);

  const {rows: users } = await pool.query(`
    INSERT INTO users (username, password_hash) VALUES ('luffy', $1),
    ('oliver',  $2),
    ('mike',  $3)
  RETURNING user_id, username
    `, [luffyHash, oliverHash, mikeHash]);

  const[ luffy, oliver, mike ] = users;

  // 5. Seed some events
  const insertEventSql = `
    INSERT INTO events (title, description, date, location, event_type, max_capacity, user_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING event_id;
  `;

  const techMeetupResponse = await pool.query(insertEventSql, [
    'Tech Meetup',
    'A casual meetup for local developers to share ideas and network.',
    '2025-06-15',
    'Downtown Community Center',
    'networking',
    50,
    luffy.user_id,
  ]);

  const jazzNightResponse = await pool.query(insertEventSql, [
    'Jazz Night',
    'An evening of live jazz performances from local musicians.',
    '2025-06-22',
    'The Blue Note Lounge',
    'concert',
    100,
    oliver.user_id,
  ]);

  const yogaInTheParkResponse = await pool.query(insertEventSql, [
    'Yoga in the Park',
    'A relaxing outdoor yoga session for all skill levels.',
    '2025-07-04',
    'Riverside Park',
    'social',
    30,
    mike.user_id,
  ]);

  const techMeetupId = techMeetupResponse.rows[0].event_id;
  const jazzNightId = jazzNightResponse.rows[0].event_id;
  const yogaInTheParkId = yogaInTheParkResponse.rows[0].event_id;

  const insertRsvpSql = 'INSERT INTO rsvps (user_id, event_id) VALUES ($1, $2);';

  await pool.query(insertRsvpSql, [luffy.user_id, jazzNightId]);
  await pool.query(insertRsvpSql, [oliver.user_id, yogaInTheParkId]);
  await pool.query(insertRsvpSql, [oliver.user_id, techMeetupId]);
  await pool.query(insertRsvpSql, [mike.user_id, yogaInTheParkId]);
  await pool.query(insertRsvpSql, [mike.user_id, techMeetupId]);
  await pool.query(insertRsvpSql, [mike.user_id, jazzNightId]);

  console.log('Database seeded.');
};

seed()
  .catch((error) => {
    console.error(`Error seeding database: ${error}`);
    process.exit(1);
  })
  .finally(() => pool.end());
