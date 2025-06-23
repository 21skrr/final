const { Program, User } = require("../models");
const { Op } = require("sequelize");

// @desc    Get all programs
// @route   GET /api/programs
// @access  Private
const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get program by ID
// @route   GET /api/programs/:id
// @access  Private
const getProgramById = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`Looking for program with ID: ${id}`);

    // Try to find the program
    const program = await Program.findByPk(id);

    // If not found, log and return 404
    if (!program) {
      console.log(`Program with ID ${id} not found`);
      return res.status(404).json({ message: "Program not found" });
    }

    // Success - return the program
    console.log(`Found program: ${program.title}`);
    res.json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create new program
// @route   POST /api/programs
// @access  Private (Admin/HR)
const createProgram = async (req, res) => {
  try {
    const {
      title,
      description,
      overview,
      components,
      features,
      support,
      benefits,
      duration,
      objective,
      programType,
      status,
    } = req.body;

    const program = await Program.create({
      title,
      description,
      overview,
      components,
      features,
      support,
      benefits,
      duration,
      objective,
      programType,
      status,
      createdBy: req.user.id,
    });

    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update program
// @route   PUT /api/programs/:id
// @access  Private (Admin/HR)
const updateProgram = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    const {
      name,
      description,
      type,
      startDate,
      endDate,
      capacity,
      requirements,
      objectives,
    } = req.body;

    await program.update({
      name: name || program.name,
      description: description || program.description,
      type: type || program.type,
      startDate: startDate || program.startDate,
      endDate: endDate || program.endDate,
      capacity: capacity || program.capacity,
      requirements: requirements || program.requirements,
      objectives: objectives || program.objectives,
    });

    res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete program
// @route   DELETE /api/programs/:id
// @access  Private (Admin)
const deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Instead of looking for programId which doesn't exist,
    // Check if users are associated with this program type
    const participantCount = await User.count({
      where: { programType: program.programType },
    });

    if (participantCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete program with active participants. Reassign participants first.",
      });
    }

    await program.destroy();
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
};
