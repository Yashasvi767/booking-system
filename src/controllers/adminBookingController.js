const bookingService = require("../services/bookingService");

async function expirePending(req, res, next) {
  try {
    const expired = await bookingService.expirePending();
    return res.status(200).json({
      expired_count: expired.length,
      expired
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  expirePending
};
