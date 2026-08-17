import fs from "node:fs/promises";
import path from "node:path";

function safeKey(root,key){
  const clean=String(key||"")
    .replace(/\\/g,"/")
    .replace(/^\/+/,"");
  const target=path.resolve(root,clean);
  const base=path.resolve(root)+path.sep;
  if(target!==path.resolve(root) && !target.startsWith(base)){
    throw new Error("Invalid media storage key.");
  }
  return target;
}

async function bodyBytes(value){
  if(value instanceof Uint8Array)return value;
  if(value instanceof ArrayBuffer)return new Uint8Array(value);
  if(ArrayBuffer.isView(value)){
    return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
  }
  if(typeof value==="string")return new TextEncoder().encode(value);
  if(value && typeof value.getReader==="function"){
    return new Uint8Array(await new Response(value).arrayBuffer());
  }
  if(value instanceof Blob){
    return new Uint8Array(await value.arrayBuffer());
  }
  throw new Error("Unsupported media payload.");
}

export class FilesystemR2Bucket {
  constructor(root){
    this.root=path.resolve(root);
  }
  async put(key,value,options={}){
    const file=safeKey(this.root,key);
    await fs.mkdir(path.dirname(file),{recursive:true});
    const temp=file+`.tmp-${process.pid}-${Date.now()}`;
    let size=0;
    try{
      if(value && typeof value.getReader==="function"){
        const handle=await fs.open(temp,"w");
        try{
          const reader=value.getReader();
          while(true){
            const {value:chunk,done}=await reader.read();
            if(done)break;
            if(!chunk?.byteLength)continue;
            const bytes=chunk instanceof Uint8Array?chunk:new Uint8Array(chunk);
            await handle.write(bytes);
            size+=bytes.byteLength;
          }
        }finally{await handle.close()}
      }else{
        const bytes=await bodyBytes(value);
        await fs.writeFile(temp,bytes);
        size=bytes.byteLength;
      }
      await fs.rename(temp,file);
    }catch(error){
      await fs.rm(temp,{force:true}).catch(()=>{});
      throw error;
    }

    const metadata={
      contentType:String(options?.httpMetadata?.contentType||"application/octet-stream")
    };
    await fs.writeFile(file+".meta.json",JSON.stringify(metadata));
    return {key:String(key),size,httpMetadata:metadata};
  }
  async get(key){
    const file=safeKey(this.root,key);
    let bytes;
    try{bytes=await fs.readFile(file)}catch(error){
      if(error?.code==="ENOENT")return null;
      throw error;
    }
    let metadata={contentType:"application/octet-stream"};
    try{
      metadata=JSON.parse(await fs.readFile(file+".meta.json","utf8"));
    }catch(_){}
    const copy=new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    return {
      key:String(key),
      size:copy.byteLength,
      httpMetadata:metadata,
      body:new Blob([copy]).stream(),
      async arrayBuffer(){
        return copy.buffer.slice(copy.byteOffset,copy.byteOffset+copy.byteLength);
      }
    };
  }
  async head(key){
    const file=safeKey(this.root,key);
    try{
      const stat=await fs.stat(file);
      return {key:String(key),size:stat.size};
    }catch(error){
      if(error?.code==="ENOENT")return null;
      throw error;
    }
  }
  async delete(key){
    const file=safeKey(this.root,key);
    await fs.rm(file,{force:true});
    await fs.rm(file+".meta.json",{force:true});
  }
}
