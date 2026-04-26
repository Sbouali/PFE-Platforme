const express = require("express");
const router = express.Router();
const ctrl = require("../Controllers/topicAdminController");
const verifyToken = require("../../middlewares/verifyToken");
const requireRole = require("../../middlewares/requireRole");
const assignTopicsFIFO = require("../Controllers/assignTopicFIFO");


// ===== ADMIN =====
router.put("/approve/:id", verifyToken, requireRole(["admin"]), ctrl.approveTopic);
router.put("/:id/archive", verifyToken, requireRole(["admin"]), ctrl.archiveTopic);
router.get("/pending", verifyToken, requireRole(["admin"]), ctrl.getPendingTopics);
router.post("/assign/fifo",verifyToken,requireRole(["admin"]),  assignTopicsFIFO.assignFIFO);
router.get("/wish-lists", verifyToken, requireRole(["admin"]), ctrl.getAllTopicWishes);

module.exports = router;