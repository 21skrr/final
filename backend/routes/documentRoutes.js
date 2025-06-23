const express = require("express");
const { check } = require("express-validator");
const documentController = require("../controllers/documentController");
const { auth, checkRole } = require("../middleware/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Validation middleware
const documentValidation = [
  check("title", "Title is required").not().isEmpty(),
  check("type", "Document type is required").isIn([
    "policy",
    "form",
    "guide",
    "template",
  ]),
  check("category", "Category is required").isIn([
    "onboarding",
    "hr",
    "training",
    "compliance",
  ]),
];

// GET /api/documents
router.get("/", auth, documentController.getAllDocuments);

// GET /api/documents/:id
router.get("/:id", auth, documentController.getDocumentById);

// POST /api/documents
router.post(
  "/",
  [auth, checkRole("hr"), upload.single("file"), documentValidation],
  documentController.uploadDocument
);

// PUT /api/documents/:id
router.put(
  "/:id",
  [auth, checkRole("hr"), documentValidation],
  documentController.updateDocument
);

// DELETE /api/documents/:id
router.delete("/:id", auth, checkRole("hr"), documentController.deleteDocument);

// POST /api/documents/access
router.post(
  "/access",
  [
    auth,
    checkRole("hr"),
    check("documentId", "Document ID is required").not().isEmpty(),
    check(
      "roleAccess",
      "Role access must be employee, supervisor, manager, hr, or all"
    ).isIn(["employee", "supervisor", "manager", "hr", "all"]),
  ],
  documentController.setDocumentAccess
);

// POST /api/documents/:id/access
router.post(
  "/:id/access",
  [
    auth,
    checkRole("hr"),
    check("userId", "User ID is required").not().isEmpty(),
  ],
  documentController.grantAccess
);

// DELETE /api/documents/:id/access/:userId
router.delete(
  "/:id/access/:userId",
  [auth, checkRole("hr")],
  documentController.revokeAccess
);

module.exports = router;
