const db = require("../../config/db");

// ======================
// CREATE NOTIFICATION
// ======================
async function createNotification(userId, type, title, message, data = {}) {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, JSON.stringify(data)]
  );
}

// ======================
// CREATE TEAM
// ======================
async function createTeam(studentId, name, type, maxMembers) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [teamResult] = await conn.query(
      `INSERT INTO teams (name, type, max_members, leader_id)
       VALUES (?, ?, ?, ?)`,
      [name, type, maxMembers, studentId]
    );

    const teamId = teamResult.insertId;

    // Insert leader into team_members with role = 'leader'
    await conn.query(
      `INSERT INTO team_members (team_id, student_id, role)
       VALUES (?, ?, 'leader')`,
      [teamId, studentId]
    );

    await conn.commit();
    return teamId;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ======================
// GET TEAM ID BY LEADER
// ======================
async function getTeamIdByLeader(studentId) {
  const [rows] = await db.query(
    `SELECT id FROM teams WHERE leader_id = ?`,
    [studentId]
  );

  if (!rows.length) throw new Error("Leader has no team");

  return rows[0].id;
}

// ======================
// GET TEAMS
// ======================
async function getTeams() {
  const [rows] = await db.query(`
    SELECT 
      t.id           AS team_id,
      t.name,
      t.type,
      t.max_members,
      t.leader_id,
      t.validated_by_admin,
      t.status,

      s.id           AS student_id,
      s.first_name,
      s.last_name,
      tm.role        AS member_role,

      leader.first_name AS leader_first_name,
      leader.last_name  AS leader_last_name

    FROM teams t
    LEFT JOIN team_members tm  ON t.id          = tm.team_id
    LEFT JOIN students s       ON tm.student_id = s.id
    LEFT JOIN students leader  ON t.leader_id   = leader.id

    ORDER BY t.id ASC
  `);

  const map = new Map();

  for (const row of rows) {
    if (!map.has(row.team_id)) {
      map.set(row.team_id, {
        id: row.team_id,
        name: row.name,
        type: row.type,
        maxMembers: row.max_members,
        validatedByAdmin: !!row.validated_by_admin,
        status: row.status,
        leader: row.leader_id
          ? {
              id: row.leader_id,
              name: `${row.leader_first_name} ${row.leader_last_name}`
            }
          : null,
        members: []
      });
    }

    if (row.student_id) {
      const team = map.get(row.team_id);
      if (!team.members.find(m => m.id === row.student_id)) {
        team.members.push({
          id: row.student_id,
          name: `${row.first_name} ${row.last_name}`,
          role: row.member_role
        });
      }
    }
  }

  return Array.from(map.values());
}

// ======================
// INVITE STUDENT
// ======================
async function inviteStudent(teamId, senderId, receiverId) {
  const [result] = await db.query(
    `INSERT INTO team_invitations (team_id, sender_id, receiver_id)
     VALUES (?, ?, ?)`,
    [teamId, senderId, receiverId]
  );
  return result.insertId;
}

// ======================
// CANCEL INVITATION
// ======================
async function cancelInvitation(invitationId, senderId) {
  const [rows] = await db.query(
    `SELECT receiver_id FROM team_invitations
     WHERE id = ? AND sender_id = ?`,
    [invitationId, senderId]
  );

  if (!rows.length) throw new Error("Invitation not found");

  await db.query(`DELETE FROM team_invitations WHERE id = ?`, [invitationId]);

  return rows[0]; // { receiver_id }
}

// ======================
// ACCEPT INVITATION
// ======================
async function acceptInvitation(invitationId, userId) {
  const [[inv]] = await db.query(
    `SELECT team_id, sender_id
     FROM team_invitations
     WHERE id = ? AND receiver_id = ? AND status = 'pending'`,
    [invitationId, userId]
  );

  if (!inv) throw new Error("Invitation not found");

  // receiver_id in invitations is user_id → resolve to student_id
  const [[student]] = await db.query(
    `SELECT id FROM students WHERE user_id = ?`,
    [userId]
  );

  if (!student) throw new Error("Student not found");

  await db.query(
    `UPDATE team_invitations SET status = 'accepted' WHERE id = ?`,
    [invitationId]
  );

  await db.query(
    `INSERT INTO team_members (team_id, student_id, role)
     VALUES (?, ?, 'member')`,
    [inv.team_id, student.id]
  );

  return { leaderUserId: inv.sender_id, teamId: inv.team_id };
}

// ======================
// REJECT INVITATION
// ======================
async function rejectInvitation(invitationId, userId) {
  const [[inv]] = await db.query(
    `SELECT sender_id FROM team_invitations
     WHERE id = ? AND receiver_id = ? AND status = 'pending'`,
    [invitationId, userId]
  );

  if (!inv) throw new Error("Invitation not found");

  await db.query(
    `UPDATE team_invitations SET status = 'rejected' WHERE id = ?`,
    [invitationId]
  );

  return { leaderUserId: inv.sender_id };
}

module.exports = {
  createTeam,
  getTeamIdByLeader,
  inviteStudent,
  cancelInvitation,
  acceptInvitation,
  rejectInvitation,
  getTeams,
  createNotification
};