const { Event, User, EventParticipant } = require("../models");
const { validationResult } = require("express-validator");

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: EventParticipant,
          as: "participants",
          attributes: ["id", "eventId", "userId"],
          include: [
            {
              model: User,
              as: "participant",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
      order: [["startDate", "ASC"]],
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's events
const getUserEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: EventParticipant,
          as: "participants",
          attributes: ["id", "eventId", "userId"],
          include: [
            {
              model: User,
              as: "participant",
              attributes: ["id", "name", "email"],
              where: { id: userId },
            },
          ],
        },
      ],
      order: [["startDate", "ASC"]],
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: EventParticipant,
          as: "participants",
          attributes: ["id", "eventId", "userId"],
          include: [
            {
              model: User,
              as: "participant",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create event
const createEvent = async (req, res) => {
  try {
    // Check if user has HR or manager role
    if (req.user.role !== "hr" && req.user.role !== "manager") {
      return res.status(403).json({
        message: "Access denied. Only HR and managers can create events.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      type,
      location,
      participants,
    } = req.body;

    // Create event
    const event = await Event.create({
      title,
      description,
      startDate,
      endDate,
      location,
      type,
      createdBy: req.user.id,
    });

    // Add participants if provided
    if (participants && participants.length > 0) {
      // Create event participants
      const participantRecords = participants.map((userId) => ({
        eventId: event.id,
        userId,
      }));

      await EventParticipant.bulkCreate(participantRecords);
    }

    // Get created event with participants
    const createdEvent = await Event.findByPk(event.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: EventParticipant,
          as: "participants",
          attributes: ["id", "eventId", "userId"],
          include: [
            {
              model: User,
              as: "participant",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    // Check if user has HR role
    if (req.user.role !== "hr") {
      return res.status(403).json({
        message: "Access denied. Only HR can update events.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { title, description, startDate, endDate, type, participants } =
      req.body;

    // Update event
    await event.update({
      title: title || event.title,
      description: description || event.description,
      startDate: startDate || event.startDate,
      endDate: endDate || event.endDate,
      type: type || event.type,
    });

    // Update participants if provided
    if (participants) {
      // Remove existing participants
      await EventParticipant.destroy({
        where: { eventId: event.id },
      });

      // Add new participants
      const participantRecords = participants.map((userId) => ({
        eventId: event.id,
        userId,
      }));

      await EventParticipant.bulkCreate(participantRecords);
    }

    // Get updated event with participants
    const updatedEvent = await Event.findByPk(event.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: EventParticipant,
          as: "participants",
          attributes: ["id", "eventId", "userId"],
          include: [
            {
              model: User,
              as: "participant",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    // Check if user has HR role
    if (req.user.role !== "hr") {
      return res.status(403).json({
        message: "Access denied. Only HR can delete events.",
      });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.destroy();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { attended } = req.body;

    // Find event participant
    const participant = await EventParticipant.findOne({
      where: {
        eventId,
        userId,
      },
    });

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Instead of updating the attended field directly,
    // We can use the "notes" field to store attendance information
    const attendanceNote = attended ? "Attended: Yes" : "Attended: No";

    // Update notes with attendance information
    await participant.update({
      notes: attendanceNote,
    });

    res.json({ message: "Attendance updated successfully" });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllEvents,
  getUserEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateAttendance,
};
