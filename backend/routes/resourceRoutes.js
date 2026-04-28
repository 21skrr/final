const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { auth, checkRole } = require("../middleware/auth");
const resourceController = require("../controllers/resourceController");

// ─── Multer Setup ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads/resources");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── Employee Routes ──────────────────────────────────────────────────────────

// GET /api/resources/public — all publicly published documents
router.get(
  "/public",
  auth,
  checkRole("employee", "supervisor", "manager", "hr"),
  resourceController.getPublicResources
);

// GET /api/resources/my-resources — explicitly assigned to the current user
router.get(
  "/my-resources",
  auth,
  checkRole("employee", "supervisor", "manager", "hr"),
  resourceController.getAssignedResources
);

// POST /api/resources/:id/acknowledge — mark as read
router.post(
  "/:id/acknowledge",
  auth,
  checkRole("employee", "supervisor", "manager", "hr"),
  resourceController.acknowledgeResource
);

// GET /api/resources/:id/acknowledge-status — check acknowledgement
router.get(
  "/:id/acknowledge-status",
  auth,
  checkRole("employee", "supervisor", "manager", "hr"),
  resourceController.getAcknowledgeStatus
);

// ─── Supervisor Routes ────────────────────────────────────────────────────────

// GET /api/resources/team — resources for supervisor's team
router.get(
  "/team",
  auth,
  checkRole("supervisor", "hr"),
  resourceController.getTeamResources
);

// POST /api/resources/assign — assign specific resources to employees
router.post(
  "/assign",
  auth,
  checkRole("supervisor", "hr"),
  resourceController.assignResources
);

// GET /api/resources/usage — resource usage by specific employee
router.get(
  "/usage",
  auth,
  checkRole("supervisor", "manager"),
  resourceController.getEmployeeResources
);

// ─── Manager Routes ───────────────────────────────────────────────────────────

// GET /api/resources/department — department-scoped resources
router.get(
  "/department",
  auth,
  checkRole("manager", "hr"),
  resourceController.getDepartmentResources
);

// GET /api/resources/summary — usage summary
router.get(
  "/summary",
  auth,
  checkRole("manager", "hr"),
  resourceController.getResourceSummary
);

// GET /api/resources/recommendations
router.get(
  "/recommendations",
  auth,
  checkRole("manager", "hr"),
  resourceController.getResourceRecommendations
);

// ─── HR Routes ────────────────────────────────────────────────────────────────

// GET /api/resources — all resources (HR / manager / supervisor)
router.get(
  "/",
  auth,
  checkRole("hr", "manager", "supervisor"),
  resourceController.getAllResources
);

// POST /api/resources/upload — PDF file upload
router.post(
  "/upload",
  auth,
  checkRole("hr", "supervisor", "manager"),
  upload.single("file"),
  resourceController.uploadPDF
);

// POST /api/resources — legacy URL-based creation (HR only)
router.post("/", auth, checkRole("hr"), resourceController.createResource);

// PUT /api/resources/:id — update metadata
router.put("/:id", auth, checkRole("hr"), resourceController.updateResource);

// DELETE /api/resources/:id — delete resource
router.delete(
  "/:id",
  auth,
  checkRole("hr", "supervisor", "manager"),
  resourceController.deleteResource
);

// GET /api/resources/analytics — HR analytics
router.get(
  "/analytics",
  auth,
  checkRole("hr"),
  resourceController.getResourceAnalytics
);

// ─── Common ───────────────────────────────────────────────────────────────────

// GET /api/resources/:id — view specific resource (must be last)
router.get(
  "/:id",
  auth,
  checkRole("employee", "supervisor", "manager", "hr"),
  resourceController.getResourceById
);

module.exports = router;