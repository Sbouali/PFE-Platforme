const bcrypt = require("bcrypt");
const db = require("./config/db");

async function seedTeacher() {
  try {
    const email = "teacher2@test.com";
    const password = "Teacher123";

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Check if user already exists
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    let userId;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log("User already exists:", email);
    } else {
      // 2. Create user
      const [userResult] = await db.execute(
        `INSERT INTO users (email, password_hash, is_active, must_change_password)
         VALUES (?, ?, 1, 0)`,
        [email, hashedPassword]
      );

      userId = userResult.insertId;
      console.log("User created:", email);
    }

    // 3. Get teacher role
    const [roles] = await db.execute(
      "SELECT id FROM roles WHERE name = ?",
      ["teacher"]
    );

    if (roles.length === 0) {
      throw new Error("Role teacher not found in roles table");
    }

    const teacherRoleId = roles[0].id;

    // 4. Attach teacher role if not exists
    const [existingRole] = await db.execute(
      "SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?",
      [userId, teacherRoleId]
    );

    if (existingRole.length === 0) {
      await db.execute(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [userId, teacherRoleId]
      );
      console.log("Teacher role attached");
    } else {
      console.log("Teacher role already attached");
    }

    // 5. Add to teachers table if not exists
    const [existingTeacher] = await db.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId]
    );

    if (existingTeacher.length === 0) {
      await db.execute(
        "INSERT INTO teachers (user_id) VALUES (?)",
        [userId]
      );
      console.log("Teacher row created");
    } else {
      console.log("Teacher row already exists");
    }

    console.log("✅ Teacher test ready");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedTeacher();