const express = require("express");
const router = express.Router();
const chatController = require("../../student/controllers/chatController");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const authMiddleware = require("../../middlewares/verifyToken");
const db = require("../../config/db");
const path = require("path");

// 🔥 Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${uuid()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 🔐 Protect all routes
router.use(authMiddleware);

// GET messages
router.get("/team/:teamId/messages", chatController.getMessages);

// POST text message
router.post("/send", chatController.sendMessage);

// POST seen
router.post("/seen", chatController.markSeen);

// GET notifications
router.get("/notifications", chatController.getNotifications);

// 🔥 SINGLE send-file route
router.post("/send-file", upload.single("file"), async (req, res) => {
  try {
    const { teamId } = req.body;
    const senderId = req.user.id; // ✅ FIX (was userId)

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = "/uploads/" + req.file.filename;

    // Verify membership
    const [members] = await db.execute(
      `SELECT * FROM team_members WHERE team_id=? AND student_id=?`,
      [teamId, senderId]
    );

    if (members.length === 0) {
      return res.status(403).json({ message: "Not a team member" });
    }

    // Insert message
    await db.execute(
      `INSERT INTO team_messages 
       (team_id, sender_id, message, mssg_type, file_url)
       VALUES (?, ?, ?, 'file', ?)`,
      [teamId, senderId, req.file.originalname, fileUrl]
    );

    res.json({
      message: "File sent",
      file: fileUrl
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;