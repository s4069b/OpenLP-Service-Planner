import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createNodeEnvironment } from "./environment.mjs";

const temp=await fs.mkdtemp(path.join(os.tmpdir(),"openlp-planner-vps-test-"));
process.env.PLANNER_DATA_DIR=temp;
process.env.MICROSOFT_ALLOWED_DOMAIN="example.org";

const {env,DB,appliedMigrations}=createNodeEnvironment({migrate:true});

try{
  if(appliedMigrations.length<19){
    throw new Error(`Expected a fresh database to apply at least 19 migrations; applied ${appliedMigrations.length}.`);
  }

  // Filesystem-backed R2 compatibility.
  const payload=new TextEncoder().encode("portable-media-test");
  await env.MEDIA.put("test/hello.txt",payload,{httpMetadata:{contentType:"text/plain"}});
  const media=await env.MEDIA.get("test/hello.txt");
  if(!media)throw new Error("Filesystem media get failed.");
  const roundTrip=new TextDecoder().decode(await media.arrayBuffer());
  if(roundTrip!=="portable-media-test")throw new Error("Filesystem media round-trip mismatch.");
  if(!(await env.MEDIA.head("test/hello.txt")))throw new Error("Filesystem media head failed.");
  await env.MEDIA.delete("test/hello.txt");
  if(await env.MEDIA.head("test/hello.txt"))throw new Error("Filesystem media delete failed.");

  // The bundled Worker is loaded after the adapters exist.
  const worker=(await import("../.vps-dist/worker.mjs")).default;

  // Public login route exercises authentication + SQLite without a session.
  const login=await worker.fetch(new Request("https://planner.example.org/login"),env);
  if(login.status!==200)throw new Error(`Login smoke test returned ${login.status}.`);

  // Seed a synthetic administrator/session directly for API smoke testing.
  const email="smoke-admin@example.org";
  const token="portable-smoke-session-token";
  const hash=crypto.createHash("sha256").update(token).digest("hex");
  await env.DB.prepare(`INSERT INTO users(email,display_name,auth_method,access_level,disabled,password_hash,password_salt,password_iterations,created_at,updated_at)
    VALUES(?,?,?,3,0,?,?,100000,datetime('now'),datetime('now'))`)
    .bind(email,"Smoke Administrator","local","smoke-hash","smoke-salt").run();
  await env.DB.prepare(`INSERT INTO auth_sessions(token_hash,email,created_at,expires_at)
    VALUES(?,?,datetime('now'),datetime('now','+1 hour'))`).bind(hash,email).run();

  const headers={
    cookie:`__Host-openlp_planner_session=${token}`,
    origin:"https://planner.example.org",
    "sec-fetch-site":"same-origin"
  };

  const bootstrap=await worker.fetch(
    new Request("https://planner.example.org/api/bootstrap",{headers}),
    env
  );
  if(bootstrap.status!==200)throw new Error(`Authenticated bootstrap returned ${bootstrap.status}.`);
  const bootstrapJson=await bootstrap.json();
  if(!Array.isArray(bootstrapJson.services))throw new Error("Bootstrap response did not contain services.");

  const settings=await worker.fetch(
    new Request("https://planner.example.org/api/settings",{
      method:"PUT",
      headers:{...headers,"content-type":"application/json"},
      body:JSON.stringify({settings:{portableSmokeTest:true}})
    }),
    env
  );
  if(settings.status!==200)throw new Error(`Settings write returned ${settings.status}.`);

  const row=await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key=?"
  ).bind("portableSmokeTest").first();
  if(row?.value_json!=="true")throw new Error("SQLite-backed settings write was not persisted.");

  console.log("VPS smoke test passed.");
  console.log(`Applied ${appliedMigrations.length} migrations.`);
  console.log("SQLite adapter: PASS");
  console.log("Filesystem media adapter: PASS");
  console.log("Auth/login route: PASS");
  console.log("Authenticated bootstrap API: PASS");
  console.log("Authenticated settings write: PASS");
}finally{
  DB.close();
  await fs.rm(temp,{recursive:true,force:true});
}
