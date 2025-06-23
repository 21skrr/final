const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const config = require("../config/config.json");

// Get environment from NODE_ENV or default to development
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

async function executeMigration() {
  try {
    console.log("Starting database migration...");

    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      multipleStatements: true, // Important for executing multiple SQL statements
    });

    console.log("Connected to database successfully.");

    // Read the SQL file
    const sqlPath = path.join(
      __dirname,
      "../migrations/update_onboarding_tables.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing SQL migration...");

    // Execute the SQL
    await connection.query(sql);

    console.log("Migration completed successfully!");

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error("Error executing migration:", error);
    process.exit(1);
  }
}

executeMigration();
