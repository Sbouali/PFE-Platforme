
const db = require("../../config/db");
const cloudinary = require("../../config/cloudinary");


// Get all messages for a team
exports.getMessages = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.userId; // from JWT

    // Verify user is a member
    const [members] = await db.execute(
      `SELECT * FROM team_members WHERE team_id=? AND student_id=?`,
      [teamId, userId]
    );
    if (members.length === 0) return res.status(403).json({ message: "Not a team member" });

    const [messages] = await db.execute(
      `SELECT m.*, u.email
       FROM team_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.team_id = ?
       ORDER BY m.created_at ASC`,
      [teamId]
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send a message (HTTP route)
exports.sendMessage = async (req, res) => {
  try {
    const { teamId, message } = req.body;
    const senderId = req.user.userId;

    // Verify membership
    const [members] = await db.execute(
      `SELECT * FROM team_members WHERE team_id=? AND student_id=?`,
      [teamId, senderId]
    );
    if (members.length === 0) return res.status(403).json({ message: "Not a team member" });

    const [result] = await db.execute(
      `INSERT INTO team_messages (team_id, sender_id, message, mssg_type)
       VALUES (?, ?, ?, 'text')`,
      [teamId, senderId, message]
    );

    res.json({ message: "Message sent", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark a message as seen
exports.markSeen = async (req, res) => {
  try {
    const { messageId } = req.body;
    const userId = req.user.userId;

    await db.execute(
      `INSERT INTO message_reads (message_id, user_id, seen_at)
       VALUES (?, ?, NOW())`,
      [messageId, userId]
    );

    res.json({ message: "Seen recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get unread notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [notifications] = await db.execute(
      `SELECT * FROM notifications
       WHERE user_id=? AND is_read=FALSE
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




exports.sendFile = async (req, res) => {
  try {
    const { teamId } = req.body;
    const senderId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // upload to cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "team_chat" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const fileType = req.file.mimetype.startsWith("image")
      ? "image"
      : "file";

    const [message] = await db.execute(
      `INSERT INTO team_messages 
      (team_id, sender_id, message, file_url, file_name, mssg_type)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        teamId,
        senderId,
        "",
        result.secure_url,
        req.file.originalname,
        fileType
      ]
    );

    res.json({
      id: message.insertId,
      fileUrl: result.secure_url
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};