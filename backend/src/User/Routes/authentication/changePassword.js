const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../../config/db");

const JWT_SECRET = process.env.JWT_SECRET ;

//to test it i need the token from the login and put it in header:authorization written like thise Baearer +token copied 
//link this when making login and checking must change password everytime we do a login in the front : linking 
const changePassword = async (req, res) => {
  try {
    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password)
      return res.status(400).json({ error: "Both password fields are required" });

    if (new_password !== confirm_password)
      return res.status(400).json({ error: "Passwords do not match" });

    if (new_password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    if (!/[A-Z]/.test(new_password))
    return res.status(400).json({ error: "Password must contain at least one uppercase letter" });

    if (!/[0-9]/.test(new_password))
    return res.status(400).json({ error: "Password must contain at least one number" });
  
    const [rows] = await db.execute(
      `SELECT password_hash FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const isSamePassword = await bcrypt.compare(new_password, rows[0].password_hash);
    if (isSamePassword)
      return res.status(400).json({ error: "New password must differ from your current password" });

    const newHash = await bcrypt.hash(new_password, 10);

    await db.execute(
      `UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?`,
      [newHash, req.user.id]
    );

    const newToken = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        must_change_password: false,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Password changed successfully",
      token: newToken,
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Password change failed" });
  }
};

module.exports = { changePassword };