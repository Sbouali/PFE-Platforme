const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../../config/db");

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 1️⃣ Get user
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Wrong password, try again" });
    }

    // 3️⃣ Activate account on first login
    if (user.is_active === 0) {
      await db.execute(
        `UPDATE users SET is_active = 1 WHERE id = ?`,
        [user.id]
      );
    }

    // 4️⃣ 🔥 Get ALL roles for this user
    const [rolesRows] = await db.execute(
      `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [user.id]
    );

    const roles = rolesRows.map(r => r.name);

    // 5️⃣ Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: roles, // ✅ array of roles
        must_change_password: user.must_change_password === 1,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 6️⃣ Response
    return res.json({
  message: "Login successful",
  token,
  roles,
  must_change_password: user.must_change_password === 1,
  user: {
    id: user.id,
    email: user.email,
    fullName:
      user.full_name ||
      user.name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email,
  },
});

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

module.exports = { login };