// backend/models/OnboardingTemplate.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OnboardingTemplate = sequelize.define(
  "OnboardingTemplate",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    programType: {
      type: DataTypes.ENUM(
        "inkompass",
        "earlyTalent",
        "apprenticeship",
        "academicPlacement",
        "workExperience",
        "all"
      ),
      allowNull: false,
      defaultValue: "all",
    },
    phases: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [
        {
          name: "prepare",
          displayName: "Prepare",
          description: "Pre-onboarding preparation and document collection",
          duration: 1, // in days
          tasks: [],
        },
        {
          name: "orient",
          displayName: "Orient",
          description: "Orientation day and introduction to company",
          duration: 1,
          tasks: [],
        },
        {
          name: "land",
          displayName: "Land",
          description: "Basic training and team integration",
          duration: 5,
          tasks: [],
        },
        {
          name: "integrate",
          displayName: "Integrate",
          description: "Role-specific training and responsibilities",
          duration: 4,
          tasks: [],
        },
        {
          name: "excel",
          displayName: "Excel",
          description: "Performance optimization and career development",
          duration: 30,
          tasks: [],
        },
      ],
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = OnboardingTemplate;
