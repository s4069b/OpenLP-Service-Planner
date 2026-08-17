import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNodeEnvironment } from "./environment.mjs";
import { nodeRequestToWeb, writeWebResponse } from "./request-bridge.mjs";

const here=path.dirname(fileURLToPath(import.meta.url));
const workerModule=await import(path.resolve(here,"../.vps-dist/worker.mjs"));
const worker=workerModule.default;
if(!worker?.fetch)throw new Error("Built Worker module does not export fetch().");

const {env,DB,paths,appliedMigrations}=createNodeEnvironment({migrate:true});
if(appliedMigrations.length){
  console.log("Applied migrations:",appliedMigrations.join(", "));
}

const host=process.env.HOST||"127.0.0.1";
const port=Math.max(1,Number(process.env.PORT||8787));

const server=http.createServer(async(req,res)=>{
  try{
    const request=await nodeRequestToWeb(req);
    const response=await worker.fetch(request,env);
    await writeWebResponse(res,response);
  }catch(error){
    console.error(error);
    if(!res.headersSent){
      res.statusCode=Number(error?.statusCode||500);
      res.setHeader("content-type","text/plain; charset=utf-8");
      res.end(res.statusCode===413?"Request body too large.":"Internal server error.");
    }else{
      res.destroy(error);
    }
  }
});

server.requestTimeout=5*60*1000;
server.headersTimeout=60*1000;

function shutdown(signal){
  console.log(`${signal}: shutting down`);
  server.close(()=>{
    try{DB.close()}catch(_){}
    process.exit(0);
  });
  setTimeout(()=>process.exit(1),10000).unref();
}
process.on("SIGTERM",()=>shutdown("SIGTERM"));
process.on("SIGINT",()=>shutdown("SIGINT"));

server.listen(port,host,()=>{
  console.log(`OpenLP Service Planner listening on http://${host}:${port}`);
  console.log(`SQLite: ${paths.databaseFile}`);
  console.log(`Media:  ${paths.mediaDir}`);
  if(!process.env.PLANNER_PUBLIC_ORIGIN){
    console.log("Set PLANNER_PUBLIC_ORIGIN to the external HTTPS URL in production.");
  }
});
