const express = require("express");
const jwt = require('jsonwebtoken');
const { login } = require("./login");
const { changePassword } = require("./changePassword");
const verifyToken = require("../../../middlewares/verifyToken");

const router = express.Router();

router.post("/login", login);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;