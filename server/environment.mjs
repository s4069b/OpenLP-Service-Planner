import path from "node:path";
import { fileURLToPath } from "node:url";
import { SqliteD1Database, applySqlMigrations } from "./sqlite-d1.mjs";
import { FilesystemR2Bucket } from "./filesystem-r2.mjs";
import { StaticAssetFetcher } from "./static-assets.mjs";

const here=path.dirname(fileURLToPath(import.meta.url));
const projectRoot=path.resolve(here,"..");

function absoluteFromRoot(value,fallback){
  const raw=String(value||fallback);
  return path.isAbsolute(raw)?raw:path.resolve(projectRoot,raw);
}

export function createNodeEnvironment({migrate=true}={}){
  const dataDir=absoluteFromRoot(process.env.PLANNER_DATA_DIR,"data");
  const databaseFile=absoluteFromRoot(
    process.env.PLANNER_SQLITE_PATH,
    path.join(dataDir,"planner.sqlite")
  );
  const mediaDir=absoluteFromRoot(
    process.env.PLANNER_MEDIA_DIR,
    path.join(dataDir,"media")
  );

  const DB=new SqliteD1Database(databaseFile);
  const migrationsDir=path.resolve(projectRoot,"migrations");
  const applied=migrate?applySqlMigrations(DB,migrationsDir):[];

  return {
    env:{
      DB,
      MEDIA:new FilesystemR2Bucket(mediaDir),
      ASSETS:new StaticAssetFetcher(path.resolve(projectRoot,"public")),

      MICROSOFT_TENANT_ID:process.env.MICROSOFT_TENANT_ID||"",
      MICROSOFT_CLIENT_ID:process.env.MICROSOFT_CLIENT_ID||"",
      MICROSOFT_CLIENT_SECRET:process.env.MICROSOFT_CLIENT_SECRET||"",
      MICROSOFT_ALLOWED_DOMAIN:process.env.MICROSOFT_ALLOWED_DOMAIN||"example.org",
      PLANNER_BOOTSTRAP_ADMIN_EMAIL:process.env.PLANNER_BOOTSTRAP_ADMIN_EMAIL||"",
      PLANNER_SETUP_TOKEN:process.env.PLANNER_SETUP_TOKEN||"",
      PLANNER_ADMIN_RECOVERY_TOKEN:process.env.PLANNER_ADMIN_RECOVERY_TOKEN||"",

      CHURCHSUITE_CLIENT_ID:process.env.CHURCHSUITE_CLIENT_ID||"",
      CHURCHSUITE_CLIENT_SECRET:process.env.CHURCHSUITE_CLIENT_SECRET||"",
      CHURCHSUITE_OIDC_CLIENT_ID:process.env.CHURCHSUITE_OIDC_CLIENT_ID||"",
      CHURCHSUITE_OIDC_CLIENT_SECRET:process.env.CHURCHSUITE_OIDC_CLIENT_SECRET||""
    },
    DB,
    paths:{projectRoot,dataDir,databaseFile,mediaDir},
    appliedMigrations:applied
  };
}
