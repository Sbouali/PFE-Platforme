const express = require("express");
const multer = require("multer");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");




const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const fs = require("fs");

const db = require("../../config/db");
const verifyToken = require("../../middlewares/verifyToken");
const requireRole = require("../../middlewares/requireRole");

const router = express.Router();

/* =========================
   CLOUDINARY STORAGE
========================= */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatars",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

/* =========================
   PASSWORD GENERATOR
========================= */
function generatePassword(role, first_name, last_name, bac_matricule) {
  if (role === "student") {
    const firstLetter = first_name?.trim().charAt(0).toLowerCase() || "";
    const lastLetter = last_name?.trim().charAt(0).toLowerCase() || "";
    return firstLetter + (bac_matricule || "") + lastLetter;
  }

  if (role === "teacher") {
    const firstLetter = first_name?.trim().charAt(0).toLowerCase() || "";
    return firstLetter + "." + (last_name?.toLowerCase() || "") + "@esi-sba";
  }

  if (role === "admin") return "admin123";

  return "default123";
}

/* =========================
   ADD USER (ADMIN ONLY)
========================= */
router.post(
  "/add-user",
  verifyToken,
  requireRole(["admin"]),
  upload.single("avatar"),
  async (req, res) => {
    try {
      console.log("🔥 BODY:", req.body);
      console.log("🔥 FILE:", req.file);
      console.log("🔥 CONTENT-TYPE:", req.headers["content-type"]);

      const {
        email,
        first_name,
        last_name,
        bac_matricule,
        promotion_year,
        speciality_id 
      } = req.body;

      /* =========================
         FIX: roles may already be an array
         (when FormData sends multiple values
         with the same key)
      ========================= */
let roles;
try {
  roles = typeof req.body.roles === "string"
    ? JSON.parse(req.body.roles)
    : req.body.roles || [];
} catch {
  roles = [];
}

      /* =========================
         VALIDATION
      ========================= */
      if (!email || !roles.length) {
        return res.status(400).json({
          message: "Email and roles are required",
        });
      }

      /* =========================
         CHECK DUPLICATES
      ========================= */
      const [existingUser] = await db.execute(
        `SELECT id FROM users WHERE email = ?`,
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      if (roles.includes("student") && bac_matricule) {
        const [existingStudent] = await db.execute(
          `SELECT user_id FROM students WHERE bac_matricule = ?`,
          [bac_matricule]
        );

        if (existingStudent.length > 0) {
          return res.status(400).json({
            message: "Student with this bac already exists",
          });
        }
      }

      /* =========================
         ☁️ CLOUDINARY UPLOAD
      ========================= */
      let avatarUrl =
        "https://res.cloudinary.com/disjnisx8/image/upload/q_auto/f_auto/v1775297109/defaultavatar_cq0gpu.jpg";

      if (req.file) {
        /* FIX: wrap cloudinary upload in its own
           try/catch for a clearer error message */
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "avatars",
          });
          avatarUrl = result.secure_url;
        } catch (uploadErr) {
          console.log("❌ Cloudinary upload failed:", uploadErr.message);
          return res.status(500).json({
            error: "Avatar upload failed: " + uploadErr.message,
          });
        } finally {
          // 🧹 always clean up temp file
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.log("⚠️ File cleanup failed:", err.message);
          }
        }
      }

      /* =========================
         PASSWORD GENERATION
      ========================= */
      const generatedPassword = generatePassword(
        roles[0],
        first_name,
        last_name,
        bac_matricule
      );

      const passwordHash = await bcrypt.hash(generatedPassword, 10);

      /* =========================
         CREATE USER
      ========================= */
      const [result] = await db.execute(
        `INSERT INTO users (email, password_hash, avatar_url)
         VALUES (?, ?, ?)`,
        [email, passwordHash, avatarUrl]
      );

      const userId = result.insertId;

      /* =========================
         ASSIGN ROLES
      ========================= */
      for (const roleName of roles) {
        const [roleRows] = await db.execute(
          `SELECT id FROM roles WHERE name = ?`,
          [roleName]
        );

        if (roleRows.length === 0) continue;

        await db.execute(
          `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
          [userId, roleRows[0].id]
        );
      }

      /* =========================
         STUDENT TABLE
      ========================= */
      if (roles.includes("student")) {
        await db.execute(
          `INSERT INTO students
           (user_id, first_name, last_name, bac_matricule, promotion_yspeciality_id )
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            first_name || "",
            last_name || "",
            bac_matricule || "",
            promotion_year || null,
            specialty || "",
            speciality_id 
          ]
        );
      }

      /* =========================
         TEACHER TABLE
      ========================= */
      if (roles.includes("teacher")) {
        await db.execute(
          `INSERT INTO teachers (user_id, first_name, last_name)
           VALUES (?, ?, ?)`,
          [userId, first_name || "", last_name || ""]
        );
      }

      /* =========================
         RESPONSE
      ========================= */
      return res.status(201).json({
        message: "User created",
        userId,
        generatedPassword,
        avatarUrl,
      });

    } catch (error) {
      /* =========================
         FIX: safely serialize any error shape
      ========================= */
      console.log("❌ ERROR MESSAGE:", error?.message);
      console.log("❌ ERROR STACK:", error?.stack);
      console.log("❌ FULL ERROR:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

      return res.status(500).json({
        error: error?.message ?? JSON.stringify(error) ?? "Failed to create user",
      });
    }
  }
);

