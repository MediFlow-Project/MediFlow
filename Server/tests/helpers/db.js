const { sequelize } = require("../../models");
const { resetOpenedSessions } = require("../../helpers/quota");

async function resetDatabase() {
  resetOpenedSessions();
  await sequelize.query("DROP SCHEMA IF EXISTS public CASCADE;");
  await sequelize.query("CREATE SCHEMA public;");
  await sequelize.query("GRANT ALL ON SCHEMA public TO postgres;");
  await sequelize.query("GRANT ALL ON SCHEMA public TO public;");
  await sequelize.sync({ force: true });
}

module.exports = { resetDatabase };
