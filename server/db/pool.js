require('dotenv').config();
const { Pool } = require('pg');

const devConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
};

const prodConfig = {
  connectionString: process.env.PG_CONNECTION_STRING,
};

const pool = new Pool(process.env.PG_CONNECTION_STRING ? prodConfig : devConfig);

module.exports = pool;
