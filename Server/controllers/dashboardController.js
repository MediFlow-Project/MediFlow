const { getDashboardCounts } = require("../helpers/dashboardCounts");

async function show(req, res, next) {
  try {
    const counts = await getDashboardCounts();
    res.status(200).json(counts);
  } catch (err) {
    next(err);
  }
}

module.exports = { show };
