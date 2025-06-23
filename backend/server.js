require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");


const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Sync all models without modifying existing tables
    await sequelize.sync({ alter: false, force: false });
    console.log("Database synchronized successfully.");

    // Try to start server on PORT, if that fails try PORT + 1
    const server = app
      .listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
          app.listen(PORT + 1, () => {
            console.log(`Server is running on port ${PORT + 1}`);
          });
        } else {
          console.error("Server error:", err);
        }
      });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();
