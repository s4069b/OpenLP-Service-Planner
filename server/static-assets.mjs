import fs from "node:fs/promises";
import path from "node:path";

const TYPES={
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".gif":"image/gif",
  ".webp":"image/webp",
  ".ico":"image/x-icon",
  ".txt":"text/plain; charset=utf-8"
};

function safePublicPath(root,pathname){
  let decoded="/";
  try{decoded=decodeURIComponent(pathname)}catch(_){decoded=pathname}
  const relative=decoded==="/"?"index.html":decoded.replace(/^\/+/,"");
  const candidate=path.resolve(root,relative);
  const base=path.resolve(root)+path.sep;
  if(candidate!==path.resolve(root) && !candidate.startsWith(base))return null;
  return candidate;
}

export class StaticAssetFetcher {
  constructor(root){this.root=path.resolve(root)}
  async fetch(request){
    const url=new URL(request.url);
    const candidate=safePublicPath(this.root,url.pathname);
    if(!candidate)return new Response("Not found",{status:404});
    try{
      const stat=await fs.stat(candidate);
      if(!stat.isFile())return new Response("Not found",{status:404});
      const headers=new Headers({
        "content-type":TYPES[path.extname(candidate).toLowerCase()]||"application/octet-stream",
        "content-length":String(stat.size)
      });
      if(request.method==="HEAD")return new Response(null,{status:200,headers});
      return new Response(await fs.readFile(candidate),{status:200,headers});
    }catch(error){
      if(error?.code==="ENOENT")return new Response("Not found",{status:404});
      throw error;
    }
  }
}
