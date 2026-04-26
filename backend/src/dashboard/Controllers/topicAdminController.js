
const db = require("../../config/db");

// ================= APPROVE TOPIC (ADMIN) =================
exports.approveTopic = async (req, res) => {
  try {
    const topicId = req.params.id;

    // check topic exists
    const [topic] = await db.execute(
      "SELECT * FROM pfe_topics WHERE id = ?",
      [topicId]
    );

    if (topic.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // update to published
    await db.execute(
      `UPDATE pfe_topics 
       SET visibility = 'published', published_at = NOW()
       WHERE id = ?`,
      [topicId]
    );

    res.json({
      success: true,
      message: "Topic approved and published",
    });
  } catch (error) {
    console.error("Approve topic error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= ARCHIVE TOPIC =================
exports.archiveTopic = async (req, res) => {
  try {
    const topicId = req.params.id;

    const [topic] = await db.execute(
      "SELECT * FROM pfe_topics WHERE id = ?",
      [topicId]
    );

    if (!topic.length) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    await db.execute(
      `UPDATE pfe_topics 
       SET visibility = 'archived' 
       WHERE id = ?`,
      [topicId]
    );

    res.json({ success: true, message: "Topic archived" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
// ================= GET PENDING TOPICS (ADMIN) =================
exports.getPendingTopics = async (req, res) => {
  try {
    const [topics] = await db.execute(
      `SELECT 
          p.id,
          p.title,
          p.description,
          p.academic_year,
          p.created_at,
          s.name AS speciality,
          t.first_name,
          t.last_name
       FROM pfe_topics p
       JOIN teachers t ON p.teacher_id = t.id
       JOIN specialities s ON p.speciality_id = s.id
       WHERE p.visibility = 'draft'
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      count: topics.length,
      data: topics,
    });

  } catch (error) {
    console.error("Get pending topics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
//getAllTopicWishes
exports.getAllTopicWishes = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        tw.id AS wish_id,
        tw.priority,
        tw.created_at,

        t.id AS team_id,
        t.name AS team_name,

        pt.id AS topic_id,
        pt.title AS topic_title,

        s.name AS speciality_name

      FROM topic_wishes tw
      JOIN teams t ON tw.team_id = t.id
      JOIN pfe_topics pt ON tw.topic_id = pt.id
      JOIN specialities s ON pt.speciality_id = s.id

      ORDER BY t.id, tw.priority ASC
    `);

    return res.json({
      message: "All topic wishes fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch topic wishes"
    });
  }
};



