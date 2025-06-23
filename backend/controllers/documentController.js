const { Document, User, DocumentAccess } = require("../models");
const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

// Get all documents
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      include: [
        { model: User, as: "uploader" },
        { model: DocumentAccess, include: [{ model: User }] },
      ],
    });
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get document by ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [
        { model: User, as: "uploader" },
        { model: DocumentAccess, include: [{ model: User }] },
      ],
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, type, category, description } = req.body;
    const document = await Document.create({
      title,
      type,
      category,
      description,
      filePath: req.file.path,
      fileName: req.file.originalname,
      uploaderId: req.user.id,
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update document
const updateDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const { title, type, category, description } = req.body;
    await document.update({
      title: title || document.title,
      type: type || document.type,
      category: category || document.category,
      description: description || document.description,
    });

    res.json(document);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete file from storage
    if (document.filePath) {
      fs.unlinkSync(document.filePath);
    }

    await document.destroy();
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Set document access
const setDocumentAccess = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId, roleAccess } = req.body;
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    await DocumentAccess.create({
      documentId,
      roleAccess,
    });

    res.json({ message: "Document access set successfully" });
  } catch (error) {
    console.error("Error setting document access:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Grant access to user
const grantAccess = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await DocumentAccess.create({
      documentId: document.id,
      userId,
    });

    res.json({ message: "Access granted successfully" });
  } catch (error) {
    console.error("Error granting access:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Revoke access from user
const revokeAccess = async (req, res) => {
  try {
    const { userId } = req.params;
    const documentAccess = await DocumentAccess.findOne({
      where: {
        documentId: req.params.id,
        userId,
      },
    });

    if (!documentAccess) {
      return res.status(404).json({ message: "Access record not found" });
    }

    await documentAccess.destroy();
    res.json({ message: "Access revoked successfully" });
  } catch (error) {
    console.error("Error revoking access:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  setDocumentAccess,
  grantAccess,
  revokeAccess,
};
