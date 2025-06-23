const jwt = require("jsonwebtoken");
const { User } = require("../models");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    console.log('Checking role for user:', req.user?.role);
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied." });
    }
    next();
  };
};

const isRH = (req, res, next) => {
  if (req.user.role !== "hr" && req.user.role !== "HR") {
    return res.status(403).json({ message: "Access denied. HR only." });
  }
  next();
};

const isSupervisor = (req, res, next) => {
  if (req.user.role !== "supervisor") {
    return res.status(403).json({ message: "Access denied. Supervisor only." });
  }
  next();
};

module.exports = {
  auth,
  checkRole,
  isRH,
  isSupervisor
};
