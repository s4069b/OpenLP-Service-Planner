import { createNodeEnvironment } from "./environment.mjs";
const {DB,appliedMigrations,paths}=createNodeEnvironment({migrate:true});
console.log(`SQLite database: ${paths.databaseFile}`);
console.log(
  appliedMigrations.length
    ?`Applied: ${appliedMigrations.join(", ")}`
    :"No migrations to apply."
);
DB.close();