/* =========================
   IMPORT USERS (ADMIN ONLY)
========================= */
router.post(
  "/import-users",
  verifyToken,
  requireRole(["admin"]),
  upload.any(),
  async (req, res) => {
    let stats = { total: 0, inserted: 0, duplicates: 0 };

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = xlsx.readFile(req.file.path);
      const rows = xlsx.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]]
      );

      stats.total = rows.length;

      for (const row of rows) {
        if (!row.email || !row.roles) continue;

        const rolesArray = row.roles.split(",").map((r) => r.trim());

        const passwordHash = await bcrypt.hash(
          generatePassword(
            rolesArray[0],
            row.first_name,
            row.last_name,
            row.bac_matricule
          ),
          10
        );

        const [userResult] = await db.execute(
          `INSERT IGNORE INTO users (email, password_hash)
           VALUES (?, ?)`,
          [row.email, passwordHash]
        );

        if (userResult.affectedRows === 0) {
          stats.duplicates++;
          continue;
        }

        const userId = userResult.insertId;

        for (const role of rolesArray) {
          const [r] = await db.execute(
            `SELECT id FROM roles WHERE name = ?`,
            [role]
          );

          if (r.length) {
            await db.execute(
              `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
              [userId, r[0].id]
            );
          }
        }

        stats.inserted++;
      }

      fs.unlinkSync(req.file.path);

      res.json({ message: "Import done", stats });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Import failed" });
    }
  }
);


/* =========================
   ADD ADMIN (ADMIN ONLY)
========================= */
router.post(
  "/add-admin",
verifyToken,
requireRole(["admin"]),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { email, first_name, last_name, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      /* =========================
         CHECK DUPLICATE EMAIL
      ========================= */
      const [existingUser] = await db.execute(
        `SELECT id FROM users WHERE email = ?`,
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      /* =========================
         UPLOAD AVATAR
      ========================= */
      let avatarUrl =
        "https://res.cloudinary.com/disjnisx8/image/upload/q_auto/f_auto/v1775297109/defaultavatar_cq0gpu.jpg";

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "avatars",
        });

        avatarUrl = result.secure_url;

        // delete local file
        fs.unlinkSync(req.file.path);
      }

      /* =========================
         HASH PASSWORD
      ========================= */
      const passwordHash = await bcrypt.hash(password, 10);

      /* =========================
         CREATE USER
      ========================= */
      const [result] = await db.execute(
        `INSERT INTO users (email, password_hash, avatar_url, is_active, must_change_password)
         VALUES (?, ?, ?, 1, 0)`,
        [email, passwordHash, avatarUrl]
      );

      const userId = result.insertId;

      /* =========================
         ASSIGN ADMIN ROLE
      ========================= */
      const [roleRows] = await db.execute(
        `SELECT id FROM roles WHERE name = 'admin'`
      );

      if (!roleRows.length) {
        return res.status(500).json({ error: "Admin role not found" });
      }

      await db.execute(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES (?, ?)`,
        [userId, roleRows[0].id]
      );

      res.status(201).json({
        message: "Admin created successfully",
        userId,
        email,
        password, // ⚠️ remove in production if needed
        avatarUrl,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Failed to create admin",
      });
    }
  }
);

module.exports = router;