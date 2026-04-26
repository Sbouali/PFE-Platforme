const db = require("./db");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected");

    // Join a team room
    socket.on("joinTeam", (teamId) => {
      socket.join(`team_${teamId}`);
    });

    // Send a message
    socket.on("sendMessage", async (data) => {
      try {
        const { teamId, message, senderId } = data; // in production, senderId should come from verified token

        // Verify sender is a team member
        const [members] = await db.execute(
          `SELECT * FROM team_members WHERE team_id=? AND student_id=?`,
          [teamId, senderId]
        );
        if (members.length === 0) return; // ignore messages from non-members

        // Store message
        const [result] = await db.execute(
          `INSERT INTO team_messages (team_id, sender_id, message, mssg_type)
           VALUES (?, ?, ?, 'text')`,
          [teamId, senderId, message]
        );

        const messageData = {
          id: result.insertId,
          teamId,
          senderId,
          message
        };

        // Broadcast message to the team room
        io.to(`team_${teamId}`).emit("newMessage", messageData);

        // Notify all other team members
        for (const member of members) {
          if (member.student_id !== senderId) {
            await db.execute(
              `INSERT INTO notifications (user_id, title, content)
               VALUES (?, ?, ?)`,
              [member.student_id, "New message", "New message in your team chat"]
            );
          }
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      socket.to(`team_${data.teamId}`).emit("userTyping", data.userName);
    });

    socket.on("stopTyping", (teamId) => {
      socket.to(`team_${teamId}`).emit("stopTyping");
    });

    // Message seen indicator
    socket.on("messageSeen", async (data) => {
      try {
        const { teamId, messageId, userId } = data;

        await db.execute(
          `INSERT INTO message_reads (message_id, user_id, seen_at)
           VALUES (?, ?, NOW())`,
          [messageId, userId]
        );

        socket.to(`team_${teamId}`).emit("messageSeen", data);
      } catch (err) {
        console.error(err);
      }
    });
  });
};