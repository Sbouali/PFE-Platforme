const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/verifyToken");
const requireRole = require("../../middlewares/requireRole");

const ctrl = require("../controllers/getController"); // fixed path

// GET teams for student (his speciality)
router.get(
  "/teams",
  verifyToken,
  requireRole(["student"]),
  ctrl.getTeamsForStudent
);

router.get(
  "/topics",
  verifyToken,
  requireRole(["student"]),
  ctrl.getTopicsForStudent
);

module.exports = router;