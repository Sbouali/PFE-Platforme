const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/verifyToken");
const requireRole = require("../../middlewares/requireRole");

const groupSoutenance = require("../Controllers/groupSoutenance")

router.post("/assignJury",verifyToken,requireRole(["admin"]),  groupSoutenance.assignJury);
router.post("/assignCoSupervisor",verifyToken,requireRole(["admin"]),  groupSoutenance.assignCoSupervisor);
router.get("/getAllSoutenances",verifyToken,requireRole(["admin"]),  groupSoutenance.getAllSoutenances);
module.exports = router;