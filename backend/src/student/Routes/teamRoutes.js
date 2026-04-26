const express = require("express");
const router = express.Router();

const teamController = require("../controllers/teamController");

// middlewares
const verifyToken = require("../../middlewares/verifyToken");
const requireRole = require("../../middlewares/requireRole");


// ========================
// TEAM MANAGEMENT
// ========================

// Create team (student only)
router.post(
  "/create",
  verifyToken,
  requireRole(["student"]),
  teamController.createTeam
);

// Invite student (leader or member depending on your logic)
router.post(
  "/invite",
  verifyToken,
  requireRole(["student"]),
  teamController.inviteStudent
);

router.post(
  "/reject-invitation",
  verifyToken,
  requireRole(["student"]),
  teamController.rejectInvitation
);

router.post(
  "/cancel-invitation",
  verifyToken,
  requireRole(["student"]),
  teamController.cancelInvitation
);

router.post(
  "/exit",
  verifyToken,
  requireRole(["student"]),
  teamController.exitTeam
);

router.post(
  "/accept-invitation",
  verifyToken,
  requireRole(["student"]),
  teamController.acceptInvitation
);

router.post(
  "/join-request",
  verifyToken,
  requireRole(["student"]),
  teamController.requestJoinTeam
);

router.post(
  "/accept-request",
  verifyToken,
  requireRole(["student"]),
  teamController.acceptJoinRequest
);

router.post(
  "/reject-request",
  verifyToken,
  requireRole(["student"]),
  teamController.rejectJoinRequest
);

// ========================
// GETTERS
// ========================

router.get(
  "/getTeams",
  verifyToken,
  requireRole(["student"]),
  teamController.getTeams
);

router.get(
  "/getJoinRequests",
  verifyToken,
  requireRole(["student"]),
  teamController.getJoinRequests
);

// ========================
// TOPIC WISHES
// ========================
// SUBMIT WISHES (STUDENT ONLY)
// ======================
router.post(
  "/submit-topic-wishes",
  verifyToken,
  requireRole(["student"]),
  teamController.submitWishes
);


// ======================
// GET TEAM WISHES (STUDENT ONLY)
// ======================
router.get(
  "/get-topic-wishesList",
  verifyToken,
  requireRole(["student"]),
  teamController.getTeamWishes
);


module.exports = router;