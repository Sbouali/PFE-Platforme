const bcrypt = require("bcrypt");
const db = require("./config/db");

async function seedTeacher() {
  try {
    const email = "teacher@test.com";
    const password = "Teacher123";

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      console.log("Teacher already exists");
      console.log("Email:", email);
      console.log("Password:", password);
      process.exit(0);
    }

    const [userResult] = await db.execute(
      `INSERT INTO users (email, password_hash, is_active, must_change_password)
       VALUES (?, ?, 1, 0)`,
      [email, hashedPassword]
    );

    const userId = userResult.insertId;

    const [roles] = await db.execute(
      "SELECT id FROM roles WHERE name = ?",
      ["teacher"]
    );

    if (roles.length === 0) {
      throw new Error("Role teacher not found");
    }

    await db.execute(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [userId, roles[0].id]
    );

    console.log("Teacher test created successfully");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedTeacher();