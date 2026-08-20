const { Client } = require("pg");
const cfg = require("../config/config.json").test;

module.exports = async function globalSetup() {
  const admin = new Client({
    user: cfg.username,
    password: cfg.password,
    host: cfg.host,
    database: "postgres",
  });

  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    cfg.database,
  ]);
  if (!exists.rowCount) {
    await admin.query(`CREATE DATABASE "${cfg.database}"`);
  }
  await admin.end();
};
