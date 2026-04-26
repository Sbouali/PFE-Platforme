const db = require("../../config/db");

const assignJury = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { team_id, jury } = req.body;

    if (!team_id || !jury || jury.length < 2) {
      return res.status(400).json({
        error: "Team and at least 2 jury members required"
      });
    }

    // 1️⃣ Get assigned topic
    const [project] = await connection.execute(
      `SELECT topic_id FROM projects WHERE team_id = ?`,
      [team_id]
    );

    if (project.length === 0) {
      return res.status(400).json({
        error: "Team has no assigned topic"
      });
    }

    const topic_id = project[0].topic_id;

    // 2️⃣ Get supervisor (teacher who created topic)
    const [topic] = await connection.execute(
      `SELECT teacher_id FROM pfe_topics WHERE id = ?`,
      [topic_id]
    );

    const supervisor_id = topic[0].teacher_id;

    // 3️⃣ Extract president
    const president = jury.find(j => j.role === "president");

    if (!president) {
      return res.status(400).json({
        error: "One jury member must be president"
      });
    }

    // 4️⃣ Create soutenance group
    const [result] = await connection.execute(
      `INSERT INTO group_soutenances 
       (team_id, topic_id, supervisor_id, president_id)
       VALUES (?, ?, ?, ?)`,
      [team_id, topic_id, supervisor_id, president.teacher_id]
    );

    const soutenance_id = result.insertId;

    // 5️⃣ Insert all jury members
    for (const member of jury) {
      await connection.execute(
        `INSERT INTO soutenance_jury_members (soutenance_id, teacher_id)
         VALUES (?, ?)`,
        [soutenance_id, member.teacher_id]
      );
    }

    await connection.commit();

    res.json({
      message: "Jury assigned successfully",
      soutenance_id
    });

  } catch (err) {
    await connection.rollback();
    console.error("JURY ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  } finally {
    connection.release();
  }
  
};

const assignCoSupervisor = async (req, res) => {
  try {
    const { soutenance_id, co_supervisor_id } = req.body;

    if (!soutenance_id || !co_supervisor_id) {
      return res.status(400).json({
        message: "soutenance_id and co_supervisor_id are required"
      });
    }

    // check soutenance exists
    const [soutenance] = await db.execute(
      "SELECT id FROM group_soutenances WHERE id = ?",
      [soutenance_id]
    );

    if (soutenance.length === 0) {
      return res.status(404).json({
        message: "Soutenance not found"
      });
    }

    // check teacher exists
    const [teacher] = await db.execute(
      "SELECT id FROM teachers WHERE id = ?",
      [co_supervisor_id]
    );

    if (teacher.length === 0) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    // ❗ optional but recommended: prevent same supervisor
    const [check] = await db.execute(
      "SELECT supervisor_id FROM group_soutenances WHERE id = ?",
      [soutenance_id]
    );

    if (check[0].supervisor_id === co_supervisor_id) {
      return res.status(400).json({
        message: "Supervisor and co-supervisor cannot be the same"
      });
    }

    // update
    await db.execute(
      `UPDATE group_soutenances 
       SET co_supervisor_id = ?
       WHERE id = ?`,
      [co_supervisor_id, soutenance_id]
    );

    return res.status(200).json({
      message: "Co-supervisor assigned successfully"
    });

  } catch (error) {
    console.error("ASSIGN CO-SUPERVISOR ERROR:", error);
    res.status(500).json({
      message: "Failed to assign co-supervisor"
    });
  }
};

const getAllSoutenances = async (req, res) => {
  try {
    const [rows] = await db.execute(`
  SELECT 
    gs.id AS soutenance_id,
    gs.created_at,

    t.id AS team_id,
    t.name AS team_name,

    pt.id AS topic_id,
    pt.title AS topic_title,

    sup.id AS supervisor_id,
    CONCAT(sup.first_name, ' ', sup.last_name) AS supervisor_name,

    co_sup.id AS co_supervisor_id,
    CONCAT(co_sup.first_name, ' ', co_sup.last_name) AS co_supervisor_name,

    pres.id AS president_id,
    CONCAT(pres.first_name, ' ', pres.last_name) AS president_name,

    jm.teacher_id AS jury_member_id,
    CONCAT(jm_t.first_name, ' ', jm_t.last_name) AS jury_member_name,

    tm.student_id,
    CONCAT(st.first_name, ' ', st.last_name) AS student_name

  FROM group_soutenances gs

  JOIN teams t ON gs.team_id = t.id
  JOIN pfe_topics pt ON gs.topic_id = pt.id

  -- supervisor
  JOIN teachers sup ON gs.supervisor_id = sup.id

  -- co-supervisor
  LEFT JOIN teachers co_sup ON gs.co_supervisor_id = co_sup.id

  -- president
  JOIN teachers pres ON gs.president_id = pres.id

  -- jury
  LEFT JOIN soutenance_jury_members jm ON jm.soutenance_id = gs.id
  LEFT JOIN teachers jm_t ON jm.teacher_id = jm_t.id

  -- students via team
  LEFT JOIN team_members tm ON tm.team_id = t.id
  LEFT JOIN students st ON tm.student_id = st.id

  ORDER BY gs.id
`);

    // 🔥 GROUP DATA (important for frontend)
    const grouped = {};

    rows.forEach(row => {
      if (!grouped[row.soutenance_id]) {
        grouped[row.soutenance_id] = {
          soutenance_id: row.soutenance_id,
          created_at: row.created_at,

          team: {
            id: row.team_id,
            name: row.team_name
          },

          topic: {
            id: row.topic_id,
            title: row.topic_title
          },

          supervisor: {
            id: row.supervisor_id,
            name: row.supervisor_name
          },

          co_supervisor: row.co_supervisor_id
        ? {
            id: row.co_supervisor_id,
            name: row.co_supervisor_name
            }
        : null,

          president: {
            id: row.president_id,
            name: row.president_name
          },

          jury: [],
          students: []
        };
      }

      // add jury (avoid duplicates)
      if (row.jury_member_id) {
        const exists = grouped[row.soutenance_id].jury.find(
          j => j.id === row.jury_member_id
        );

        if (!exists) {
          grouped[row.soutenance_id].jury.push({
            id: row.jury_member_id,
            name: row.jury_member_name
          });
        }
      }

      // add students (avoid duplicates)
      if (row.student_id) {
        const exists = grouped[row.soutenance_id].students.find(
          s => s.id === row.student_id
        );

        if (!exists) {
          grouped[row.soutenance_id].students.push({
            id: row.student_id,
            name: row.student_name
          });
        }
      }
    });

    return res.json({
      message: "All soutenances fetched successfully",
      data: Object.values(grouped)
    });

  } catch (error) {
    console.error("GET SOUTENANCES ERROR:", error);

    res.status(500).json({
      error: "Failed to fetch soutenances"
    });
  }
};


module.exports = { assignJury, assignCoSupervisor, getAllSoutenances};