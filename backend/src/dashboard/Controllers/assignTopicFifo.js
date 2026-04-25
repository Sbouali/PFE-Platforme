const db = require("../../config/db");
const assignFIFO = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Get all wishes ordered FIFO
    const [wishes] = await connection.execute(`
      SELECT * FROM topic_wishes
      ORDER BY priority ASC, created_at ASC
    `);

    for (const wish of wishes) {
      const { team_id, topic_id } = wish;

      // 2️⃣ Check if topic already assigned
      const [topicAssigned] = await connection.execute(
        `SELECT id FROM projects WHERE topic_id = ?`,
        [topic_id]
      );

      if (topicAssigned.length > 0) continue;

      // 3️⃣ Check if team already has topic
      const [teamAssigned] = await connection.execute(
        `SELECT id FROM projects WHERE team_id = ?`,
        [team_id]
      );

      if (teamAssigned.length > 0) continue;

      // 4️⃣ Assign topic
      await connection.execute(
        `INSERT INTO projects (team_id, topic_id) VALUES (?, ?)`,
        [team_id, topic_id]
      );

      // 5️⃣ Update topic status
      await connection.execute(
        `UPDATE pfe_topics SET status = 'assigned' WHERE id = ?`,
        [topic_id]
      );
    }

    await connection.commit();

    res.json({ message: "Topics assigned successfully (FIFO)" });

  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Assignment failed" });
  } finally {
    connection.release();
  }
};

module.exports = { assignFIFO };