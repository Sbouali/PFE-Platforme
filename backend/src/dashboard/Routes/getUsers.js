const express = require("express");
const db = require("../../config/db");
const router = express.Router();
const teamService = require("../../student/services/teamService");

router.get("/users", async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT 
        u.id,
        u.email,
        u.avatar_url,
        u.is_active,
        u.created_at,
        COALESCE(GROUP_CONCAT(r.name), '') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    const formattedUsers = users.map((user) => ({
      ...user,
      roles: user.roles ? user.roles.split(",") : [],
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* =========================
   GET USERS BY ROLE
========================= */

router.get("/users/role/:role", async (req, res) => {
  const { role } = req.params;

  try {
    let query;
    let params = [role];

   if (role === "student") {
  query = `
    SELECT DISTINCT
      u.id,
      u.email,
      u.avatar_url,
      u.is_active,
      u.created_at,
      s.first_name,
      s.last_name,
      s.bac_matricule,
      s.promotion_year,
      s.speciality_id
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.id
    INNER JOIN students s ON u.id = s.user_id
    WHERE r.name = ?
  `;
} else if (role === "teacher") {
  query = `
    SELECT DISTINCT
      u.id,
      u.email,
      u.avatar_url,
      u.is_active,
      u.created_at,
      t.first_name,
      t.last_name
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.id
    INNER JOIN teachers t ON u.id = t.user_id
    WHERE r.name = ?
  `;
} else {
  query = `
    SELECT DISTINCT
      u.id,
      u.email,
      u.avatar_url,
      u.is_active,
      u.created_at
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE r.name = ?
  `;
}

    const [data] = await db.execute(query, params);

    return res.status(200).json(data);

  } catch (error) {
    console.log("❌ ERROR:", error?.message);
    return res.status(500).json({
      error: error?.message ?? "Failed to fetch users",
    });
  }
});

router.get("/teams", async (req, res) => {
  try {
    const teams = await teamService.getTeams();

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });

  } catch (err) {
    console.log("❌ ERROR:", err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;