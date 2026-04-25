const teamService = require("../services/teamService");
const db = require("../../config/db");
const isleader = require("../../middlewares/isTeamLeader");

// ================= CREATE TEAM =================
exports.createTeam = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: "name and type are required" });
    }

    const [[student]] = await db.execute(
      `SELECT id FROM students WHERE user_id = ?`,
      [req.user.id]
    );

    if (!student) {
      return res.status(400).json({ success: false, message: "Only students can create a team" });
    }

    const studentId = student.id;

    // Check student not already in a team (UNIQUE on student_id in team_members)
    const [existingTeam] = await db.execute(
      `SELECT 1 FROM team_members WHERE student_id = ?`,
      [studentId]
    );

    if (existingTeam.length > 0) {
      return res.status(400).json({ success: false, message: "You already belong to a team" });
    }

    const typeMap = { monome: 1, binome: 2, startup: 6 };
    const maxMembers = typeMap[type];

    if (!maxMembers) {
      return res.status(400).json({ success: false, message: "Invalid team type. Use: monome, binome, startup" });
    }

    const id = await teamService.createTeam(studentId, name, type, maxMembers);

    await teamService.createNotification(
      req.user.id,
      "team_created",
      "Team created",
      `You created team ${name}`,
      { id, name }
    );

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: { id, name, type, maxMembers }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ================= INVITE STUDENT =================
exports.inviteStudent = async (req, res) => {
  try {
    const { receiverId } = req.body; // user_id of student to invite
    const senderId = req.user.id;    // user_id of leader

    const [[sender]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [senderId]
    );
    if (!sender) return res.status(404).json({ error: "Student not found" });

    const teamId = await teamService.getTeamIdByLeader(sender.id);

    // Check team capacity
    const [[team]] = await db.query(
      `SELECT t.type, t.max_members, COUNT(tm.id) AS current_members
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id = ?
       GROUP BY t.id`,
      [teamId]
    );
    if (!team) return res.status(404).json({ error: "Team not found" });

    if (team.current_members >= team.max_members) {
      return res.status(400).json({
        error: `Team is full. ${team.type} teams allow maximum ${team.max_members} member(s)`
      });
    }

    // Count pending invitations to avoid over-inviting
    const [[pendingCount]] = await db.query(
      `SELECT COUNT(*) AS pending FROM team_invitations
       WHERE team_id = ? AND status = 'pending'`,
      [teamId]
    );

    if (team.current_members + pendingCount.pending >= team.max_members) {
      return res.status(400).json({
        error: `Cannot send more invitations. ${pendingCount.pending} pending invitation(s) will fill the team.`
      });
    }

    // Check receiver is not already in a team
    // team_invitations.receiver_id is user_id → resolve to student_id first
    const [[receiverStudent]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [receiverId]
    );
    if (!receiverStudent) return res.status(404).json({ error: "Receiver student not found" });

    const [[existingMember]] = await db.query(
      `SELECT id FROM team_members WHERE student_id = ?`,
      [receiverStudent.id]
    );
    if (existingMember) {
      return res.status(400).json({ error: "This student is already in a team" });
    }

    // Check no duplicate pending invitation
    const [[existingInvite]] = await db.query(
      `SELECT id FROM team_invitations
       WHERE team_id = ? AND receiver_id = ? AND status = 'pending'`,
      [teamId, receiverId]
    );
    if (existingInvite) {
      return res.status(400).json({ error: "An invitation is already pending for this student" });
    }

    // Insert invitation (sender_id and receiver_id are both user_ids)
    const [result] = await db.query(
      `INSERT INTO team_invitations (team_id, sender_id, receiver_id)
       VALUES (?, ?, ?)`,
      [teamId, senderId, receiverId]
    );

    const invitationId = result.insertId;

    await teamService.createNotification(
      receiverId,
      "team_invite",
      "Team invitation",
      "You received a team invitation",
      { invitationId, teamId }
    );

    res.json({ success: true, message: "Invitation sent", invitationId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= CANCEL INVITATION =================
exports.cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const senderId = req.user.id; // user_id

    const [[invitation]] = await db.query(
      `SELECT receiver_id FROM team_invitations
       WHERE id = ? AND sender_id = ? AND status = 'pending'`,
      [invitationId, senderId]
    );
    if (!invitation) return res.status(404).json({ error: "Invitation not found" });

    // Mark as cancelled instead of deleting (preserves history)
    await db.query(
      `UPDATE team_invitations SET status = 'cancelled' WHERE id = ?`,
      [invitationId]
    );

    await teamService.createNotification(
      invitation.receiver_id,
      "invite_cancelled",
      "Invitation cancelled",
      "The team leader cancelled the invitation",
      { invitationId }
    );

    res.json({ success: true, message: "Invitation cancelled" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= ACCEPT INVITATION =================
exports.acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const userId = req.user.id; // user_id

    const [[student]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [userId]
    );
    if (!student) return res.status(404).json({ error: "Student not found" });

    const [[invitation]] = await db.query(
      `SELECT team_id, sender_id FROM team_invitations
       WHERE id = ? AND receiver_id = ? AND status = 'pending'`,
      [invitationId, userId] // receiver_id is user_id
    );
    if (!invitation) return res.status(404).json({ error: "Invitation not found" });

    // Re-check team capacity before accepting
    const [[team]] = await db.query(
      `SELECT max_members, COUNT(tm.id) AS current_members
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id = ?
       GROUP BY t.id`,
      [invitation.team_id]
    );

    if (team.current_members >= team.max_members) {
      return res.status(400).json({ error: "Team is now full, cannot accept invitation" });
    }

    await db.query(
      `UPDATE team_invitations SET status = 'accepted' WHERE id = ?`,
      [invitationId]
    );

    // student_id in team_members is students.id (not users.id)
    await db.query(
      `INSERT INTO team_members (team_id, student_id, role)
       VALUES (?, ?, 'member')`,
      [invitation.team_id, student.id]
    );

    await teamService.createNotification(
      invitation.sender_id, // sender_id is user_id
      "invite_accepted",
      "Invitation accepted",
      "A student accepted your team invitation",
      { invitationId, teamId: invitation.team_id }
    );

    res.json({ success: true, message: "Invitation accepted, you have joined the team" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= REJECT INVITATION =================
exports.rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const userId = req.user.id; // user_id

    const [[invitation]] = await db.query(
      `SELECT sender_id FROM team_invitations
       WHERE id = ? AND receiver_id = ? AND status = 'pending'`,
      [invitationId, userId] // receiver_id is user_id
    );
    if (!invitation) return res.status(404).json({ error: "Invitation not found" });

    await db.query(
      `UPDATE team_invitations SET status = 'rejected' WHERE id = ?`,
      [invitationId]
    );

    await teamService.createNotification(
      invitation.sender_id,
      "invite_rejected",
      "Invitation rejected",
      "A student rejected your team invitation",
      { invitationId }
    );

    res.json({ success: true, message: "Invitation rejected" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= EXIT TEAM =================
exports.exitTeam = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[student]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [userId]
    );
    if (!student) return res.status(404).json({ error: "Student not found" });

    const studentId = student.id;

    const [[membership]] = await db.query(
      `SELECT tm.id, tm.team_id, t.leader_id, t.name AS team_name
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.student_id = ?`,
      [studentId]
    );
    if (!membership) return res.status(400).json({ error: "You are not in a team" });

    if (membership.leader_id === studentId) {
      return res.status(400).json({
        error: "Leaders cannot leave the team. Transfer leadership first or delete the team."
      });
    }

    await db.query(
      `DELETE FROM team_members WHERE student_id = ?`,
      [studentId]
    );

    // Get leader's user_id for notification
    const [[leader]] = await db.query(
      `SELECT user_id FROM students WHERE id = ?`,
      [membership.leader_id]
    );

    await teamService.createNotification(
      leader.user_id,
      "member_left",
      "Member left",
      "A member has left your team",
      { teamId: membership.team_id, studentId }
    );

    res.json({ success: true, message: "You have left the team" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= REQUEST JOIN =================
exports.requestJoinTeam = async (req, res) => {
  try {
    const { id } = req.body; // team_id
    const userId = req.user.id;

    const [[student]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [userId]
    );
    if (!student) return res.status(404).json({ error: "Student not found" });

    const studentId = student.id;

    // Check student not already in a team
    const [[existingMember]] = await db.query(
      `SELECT id FROM team_members WHERE student_id = ?`,
      [studentId]
    );
    if (existingMember) return res.status(400).json({ error: "You are already in a team" });

    const [[team]] = await db.query(
      `SELECT t.id, t.type, t.max_members, t.leader_id, s.user_id AS leader_user_id
       FROM teams t
       JOIN students s ON t.leader_id = s.id
       WHERE t.id = ?`,
      [id]
    );
    if (!team) return res.status(404).json({ error: "Team not found" });

    const [[memberCount]] = await db.query(
      `SELECT COUNT(*) AS current_members FROM team_members WHERE team_id = ?`,
      [id]
    );
    if (memberCount.current_members >= team.max_members) {
      return res.status(400).json({ error: "Team is full" });
    }

    // NOTE: team_join_requests.student_id references users.id (per schema)
    const [[existingRequest]] = await db.query(
      `SELECT id FROM team_join_requests
       WHERE team_id = ? AND student_id = ? AND status = 'pending'`,
      [id, userId] // student_id in join_requests = user_id
    );
    if (existingRequest) {
      return res.status(400).json({ error: "You already have a pending request for this team" });
    }

    const [result] = await db.query(
      `INSERT INTO team_join_requests (team_id, student_id, status)
       VALUES (?, ?, 'pending')`,
      [id, userId] // student_id in join_requests = user_id
    );

    await teamService.createNotification(
      team.leader_user_id,
      "join_request",
      "Join request",
      "A student requested to join your team",
      { requestId: result.insertId, teamId: id }
    );

    res.json({ success: true, message: "Join request sent", requestId: result.insertId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= GET JOIN REQUESTS (for team leader) =================
exports.getJoinRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[leader]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [userId]
    );
    if (!leader) return res.status(404).json({ error: "Student not found" });

    const [[team]] = await db.query(
      `SELECT id, name FROM teams WHERE leader_id = ?`,
      [leader.id]
    );
    if (!team) return res.status(404).json({ error: "You are not a team leader" });

    // join_requests.student_id = users.id → join to students via users
    const [requests] = await db.query(
      `SELECT 
        jr.id          AS request_id,
        jr.status,
        jr.created_at,
        jr.student_id  AS requester_user_id,
        s.id           AS student_id,
        s.first_name,
        s.last_name,
        s.bac_matricule
       FROM team_join_requests jr
       JOIN students s ON s.user_id = jr.student_id
       WHERE jr.team_id = ? AND jr.status = 'pending'
       ORDER BY jr.created_at DESC`,
      [team.id]
    );

    res.json({
      success: true,
      teamId: team.id,
      teamName: team.name,
      count: requests.length,
      data: requests.map(r => ({
        requestId: r.request_id,
        status: r.status,
        createdAt: r.created_at,
        student: {
          id: r.student_id,
          userId: r.requester_user_id,
          firstName: r.first_name,
          lastName: r.last_name,
          bacMatricule: r.bac_matricule
        }
      }))
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ================= ACCEPT JOIN REQUEST =================
exports.acceptJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const [[leader]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [userId]
    );
    if (!leader) return res.status(404).json({ error: "Student not found" });

    // join_requests.student_id = users.id
    const [[request]] = await db.query(
      `SELECT jr.id, jr.team_id, jr.student_id AS requester_user_id
       FROM team_join_requests jr
       WHERE jr.id = ? AND jr.status = 'pending'`,
      [requestId]
    );
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Verify the caller is the leader of that team
    const [[team]] = await db.query(
      `SELECT id, max_members FROM teams WHERE id = ? AND leader_id = ?`,
      [request.team_id, leader.id]
    );
    if (!team) return res.status(403).json({ error: "You are not the leader of this team" });

    // Re-check capacity
    const [[memberCount]] = await db.query(
      `SELECT COUNT(*) AS current_members FROM team_members WHERE team_id = ?`,
      [request.team_id]
    );
    if (memberCount.current_members >= team.max_members) {
      return res.status(400).json({ error: "Team is full" });
    }

    // Resolve requester's user_id → students.id for team_members insert
    const [[requesterStudent]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [request.requester_user_id]
    );
    if (!requesterStudent) return res.status(404).json({ error: "Requesting student not found" });

    await db.query(
      `UPDATE team_join_requests SET status = 'accepted' WHERE id = ?`,
      [requestId]
    );

    // team_members.student_id = students.id
    await db.query(
      `INSERT INTO team_members (team_id, student_id, role)
       VALUES (?, ?, 'member')`,
      [request.team_id, requesterStudent.id]
    );

    await teamService.createNotification(
      request.requester_user_id, // user_id for notification
      "join_accepted",
      "Request accepted",
      "Your request to join the team was accepted",
      { teamId: request.team_id }
    );

    res.json({ success: true, message: "Student added to team" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= REJECT JOIN REQUEST =================
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const [[leader]] = await db.query(
      `SELECT id FROM students WHERE user_id = ?`,
      [userId]
    );
    if (!leader) return res.status(404).json({ error: "Student not found" });

    const [[request]] = await db.query(
      `SELECT jr.id, jr.team_id, jr.student_id AS requester_user_id
       FROM team_join_requests jr
       WHERE jr.id = ? AND jr.status = 'pending'`,
      [requestId]
    );
    if (!request) return res.status(404).json({ error: "Request not found" });

    const [[team]] = await db.query(
      `SELECT id FROM teams WHERE id = ? AND leader_id = ?`,
      [request.team_id, leader.id]
    );
    if (!team) return res.status(403).json({ error: "You are not the leader of this team" });

    await db.query(
      `UPDATE team_join_requests SET status = 'rejected' WHERE id = ?`,
      [requestId]
    );

    await teamService.createNotification(
      request.requester_user_id,
      "join_rejected",
      "Request rejected",
      "Your request to join the team was rejected",
      { teamId: request.team_id }
    );

    res.json({ success: true, message: "Join request rejected" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= GET TEAMS =================
exports.getTeams = async (req, res) => {
  try {
    const teams = await teamService.getTeams();
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// helper: get teamId from user
async function getTeamId(userId) {
  const [[student]] = await db.query(
    `SELECT id FROM students WHERE user_id = ?`,
    [userId]
  );

  if (!student) throw new Error("Student not found");

  const [[team]] = await db.query(
    `SELECT team_id FROM team_members WHERE student_id = ?`,
    [student.id]
  );

  if (!team) throw new Error("User is not in a team");

  return team.team_id;
}

// ======================
// SUBMIT WISHES (FIXED)
// ======================
exports.submitWishes = async (req, res) => {
  const { wishes } = req.body;
  const userId = req.user.id;

  try {
    if (!Array.isArray(wishes) || wishes.length === 0) {
      return res.status(400).json({
        message: "Wishes must be a non-empty array"
      });
    }

    const teamId = await getTeamId(userId);

    // 🔥 validate duplicates in request body BEFORE DB
    const topicIds = wishes.map(w => w.topic_id);
    const uniqueTopics = new Set(topicIds);

    if (uniqueTopics.size !== topicIds.length) {
      return res.status(400).json({
        message: "Duplicate topic_id in wishes not allowed"
      });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. delete old wishes
      await conn.query(
        `DELETE FROM topic_wishes WHERE team_id = ?`,
        [teamId]
      );

      // 2. insert new ordered wishes safely
      for (let i = 0; i < wishes.length; i++) {
        const topicId = wishes[i].topic_id;
        const priority = i + 1;

        await conn.query(
          `INSERT INTO topic_wishes (team_id, topic_id, priority)
           VALUES (?, ?, ?)`,
          [teamId, topicId, priority]
        );
      }

      await conn.commit();
      conn.release();

      return res.json({
        success: true,
        message: "Topic wishes submitted successfully",
        teamId,
        count: wishes.length
      });

    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
// GET TEAM WISHES (FIXED)
// ======================
exports.getTeamWishes = async (req, res) => {
  const userId = req.user.id;

  try {
    const teamId = await getTeamId(userId);

    const [rows] = await db.query(
      `
      SELECT 
        tw.id,
        tw.topic_id,
        tw.priority,
        tw.created_at,

        p.title,
        p.description,
        p.speciality_id,
        p.teacher_id,
        p.academic_year,
        p.visibility

      FROM topic_wishes tw
      JOIN pfe_topics p ON p.id = tw.topic_id
      WHERE tw.team_id = ?
      ORDER BY tw.priority ASC
      `,
      [teamId]
    );

    return res.json({
      success: true,
      teamId,
      count: rows.length,
      data: rows
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};