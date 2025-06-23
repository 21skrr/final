const {
  User,
  OnboardingProgress,
  Task,
  UserTaskProgress,
  OnboardingTask,
} = require("../models");
const { Op } = require("sequelize");

// GET /api/supervisor/team/onboarding
const getTeamOnboardingProgress = async (req, res) => {
  try {
    // Check if user is supervisor, manager, or HR
    if (!["supervisor", "manager", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let teamMembers;

    if (req.user.role === "supervisor") {
      // Get direct reports for this supervisor
      teamMembers = await User.findAll({
        where: { supervisorId: req.user.id },
        attributes: [
          "id",
          "name",
          "email",
          "role",
          "department",
          "startDate",
          "programType",
        ],
      });
    } else {
      // For HR or manager, get filtered employees
      const departmentFilter = req.query.department
        ? { department: req.query.department }
        : {};
      const programFilter = req.query.program
        ? { programType: req.query.program }
        : {};

      teamMembers = await User.findAll({
        where: {
          role: "employee",
          ...departmentFilter,
          ...programFilter,
        },
        attributes: [
          "id",
          "name",
          "email",
          "role",
          "department",
          "startDate",
          "programType",
        ],
      });
    }

    // Get onboarding progress for all team members
    const teamProgress = await Promise.all(
      teamMembers.map(async (member) => {
        const progress = await OnboardingProgress.findOne({
          where: { UserId: member.id },
        });

        // Get task completion rate
        const tasks = await Task.findAll({
          where: { userId: member.id },
        });

        const completedTasks = tasks.filter((task) => task.isCompleted).length;
        const taskCompletionRate =
          tasks.length > 0
            ? Math.round((completedTasks / tasks.length) * 100)
            : 0;

        return {
          employee: member,
          progress: progress || { stage: "not_started", progress: 0 },
          taskCompletionRate,
          totalTasks: tasks.length,
          completedTasks,
        };
      })
    );

    res.json(teamProgress);
  } catch (error) {
    console.error("Error fetching team onboarding progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/supervisor/dashboard/onboarding
const getOnboardingDashboard = async (req, res) => {
  try {
    // Check if user is supervisor, manager, or HR
    if (!["supervisor", "manager", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let teamFilter = {};

    if (req.user.role === "supervisor") {
      // For supervisors, only show direct reports
      teamFilter = { supervisorId: req.user.id };
    } else if (req.query.department) {
      // For HR/managers with department filter
      teamFilter = { department: req.query.department };
    }

    // Get all employees based on filter
    const employees = await User.findAll({
      where: {
        role: "employee",
        ...teamFilter,
      },
      attributes: ["id", "name", "email", "startDate", "programType"],
    });

    // Get onboarding progress counts by stage
    const stageCountsPromises = [
      "prepare",
      "orient",
      "land",
      "integrate",
      "excel",
    ].map(async (stage) => {
      const count = await OnboardingProgress.count({
        where: {
          stage,
          UserId: { [Op.in]: employees.map((e) => e.id) },
        },
      });
      return { stage, count };
    });

    const stageCounts = await Promise.all(stageCountsPromises);

    // Get recent tasks
    const recentTasks = await Task.findAll({
      where: {
        userId: { [Op.in]: employees.map((e) => e.id) },
      },
      order: [["updatedAt", "DESC"]],
      limit: 10,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });

    // Create summary statistics
    const totalEmployees = employees.length;
    const completedOnboarding = await OnboardingProgress.count({
      where: {
        UserId: { [Op.in]: employees.map((e) => e.id) },
        stage: "excel",
        progress: 100,
      },
    });

    const recentHires = await User.count({
      where: {
        role: "employee",
        ...teamFilter,
        startDate: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    // Combine data for dashboard
    const dashboardData = {
      summary: {
        totalEmployees,
        completedOnboarding,
        recentHires,
        completionRate:
          totalEmployees > 0
            ? Math.round((completedOnboarding / totalEmployees) * 100)
            : 0,
      },
      stageCounts,
      recentTasks,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error generating onboarding dashboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTeamOnboardingProgress,
  getOnboardingDashboard,
};
