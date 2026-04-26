const db = require("../../config/db");

// ================= GET TEAMS FOR STUDENT =================
exports.getTeamsForStudent = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get student info
    const [studentRows] = await db.query(
      `SELECT id, speciality_id FROM students WHERE user_id = ?`,
      [userId]
    );

    if (!studentRows.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = studentRows[0];

    // 2. Get teams in same speciality
    const [teams] = await db.query(
      `
      SELECT DISTINCT t.id, t.name, t.type, t.status
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      JOIN students s ON s.id = tm.student_id
      WHERE s.speciality_id = ?
      `,
      [student.speciality_id]
    );

    // 3. Attach members
    for (let team of teams) {
      const [members] = await db.query(
        `
        SELECT s.id, s.first_name, s.last_name
        FROM team_members tm
        JOIN students s ON s.id = tm.student_id
        WHERE tm.team_id = ?
        `,
        [team.id]
      );

      team.members = members;
    }

    return res.json({
      speciality_id: student.speciality_id,
      teams,
    });

  } catch (error) {
    console.error("Get teams error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// ================= GET TOPICS FOR STUDENT =================
exports.getTopicsForStudent = async (req, res) => {
  try {
    const userId = req.user.id;

    const [student] = await db.query(
      `SELECT speciality_id FROM students WHERE user_id = ?`,
      [userId]
    );

    if (!student.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const specialityId = student[0].speciality_id;

    if (!specialityId) {
      return res.status(400).json({
        success: false,
        message: "Student has no speciality assigned",
      });
    }

    const [topics] = await db.query(
      `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.academic_year,
        p.created_at,
        t.first_name,
        t.last_name
      FROM pfe_topics p
      JOIN teachers t ON p.teacher_id = t.id
      WHERE 
        p.speciality_id = ?
        AND p.visibility = 'published'
        AND p.status = 'unassigned'
      ORDER BY p.created_at DESC
      `,
      [specialityId]
    );

    res.json({
      success: true,
      count: topics.length,
      data: topics,
    });

  } catch (error) {
    console.error("Get student topics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};