const express = require("express");
const router = require("express").Router();
const adminController = require("../controllers/adminController");
const adminBookingController = require("../controllers/adminBookingController");

router.post("/slots", adminController.createSlot);
router.get("/slots", adminController.listSlots);
router.post("/expire-pending", adminBookingController.expirePending);

module.exports = router;
