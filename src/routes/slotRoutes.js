const express = require("express");
const router = require("express").Router();
const slotController = require("../controllers/slotController");

router.get("/slots", slotController.listSlotsForUsers);

module.exports = router;
