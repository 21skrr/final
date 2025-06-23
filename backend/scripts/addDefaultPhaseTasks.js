const { Checklist, ChecklistItem, User, sequelize } = require("../models");

// Default tasks for each phase
const phaseDefaultTasks = {
  prepare: [
    {
      title: "Complete paperwork (contracts, HR forms)",
      description:
        "Ensure all employment contracts and HR forms are filled out and submitted",
      isRequired: true,
    },
    {
      title: "Review welcome materials (guides, videos)",
      description:
        "Go through all welcome guides and onboarding videos provided by the company",
      isRequired: true,
    },
    {
      title: "Set up IT accounts, email, tools",
      description:
        "Ensure IT accounts, email and necessary tools are properly set up and functioning",
      isRequired: true,
    },
    {
      title: "Digital onboarding access (e.g. NEW2PMI platform)",
      description: "Gain access to digital onboarding platforms and resources",
      isRequired: true,
    },
  ],
  orient: [
    {
      title: "Attend orientation session (F2F or digital)",
      description:
        "Participate in formal orientation session either face-to-face or digitally",
      isRequired: true,
    },
    {
      title: "Meet the team (formal or informal intro)",
      description: "Be introduced to team members and key stakeholders",
      isRequired: true,
    },
    {
      title: "Receive equipment (laptop, phone, badges)",
      description: "Collect all necessary equipment and access credentials",
      isRequired: true,
    },
    {
      title: "Training on company systems & tools",
      description:
        "Complete initial training on company-specific systems and tools",
      isRequired: true,
    },
  ],
  land: [
    {
      title: "Start self-study activities (role-specific materials)",
      description:
        "Begin self-directed learning with role-specific materials and resources",
      isRequired: true,
    },
    {
      title: "Get assigned a buddy (support person)",
      description:
        "Be paired with an experienced colleague who can provide guidance and support",
      isRequired: true,
    },
    {
      title: "Shadow interactions (e.g., observe client meetings)",
      description:
        "Observe and learn from experienced colleagues in real work situations",
      isRequired: true,
    },
    {
      title: "Confirm access to tools/platforms",
      description:
        "Verify that all necessary access to tools and platforms has been granted",
      isRequired: true,
    },
  ],
  integrate: [
    {
      title: "Reverse shadowing (employee in lead role)",
      description:
        "Take the lead in work activities while being observed and supported",
      isRequired: true,
    },
    {
      title: "Demonstrate system autonomy",
      description:
        "Show ability to work independently with company systems and processes",
      isRequired: true,
    },
    {
      title: "Continue guided self-training",
      description:
        "Progress with self-directed learning with occasional guidance from mentors",
      isRequired: true,
    },
    {
      title: "Complete knowledge assessments (online/F2F)",
      description:
        "Undergo evaluations to confirm understanding of role requirements and company procedures",
      isRequired: true,
    },
  ],
  excel: [
    {
      title: "Set up Individual Development Plan (IDP)",
      description:
        "Create a personalized plan for professional growth and development",
      isRequired: true,
    },
    {
      title: "Join feedback/coaching sessions",
      description:
        "Participate in structured feedback and coaching to improve performance",
      isRequired: true,
    },
    {
      title: "Receive advanced on-the-job training",
      description:
        "Engage in more specialized and advanced training related to role",
      isRequired: true,
    },
    {
      title: "Start tracking KPIs and goals",
      description:
        "Begin tracking key performance indicators and setting measurable goals",
      isRequired: true,
    },
  ],
};

async function addDefaultPhaseTasks() {
  try {
    console.log("Adding default tasks for each onboarding phase...");

    // Use existing checklist if available
    let checklist = await Checklist.findOne();

    if (!checklist) {
      console.error(
        "No checklists found in the database. Please create a checklist first."
      );
      process.exit(1);
    }

    console.log(`Using checklist "${checklist.title}" (${checklist.id})`);

    // Get existing checklist items to avoid duplicates
    const existingItems = await ChecklistItem.findAll({
      where: { checklistId: checklist.id },
    });

    const existingTitles = existingItems.map((item) => item.title);

    // Keep track of items added per phase
    const addedItems = {
      prepare: 0,
      orient: 0,
      land: 0,
      integrate: 0,
      excel: 0,
    };

    // Add default tasks for each phase
    for (const [phase, tasks] of Object.entries(phaseDefaultTasks)) {
      console.log(
        `Processing ${tasks.length} tasks for ${phase.toUpperCase()} phase...`
      );

      let orderIndex = existingItems.filter(
        (item) => item.phase === phase
      ).length;

      for (const task of tasks) {
        // Skip if task with same title already exists
        if (existingTitles.includes(task.title)) {
          console.log(`- Skipping "${task.title}" (already exists)`);
          continue;
        }

        try {
          // Create the checklist item
          await ChecklistItem.create({
            checklistId: checklist.id,
            title: task.title,
            description: task.description,
            isRequired: task.isRequired,
            phase: phase,
            orderIndex: orderIndex++,
            controlledBy: "hr", // Default - HR controls these items
          });

          addedItems[phase]++;
          console.log(`- Added "${task.title}"`);
        } catch (error) {
          console.error(`Error adding task "${task.title}":`, error.message);
        }
      }
    }

    // Print summary
    console.log("\nSummary of added tasks:");
    for (const phase in addedItems) {
      console.log(
        `- ${phase.toUpperCase()}: ${addedItems[phase]} new tasks added`
      );
    }

    console.log("\nDefault phase tasks added successfully!");
  } catch (error) {
    console.error("Error adding default phase tasks:", error);
  } finally {
    process.exit();
  }
}

// Run the script
addDefaultPhaseTasks();
