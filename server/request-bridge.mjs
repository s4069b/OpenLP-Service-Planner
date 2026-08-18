function publicOrigin(req){
  const configured=String(process.env.PLANNER_PUBLIC_ORIGIN||"").trim();
  if(configured)return configured.replace(/\/+$/,"");

  const trustProxy=String(process.env.PLANNER_TRUST_PROXY??"true").toLowerCase()!=="false";
  const forwardedProto=trustProxy
    ?String(req.headers["x-forwarded-proto"]||"").split(",")[0].trim()
    :"";
  const proto=forwardedProto || (req.socket.encrypted?"https":"http");
  const forwardedHost=trustProxy
    ?String(req.headers["x-forwarded-host"]||"").split(",")[0].trim()
    :"";
  const host=forwardedHost || String(req.headers.host||"localhost");
  return `${proto}://${host}`;
}

function streamingRequestBody(req,maxBytes){
  const iterator=req[Symbol.asyncIterator]();
  let size=0;
  return new ReadableStream({
    async pull(controller){
      try{
        const {value,done}=await iterator.next();
        if(done){controller.close();return}
        const chunk=value instanceof Uint8Array?value:new Uint8Array(value);
        size+=chunk.byteLength;
        if(size>maxBytes){
          const error=new Error("Request body is too large.");
          error.statusCode=413;
          controller.error(error);
          req.destroy?.(error);
          return;
        }
        controller.enqueue(chunk);
      }catch(error){controller.error(error)}
    },
    async cancel(reason){
      try{await iterator.return?.()}catch(_){}
      req.destroy?.(reason instanceof Error?reason:undefined);
    }
  });
}

export async function nodeRequestToWeb(req){
  const origin=publicOrigin(req);
  const url=new URL(req.url||"/",origin);
  const headers=new Headers();
  for(const [name,value] of Object.entries(req.headers)){
    if(value===undefined)continue;
    if(Array.isArray(value)){
      for(const bit of value)headers.append(name,bit);
    }else headers.set(name,String(value));
  }

  const method=String(req.method||"GET").toUpperCase();
  const init={method,headers};
  if(!["GET","HEAD"].includes(method)){
    const pathname=url.pathname;
    const largeBodyRoute=
      pathname==="/api/media" ||
      pathname==="/api/full-restore" ||
      pathname==="/api/full-restore-preview" ||
      pathname==="/api/database-restore";
    const maxMb=largeBodyRoute
      ?Math.max(1,Number(process.env.PLANNER_MAX_UPLOAD_MB||250))
      :Math.max(1,Number(process.env.PLANNER_MAX_REQUEST_MB||10));
    init.body=streamingRequestBody(req,maxMb*1024*1024);
    // Required by Node's WHATWG Request implementation for streaming bodies.
    init.duplex="half";
  }
  return new Request(url,init);
}

export async function writeWebResponse(res,response){
  res.statusCode=response.status;
  for(const [name,value] of response.headers.entries()){
    if(name.toLowerCase()==="set-cookie"){
      // Headers.getSetCookie is available in current Node versions. Fall back
      // to the single value used by this application.
      const cookies=response.headers.getSetCookie?.()||[value];
      res.setHeader("set-cookie",cookies);
    }else{
      res.setHeader(name,value);
    }
  }

  if(!response.body){
    res.end();
    return;
  }

  const reader=response.body.getReader();
  try{
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      if(value?.byteLength){
        if(!res.write(Buffer.from(value))){
          await new Promise(resolve=>res.once("drain",resolve));
        }
      }
    }
    res.end();
  }catch(error){
    res.destroy(error);
  }
}
