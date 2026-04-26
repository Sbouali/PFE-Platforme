// middleware/isPfeYear.js

const isPfeYear = (req, res, next) => {
  try {
    const student = req.user?.student;

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: student data missing"
      });
    }

    if (!student.is_pfe_year) {
      return res.status(403).json({
        success: false,
        message: "Access denied: PFE year students only"
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in PFE middleware"
    });
  }
};

module.exports = isPfeYear;