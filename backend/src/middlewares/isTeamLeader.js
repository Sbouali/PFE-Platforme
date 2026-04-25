async function isTeamLeader(req, res, next) {
  const userId = req.user.id;
  const teamId = req.params.teamId;

  const [rows] = await db.query(`
    SELECT tm.*
    FROM team_members tm
    JOIN students s ON s.id = tm.student_id
    WHERE tm.team_id = ? AND s.user_id = ? AND tm.role = 'leader'
  `, [teamId, userId]);

  if (rows.length === 0) {
    return res.status(403).json({ message: "Only team leader allowed" });
  }

  next();
}