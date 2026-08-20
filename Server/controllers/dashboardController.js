const { getDashboardCounts } = require("../helpers/dashboardCounts");

class DashboardController {
  static async show(req, res, next) {
    try {
      const counts = await getDashboardCounts();
      res.status(200).json(counts);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
