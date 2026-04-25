const db = require("../../config/db");

// ================= CREATE TOPIC (TEACHER) =================
exports.createTopic = async (req, res) => {
  try {
    const { title, description, speciality_id, academic_year } = req.body;

    const userId = req.user.id; // from auth middleware

    if (!title || !speciality_id || !academic_year) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // get teacher id from user_id
    const [teacher] = await db.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId]
    );

    if (teacher.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can create topics",
      });
    }

    const teacherId = teacher[0].id;

    // insert topic as DRAFT
    await db.execute(
      `INSERT INTO pfe_topics 
      (title, description, teacher_id, speciality_id, academic_year, visibility) 
      VALUES (?, ?, ?, ?, ?, 'draft')`,
      [title, description, teacherId, speciality_id, academic_year]
    );

    res.status(201).json({
      success: true,
      message: "Topic created and waiting for admin approval",
    });
  } catch (error) {
    console.error("Create topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= UPDATE TOPIC =================
exports.updateTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const { title, description, speciality_id, academic_year } = req.body;
    const userId = req.user.id;

    // 1️⃣ get teacher
    const [teacher] = await db.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId]
    );

    if (!teacher.length) {
      return res.status(403).json({
        success: false,
        message: "Only teachers allowed"
      });
    }

    const teacherId = teacher[0].id;

    // 2️⃣ get topic (REMOVE draft condition ❗)
    const [topicRows] = await db.execute(
      `SELECT * FROM pfe_topics 
       WHERE id = ? AND teacher_id = ?`,
      [topicId, teacherId]
    );

    if (!topicRows.length) {
      return res.status(403).json({
        success: false,
        message: "Topic not found or not yours"
      });
    }

    const topic = topicRows[0];

    // 3️⃣ if topic was approved → reset to draft
    let newVisibility = topic.visibility;

    if (topic.visibility === "public") {
      newVisibility = "draft";
    }

    // 4️⃣ update topic
    await db.execute(
      `UPDATE pfe_topics 
       SET title = ?, description = ?, speciality_id = ?, academic_year = ?, visibility = ?
       WHERE id = ?`,
      [title, description, speciality_id, academic_year, newVisibility, topicId]
    );

    res.json({
      success: true,
      message:
        newVisibility === "draft"
          ? "Topic updated and needs re-approval"
          : "Topic updated"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================= DELETE TOPIC =================
exports.deleteTopic = async (req, res) => {
  try {
    const topicId = req.params.id;
    const userId = req.user.id;

    const [teacher] = await db.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId]
    );

    if (!teacher.length) {
      return res.status(403).json({ success: false });
    }

    const teacherId = teacher[0].id;

    const [topic] = await db.execute(
      `SELECT * FROM pfe_topics 
       WHERE id = ? AND teacher_id = ? AND visibility = 'draft'`,
      [topicId, teacherId]
    );

    if (!topic.length) {
      return res.status(403).json({
        success: false,
        message: "Only draft topics can be deleted",
      });
    }

    await db.execute("DELETE FROM pfe_topics WHERE id = ?", [topicId]);

    res.json({ success: true, message: "Topic deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


// ================= GET MY DRAFTS =================
exports.getMyDraftTopics = async (req, res) => {
  try {
    const userId = req.user.id;

    const [teacher] = await db.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId]
    );

    if (!teacher.length) {
      return res.status(403).json({ success: false });
    }

    const teacherId = teacher[0].id;

    const [topics] = await db.execute(
      `SELECT * FROM pfe_topics 
       WHERE teacher_id = ? AND visibility = 'draft'`,
      [teacherId]
    );

    res.json({ success: true, data: topics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};