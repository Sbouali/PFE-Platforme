// ================= GET TOPICS FOR STUDENT =================
exports.getTopicsForStudent = async (req, res) => {
  try {
    const userId = req.user.id;

    // get student with speciality_id
    const [student] = await db.execute(
      `SELECT speciality_id 
       FROM students 
       WHERE user_id = ?`,
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

    // get topics
    const [topics] = await db.execute(
      `SELECT 
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
       ORDER BY p.created_at DESC`,
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