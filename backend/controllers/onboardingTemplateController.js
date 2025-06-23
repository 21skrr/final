// backend/controllers/onboardingTemplateController.js
const { OnboardingTemplate, User, OnboardingProgram } = require("../models");
const { validationResult } = require("express-validator");

// Get all templates
const getAllTemplates = async (req, res) => {
  try {
    const templates = await OnboardingTemplate.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    const template = await OnboardingTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create template
const createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, programType, stages } = req.body;
    const template = await OnboardingTemplate.create({
      name,
      description,
      programType,
      stages,
    });

    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update template
const updateTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = await OnboardingTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const { name, description, programType, stages } = req.body;
    await template.update({
      name: name || template.name,
      description: description || template.description,
      programType: programType || template.programType,
      stages: stages || template.stages,
    });

    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete template
const deleteTemplate = async (req, res) => {
  try {
    const template = await OnboardingTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    await template.destroy();
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Apply template to user
const applyTemplateToUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { templateId, userId } = req.body;

    // Check if template exists
    const template = await OnboardingTemplate.findByPk(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create onboarding program
    const program = await OnboardingProgram.create({
      userId,
      templateId,
      status: "active",
      currentStage: 0,
      stages: template.stages,
    });

    res.status(201).json(program);
  } catch (error) {
    console.error("Error applying template:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplateToUser,
};
