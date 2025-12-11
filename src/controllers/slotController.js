// src/controllers/slotController.js
const slotService = require("../services/slotService");

// GET /api/slots
// Public/user endpoint to list *available* upcoming slots
async function listSlotsForUsers(req, res, next) {
  try {
    const { doctor_name, specialization, date } = req.query;

    // Filters passed by user
    const filters = {
      doctor_name: doctor_name || undefined,
      specialization: specialization || undefined,
      date: date || undefined,
    };

    const slots = await slotService.listAvailableSlotsForUsers(filters);

    return res.status(200).json(slots);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSlotsForUsers,
};
