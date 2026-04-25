const express = require("express");
const router = express.Router();
const ctrl = require("../Controllers/topicController");
const verifyToken = require("../../middlewares/verifyToken");
const requireRole = require("../../middlewares/requireRole");

// ===== TEACHER =====
router.post("/create-topic", verifyToken, requireRole(["teacher"]), ctrl.createTopic);
router.put("/update_topic/:id", verifyToken, requireRole(["teacher"]), ctrl.updateTopic);
router.delete("/delete_topic/:id", verifyToken, requireRole(["teacher"]), ctrl.deleteTopic);
router.get("/my-drafts", verifyToken, requireRole(["teacher"]), ctrl.getMyDraftTopics);
module.exports = router;