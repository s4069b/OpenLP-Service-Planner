import { getAuthUser, requireAuthUser, handleAuthRequest, listUsers, createLocalUser, updateManagedUser, resetLocalUserPassword, deleteManagedUser, microsoftConfigStatus,
  churchSuiteOAuthConfigStatus
} from "./auth";
import { Zip, ZipPassThrough, ZipDeflate, strToU8, strFromU8, Unzip, UnzipInflate } from "fflate";

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function secureResponse(response:Response){
  const headers=new Headers(response.headers);
  headers.set("x-content-type-options","nosniff");
  headers.set("x-frame-options","DENY");
  headers.set("referrer-policy","strict-origin-when-cross-origin");
  headers.set("permissions-policy","camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("strict-transport-security","max-age=31536000");
  headers.set("content-security-policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; "+
    "script-src 'self'; style-src 'self' 'unsafe-inline'; "+
    "img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; "+
    "font-src 'self' data:; form-action 'self'; upgrade-insecure-requests");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

function sameOriginUnsafeRequest(request:Request){
  if(["GET","HEAD","OPTIONS"].includes(request.method))return true;
  const url=new URL(request.url);
  const origin=request.headers.get("origin");
  if(origin)return origin===url.origin;
  const referer=request.headers.get("referer");
  if(referer){try{return new URL(referer).origin===url.origin}catch(_){return false}}
  return String(request.headers.get("sec-fetch-site")||"").toLowerCase()==="same-origin";
}

function htmlEscape(value: any) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch] || ch));
}

const DATABASE_BACKUP_TABLES=[
  "planner_state",
  "planner_settings",
  "users",
  "services",
  "service_items",
  "service_audit",
  "songs",
  "song_revisions",
  "media_library_folders",
  "media_assets",
  "churchsuite_plan_directory_cache",
  "song_usage"
] as const;

const DATABASE_RESTORE_DELETE_ORDER=[
  "service_items",
  "service_audit",
  "song_usage",
  "song_revisions",
  "media_assets",
  "churchsuite_plan_directory_cache",
  "songs",
  "services",
  "media_library_folders",
  "users",
  "planner_settings",
  "planner_state"
] as const;

const DATABASE_RESTORE_INSERT_ORDER=[
  "planner_state",
  "planner_settings",
  "users",
  "services",
  "songs",
  "media_library_folders",
  "service_items",
  "service_audit",
  "song_revisions",
  "media_assets",
  "churchsuite_plan_directory_cache",
  "song_usage"
] as const;

async function tableColumns(env: Cloudflare.Env,table:string){
  if(!DATABASE_BACKUP_TABLES.includes(table as any))return [];
  const rows=await env.DB.prepare(`PRAGMA table_info("${table}")`).all<any>();
  return (rows.results||[]).map((r:any)=>String(r.name||"")).filter(Boolean);
}

async function buildDatabaseBackup(env: Cloudflare.Env){
  const tables:Record<string,any[]>= {};
  for(const table of DATABASE_BACKUP_TABLES){
    const rows=await env.DB.prepare(`SELECT * FROM "${table}"`).all<any>();
    tables[table]=rows.results||[];
  }
  return {
    format:"openlp-service-planner-database-backup",
    formatVersion:1,
    appVersion:"1.76",
    createdAt:new Date().toISOString(),
    note:"Database rows only. Uploaded media file bytes stored outside the database are not included.",
    tables
  };
}

function backupPlannerSettings(backup:any){
  const out:Record<string,any>={};
  const rows=Array.isArray(backup?.tables?.planner_settings)?backup.tables.planner_settings:[];
  for(const row of rows){
    const key=String(row?.key||"");
    if(!key)continue;
    try{out[key]=JSON.parse(String(row?.value_json??"null"))}catch(_){out[key]=null}
  }
  return out;
}

async function ensureUsableAdministrator(env:Cloudflare.Env,settingsOverride:Record<string,any>={}){
  const microsoftGlobal=Object.prototype.hasOwnProperty.call(settingsOverride,"microsoftSsoSignInEnabled")
    ?settingsOverride.microsoftSsoSignInEnabled!==false
    :await plannerSetting(env,"microsoftSsoSignInEnabled",true);
  const churchSuiteGlobal=Object.prototype.hasOwnProperty.call(settingsOverride,"myChurchSuiteSignInEnabled")
    ?settingsOverride.myChurchSuiteSignInEnabled===true
    :await plannerSetting(env,"myChurchSuiteSignInEnabled",false);
  const microsoftConfigured=microsoftConfigStatus(env).configured;
  const churchSuiteConfigured=churchSuiteOAuthConfigStatus(env).configured;
  const rows=await env.DB.prepare(`SELECT email,password_hash,password_salt,microsoft_sso_enabled,churchsuite_sso_enabled
    FROM users WHERE disabled=0 AND access_level=3`).all<any>();
  const usable=(rows.results||[]).some((row:any)=>{
    const local=!!String(row.password_hash||"").trim()&&!!String(row.password_salt||"").trim();
    const microsoft=microsoftGlobal&&microsoftConfigured&&!!Number(row.microsoft_sso_enabled||0);
    const churchSuite=churchSuiteGlobal&&churchSuiteConfigured&&!!Number(row.churchsuite_sso_enabled||0);
    return local||microsoft||churchSuite;
  });
  if(!usable)throw new Error("This change would leave the Planner with no enabled Administrator who has a currently usable sign-in method.");
}

async function validateBackupAdministratorAccess(env:Cloudflare.Env,backup:any){
  const settings=backupPlannerSettings(backup);
  const microsoftGlobal=settings.microsoftSsoSignInEnabled!==false;
  const churchSuiteGlobal=settings.myChurchSuiteSignInEnabled===true;
  const microsoftConfigured=microsoftConfigStatus(env).configured;
  const churchSuiteConfigured=churchSuiteOAuthConfigStatus(env).configured;
  const users=Array.isArray(backup?.tables?.users)?backup.tables.users:[];
  const usable=users.some((row:any)=>{
    if(Number(row?.disabled||0)||Number(row?.access_level||0)!==3)return false;
    const local=!!String(row?.password_hash||"").trim()&&!!String(row?.password_salt||"").trim();
    const microsoft=microsoftGlobal&&microsoftConfigured&&!!Number(row?.microsoft_sso_enabled||0);
    const churchSuite=churchSuiteGlobal&&churchSuiteConfigured&&!!Number(row?.churchsuite_sso_enabled||0);
    return local||microsoft||churchSuite;
  });
  if(!usable){
    throw new Error("This backup has no enabled Administrator with a sign-in method that is usable on this installation. Configure the required SSO provider first, or restore a backup containing an enabled local-password Administrator.");
  }
}

async function restoreDatabaseBackup(env: Cloudflare.Env,backup:any){
  if(!backup || backup.format!=="openlp-service-planner-database-backup"){
    throw new Error("This is not an OpenLP Service Planner database backup.");
  }
  if(Number(backup.formatVersion)!==1){
    throw new Error(`Unsupported backup format version: ${backup.formatVersion}`);
  }
  if(!backup.tables || typeof backup.tables!=="object"){
    throw new Error("Backup does not contain database tables.");
  }
  await validateBackupAdministratorAccess(env,backup);

  // Build all statements before executing. D1 batch runs them in order and
  // fails the operation rather than deliberately accepting a partial restore.
  const statements:any[]=[];
  // Authentication sessions/states are deployment runtime state, not backup data.
  // A restore always signs everybody out and discards in-progress OIDC flows.
  statements.push(env.DB.prepare("DELETE FROM auth_sessions"));
  statements.push(env.DB.prepare("DELETE FROM auth_oidc_states"));

  for(const table of DATABASE_RESTORE_DELETE_ORDER){
    statements.push(env.DB.prepare(`DELETE FROM "${table}"`));
  }

  for(const table of DATABASE_RESTORE_INSERT_ORDER){
    const rows=Array.isArray(backup.tables?.[table])?backup.tables[table]:[];
    if(!rows.length)continue;

    const allowedColumns=await tableColumns(env,table);
    const allowed=new Set(allowedColumns);

    for(const row of rows){
      if(!row || typeof row!=="object")continue;
      const columns=Object.keys(row).filter(k=>allowed.has(k));
      if(!columns.length)continue;
      const quoted=columns.map(c=>`"${c.replace(/"/g,'""')}"`).join(",");
      const placeholders=columns.map(()=>"?").join(",");
      const values=columns.map(c=>row[c]===undefined?null:row[c]);
      statements.push(
        env.DB.prepare(`INSERT INTO "${table}" (${quoted}) VALUES (${placeholders})`).bind(...values)
      );
    }
  }

  await env.DB.batch(statements);
  return {
    ok:true,
    tablesRestored:DATABASE_BACKUP_TABLES.filter(t=>Array.isArray(backup.tables?.[t])).length
  };
}


function safeBackupArchiveName(value:any){
  return String(value||"file")
    .replace(/[\u0000-\u001f\u007f]/g,"")
    .replace(/[\\/:*?"<>|]+/g,"-")
    .replace(/\s+/g," ")
    .trim()
    .slice(0,120) || "file";
}

async function buildFullBackupManifest(env: Cloudflare.Env,databaseBackup:any){
  const rows=Array.isArray(databaseBackup?.tables?.media_assets)
    ?databaseBackup.tables.media_assets
    :[];

  const seen=new Set<string>();
  const media:any[]=[];
  let n=0;

  for(const row of rows){
    const key=String(row?.r2_key||"");
    if(!key || seen.has(key))continue;
    seen.add(key);
    n++;
    const originalName=String(row?.original_name||`media-${n}`);
    const archivePath=`media/${String(n).padStart(6,"0")}-${safeBackupArchiveName(originalName)}`;
    media.push({
      archivePath,
      r2Key:key,
      originalName,
      contentType:String(row?.content_type||"application/octet-stream"),
      byteSize:Number(row?.byte_size||0),
      sha256:String(row?.sha256||"")
    });
  }

  return {
    format:"openlp-service-planner-full-backup",
    formatVersion:1,
    appVersion:"1.76",
    createdAt:new Date().toISOString(),
    databaseFile:"database.json",
    mediaCount:media.length,
    mediaBytes:media.reduce((sum:any,m:any)=>sum+Number(m.byteSize||0),0),
    summary:{
      services:Array.isArray(databaseBackup?.tables?.services)?databaseBackup.tables.services.length:0,
      songs:Array.isArray(databaseBackup?.tables?.songs)?databaseBackup.tables.songs.length:0,
      users:Array.isArray(databaseBackup?.tables?.users)?databaseBackup.tables.users.length:0,
      mediaFiles:media.length
    },
    media,
    note:"Contains planner database rows plus every media object referenced by media_assets."
  };
}

async function streamFullBackup(
  env: Cloudflare.Env,
  databaseBackup:any,
  manifest:any,
  controller:ReadableStreamDefaultController<Uint8Array>
){
  const zip=new Zip((err,chunk,final)=>{
    if(err){controller.error(err);return}
    if(chunk?.byteLength)controller.enqueue(chunk);
    if(final)controller.close();
  });

  try{
    const manifestEntry=new ZipDeflate("manifest.json",{level:6});
    zip.add(manifestEntry);
    manifestEntry.push(strToU8(JSON.stringify(manifest,null,2)),true);

    const dbEntry=new ZipDeflate("database.json",{level:6});
    zip.add(dbEntry);
    dbEntry.push(strToU8(JSON.stringify(databaseBackup,null,2)),true);

    for(const media of manifest.media||[]){
      const object=await env.MEDIA.get(String(media.r2Key));
      if(!object){
        throw new Error(`Media file is missing from storage: ${media.originalName || media.r2Key}`);
      }

      const entry=new ZipPassThrough(String(media.archivePath));
      zip.add(entry);
      const reader=object.body.getReader();
      while(true){
        const {value,done}=await reader.read();
        if(done)break;
        if(value?.byteLength)entry.push(value,false);
      }
      entry.push(new Uint8Array(0),true);
    }

    zip.end();
  }catch(error){
    controller.error(error);
  }
}

async function currentReferencedMediaKeys(env:Cloudflare.Env){
  const rows=await env.DB.prepare(
    `SELECT DISTINCT r2_key FROM media_assets WHERE r2_key IS NOT NULL AND r2_key<>''`
  ).all<any>();
  return new Set((rows.results||[]).map((r:any)=>String(r.r2_key||"")).filter(Boolean));
}

type FullBackupInspection={manifest:any;databaseBackup:any;entrySizes:Map<string,number>};
const BACKUP_METADATA_LIMIT=32*1024*1024;

function concatUint8(chunks:Uint8Array[]){
  const total=chunks.reduce((n,c)=>n+c.byteLength,0);
  const out=new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.byteLength}
  return out;
}

function parseFullBackupMetadata(metadataChunks:Map<string,Uint8Array[]>,entrySizes:Map<string,number>):FullBackupInspection{
  const manifestRaw=metadataChunks.get("manifest.json");
  const databaseRaw=metadataChunks.get("database.json");
  if(!manifestRaw||!databaseRaw)throw new Error("The full backup is missing manifest.json or database.json.");
  let manifest:any,databaseBackup:any;
  try{
    manifest=JSON.parse(strFromU8(concatUint8(manifestRaw)));
    databaseBackup=JSON.parse(strFromU8(concatUint8(databaseRaw)));
  }catch(_){throw new Error("The full backup metadata is not valid JSON.")}
  if(manifest?.format!=="openlp-service-planner-full-backup"||Number(manifest?.formatVersion)!==1){
    throw new Error("This is not a supported OpenLP Service Planner full backup.");
  }
  if(databaseBackup?.format!=="openlp-service-planner-database-backup"){
    throw new Error("The full backup does not contain a valid planner database backup.");
  }
  const mediaRows=Array.isArray(manifest.media)?manifest.media:[];
  for(const media of mediaRows){
    const archivePath=String(media?.archivePath||"");
    const r2Key=String(media?.r2Key||"");
    if(!archivePath||!r2Key)throw new Error("A media entry in the backup is incomplete.");
    if(!entrySizes.has(archivePath))throw new Error(`Media file is missing from the backup: ${media?.originalName||archivePath}`);
    const expected=Number(media?.byteSize||0);
    if(expected>0&&entrySizes.get(archivePath)!==expected){
      throw new Error(`Media file size does not match the backup manifest: ${media?.originalName||archivePath}`);
    }
  }
  return {manifest,databaseBackup,entrySizes};
}

async function inspectFullBackupReadable(stream:ReadableStream<Uint8Array>):Promise<FullBackupInspection>{
  const metadataChunks=new Map<string,Uint8Array[]>();
  const entrySizes=new Map<string,number>();
  let metadataBytes=0;
  let streamError:any=null;
  const unzip=new Unzip(entry=>{
    let count=0;
    const collect=entry.name==="manifest.json"||entry.name==="database.json";
    if(collect)metadataChunks.set(entry.name,[]);
    entry.ondata=(err:any,chunk:Uint8Array,final:boolean)=>{
      if(err){streamError=err;return}
      count+=chunk?.byteLength||0;
      if(collect&&chunk?.byteLength){
        metadataBytes+=chunk.byteLength;
        if(metadataBytes>BACKUP_METADATA_LIMIT){streamError=new Error("Backup metadata is too large to restore safely.");return}
        metadataChunks.get(entry.name)!.push(chunk);
      }
      if(final)entrySizes.set(entry.name,count);
    };
    entry.start();
  });
  unzip.register(UnzipInflate);
  const reader=stream.getReader();
  while(true){
    const {value,done}=await reader.read();
    if(done){unzip.push(new Uint8Array(0),true);break}
    if(value?.byteLength)unzip.push(value,false);
    if(streamError)throw streamError;
  }
  if(streamError)throw streamError;
  return parseFullBackupMetadata(metadataChunks,entrySizes);
}

function restoreStageKey(restoreId:string,index:number,media:any){
  const name=safeBackupArchiveName(media?.originalName||`media-${index+1}`);
  return `restore-${restoreId}/${String(index+1).padStart(6,"0")}-${name}`;
}

function databaseBackupWithRestoredMediaKeys(databaseBackup:any,keyByOriginal:Map<string,string>){
  const clone=JSON.parse(JSON.stringify(databaseBackup));
  const rows=Array.isArray(clone?.tables?.media_assets)?clone.tables.media_assets:[];
  for(const row of rows){
    const original=String(row?.r2_key||"");
    if(original&&keyByOriginal.has(original))row.r2_key=keyByOriginal.get(original);
  }
  return clone;
}

async function deleteMediaKeysQuietly(env:Cloudflare.Env,keys:Iterable<string>){
  let deleted=0;
  for(const key of keys){
    try{await env.MEDIA.delete(key);deleted++}catch(_){}
  }
  return deleted;
}

async function restoreFullBackupReadable(env:Cloudflare.Env,stream:ReadableStream<Uint8Array>){
  const restoreId=crypto.randomUUID();
  const metadataChunks=new Map<string,Uint8Array[]>();
  const entrySizes=new Map<string,number>();
  const stageByArchivePath=new Map<string,string>();
  const keyByOriginal=new Map<string,string>();
  const stagedKeys=new Set<string>();
  const uploads:Promise<any>[]=[];
  const pendingWrites:Promise<any>[]=[];
  let metadataBytes=0;
  let streamError:any=null;
  let manifest:any=null;

  const configureManifest=()=>{
    const chunks=metadataChunks.get("manifest.json");
    if(!chunks)return;
    try{manifest=JSON.parse(strFromU8(concatUint8(chunks)))}catch(_){streamError=new Error("The full backup manifest is not valid JSON.");return}
    if(manifest?.format!=="openlp-service-planner-full-backup"||Number(manifest?.formatVersion)!==1){streamError=new Error("This is not a supported OpenLP Service Planner full backup.");return}
    const mediaRows=Array.isArray(manifest.media)?manifest.media:[];
    mediaRows.forEach((media:any,index:number)=>{
      const archivePath=String(media?.archivePath||"");
      const original=String(media?.r2Key||"");
      if(!archivePath||!original){streamError=new Error("A media entry in the backup is incomplete.");return}
      const staged=restoreStageKey(restoreId,index,media);
      stageByArchivePath.set(archivePath,staged);
      keyByOriginal.set(original,staged);
      stagedKeys.add(staged);
    });
  };

  const unzip=new Unzip(entry=>{
    let count=0;
    const metadata=entry.name==="manifest.json"||entry.name==="database.json";
    if(metadata){
      metadataChunks.set(entry.name,[]);
      entry.ondata=(err:any,chunk:Uint8Array,final:boolean)=>{
        if(err){streamError=err;return}
        count+=chunk?.byteLength||0;
        if(chunk?.byteLength){
          metadataBytes+=chunk.byteLength;
          if(metadataBytes>BACKUP_METADATA_LIMIT){streamError=new Error("Backup metadata is too large to restore safely.");return}
          metadataChunks.get(entry.name)!.push(chunk);
        }
        if(final){entrySizes.set(entry.name,count);if(entry.name==="manifest.json")configureManifest()}
      };
      entry.start();
      return;
    }

    if(!manifest){
      entry.ondata=(err:any,chunk:Uint8Array,final:boolean)=>{if(err)streamError=err;if(final)entrySizes.set(entry.name,count);count+=chunk?.byteLength||0};
      streamError=new Error("The full backup must contain manifest.json before media files.");
      entry.start();
      return;
    }
    const media=(manifest.media||[]).find((m:any)=>String(m.archivePath)===entry.name);
    if(!media){
      entry.ondata=(err:any,chunk:Uint8Array,final:boolean)=>{if(err)streamError=err;count+=chunk?.byteLength||0;if(final)entrySizes.set(entry.name,count)};
      entry.start();
      return;
    }
    const stagedKey=stageByArchivePath.get(entry.name);
    if(!stagedKey){streamError=new Error(`Restore staging key is missing for ${entry.name}`);entry.start();return}
    const pipe=new TransformStream<Uint8Array,Uint8Array>();
    const writer=pipe.writable.getWriter();
    uploads.push(env.MEDIA.put(stagedKey,pipe.readable,{httpMetadata:{contentType:String(media.contentType||"application/octet-stream")}}));
    entry.ondata=(err:any,chunk:Uint8Array,final:boolean)=>{
      if(err){streamError=err;pendingWrites.push(writer.abort(err));return}
      count+=chunk?.byteLength||0;
      if(chunk?.byteLength)pendingWrites.push(writer.write(chunk));
      if(final){entrySizes.set(entry.name,count);pendingWrites.push(writer.close())}
    };
    entry.start();
  });
  unzip.register(UnzipInflate);

  try{
    const reader=stream.getReader();
    while(true){
      const {value,done}=await reader.read();
      if(done)unzip.push(new Uint8Array(0),true);
      else if(value?.byteLength)unzip.push(value,false);
      if(pendingWrites.length){const writes=pendingWrites.splice(0,pendingWrites.length);await Promise.all(writes)}
      if(streamError)throw streamError;
      if(done)break;
    }
    await Promise.all(uploads);
    if(streamError)throw streamError;
    const {manifest:checkedManifest,databaseBackup}=parseFullBackupMetadata(metadataChunks,entrySizes);
    await validateBackupAdministratorAccess(env,databaseBackup);
    const oldKeys=await currentReferencedMediaKeys(env);
    const stagedDatabase=databaseBackupWithRestoredMediaKeys(databaseBackup,keyByOriginal);
    await restoreDatabaseBackup(env,stagedDatabase);
    const deletedObsolete=await deleteMediaKeysQuietly(env,oldKeys);
    return {ok:true,mediaRestored:Array.isArray(checkedManifest.media)?checkedManifest.media.length:0,obsoleteMediaDeleted:deletedObsolete,tablesRestored:DATABASE_BACKUP_TABLES.length};
  }catch(error){
    await deleteMediaKeysQuietly(env,stagedKeys);
    throw error;
  }
}

async function plannerSetting<T>(env: Cloudflare.Env, key: string, fallback: T): Promise<T> {
  const row = await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key=?"
  ).bind(key).first<{value_json:string}>();
  return safeJson(row?.value_json ?? null, fallback);
}

async function churchSuitePlanningExtensionEnabled(env:Cloudflare.Env){
  const mode=String(await plannerSetting(env,"churchSuiteMode","off"));
  return ["on","manual","auto"].includes(mode);
}

function normalizePublishedDirectoryPath(value: any) {
  const clean = String(value || "churchsuite-plans")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9/_-]/g, "");
  return `/${clean || "churchsuite-plans"}`;
}

function churchSuitePublishedPlanUrl(base: string, identifier: string) {
  const cleanBase=String(base||"").replace(/\/+$/,"");
  return cleanBase && identifier
    ? `${cleanBase}/-/plans/${encodeURIComponent(identifier)}`
    : "";
}


async function churchSuiteSongSelectionState(env: Cloudflare.Env, planId: number) {
  const payload = await churchSuiteFetch(
    env,
    `/planning/plan_items?plan_ids[]=${Number(planId)}&per_page=250`
  );
  const items = Array.isArray(payload?.data) ? payload.data : [];

  // ChurchSuite keeps a song item in the plan even when no actual song /
  // arrangement has been chosen yet. Count every song slot, then count the
  // subset with a selected arrangement.
  const songItems = items.filter((item:any)=>item?.type === "song");
  const total = songItems.length;
  const selected = songItems.filter((item:any)=>
    Number(item?.arrangement_id || item?.song_arrangement_id || item?.arrangement?.id || 0) > 0
  ).length;

  const state =
    total === 0 ? "none-required" :
    selected === 0 ? "none-selected" :
    selected < total ? "partial" :
    "all-selected";

  return { total, selected, state };
}

async function plannerDirectoryServiceStatuses(env: Cloudflare.Env) {
  const serviceRows = await env.DB.prepare(
    `SELECT id,title,date_iso,theme,downloaded_for_device_at,downloaded_snapshot,
            churchsuite_plan_id,churchsuite_plan_identifier
     FROM services
     WHERE churchsuite_plan_id IS NOT NULL OR churchsuite_plan_identifier IS NOT NULL`
  ).all<any>();

  const mapById = new Map<string,string>();
  const mapByIdentifier = new Map<string,string>();

  for (const row of serviceRows.results) {
    const itemRows = await env.DB.prepare(
      `SELECT item_json FROM service_items
       WHERE service_id=? ORDER BY position`
    ).bind(String(row.id)).all<any>();
    const items = itemRows.results.map((x:any)=>safeJson(x.item_json,{}));

    let label="Not complete";
    const projected=items.filter((item:any)=>!!item.projected);
    const empty=items.length===0;
    const complete=!empty && projected.every((item:any)=>!!item.ready);

    if(row.downloaded_for_device_at){
      const currentSnapshot=JSON.stringify({
        title:String(row.title||""),
        dateISO:String(row.date_iso||""),
        theme:String(row.theme||"Default"),
        items
      });
      label=row.downloaded_snapshot===currentSnapshot
        ?"Downloaded"
        :"Amended after download";
    }else if(empty){
      label="Empty";
    }else if(complete){
      label="Complete";
    }

    if(row.churchsuite_plan_id!==null && row.churchsuite_plan_id!==undefined){
      mapById.set(String(row.churchsuite_plan_id),label);
    }
    if(row.churchsuite_plan_identifier){
      mapByIdentifier.set(String(row.churchsuite_plan_identifier),label);
    }
  }

  return {mapById,mapByIdentifier};
}

async function syncChurchSuitePublishedDirectory(env: Cloudflare.Env, options:{forceInitial?:boolean}={}) {
  const enabled = await plannerSetting(env, "churchSuiteDirectoryEnabled", false);
  if (!enabled) throw new Error("Published ChurchSuite service-plan directory is disabled.");

  const cache = await env.DB.prepare(
    "SELECT synced_at FROM churchsuite_plan_directory_cache WHERE id=1"
  ).first<any>();

  if(cache?.synced_at && !options.forceInitial){
    const last=new Date(String(cache.synced_at).replace(" ","T")+"Z").getTime();
    const elapsed=Date.now()-last;
    const minimum=5*60*1000;
    if(Number.isFinite(last) && elapsed<minimum){
      const retrySeconds=Math.max(1,Math.ceil((minimum-elapsed)/1000));
      return {
        throttled:true,
        retrySeconds,
        nextAllowedAt:new Date(last+minimum).toISOString()
      };
    }
  }

  const lockKey="churchSuiteDirectorySyncLock";
  const lockRow=await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key=?"
  ).bind(lockKey).first<any>();

  let lockedAt=0;
  try{lockedAt=Number(JSON.parse(String(lockRow?.value_json||"0"))||0)}catch(_){}
  // A stale lock self-expires after 2 minutes.
  if(lockedAt && Date.now()-lockedAt<2*60*1000){
    return {busy:true,retrySeconds:5};
  }

  await env.DB.prepare(
    `INSERT INTO planner_settings(key,value_json,updated_at)
     VALUES(?,?,datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=datetime('now')`
  ).bind(lockKey,JSON.stringify(Date.now())).run();

  try{
    const weeksRaw = await plannerSetting(env, "churchSuiteDirectoryWeeks", 8);
    const weeks = Math.min(52,Math.max(1,Number(weeksRaw||8)));
    const baseUrl = await plannerSetting(env, "churchSuitePlanBaseUrl", "");
    const showSongs = await plannerSetting(env, "churchSuiteDirectoryShowSongs", true);

    const now = new Date();
    const start = now.toISOString().slice(0,10);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + weeks * 7);
    const end = endDate.toISOString().slice(0,10);

    const params = new URLSearchParams();
    params.set("status","published");
    params.set("starts_after",start);
    params.set("starts_before",end);
    const plans = await churchSuiteListAll(env, `/planning/plans?${params.toString()}`);

    const cleanPlans:any[] = [];
    for (const p of plans) {
      const dateISO=String(p.date||"");
      if(dateISO < start || dateISO > end) continue;

      let songSelection:any=null;
      if(showSongs){
        try{
          songSelection=await churchSuiteSongSelectionState(env,Number(p.id));
        }catch(_){
          songSelection=null;
        }
      }

      cleanPlans.push({
        id:Number(p.id),
        identifier:String(p.identifier||""),
        title:String(p.name||"ChurchSuite service"),
        dateISO,
        time:String(p.time||""),
        modifiedAt:String(p.modified_at||""),
        url:churchSuitePublishedPlanUrl(String(baseUrl||""),String(p.identifier||"")),
        songSelection
      });
    }

    cleanPlans.sort((a:any,b:any)=>`${a.dateISO} ${a.time}`.localeCompare(`${b.dateISO} ${b.time}`));

    await env.DB.prepare(
      `INSERT INTO churchsuite_plan_directory_cache(id,plans_json,synced_at,range_start,range_end)
       VALUES(1,?,datetime('now'),?,?)
       ON CONFLICT(id) DO UPDATE SET
         plans_json=excluded.plans_json,
         synced_at=excluded.synced_at,
         range_start=excluded.range_start,
         range_end=excluded.range_end`
    ).bind(JSON.stringify(cleanPlans),start,end).run();

    return {plans:cleanPlans,start,end,throttled:false,busy:false};
  } finally {
    await env.DB.prepare("DELETE FROM planner_settings WHERE key=?").bind(lockKey).run().catch(()=>{});
  }
}

function formatPublishedPlanDate(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateISO;
  return new Intl.DateTimeFormat("en-AU",{
    weekday:"short",day:"numeric",month:"short",year:"numeric"
  }).format(d);
}

async function churchSuiteServiceListAvailable(env:Cloudflare.Env){
  const enabled=await plannerSetting(env,"churchSuiteDirectoryEnabled",false);
  return !!enabled && await churchSuitePlanningExtensionEnabled(env);
}

function firstLoginAccessPage(user:any,serviceListAvailable:boolean,continueTo:string){
  const safeContinue=continueTo.startsWith("/")&&!continueTo.startsWith("//")?continueTo:"/";
  const lowest=Number(user?.accessLevel||1)===1;
  const currentAccess=lowest
    ?(serviceListAvailable
      ?`<p>For now, you can use the <strong>ChurchSuite Service list</strong>.</p>`
      :`<div class="notice"><strong>You do not currently have access to any Planner features.</strong> The optional ChurchSuite Service list is not enabled for this installation.</div>`)
    :Number(user?.accessLevel||1)===2
      ?`<p>Your account has already been assigned <strong>Planner</strong> access.</p>`
      :`<p>Your account has already been assigned <strong>Administrator</strong> access.</p>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>First sign-in · OpenLP Service Planner</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f7;color:#1d1d1f;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
main{max-width:540px;margin:12vh auto;padding:0 18px}.card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.05)}
h1{font-size:24px;line-height:1.15;margin:0 0 10px}p{color:#6e6e73;margin:8px 0}.notice{margin:16px 0;padding:11px 12px;border-radius:11px;background:#f2f2f4;color:#4b4b50}.button{display:inline-flex;align-items:center;justify-content:center;margin-top:18px;padding:9px 13px;border-radius:9px;text-decoration:none;font-weight:650;background:#1d1d1f;color:#fff}
</style>
</head>
<body><main><div class="card">
<h1>Welcome to OpenLP Service Planner</h1>
<p>This is your first sign-in.</p>
${lowest?`<p>Your account begins at the lowest access level.</p>`:``}
${currentAccess}
${lowest?`<p>If you would like to be considered for <strong>Planner</strong> or <strong>Administrator</strong> access, ask a current Administrator.</p>`:``}
<a class="button" href="${htmlEscape(safeContinue)}">Continue</a>
</div></main></body></html>`;
}

function churchSuiteServiceListUnavailablePage(){
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>More access required · OpenLP Service Planner</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f5f5f7;color:#1d1d1f;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
main{max-width:540px;margin:12vh auto;padding:0 18px}
.card{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.05)}
h1{font-size:24px;line-height:1.15;margin:0 0 10px}
p{color:#6e6e73;margin:8px 0}
.notice{margin:16px 0;padding:11px 12px;border-radius:11px;background:#f2f2f4;color:#4b4b50}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}
.button{display:inline-flex;align-items:center;justify-content:center;padding:9px 13px;border-radius:9px;text-decoration:none;font-weight:650;border:1px solid rgba(0,0,0,.08);background:#1d1d1f;color:#fff}
.button.secondary{background:#f2f2f4;color:#333;cursor:pointer;font:650 15px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
</style>
</head>
<body>
<main>
  <div class="card">
    <h1>More access required</h1>
    <p>Your account is currently assigned the lowest OpenLP Service Planner access level.</p>
    <div class="notice">The optional ChurchSuite Service list is not enabled for this installation, so there is currently nothing available for this access level.</div>
    <p>Ask a current Administrator if you need <strong>Planner</strong> or <strong>Administrator</strong> access.</p>
    <div class="actions">
      <form method="post" action="/auth/logout" style="margin:0"><button class="button secondary" type="submit">Sign out</button></form>
    </div>
  </div>
</main>
</body>
</html>`;
}


async function publishedChurchSuiteDirectory(request: Request, env: Cloudflare.Env) {
  const user=await getAuthUser(request,env);
  const enabled = await plannerSetting(env, "churchSuiteDirectoryEnabled", false);
  const configuredPath = normalizePublishedDirectoryPath(
    await plannerSetting(env, "churchSuiteDirectoryPath", "churchsuite-plans")
  );
  const url=new URL(request.url);
  const routeMatch=url.pathname===configuredPath || url.pathname===`${configuredPath}/`;
  const extensionEnabled=await churchSuitePlanningExtensionEnabled(env);

  // A disabled published-plan route must never fall through to static asset
  // handling; that previously produced confusing file-download behaviour.
  if(routeMatch && (!enabled || !extensionEnabled)){
    return new Response("ChurchSuite service plans are not enabled.",{
      status:404,
      headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}
    });
  }
  if (!enabled || !extensionEnabled) return null;

  if(url.pathname!==configuredPath && url.pathname!==`${configuredPath}/`) {
    return null;
  }

  const canResync=Number(user?.accessLevel||0)>=2;
  let cache = await env.DB.prepare(
    "SELECT plans_json,synced_at,range_start,range_end FROM churchsuite_plan_directory_cache WHERE id=1"
  ).first<any>();
  const lastCachedSyncDate=cache?.synced_at
    ?new Date(String(cache.synced_at).replace(" ","T")+"Z")
    :null;
  const automaticRefreshMs=15*60*1000;
  const automaticRefreshDue=!lastCachedSyncDate || (Date.now()-lastCachedSyncDate.getTime()>=automaticRefreshMs);

  let syncError="";
  if(request.method==="POST"){
    const automatic=url.searchParams.get("automatic")==="1";
    if(!automatic&&!canResync)return json({error:"Planner access is required to manually re-sync ChurchSuite."},{status:403});
    if(automatic&&!automaticRefreshDue){
      return json({ok:true,skipped:true,reason:"cache-fresh"});
    }
    try{
      const result:any=await syncChurchSuitePublishedDirectory(env,{forceInitial:true});
      if(result?.throttled){
        return new Response(JSON.stringify({
          ok:false,
          throttled:true,
          retrySeconds:Number(result.retrySeconds||300),
          nextAllowedAt:result.nextAllowedAt||null
        }),{
          status:429,
          headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
        });
      }
      if(result?.busy){
        return new Response(JSON.stringify({
          ok:false,
          busy:true,
          retrySeconds:Number(result.retrySeconds||5)
        }),{
          status:409,
          headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
        });
      }
      return new Response(JSON.stringify({ok:true}),{
        headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
      });
    }catch(error:any){
      return new Response(JSON.stringify({ok:false,error:String(error?.message||error)}),{
        status:500,
        headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
      });
    }
  } else if(request.method!=="GET"){
    return new Response("Method not allowed",{status:405});
  }

  // Return the current cache immediately. If it is stale or missing, the
  // rendered page starts a server-authorised refresh and shows progress.
  const plans=safeJson<any[]>(cache?.plans_json||"[]",[]);
  const showPlannerStatus=await plannerSetting(env,"churchSuiteDirectoryShowPlannerStatus",true);
  const showSongs=await plannerSetting(env,"churchSuiteDirectoryShowSongs",true);
  const plannerStatuses=showPlannerStatus
    ?await plannerDirectoryServiceStatuses(env)
    :{mapById:new Map<string,string>(),mapByIdentifier:new Map<string,string>()};

  const rows=plans.map(plan=>{
    const plannerStatus=showPlannerStatus
      ?(plannerStatuses.mapById.get(String(plan.id)) || plannerStatuses.mapByIdentifier.get(String(plan.identifier||"")) || "")
      :"";
    const songState=showSongs ? plan.songSelection : null;
    const songLabel=!showSongs
      ?""
      :!songState
        ?"Unknown"
        :songState.state==="all-selected"
          ?`All selected (${Number(songState.selected)}/${Number(songState.total)})`
          :songState.state==="partial"
            ?`Partial (${Number(songState.selected)}/${Number(songState.total)})`
            :songState.state==="none-selected"
              ?`None selected (0/${Number(songState.total)})`
              :songState.state==="none-required"
                ?"No song items"
                :"Unknown";

    return `
    <a class="plan ${showPlannerStatus?'with-status':''} ${showSongs?'with-songs':''}" href="${htmlEscape(plan.url||"#")}" ${plan.url?'target="_blank" rel="noopener"':''}>
      <span class="date">${htmlEscape(formatPublishedPlanDate(plan.dateISO))}</span>
      <span class="detail">
        <strong>${htmlEscape(plan.title)}</strong>
        ${plan.time?`<small>${htmlEscape(plan.time)}</small>`:""}
      </span>
      ${showPlannerStatus?`<span class="indicator planner-status ${plannerStatus?'has-value':''} ${
        plannerStatus==="Complete"?"planner-complete":
        plannerStatus==="Downloaded"?"planner-downloaded":
        plannerStatus==="Amended after download"?"planner-amended":
        plannerStatus==="Not complete"?"planner-incomplete":
        plannerStatus==="Empty"?"planner-empty":""
      }"><small>OpenLP Planner</small><b>${htmlEscape(plannerStatus)}</b></span>`:""}
      ${showSongs?`<span class="indicator songs-status ${
        songState?.state==="all-selected"?"songs-all":
        songState?.state==="partial"?"songs-partial":
        songState?.state==="none-selected"?"songs-none":""
      }"><small>ChurchSuite songs</small><b>${htmlEscape(songLabel)}</b></span>`:""}
      <span class="arrow">›</span>
    </a>`;
  }).join("");

  const lastSyncDate=lastCachedSyncDate;
  const lastSync=lastSyncDate
    ? lastSyncDate.toLocaleString("en-AU",{dateStyle:"medium",timeStyle:"short"})
    : "Not yet synced";
  const syncCooldownMs=5*60*1000;
  const nextSyncAllowedAt=lastSyncDate
    ? lastSyncDate.getTime()+syncCooldownMs
    : 0;
  const syncCooldownRemaining=Math.max(0,nextSyncAllowedAt-Date.now());
  const syncCooldownActive=syncCooldownRemaining>0;

  const page=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ChurchSuite Service Plans</title>
<style>
:root{color-scheme:light;--bg:#f5f5f7;--panel:rgba(255,255,255,.88);--ink:#1d1d1f;--muted:#6e6e73;--line:rgba(0,0,0,.09);--blue:#0071e3}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif}
.wrap{width:min(820px,calc(100% - 32px));margin:0 auto;padding:64px 0 52px}
.header{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
h1{font-size:34px;letter-spacing:-.035em;margin:3px 0 0;line-height:1.1}.meta{font-size:12px;color:var(--muted);margin-top:7px}
button{appearance:none;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);padding:9px 13px;font:600 13px inherit;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.03)}
button:hover{background:#fafafa}.list{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--panel);box-shadow:0 8px 30px rgba(0,0,0,.035)}
.plan{display:grid;grid-template-columns:180px minmax(0,1fr) 20px;align-items:center;gap:18px;padding:16px 18px;text-decoration:none;color:inherit;border-bottom:1px solid var(--line)}
.plan.with-status{grid-template-columns:180px minmax(0,1fr) 150px 20px}
.plan.with-songs{grid-template-columns:180px minmax(0,1fr) 150px 20px}
.plan.with-status.with-songs{grid-template-columns:180px minmax(0,1fr) 145px 145px 20px}
.plan:last-child{border-bottom:0}.plan:hover{background:rgba(0,113,227,.035)}.date{font-weight:650}.detail{display:flex;flex-direction:column;min-width:0}.detail strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.detail small{color:var(--muted);margin-top:2px}
.indicator{display:flex;flex-direction:column;min-width:0;gap:3px}.indicator small{color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.06em}.indicator b{display:inline-flex;align-self:flex-start;max-width:100%;padding:3px 7px;border-radius:999px;font-size:11px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(110,110,115,.07);color:#5f5f64}
.songs-all b,.planner-complete b,.planner-downloaded b{background:rgba(61,139,90,.10);color:#447454}
.songs-partial b,.planner-incomplete b{background:rgba(210,135,55,.11);color:#8a643d}
.songs-none b,.planner-amended b{background:rgba(190,69,62,.09);color:#92514c}
.planner-status:not(.has-value) b{min-height:17px;padding:0;background:transparent}.arrow{font-size:24px;color:#a1a1a6;text-align:right}
.empty{padding:34px;text-align:center;color:var(--muted)}.error{margin:0 0 16px;padding:10px 12px;border-radius:10px;background:#fff1f0;color:#8b2b25;border:1px solid #f2c9c5;font-size:12px}
.directory-control-stack{display:flex;flex-direction:column;align-items:flex-end;gap:5px}.directory-actions{display:flex;gap:8px;flex-wrap:wrap}.directory-actions form{margin:0}.directory-actions a,.directory-actions form button{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);padding:9px 13px;font:600 13px inherit}.directory-actions a:hover,.directory-actions form button:hover{background:#fafafa}.directory-actions button:disabled{opacity:.45;cursor:not-allowed;background:#f4f4f5}.planner-return-link{font-size:10px;color:var(--muted);text-decoration:none}.planner-return-link:hover{text-decoration:underline}.sync-cooldown-note{font-size:10px;color:var(--muted);text-align:right}.sync-status{margin:-8px 0 16px;padding:9px 11px;border-radius:10px;background:rgba(0,113,227,.06);color:#4e6377;font-size:12px}.sync-status.error{background:#fff1f0;color:#8b2b25}.sync-status.sync-working{display:flex;align-items:center;gap:9px}.sync-status.sync-working::before{content:"";width:12px;height:12px;border:2px solid rgba(49,90,131,.25);border-top-color:#315a83;border-radius:50%;animation:directory-spin .8s linear infinite}@keyframes directory-spin{to{transform:rotate(360deg)}}.sync-working:before{content:"";display:inline-block;width:11px;height:11px;border:2px solid rgba(0,0,0,.15);border-top-color:#555;border-radius:50%;margin-right:7px;vertical-align:-2px;animation:dirSpin .7s linear infinite}@keyframes dirSpin{to{transform:rotate(360deg)}}.footer{margin-top:14px;color:var(--muted);font-size:11px;text-align:center}
@media(max-width:600px){.wrap{width:min(100% - 22px,820px);padding-top:30px}.header{align-items:flex-start;flex-direction:column}.directory-control-stack{align-items:flex-start}h1{font-size:28px}.plan,.plan.with-status,.plan.with-songs,.plan.with-status.with-songs{grid-template-columns:1fr 20px;gap:5px 10px}.date{grid-column:1;font-size:12px;color:var(--muted)}.detail{grid-column:1}.indicator{grid-column:1;margin-top:4px}.indicator small{font-size:8px}.arrow{grid-column:2;grid-row:1/6}}
</style>
</head>
<body><main class="wrap">
<header class="header">
  <div>
    <div class="eyebrow">ChurchSuite</div>
    <h1>Upcoming service plans</h1>
    <div class="meta">Today through ${htmlEscape(cache?.range_end||"")}</div>
    <div class="meta" id="lastSyncNote">Last synced ${htmlEscape(lastSync)}</div>
  </div>
  <div class="directory-control-stack">
    <div class="directory-actions">
      ${canResync?`<button type="button" id="directoryResync" data-sync-url="${htmlEscape(configuredPath)}" data-next-allowed-at="${nextSyncAllowedAt}" ${syncCooldownActive?'disabled':''}>↻ Re-sync</button>`:""}
      <form method="post" action="/auth/logout"><button type="submit">Log out</button></form>
    </div>
    ${canResync?`<a class="planner-return-link" href="/?screen=home">OpenLP Planner Home</a>`:""}
    ${canResync?`<div class="sync-cooldown-note" id="syncCooldownNote" ${syncCooldownActive?'':'hidden'}></div>`:""}
  </div>
</header>
<div id="syncStatus" class="sync-status" data-sync-url="${htmlEscape(configuredPath)}" data-auto-sync="${automaticRefreshDue?'1':'0'}" hidden></div>
${syncError?`<div class="error">${htmlEscape(syncError)}</div>`:""}
<section class="list">${rows||'<div class="empty">No published service plans are currently available.</div>'}</section>
<div class="footer">OpenLP Service Planner</div>
</main>
<script src="/churchsuite-directory.js"></script>
</body></html>`;

  return new Response(page,{headers:{
    "content-type":"text/html; charset=utf-8",
    "cache-control":"no-store"
  }});
}


function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

let serviceRevisionColumnReady = false;

async function hasServiceRevisionColumn(env: Cloudflare.Env) {
  if (serviceRevisionColumnReady) return true;
  const columns = await env.DB.prepare("PRAGMA table_info(services)").all<any>();
  const available = columns.results.some((column: any) => String(column.name) === "revision");
  if (available) serviceRevisionColumnReady = true;
  return available;
}

async function bootstrap(env: Cloudflare.Env) {
  const serviceRevisionAvailable = await hasServiceRevisionColumn(env);

  const settingsRows = await env.DB.prepare(
    "SELECT key, value_json FROM planner_settings"
  ).all<{ key: string; value_json: string }>();

  const settings: Record<string, unknown> = {};
  for (const row of settingsRows.results) {
    settings[row.key] = safeJson(row.value_json, null);
  }

  const servicesRows = await env.DB.prepare(
    `SELECT id,title,date_iso,date_display,theme,published,kind,service_type_id,service_type_name,
            downloaded_for_device_at,downloaded_snapshot,
            service_type_id,service_type_name,
            last_edited_at,last_edited_by,last_edited_action,
            churchsuite_plan_id,churchsuite_plan_identifier,churchsuite_plan_url,
            churchsuite_last_updated,churchsuite_last_synced,churchsuite_import_mode,churchsuite_out_of_sync,churchsuite_out_of_sync_reason,
            ${serviceRevisionAvailable ? "revision" : "0 AS revision"}
     FROM services
     ORDER BY date_iso, title`
  ).all<any>();

  const services = [];
  for (const row of servicesRows.results) {
    const itemsRows = await env.DB.prepare(
      `SELECT item_json FROM service_items
       WHERE service_id = ?
       ORDER BY position`
    ).bind(row.id).all<{ item_json: string }>();

    const auditRows = await env.DB.prepare(
      `SELECT actor,action,detail,created_at
       FROM service_audit
       WHERE service_id = ?
       ORDER BY id DESC
       LIMIT 50`
    ).bind(row.id).all<any>();

    services.push({
      id: row.id,
      title: row.title,
      dateISO: row.date_iso,
      date: row.date_display,
      theme: row.theme,
      published: !!row.published,
      kind: row.kind,
      serviceTypeId: row.service_type_id || undefined,
      serviceTypeName: row.service_type_name || (row.kind==='event'?'One-off services':row.title),
      downloadedForDeviceAt: row.downloaded_for_device_at || undefined,
      downloadedSnapshot: row.downloaded_snapshot || undefined,
      lastEditedAt: row.last_edited_at || undefined,
      lastEditedBy: row.last_edited_by || undefined,
      lastEditedAction: row.last_edited_action || undefined,
      churchSuitePlanId: row.churchsuite_plan_id ?? undefined,
      churchSuitePlanIdentifier: row.churchsuite_plan_identifier || undefined,
      churchSuitePlanUrl: row.churchsuite_plan_url || undefined,
      churchSuiteLastUpdated: row.churchsuite_last_updated || undefined,
      churchSuiteLastSynced: row.churchsuite_last_synced || undefined,
      churchSuiteImportMode: row.churchsuite_import_mode || undefined,
      churchSuiteOutOfSync: !!row.churchsuite_out_of_sync,
      churchSuiteOutOfSyncReason: row.churchsuite_out_of_sync_reason || undefined,
      revision: Number(row.revision||0),
      items: itemsRows.results.map(x => safeJson(x.item_json, {})),
      activity: auditRows.results.map(x => [
        x.actor,
        x.detail ? `${x.action}: ${x.detail}` : x.action,
        x.created_at
      ])
    });
  }

  const active = await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key = 'activeServiceId'"
  ).first<{ value_json: string }>();

  return {
    activeServiceId: safeJson(active?.value_json ?? null, services[0]?.id ?? null),
    settings,
    services,
    // An empty service list is valid. Settings are written during first seed,
    // so their presence distinguishes an initialized planner from a genuinely
    // fresh structured database and prevents deleted services being re-seeded.
    initialized: settingsRows.results.length>0 || servicesRows.results.length>0,
    authConfig:{allowedDomain:microsoftConfigStatus(env).allowedDomain}
  };
}

async function upsertSettings(env: Cloudflare.Env, settings: Record<string, unknown>) {
  const statements = [];
  for (const [key, value] of Object.entries(settings)) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO planner_settings(key,value_json,updated_at)
         VALUES(?,?,datetime('now'))
         ON CONFLICT(key) DO UPDATE SET
           value_json=excluded.value_json,
           updated_at=datetime('now')`
      ).bind(key, JSON.stringify(value))
    );
  }
  if (statements.length) await env.DB.batch(statements);
}

async function upsertService(env: Cloudflare.Env, service: any) {
  await env.DB.prepare(
    `INSERT INTO services
      (id,title,date_iso,date_display,theme,published,kind,service_type_id,service_type_name,downloaded_for_device_at,downloaded_snapshot,
       last_edited_at,last_edited_by,last_edited_action,
       churchsuite_plan_id,churchsuite_plan_identifier,churchsuite_plan_url,churchsuite_last_updated,churchsuite_last_synced,churchsuite_import_mode,
       churchsuite_out_of_sync,churchsuite_out_of_sync_reason,
       updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title,
       date_iso=excluded.date_iso,
       date_display=excluded.date_display,
       theme=excluded.theme,
       published=excluded.published,
       kind=excluded.kind,
       service_type_id=excluded.service_type_id,
       service_type_name=excluded.service_type_name,
       downloaded_for_device_at=excluded.downloaded_for_device_at,
       downloaded_snapshot=excluded.downloaded_snapshot,
       last_edited_at=excluded.last_edited_at,
       last_edited_by=excluded.last_edited_by,
       last_edited_action=excluded.last_edited_action,
       churchsuite_plan_id=excluded.churchsuite_plan_id,
       churchsuite_plan_identifier=excluded.churchsuite_plan_identifier,
       churchsuite_plan_url=excluded.churchsuite_plan_url,
       churchsuite_last_updated=excluded.churchsuite_last_updated,
       churchsuite_last_synced=excluded.churchsuite_last_synced,
       churchsuite_import_mode=excluded.churchsuite_import_mode,
       churchsuite_out_of_sync=excluded.churchsuite_out_of_sync,
       churchsuite_out_of_sync_reason=excluded.churchsuite_out_of_sync_reason,
       updated_at=datetime('now')`
  ).bind(
    String(service.id),
    String(service.title || "Service"),
    String(service.dateISO || ""),
    String(service.date || ""),
    String(service.theme || "Default"),
    service.published ? 1 : 0,
    String(service.kind || "regular"),
    service.kind === "event" ? null : (service.serviceTypeId || null),
    service.kind === "event" ? "One-off services" : (service.serviceTypeName || service.title || "Regular service"),
    service.downloadedForDeviceAt || null,
    service.downloadedSnapshot || null,
    service.lastEditedAt || null,
    service.lastEditedBy || null,
    service.lastEditedAction || null,
    service.churchSuitePlanId ?? null,
    service.churchSuitePlanIdentifier || null,
    service.churchSuitePlanUrl || null,
    service.churchSuiteLastUpdated || null,
    service.churchSuiteLastSynced || null,
    service.churchSuiteImportMode || null,
    service.churchSuiteOutOfSync ? 1 : 0,
    service.churchSuiteOutOfSyncReason || null
  ).run();
}

async function claimServiceRevision(env: Cloudflare.Env, serviceId: string, baseRevision: unknown) {
  const expected=Number(baseRevision);
  if (!(await hasServiceRevisionColumn(env))) {
    // Backward-compatible rescue path for deployments where migration 0021 has
    // not yet been applied. Saves continue with pre-1.76.51 behaviour until the
    // normal migration is applied, after which revision conflict protection is
    // enabled automatically.
    return {ok:true,revision:Number.isFinite(expected)?expected:0};
  }
  if(!Number.isFinite(expected)) return {ok:false,status:400,error:"Missing service revision."};
  const result=await env.DB.prepare(
    `UPDATE services SET revision=revision+1 WHERE id=? AND revision=?`
  ).bind(serviceId,expected).run();
  if(Number(result.meta?.changes||0)!==1){
    const row=await env.DB.prepare(
      `SELECT revision,last_edited_at,last_edited_by,last_edited_action FROM services WHERE id=?`
    ).bind(serviceId).first<any>();
    if(!row)return {ok:false,status:404,error:"Service not found."};
    return {ok:false,status:409,error:"This service has changed on another device.",revision:Number(row.revision||0),lastEditedAt:row.last_edited_at||null,lastEditedBy:row.last_edited_by||null,lastEditedAction:row.last_edited_action||null};
  }
  return {ok:true,revision:expected+1};
}

async function upsertItem(env: Cloudflare.Env, serviceId: string, item: any) {
  const positionRow = await env.DB.prepare(
    "SELECT COALESCE(MAX(position),-1)+1 AS next_position FROM service_items WHERE service_id=?"
  ).bind(serviceId).first<{ next_position: number }>();

  await env.DB.prepare(
    `INSERT INTO service_items(id,service_id,position,item_json,updated_at)
     VALUES (?,?,?,?,datetime('now'))
     ON CONFLICT(id,service_id) DO UPDATE SET
       item_json=excluded.item_json,
       updated_at=datetime('now')`
  ).bind(
    String(item.id),
    serviceId,
    Number(positionRow?.next_position ?? 0),
    JSON.stringify(item)
  ).run();
}


const OPENLP_VERSION = "3.1.7";
const OPENLP_SERVICE_FILE_VERSION = 3;

function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function baseHeader(
  name: string,
  plugin: string,
  title: string,
  type: number,
  capabilities: number[]
) {
  return {
    name,
    plugin,
    theme: plugin === "songs" ? null : -1,
    title,
    footer: [],
    type,
    audit: "",
    notes: "",
    from_plugin: false,
    capabilities,
    search: "",
    data: "",
    xml_version: null,
    auto_play_slides_once: false,
    auto_play_slides_loop: false,
    timed_slide_interval: 0,
    start_time: 0,
    end_time: 0,
    media_length: 0,
    background_audio: [],
    theme_overwritten: false,
    will_auto_start: false,
    processor: null,
    metadata: [],
    sha256_file_hash: null,
    stored_filename: null
  } as any;
}

type LibrarySong = {
  id: number | string;
  title: string;
  alternateTitle?: string;
  verseOrder?: string;
  copyright?: string;
  ccliNumber?: string;
  authors?: string[];
  sections?: Array<{ key: string; type?: string; label?: string; text: string }>;
};

type MediaRow = {
  id: string;
  service_id: string;
  item_id: string;
  r2_key: string;
  original_name: string;
  content_type: string | null;
  byte_size: number | null;
  sha256: string | null;
};

async function loadSongLibrary(request: Request, env: Cloudflare.Env): Promise<LibrarySong[]> {
  await ensureSongsSeeded(request, env);
  const rows = await env.DB.prepare(
    `SELECT id,title,alternate_title,authors_json,sections_json,verse_order,music_note,copyright,ccli_number,comments,theme_name
     FROM songs ORDER BY title COLLATE NOCASE`
  ).all<any>();

  return rows.results.map(row => ({
    id: row.id,
    title: row.title,
    alternateTitle: row.alternate_title || "",
    authors: safeJson(row.authors_json, []),
    sections: safeJson(row.sections_json, []),
    verseOrder: row.verse_order || "",
    musicNote: row.music_note || "",
    copyright: row.copyright || "",
    ccliNumber: row.ccli_number || "",
    comments: row.comments || "",
    themeName: row.theme_name || ""
  }));
}

async function getServiceForExport(env: Cloudflare.Env, serviceId: string) {
  const service = await env.DB.prepare(
    `SELECT id,title,date_iso,date_display,theme,published,kind,
            downloaded_for_device_at,downloaded_snapshot
     FROM services WHERE id=?`
  ).bind(serviceId).first<any>();

  if (!service) return null;

  const itemRows = await env.DB.prepare(
    `SELECT id,position,item_json
     FROM service_items
     WHERE service_id=?
     ORDER BY position`
  ).bind(serviceId).all<any>();

  const mediaRows = await env.DB.prepare(
    `SELECT id,service_id,item_id,r2_key,original_name,content_type,byte_size,sha256
     FROM media_assets
     WHERE service_id=?
     ORDER BY created_at,id`
  ).bind(serviceId).all<MediaRow>();

  return {
    ...service,
    items: itemRows.results.map(row => ({
      rowId: String(row.id),
      position: Number(row.position),
      item: safeJson<any>(row.item_json, {})
    })),
    media: mediaRows.results
  };
}

function serviceSnapshotForExport(service: any): string {
  return JSON.stringify({
    title: service.title,
    dateISO: service.date_iso,
    theme: service.theme,
    items: service.items.map((x: any) => x.item)
  });
}

function fileExtension(name: string): string {
  const match = name.match(/(\.[A-Za-z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}
function openlyrics(song: LibrarySong, order: string): string {
  const props: string[] = [];
  props.push(`<titles><title>${xmlEscape(song.title)}</title></titles>`);
  if (order) props.push(`<verseOrder>${xmlEscape(order)}</verseOrder>`);
  if (song.ccliNumber) props.push(`<ccliNo>${xmlEscape(song.ccliNumber)}</ccliNo>`);
  if (song.authors?.length) {
    props.push(`<authors>${song.authors.map(a => `<author>${xmlEscape(a)}</author>`).join("")}</authors>`);
  }

  const lyrics = (song.sections || []).map(section => {
    const lines = String(section.text || "")
      .split(/\r?\n/)
      .map(line => xmlEscape(line))
      .join("<br/>");
    return `<verse name="${xmlEscape(section.key)}"><lines>${lines}</lines></verse>`;
  });

  return `<?xml version='1.0' encoding='UTF-8'?>\n` +
    `<song xmlns="http://openlyrics.info/namespace/2009/song" version="0.8" ` +
    `createdIn="OpenLP ${OPENLP_VERSION}" modifiedIn="OpenLP ${OPENLP_VERSION}">` +
    `<properties>${props.join("")}</properties><lyrics>${lyrics.join("")}</lyrics></song>`;
}

function songServiceItem(item: any, song: LibrarySong) {
  const availableSections = song.sections || [];
  const order = String(
    item.verse ||
    song.verseOrder ||
    availableSections.map(section => section.key).join(" ")
  ).trim();
  const byKey = new Map(availableSections.map(s => [String(s.key).toLowerCase(), s]));
  const authorText = (song.authors || []).join(", ");
  const header = baseHeader("songs", "songs", song.title, 1, [2,1,5,8,9,13,22]);

  const footer: string[] = [song.title];
  if (authorText) footer.push(`Written by: ${authorText}`);
  if (song.copyright) footer.push(song.copyright);

  header.footer = footer;
  header.audit = [song.title, song.authors || [], song.copyright || "", song.ccliNumber || ""];
  header.data = {
    title: song.title.toLowerCase(),
    alternate_title: song.alternateTitle || "",
    authors: authorText,
    ccli_number: song.ccliNumber || "",
    copyright: song.copyright || ""
  };
  header.xml_version = openlyrics(song, order);

  const data = [];
  for (const tag of order.split(/\s+/).filter(Boolean)) {
    const section = byKey.get(tag.toLowerCase());
    if (!section) continue;
    const raw = String(section.text || "");
    data.push({
      title: raw.replace(/\r?\n/g, " ").slice(0, 30),
      raw_slide: raw,
      verseTag: tag.toUpperCase()
    });
  }

  if (!data.length) {
    for (const section of availableSections) {
      const raw = String(section.text || "");
      data.push({
        title: raw.replace(/\r?\n/g, " ").slice(0, 30),
        raw_slide: raw,
        verseTag: String(section.key || "").toUpperCase()
      });
    }
  }

  return { serviceitem: { header, data } };
}

function mediaForItem(exportData: any, item: any): MediaRow[] {
  const all = exportData.media as MediaRow[];
  const explicit = Array.isArray(item.media) ? item.media.map((m: any) => String(m.id)) : [];
  if (explicit.length) {
    const byId = new Map(all.map(m => [String(m.id), m]));
    return explicit.map((id: string) => byId.get(id)).filter(Boolean) as MediaRow[];
  }
  return all.filter(m => String(m.item_id) === String(item.id));
}

function imageServiceItem(item: any, media: MediaRow[]) {
  const title = String(item.title || "Images");
  const header = baseHeader("images", "images", title, 2, [3,1,5,6,17,21,26]);
  const mode = String(item.autoplay || "off");
  header.auto_play_slides_once = mode === "once";
  header.auto_play_slides_loop = mode === "loop";
  header.timed_slide_interval = Number(item.interval || 0);

  const data = media.map((m, index) => {
    const hash = String(m.sha256 || "");
    const stored = `${hash}${fileExtension(m.original_name)}`;
    return {
      // Keep the planner-selected ordering visible to OpenLP without changing
      // the archive filename that OpenLP resolves via file_hash.
      title: `${String(index + 1).padStart(3, "0")}-${m.original_name}`,
      image: {
        parts: ["images", "thumbnails", stored],
        json_meta: { class: "Path", version: 1 }
      },
      file_hash: hash
    };
  });

  return { serviceitem: { header, data } };
}

function videoServiceItem(item: any, media: MediaRow[]) {
  const m = media[0];
  const hash = String(m.sha256 || "");
  const stored = `${hash}${fileExtension(m.original_name)}`;
  const header = baseHeader("media", "media", m.original_name, 3, [12,16,17,4]);
  header.will_auto_start = item.autoStart !== false;
  header.processor = "vlc";
  header.media_length = 0;
  header.sha256_file_hash = hash;
  header.stored_filename = stored;

  const data = [{
    title: m.original_name,
    image: "clapperboard",
    path: ".",
    display_title: null,
    notes: null
  }];

  return { serviceitem: { header, data } };
}


function bibleServiceItem(item: any) {
  const passage = String(item.passage || item.title || "Bible Reading").trim();
  const version = String(item.bibleVersion || "").trim();
  const raw = String(item.bibleText || "").trim();
  const title = version ? `${passage} (${version})` : passage;
  const header = baseHeader("bibles", "bibles", title, 1, [14,1,5,17]);
  header.footer = [passage, version].filter(Boolean);
  header.data = {
    bibles: version ? [{ version, copyright: "", permissions: "" }] : []
  };
  return {
    serviceitem: {
      header,
      data: [{
        title: raw.replace(/\r?\n/g, " ").slice(0, 30),
        raw_slide: raw,
        verseTag: "1"
      }]
    }
  };
}

function countPdfPages(bytes: Uint8Array): number {
  const needle = [47,84,121,112,101,32,47,80,97,103,101]; // "/Type /Page"
  let count = 0;
  for (let i = 0; i <= bytes.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i+j] !== needle[j]) { match = false; break; }
    }
    if (!match) continue;
    const next = bytes[i + needle.length];
    // Avoid counting "/Type /Pages"
    if (next !== 115) count++;
  }
  return Math.max(1, count);
}

async function pdfSlideCount(env: Cloudflare.Env, media: MediaRow[]): Promise<number> {
  if (!media.length) return 0;
  const object = await env.MEDIA.get(media[0].r2_key);
  if (!object) return 0;
  return countPdfPages(new Uint8Array(await object.arrayBuffer()));
}

function pdfServiceItem(item: any, media: MediaRow[], slideCount: number) {
  const m = media[0];
  const hash = String(m.sha256 || "");
  const stored = `${hash}${fileExtension(m.original_name)}`;
  const header = baseHeader("presentations", "presentations", m.original_name, 3, [17,10]);
  header.processor = "Pdf";
  header.sha256_file_hash = hash;
  header.stored_filename = stored;

  const data = Array.from({ length: Math.max(1, slideCount) }, (_, i) => ({
    title: `${i + 1}`,
    image: "presentation",
    command: `${i + 1}`,
    path: ".",
    display_title: null,
    notes: null
  }));

  return { serviceitem: { header, data } };
}

async function validateExport(
  request: Request,
  env: Cloudflare.Env,
  exportData: any
): Promise<{ errors: string[]; warnings: string[]; songs: LibrarySong[]; skipItemIds: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const skipItemIds: string[] = [];
  const songs = await loadSongLibrary(request, env);
  const songsById = new Map(songs.map(s => [String(s.id), s]));
  const songsByTitle = new Map(songs.map(s => [String(s.title).toLowerCase(), s]));

  for (const wrapped of exportData.items) {
    const item = wrapped.item;
    if (!item?.projected) continue;

    if (item.type === "song") {
      const song =
        songsById.get(String(item.songId ?? "")) ||
        songsByTitle.get(String(item.title || "").toLowerCase()) ||
        (item.serviceSong && Array.isArray(item.serviceSong.sections) ? item.serviceSong : null);
      if (!song) errors.push(`Song content is not available locally or in the shared library: ${item.title || "Untitled song"}.`);
      continue;
    }

    if (item.type === "images" || item.type === "sermon-images") {
      const media = mediaForItem(exportData, item);
      if (!media.length) {
        errors.push(`${item.title || "Image presentation"} has no uploaded images.`);
        skipItemIds.push(String(item.id));
      }
      continue;
    }

    if (item.type === "video") {
      const media = mediaForItem(exportData, item);
      if (!media.length) {
        errors.push(`${item.title || "Video"} has no uploaded video.`);
        skipItemIds.push(String(item.id));
      } else if (media.length > 1) {
        warnings.push(`${item.title || "Video"} has more than one media file; only the first will be exported.`);
      }
      continue;
    }

    if (item.type === "bible") {
      if (!String(item.passage || "").trim() || !String(item.bibleText || "").trim()) {
        errors.push(`${item.title || "Bible Reading"} needs both a passage reference and passage text.`);
        skipItemIds.push(String(item.id));
      }
      continue;
    }

    if (item.type === "pdf") {
      const media = mediaForItem(exportData, item);
      if (!media.length) {
        errors.push(`${item.title || "PDF presentation"} has no converted page images.`);
        skipItemIds.push(String(item.id));
      }
      continue;
    }

    if (item.type === "text") continue;

    errors.push(`${item.title || "Projected item"} uses ${item.type || "an unknown type"}, which is not yet supported by the OpenLP exporter.`);
    skipItemIds.push(String(item.id));
  }

  for (const media of exportData.media as MediaRow[]) {
    const object = await env.MEDIA.head(media.r2_key);
    if (!object) errors.push(`Uploaded media is missing from R2: ${media.original_name}.`);
  }

  return { errors, warnings, songs, skipItemIds };
}

async function pipeR2ObjectToZip(
  env: Cloudflare.Env,
  zip: Zip,
  entryName: string,
  key: string
) {
  const object = await env.MEDIA.get(key);
  if (!object) throw new Error(`R2 object missing: ${key}`);

  const entry = new ZipPassThrough(entryName);
  zip.add(entry);

  const reader = object.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value?.byteLength) entry.push(value, false);
  }
  entry.push(new Uint8Array(0), true);
}

async function streamOpenLpZip(
  request: Request,
  env: Cloudflare.Env,
  exportData: any,
  songs: LibrarySong[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  skipItemIds: Set<string> = new Set()
) {
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      controller.error(err);
      return;
    }
    if (chunk?.byteLength) controller.enqueue(chunk);
    if (final) controller.close();
  });

  try {
    const songsById = new Map(songs.map(s => [String(s.id), s]));
    const songsByTitle = new Map(songs.map(s => [String(s.title).toLowerCase(), s]));
    const serviceData: any[] = [{
      openlp_core: {
        "lite-service": false,
        "service-theme": exportData.theme === "Default" ? "" : String(exportData.theme || ""),
        "openlp-servicefile-version": OPENLP_SERVICE_FILE_VERSION
      }
    }];

    const filesToWrite: Array<{ entryName: string; key: string }> = [];
    const addedEntries = new Set<string>();

    for (const wrapped of exportData.items) {
      const item = wrapped.item;
      if (!item?.projected || item.type === "text") continue;
      if (skipItemIds.has(String(item.id))) continue;

      if (item.type === "song") {
        const song =
          songsById.get(String(item.songId ?? "")) ||
          songsByTitle.get(String(item.title || "").toLowerCase()) ||
          (item.serviceSong && Array.isArray(item.serviceSong.sections) ? item.serviceSong : null);
        if (song) serviceData.push(songServiceItem(item, song));
        continue;
      }

      if (item.type === "images" || item.type === "sermon-images") {
        const media = mediaForItem(exportData, item);
        serviceData.push(imageServiceItem(item, media));

        for (let mediaIndex = 0; mediaIndex < media.length; mediaIndex++) {
          const m = media[mediaIndex];
          const stored = `${m.sha256}${fileExtension(m.original_name)}`;
          if (!addedEntries.has(stored)) {
            filesToWrite.push({ entryName: stored, key: m.r2_key });
            addedEntries.add(stored);
          }
          const thumb = `thumbnails/${stored}`;
          if (!addedEntries.has(thumb)) {
            filesToWrite.push({ entryName: thumb, key: m.r2_key });
            addedEntries.add(thumb);
          }
        }
        continue;
      }

      if (item.type === "video") {
        const media = mediaForItem(exportData, item);
        if (!media.length) continue;
        serviceData.push(videoServiceItem(item, media));
        const m = media[0];
        const stored = `${m.sha256}${fileExtension(m.original_name)}`;
        if (!addedEntries.has(stored)) {
          filesToWrite.push({ entryName: stored, key: m.r2_key });
          addedEntries.add(stored);
        }
      }

      if (item.type === "bible") {
        serviceData.push(bibleServiceItem(item));
        continue;
      }

      if (item.type === "pdf") {
        const media = mediaForItem(exportData, item);
        if (!media.length) continue;
        serviceData.push(imageServiceItem(item, media));
        for (let mediaIndex = 0; mediaIndex < media.length; mediaIndex++) {
          const m = media[mediaIndex];
          const stored = `${m.sha256}${fileExtension(m.original_name)}`;
          if (!addedEntries.has(stored)) {
            filesToWrite.push({ entryName: stored, key: m.r2_key });
            addedEntries.add(stored);
          }
          const thumb = `thumbnails/${stored}`;
          if (!addedEntries.has(thumb)) {
            filesToWrite.push({ entryName: thumb, key: m.r2_key });
            addedEntries.add(thumb);
          }
        }
        continue;
      }
    }

    // Match the successful OpenLP prototype: media first is fine, then service_data.osj.
    for (const file of filesToWrite) {
      await pipeR2ObjectToZip(env, zip, file.entryName, file.key);
    }

    const serviceEntry = new ZipDeflate("service_data.osj", { level: 6 });
    zip.add(serviceEntry);
    serviceEntry.push(strToU8(JSON.stringify(serviceData)), true);
    zip.end();
  } catch (err) {
    controller.error(err);
  }
}

function safeDownloadName(exportData: any): string {
  const base = `${exportData.date_iso || "service"}-${exportData.title || "service"}`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "openlp-service"}.osz`;
}


async function ensureSongsSeeded(request: Request, env: Cloudflare.Env) {
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM songs").first<{ count: number }>();
  if ((count?.count || 0) > 0) return;

  const response = await env.ASSETS.fetch(new Request(new URL("/songs.json", request.url).toString()));
  if (!response.ok) return;
  const bundled = await response.json<any[]>();
  if (!Array.isArray(bundled) || !bundled.length) return;

  const batch = bundled.map(song =>
    env.DB.prepare(
      `INSERT OR IGNORE INTO songs
       (id,title,alternate_title,authors_json,sections_json,verse_order,music_note,copyright,ccli_number,comments,theme_name,source,classifications_json,updated_at,updated_by)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),?)`
    ).bind(
      String(song.id),
      String(song.title || "Untitled"),
      String(song.alternateTitle || ""),
      JSON.stringify(song.authors || []),
      JSON.stringify(song.sections || []),
      String(song.verseOrder || ""),
      String(song.musicNote || ""),
      String(song.copyright || ""),
      String(song.ccliNumber || ""),
      String(song.comments || ""),
      String(song.themeName || ""),
      "openlp",
      JSON.stringify(["uncategorised"]),
      "Initial import"
    )
  );

  // D1 batch size can be large; chunk to be safe.
  for (let i = 0; i < batch.length; i += 50) {
    await env.DB.batch(batch.slice(i, i + 50));
  }
}


type SongClassificationItem={id:string;name:string};
type SongClassificationGroup={
  id:string;
  name:string;
  rule:"exactly-one"|"one-or-more"|"zero-or-more";
  defaultId:string;
  items:SongClassificationItem[];
};

const DEFAULT_SONG_CLASSIFICATION_GROUPS:SongClassificationGroup[]=[
  {id:"collection",name:"Collection",rule:"one-or-more",defaultId:"uncategorised",
   items:[{id:"core",name:"Core"},{id:"new",name:"New"},{id:"timeless",name:"Timeless"},{id:"uncategorised",name:"Uncategorised"}]},
  {id:"review",name:"Review",rule:"zero-or-more",defaultId:"",
   items:[{id:"drop-this-song",name:"Drop this song"},{id:"try-in-future",name:"Try in the future"}]},
  {id:"service-position",name:"Service position",rule:"zero-or-more",defaultId:"",
   items:[{id:"opener",name:"Opener"},{id:"closer",name:"Closer"}]}
];

function songClassSlug(value:string){
  return String(value||"classification").trim().toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"classification";
}
function cleanSongClassificationGroups(value:any):SongClassificationGroup[]{
  const groups:SongClassificationGroup[]=[];
  const usedGroups=new Set<string>();
  const usedItems=new Set<string>();
  for(const raw of Array.isArray(value)?value:[]){
    const name=String(raw?.name||"").trim();
    if(!name)continue;
    let id=songClassSlug(raw?.id||name),n=2;
    while(usedGroups.has(id))id=`${songClassSlug(name)}-${n++}`;
    usedGroups.add(id);
    const rule=["exactly-one","one-or-more","zero-or-more"].includes(String(raw?.rule))
      ? String(raw.rule) as SongClassificationGroup["rule"] : "zero-or-more";
    const items:SongClassificationItem[]=[];
    for(const source of Array.isArray(raw?.items)?raw.items:[]){
      const itemName=String(source?.name||"").trim();
      if(!itemName)continue;
      let itemId=songClassSlug(source?.id||itemName),k=2;
      while(usedItems.has(itemId))itemId=`${songClassSlug(itemName)}-${k++}`;
      usedItems.add(itemId);
      items.push({id:itemId,name:itemName});
    }
    if(!items.length)continue;
    let defaultId=String(raw?.defaultId||"");
    const ids=new Set(items.map(x=>x.id));
    if(!ids.has(defaultId))defaultId="";
    if(rule!=="zero-or-more"&&!defaultId)defaultId=items[0].id;
    if(rule==="zero-or-more")defaultId="";
    groups.push({id,name,rule,defaultId,items});
  }
  return groups.length?groups:structuredClone(DEFAULT_SONG_CLASSIFICATION_GROUPS);
}
async function songClassificationGroups(env:Cloudflare.Env){
  return cleanSongClassificationGroups(
    await plannerSetting(env,"songClassificationGroups",DEFAULT_SONG_CLASSIFICATION_GROUPS)
  );
}
function normalizeSongClassificationSelection(value:any,groups:SongClassificationGroup[]){
  const selected=new Set((Array.isArray(value)?value:[]).map(String));
  const out:string[]=[];
  for(const group of groups){
    const valid=group.items.map(x=>x.id).filter(id=>selected.has(id));
    if(group.rule==="exactly-one"){
      out.push(valid[0]||group.defaultId||group.items[0]?.id);
    }else if(group.rule==="one-or-more"){
      if(valid.length)out.push(...valid);
      else out.push(group.defaultId||group.items[0]?.id);
    }else{
      out.push(...valid);
    }
  }
  return [...new Set(out.filter(Boolean))];
}
async function normalizeAllSongClassifications(env:Cloudflare.Env){
  const groups=await songClassificationGroups(env);
  const rows=await env.DB.prepare("SELECT id,classifications_json FROM songs").all<any>();
  const statements=rows.results.map(row=>
    env.DB.prepare("UPDATE songs SET classifications_json=?,updated_at=datetime('now') WHERE id=?")
      .bind(JSON.stringify(normalizeSongClassificationSelection(safeJson(row.classifications_json,[]),groups)),String(row.id))
  );
  for(let i=0;i<statements.length;i+=50)await env.DB.batch(statements.slice(i,i+50));
}

function songRowToJson(row: any) {
  return {
    id: row.id,
    title: row.title,
    alternateTitle: row.alternate_title || "",
    authors: safeJson(row.authors_json, []),
    sections: safeJson(row.sections_json, []),
    verseOrder: row.verse_order || "",
    musicNote: row.music_note || "",
    copyright: row.copyright || "",
    ccliNumber: row.ccli_number || "",
    comments: row.comments || "",
    themeName: row.theme_name || "",
    source: row.source || "openlp",
    classifications: safeJson(row.classifications_json, []),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  };
}


async function getSongJson(env: Cloudflare.Env, songId: string) {
  const row = await env.DB.prepare("SELECT * FROM songs WHERE id=?").bind(songId).first<any>();
  return row ? songRowToJson(row) : null;
}

async function saveSongRevision(env: Cloudflare.Env, songId: string, actor: string) {
  const current = await getSongJson(env, songId);
  if (!current) return false;

  await env.DB.prepare(
    `INSERT INTO song_revisions(song_id,song_json,saved_at,saved_by)
     VALUES(?,?,datetime('now'),?)`
  ).bind(songId, JSON.stringify(current), actor || "Unknown").run();

  await env.DB.prepare(
    `DELETE FROM song_revisions
     WHERE song_id=? AND id NOT IN (
       SELECT id FROM song_revisions WHERE song_id=? ORDER BY id DESC LIMIT 20
     )`
  ).bind(songId, songId).run();
  return true;
}

async function upsertSong(env: Cloudflare.Env, song: any, actor: string, saveRevision = true) {
  const songId = String(song.id);
  const classifications=normalizeSongClassificationSelection(
    song.classifications,
    await songClassificationGroups(env)
  );
  if (saveRevision) {
    const existing = await env.DB.prepare("SELECT id FROM songs WHERE id=?").bind(songId).first<any>();
    if (existing) await saveSongRevision(env, songId, actor);
  }
  await env.DB.prepare(
    `INSERT INTO songs
     (id,title,alternate_title,authors_json,sections_json,verse_order,music_note,copyright,ccli_number,comments,theme_name,source,classifications_json,updated_at,updated_by)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),?)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title,
       alternate_title=excluded.alternate_title,
       authors_json=excluded.authors_json,
       sections_json=excluded.sections_json,
       verse_order=excluded.verse_order,
       music_note=excluded.music_note,
       copyright=excluded.copyright,
       ccli_number=excluded.ccli_number,
       comments=excluded.comments,
       theme_name=excluded.theme_name,
       source=excluded.source,
       classifications_json=excluded.classifications_json,
       updated_at=datetime('now'),
       updated_by=excluded.updated_by`
  ).bind(
    String(song.id),
    String(song.title || "Untitled"),
    String(song.alternateTitle || ""),
    JSON.stringify(song.authors || []),
    JSON.stringify(song.sections || []),
    String(song.verseOrder || ""),
    String(song.musicNote || ""),
    String(song.copyright || ""),
    String(song.ccliNumber || ""),
    String(song.comments || ""),
    String(song.themeName || ""),
    String(song.source || "planner"),
    JSON.stringify(classifications),
    actor || "Unknown"
  ).run();
}


function friendlyNameFromEmail(email: string): string {
  const local = email.split("@")[0] || "Editor";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

async function getRequestUser(request: Request, env: Cloudflare.Env) {
  return requireAuthUser(request,env);
}

let churchSuiteTokenCache: { token: string; expiresAt: number } | null = null;

function churchSuiteSecrets(env: Cloudflare.Env) {
  const e = env as any;
  return {
    clientId: String(e.CHURCHSUITE_CLIENT_ID || ""),
    clientSecret: String(e.CHURCHSUITE_CLIENT_SECRET || "")
  };
}

async function getChurchSuiteToken(env: Cloudflare.Env): Promise<string> {
  const now = Date.now();
  if (churchSuiteTokenCache && churchSuiteTokenCache.expiresAt > now + 60_000) {
    return churchSuiteTokenCache.token;
  }

  const { clientId, clientSecret } = churchSuiteSecrets(env);
  if (!clientId || !clientSecret) {
    throw new Error("ChurchSuite credentials are not configured in Cloudflare.");
  }

  const basic = btoa(`${clientId}:${clientSecret}`);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "planning.read"
  });

  const response = await fetch("https://login.churchsuite.com/oauth2/token", {
    method: "POST",
    headers: {
      "authorization": `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
      "accept": "application/json"
    },
    body
  });

  const payload = await response.json<any>().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    const message = payload?.error_description || payload?.error || `HTTP ${response.status}`;
    throw new Error(`ChurchSuite authentication failed: ${message}`);
  }

  const expiresIn = Number(payload.expires_in || 3600);
  churchSuiteTokenCache = {
    token: String(payload.access_token),
    expiresAt: now + expiresIn * 1000
  };
  return churchSuiteTokenCache.token;
}

async function churchSuiteFetch(env: Cloudflare.Env, path: string) {
  const token = await getChurchSuiteToken(env);
  const response = await fetch(`https://api.churchsuite.com/v2${path}`, {
    headers: {
      "authorization": `Bearer ${token}`,
      "accept": "application/json"
    }
  });

  const payload = await response.json<any>().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    throw new Error(`ChurchSuite API: ${message}`);
  }
  return payload;
}

async function churchSuiteListAll(env: Cloudflare.Env, path: string) {
  const separator = path.includes("?") ? "&" : "?";
  let page = 1;
  const out: any[] = [];

  while (page <= 100) {
    const payload = await churchSuiteFetch(env, `${path}${separator}page=${page}&per_page=250`);
    out.push(...(Array.isArray(payload?.data) ? payload.data : []));
    const next = payload?.pagination?.next_page;
    if (!next) break;
    page = Number(next);
  }
  return out;
}

function churchSuiteIdentifierFromUrl(value: string) {
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith(".churchsuite.com")) return "";
    const match = url.pathname.match(/\/-\/plans\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

async function churchSuiteResolvePlan(env: Cloudflare.Env, identifier: string) {
  if (!identifier) throw new Error("The ChurchSuite Plan Page URL does not contain a plan identifier.");
  const plans = await churchSuiteListAll(env, "/planning/plans?status=published");
  const plan = plans.find((p: any) => String(p.identifier || "") === identifier);
  if (!plan) throw new Error("That published ChurchSuite plan was not found through the API.");
  return plan;
}

function churchSuitePassageField(questionResponses: any) {
  if (!Array.isArray(questionResponses)) return "";

  // Bible mapping deliberately uses only the ChurchSuite field/question named
  // "Passage". Do not infer a reference from the item title, reader, comments,
  // notes, or any other question response.
  const passageQuestion = questionResponses.find((q: any) =>
    !q?.hidden && String(q?.name || "").trim().toLowerCase() === "passage"
  );
  if (!passageQuestion) return "";

  const value = passageQuestion.value;

  if (passageQuestion?.response_type === "bible" && Array.isArray(value)) {
    return value.map((ref: any) => {
      const book = String(ref?.book || "").trim();
      const reference = String(ref?.reference || "").trim();
      const version = String(ref?.version || "").trim();
      const passage = [book, reference].filter(Boolean).join(" ").trim();
      return [passage, version ? `(${version})` : ""].filter(Boolean).join(" ").trim();
    }).filter(Boolean).join("; ");
  }

  if (typeof value === "string") return value.trim();

  if (Array.isArray(value) && value.every((x: any) => typeof x === "string")) {
    return value.map((x: string) => x.trim()).filter(Boolean).join("; ");
  }

  return "";
}

function churchSuiteQuestionText(questionResponses: any) {
  if (!Array.isArray(questionResponses)) return "";
  const parts: string[] = [];

  for (const q of questionResponses) {
    if (q?.hidden) continue;
    const value = q?.value;
    if (q?.response_type === "bible" && Array.isArray(value)) {
      for (const ref of value) {
        const book = String(ref?.book || "").trim();
        const reference = String(ref?.reference || "").trim();
        const version = String(ref?.version || "").trim();
        const text = [book && `${book} ${reference}`.trim(), version && `(${version})`].filter(Boolean).join(" ");
        if (text) parts.push(text);
      }
    } else if (typeof value === "string" && value.trim()) {
      parts.push(`${q?.name ? `${q.name}: ` : ""}${value.trim()}`);
    } else if (Array.isArray(value) && value.length && value.every((x: any) => typeof x === "string")) {
      parts.push(`${q?.name ? `${q.name}: ` : ""}${value.join(", ")}`);
    }
  }
  return parts.join(" · ");
}

function churchSuitePlanItemPeople(item: any) {
  if (!Array.isArray(item?.people)) return [];
  return item.people
    .map((person: any) => {
      const first = String(person?.first_name || "").trim();
      const last = String(person?.last_name || "").trim();
      const name = [first,last].filter(Boolean).join(" ").trim();
      if (!name) return null;
      return {
        id: person?.id ?? null,
        type: String(person?.type || ""),
        firstName: first,
        lastName: last,
        name
      };
    })
    .filter(Boolean);
}


function churchSuitePlanItemDetails(item: any) {
  const pieces: string[] = [];
  if (item?.comment) pieces.push(String(item.comment));
  if (Array.isArray(item?.notes)) {
    for (const note of item.notes) {
      if (note?.note) pieces.push(`${note?.name ? `${note.name}: ` : ""}${note.note}`);
    }
  }
  const questions = churchSuiteQuestionText(item?.question_responses);
  if (questions) pieces.push(questions);
  return pieces.filter(Boolean).join(" · ");
}

async function churchSuiteBuildPlan(env: Cloudflare.Env, plan: any) {
  const planId = Number(plan.id);
  const allowPeople = await plannerSetting(env,"churchSuiteImportPeopleEnabled",false);
  const [itemsPayload, types] = await Promise.all([
    churchSuiteFetch(env, `/planning/plan_items?plan_ids[]=${planId}&per_page=250`),
    churchSuiteListAll(env, "/planning/types")
  ]);

  const typeMap = new Map<number, string>(
    types.map((t: any) => [Number(t.id), String(t.name || "")])
  );

  const planItems = (Array.isArray(itemsPayload?.data) ? itemsPayload.data : [])
    .slice()
    .sort((a: any, b: any) => Number(a.order || 0) - Number(b.order || 0));

  const arrangementCache = new Map<number, any>();
  const songCache = new Map<number, any>();
  const resultItems: any[] = [];

  for (const item of planItems) {
    if (String(item?.type || "").toLowerCase() === "song") {
      // Every ChurchSuite song plan item must reach the browser as a song.
      // The arrangement enriches the item when present, but it must not be a
      // prerequisite: templates consume these song entries positionally.
      const arrangementId = Number(
        item?.arrangement_id ||
        item?.song_arrangement_id ||
        item?.arrangement?.id ||
        0
      ) || null;

      let arrangement: any = null;
      if (arrangementId) {
        arrangement = arrangementCache.get(arrangementId);
        if (!arrangement) {
          try {
            arrangement = (await churchSuiteFetch(env, `/planning/song_arrangements/${arrangementId}`))?.data;
            if (arrangement) arrangementCache.set(arrangementId, arrangement);
          } catch (_) {
            // Keep the song slot even if enrichment fails.
          }
        }
      }

      const directSongId = Number(item?.song_id || item?.song?.id || 0) || null;
      const songId = Number(arrangement?.song_id || directSongId || 0) || null;
      let song: any = null;
      if (songId) {
        song = songCache.get(songId);
        if (!song) {
          try {
            song = (await churchSuiteFetch(env, `/planning/songs/${songId}`))?.data;
            if (song) songCache.set(songId, song);
          } catch (_) {
            // The plan-item title is still enough to preserve the song slot.
          }
        }
      }

      resultItems.push({
        order: Number(item.order || resultItems.length + 1),
        sourceId: String(item.id),
        kind: "song",
        title: String(song?.name || arrangement?.name || item?.name || item?.title || "Song"),
        typeName: "Song",
        ccli: song?.ccli ?? item?.ccli ?? null,
        arrangementId,
        songId: song?.id ?? songId,
        details: "",
        people: allowPeople ? churchSuitePlanItemPeople(item) : []
      });
      continue;
    }

    resultItems.push({
      order: Number(item.order || resultItems.length + 1),
      sourceId: String(item.id),
      kind: "type",
      title: String(item?.name || typeMap.get(Number(item?.type_id)) || "Plan item"),
      typeName: typeMap.get(Number(item?.type_id)) || "",
      ccli: null,
      details: churchSuitePlanItemDetails(item),
      passage: churchSuitePassageField(item?.question_responses),
      people: allowPeople ? churchSuitePlanItemPeople(item) : []
    });
  }

  return {
    id: planId,
    identifier: String(plan.identifier || ""),
    title: String(plan.name || "ChurchSuite service"),
    dateISO: String(plan.date || ""),
    dateText: String(plan.date || ""),
    time: String(plan.time || ""),
    modifiedAt: String(plan.modified_at || ""),
    status: String(plan.status || ""),
    publicUrl: String(plan.public_url || plan.publicUrl || plan.url || ""),
    items: resultItems
  };
}


function cleanLibraryFolderName(value: any) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

async function createMediaLibraryFolder(env: Cloudflare.Env, mediaType: string, name: string) {
  const cleanName = cleanLibraryFolderName(name);
  if (!cleanName) throw new Error("Folder name is required.");
  const existing = await env.DB.prepare(
    "SELECT id,name FROM media_library_folders WHERE media_type=? AND name=? COLLATE NOCASE"
  ).bind(mediaType, cleanName).first<any>();
  if (existing) return existing;

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO media_library_folders(id,media_type,name,created_at,updated_at)
     VALUES(?,?,?,datetime('now'),datetime('now'))`
  ).bind(id, mediaType, cleanName).run();
  return { id, name: cleanName };
}

async function ensureServiceItemLibraryFolder(
  env: Cloudflare.Env,
  mediaType: string,
  baseName: string,
  dateLabel: string
) {
  const base = cleanLibraryFolderName(baseName) || "Stored media";
  const exact = await env.DB.prepare(
    "SELECT id,name FROM media_library_folders WHERE media_type=? AND name=? COLLATE NOCASE"
  ).bind(mediaType, base).first<any>();
  if (!exact) return createMediaLibraryFolder(env, mediaType, base);

  const datedName = dateLabel ? `${base} — ${cleanLibraryFolderName(dateLabel)}` : `${base} — Copy`;
  const dated = await env.DB.prepare(
    "SELECT id,name FROM media_library_folders WHERE media_type=? AND name=? COLLATE NOCASE"
  ).bind(mediaType, datedName).first<any>();
  if (dated) return dated;
  return createMediaLibraryFolder(env, mediaType, datedName);
}

async function deletePlannerServices(env:Cloudflare.Env,serviceIds:string[]){
  const ids=[...new Set(serviceIds.map(String).map(x=>x.trim()).filter(Boolean))];
  if(!ids.length)return {deleted:[],activeServiceId:null};

  // Remove non-retained service media from object storage first. Retained
  // library assets survive deletion and are detached from the deleted service.
  for(const serviceId of ids){
    const media=await env.DB.prepare(
      "SELECT r2_key FROM media_assets WHERE service_id=? AND retained=0"
    ).bind(serviceId).all<any>();
    for(const row of media.results||[]){
      try{await env.MEDIA.delete(String(row.r2_key))}catch(_){}
    }
  }

  const statements:any[]=[];
  for(const serviceId of ids){
    statements.push(
      env.DB.prepare("DELETE FROM media_assets WHERE service_id=? AND retained=0").bind(serviceId),
      env.DB.prepare("UPDATE media_assets SET service_id=NULL,item_id=NULL WHERE service_id=? AND retained=1").bind(serviceId),
      env.DB.prepare("DELETE FROM service_audit WHERE service_id=?").bind(serviceId),
      env.DB.prepare("DELETE FROM service_items WHERE service_id=?").bind(serviceId),
      env.DB.prepare("DELETE FROM services WHERE id=?").bind(serviceId)
    );
  }
  if(statements.length)await env.DB.batch(statements);

  // Verify the rows really disappeared instead of telling the browser a delete
  // succeeded while leaving D1 unchanged.
  for(const serviceId of ids){
    const row=await env.DB.prepare("SELECT id FROM services WHERE id=?").bind(serviceId).first<any>();
    if(row)throw new Error(`Service deletion did not complete for ${serviceId}.`);
  }

  const activeRow=await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key='activeServiceId'"
  ).first<any>();
  const activeId=safeJson(activeRow?.value_json??null,null as any);
  let nextActive=activeId && !ids.includes(String(activeId)) ? String(activeId) : "";

  if(!nextActive){
    const next=await env.DB.prepare(
      "SELECT id FROM services ORDER BY date_iso,title LIMIT 1"
    ).first<any>();
    nextActive=String(next?.id||"");
    await upsertSettings(env,{activeServiceId:nextActive||null});
  }

  return {deleted:ids,activeServiceId:nextActive||null};
}

async function handleApi(request: Request, env: Cloudflare.Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/health" && request.method === "GET") {
    return json({ ok: true });
  }


  if (path === "/api/churchsuite/status" && request.method === "GET") {
    const configured = !!(churchSuiteSecrets(env).clientId && churchSuiteSecrets(env).clientSecret);
    if (!configured) {
      return json({ configured: false, connected: false, message: "ChurchSuite credentials are not configured." });
    }

    try {
      await churchSuiteFetch(env, "/planning/types?per_page=1");
      return json({ configured: true, connected: true, message: "Connected to ChurchSuite Planning." });
    } catch (error: any) {
      return json({
        configured: true,
        connected: false,
        message: String(error?.message || error)
      });
    }
  }

  if (path === "/api/churchsuite/service-names" && request.method === "GET") {
    try {
      // Service mapping is deliberately based on the ChurchSuite plan name
      // exposed by the Planning API. This avoids relying on inferred wording
      // inside the planner while remaining compatible with the data v2 returns.
      const plans = await churchSuiteListAll(env, "/planning/plans?status=published");
      const names=[...new Set(
        plans.map((p:any)=>String(p.name||"").trim()).filter(Boolean)
      )].sort((a,b)=>a.localeCompare(b));
      return json({names});
    } catch (error:any) {
      return json({error:String(error?.message||error)},{status:502});
    }
  }

  if (path === "/api/churchsuite/plans" && request.method === "GET") {
    if(!(await churchSuitePlanningExtensionEnabled(env))){
      return json({error:"ChurchSuite extension is disabled."},{status:409});
    }

    try {
      const params = new URLSearchParams();
      params.set("status", "published");
      if (url.searchParams.get("starts_after")) params.set("starts_after", String(url.searchParams.get("starts_after")));
      if (url.searchParams.get("starts_before")) params.set("starts_before", String(url.searchParams.get("starts_before")));
      const plans = await churchSuiteListAll(env, `/planning/plans?${params.toString()}`);
      return json({
        plans: plans.map((p: any) => ({
          id: Number(p.id),
          identifier: String(p.identifier || ""),
          title: String(p.name || "ChurchSuite service"),
          dateISO: String(p.date || ""),
          time: String(p.time || ""),
          modifiedAt: String(p.modified_at || ""),
          status: String(p.status || "")
        }))
      });
    } catch (error: any) {
      return json({ error: String(error?.message || error) }, { status: 502 });
    }
  }

  if (path === "/api/churchsuite/song-library" && request.method === "GET") {
    if(!(await churchSuitePlanningExtensionEnabled(env))){
      return json({error:"ChurchSuite extension is disabled."},{status:409});
    }
    try{
      const rows=await churchSuiteListAll(env,"/planning/songs");
      const songs=rows.map((song:any)=>({
        id:song?.id??null,
        title:String(song?.name||song?.title||"").trim(),
        ccli:String(song?.ccli??song?.ccli_number??song?.ccliNumber??"").trim(),
        authors:Array.isArray(song?.authors)
          ?song.authors.map((a:any)=>String(a?.name||a||"").trim()).filter(Boolean)
          :String(song?.author||song?.authors_text||"").split(",").map((x:string)=>x.trim()).filter(Boolean),
        copyright:String(song?.copyright||"").trim()
      })).filter((song:any)=>song.title);
      return json({songs});
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:502});
    }
  }

  if (path === "/api/churchsuite/scan-plan" && request.method === "POST") {
    if(!(await churchSuitePlanningExtensionEnabled(env))){
      return json({error:"ChurchSuite extension is disabled."},{status:409});
    }

    const body = await request.json<any>();

    try {
      let plan: any = null;

      if (Number(body?.planId) > 0) {
        plan = (await churchSuiteFetch(env, `/planning/plans/${Number(body.planId)}`))?.data;
      } else {
        const identifier = churchSuiteIdentifierFromUrl(String(body?.url || ""));
        plan = await churchSuiteResolvePlan(env, identifier);
      }

      if (!plan?.id) {
        return json({ error: "ChurchSuite did not return a readable plan." }, { status: 404 });
      }

      const built = await churchSuiteBuildPlan(env, plan);
      return json({ plan: built });
    } catch (error: any) {
      return json({ error: String(error?.message || error) }, { status: 502 });
    }
  }




  if(path==="/api/admin/song-classifications" && request.method==="GET"){
    return json({groups:await songClassificationGroups(env)});
  }
  if(path==="/api/admin/song-classifications" && request.method==="PUT"){
    const body=await request.json<any>();
    const groups=cleanSongClassificationGroups(body.groups);
    await upsertSettings(env,{songClassificationGroups:groups});
    await normalizeAllSongClassifications(env);
    return json({ok:true,groups});
  }

  if (path === "/api/admin/users" && request.method === "GET") return json({
    users:await listUsers(env),
    churchSuiteServiceListAvailable:await churchSuiteServiceListAvailable(env),
    microsoftAllowedDomain:microsoftConfigStatus(env).allowedDomain,
    microsoftConfigured:microsoftConfigStatus(env).configured,
    microsoftSsoSignInEnabled:await plannerSetting(env,"microsoftSsoSignInEnabled",true),
    microsoftAutoEnrollDomainUsers:await plannerSetting(env,"microsoftAutoEnrollDomainUsers",true),
    myChurchSuiteConfigured:churchSuiteOAuthConfigStatus(env).configured,
    myChurchSuiteSignInEnabled:await plannerSetting(env,"myChurchSuiteSignInEnabled",false)
  });
  if (path === "/api/admin/users" && request.method === "POST") {
    try{
      const body=await request.json<any>();
      if(Number(body.accessLevel||1)===1 && !(await churchSuiteServiceListAvailable(env))){
        return json({error:"ChurchSuite Service list access is unavailable because ChurchSuite and Service List publishing are not both enabled."},{status:400});
      }
      await createLocalUser(env,body);
      return json({ok:true,users:await listUsers(env)})
    }
    catch(error:any){return json({error:String(error?.message||error)},{status:400})}
  }
  const managedUserMatch=path.match(/^\/api\/admin\/users\/([^/]+)$/);
  if(managedUserMatch && request.method === "PUT"){
    try{
      const me=await getRequestUser(request,env);
      const body=await request.json<any>();
      if(Number(body.accessLevel||1)===1 && !(await churchSuiteServiceListAvailable(env))){
        return json({error:"ChurchSuite Service list access is unavailable because ChurchSuite and Service List publishing are not both enabled."},{status:400});
      }
      await updateManagedUser(env,decodeURIComponent(managedUserMatch[1]),body,me.email);
      return json({ok:true,users:await listUsers(env)})
    }
    catch(error:any){return json({error:String(error?.message||error)},{status:400})}
  }
  if(managedUserMatch && request.method === "DELETE"){
    try{
      const me=await getRequestUser(request,env);
      const result=await deleteManagedUser(env,decodeURIComponent(managedUserMatch[1]),me.email);
      return json({...result,users:await listUsers(env)});
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:400});
    }
  }
  const managedPasswordMatch=path.match(/^\/api\/admin\/users\/([^/]+)\/password$/);
  if(managedPasswordMatch && request.method === "POST"){
    try{const body=await request.json<any>();await resetLocalUserPassword(env,decodeURIComponent(managedPasswordMatch[1]),String(body.password||""));return json({ok:true})}
    catch(error:any){return json({error:String(error?.message||error)},{status:400})}
  }

  if (path === "/api/me" && request.method === "GET") {
    return json({ user: await getRequestUser(request, env) });
  }

  if (path === "/api/me" && request.method === "PUT") {
    const user = await getRequestUser(request, env);
    const body = await request.json<any>();
    const displayName = String(body.displayName || user.displayName).trim() || user.displayName;
    await env.DB.prepare(
      "UPDATE users SET display_name=?,updated_at=datetime('now') WHERE email=?"
    ).bind(displayName, user.email).run();
    return json({ user: { ...user, displayName } });
  }


  if(path==="/api/bible-gateway/fetch" && request.method==="GET"){
    const reference=String(url.searchParams.get("search")||"").trim();
    const version=String(url.searchParams.get("version")||"NIV").trim().toUpperCase();

    if(!reference || reference.length>160){
      return json({error:"A Bible reference is required."},{status:400});
    }
    if(!/^[A-Z0-9-]{2,20}$/.test(version)){
      return json({error:"Invalid Bible translation code."},{status:400});
    }

    const remote=new URL("https://www.biblegateway.com/passage/");
    remote.searchParams.set("search",reference);
    remote.searchParams.set("version",version);
    remote.searchParams.set("interface","print");

    try{
      const response=await fetch(remote.toString(),{
        redirect:"follow",
        headers:{
          "accept":"text/html,application/xhtml+xml",
          "accept-language":"en-AU,en;q=0.9",
          "user-agent":"Mozilla/5.0 OpenLP-Service-Planner/1.0"
        }
      });
      if(!response.ok){
        return json({
          error:`Bible Gateway returned HTTP ${response.status}. Use the normal paste workflow instead.`
        },{status:502});
      }

      const html=await response.text();
      if(!html || html.length<100){
        return json({error:"Bible Gateway returned an empty page. Use the normal paste workflow instead."},{status:502});
      }

      return json({
        ok:true,
        html,
        sourceUrl:remote.toString()
      });
    }catch(error:any){
      return json({
        error:`Bible Gateway could not be fetched: ${String(error?.message||error)}. Use the normal paste workflow instead.`
      },{status:502});
    }
  }

  if (path === "/api/songs" && request.method === "GET") {
    await ensureSongsSeeded(request, env);
    const rows = await env.DB.prepare(
      `SELECT * FROM songs ORDER BY title COLLATE NOCASE`
    ).all<any>();
    return json({ songs: rows.results.map(songRowToJson) });
  }

  if (path === "/api/songs" && request.method === "POST") {
    const body = await request.json<any>();
    if (!body.song?.id) return json({ error: "Missing song." }, { status: 400 });
    await upsertSong(env, body.song, String(body.actor || "Unknown"));
    return json({ ok: true });
  }

  const songHistoryMatch = path.match(/^\/api\/songs\/([^/]+)\/history\/latest$/);
  if (songHistoryMatch && request.method === "GET") {
    const songId = decodeURIComponent(songHistoryMatch[1]);
    const row = await env.DB.prepare(
      `SELECT id,song_json,saved_at,saved_by
       FROM song_revisions WHERE song_id=?
       ORDER BY id DESC LIMIT 1`
    ).bind(songId).first<any>();
    if (!row) return json({ available: false });
    return json({
      available: true,
      revisionId: row.id,
      savedAt: row.saved_at,
      savedBy: row.saved_by,
      song: safeJson(row.song_json, null)
    });
  }

  const songRestoreMatch = path.match(/^\/api\/songs\/([^/]+)\/history\/restore-latest$/);
  if (songRestoreMatch && request.method === "POST") {
    const songId = decodeURIComponent(songRestoreMatch[1]);
    const user = await getRequestUser(request, env);
    const row = await env.DB.prepare(
      `SELECT id,song_json FROM song_revisions
       WHERE song_id=? ORDER BY id DESC LIMIT 1`
    ).bind(songId).first<any>();
    if (!row) return json({ error: "No previous saved version is available." }, { status: 404 });

    const previous = safeJson<any>(row.song_json, null);
    if (!previous) return json({ error: "The saved revision could not be read." }, { status: 500 });

    // Preserve the current state as a new revision before restoring, so an
    // accidental restore can itself be reversed with another restore.
    await saveSongRevision(env, songId, user.displayName);
    previous.id = songId;
    await upsertSong(env, previous, user.displayName, false);

    // Remove the revision we just restored FROM, leaving the snapshot of the
    // replaced current state as the newest entry.
    await env.DB.prepare("DELETE FROM song_revisions WHERE id=?").bind(row.id).run();

    const restored = await getSongJson(env, songId);
    return json({ ok: true, song: restored });
  }

  const songMatch = path.match(/^\/api\/songs\/([^/]+)$/);
  if (songMatch && request.method === "PUT") {
    const body = await request.json<any>();
    if (!body.song) return json({ error: "Missing song." }, { status: 400 });
    body.song.id = decodeURIComponent(songMatch[1]);
    await upsertSong(env, body.song, String(body.actor || "Unknown"));
    return json({ ok: true });
  }

  if (songMatch && request.method === "DELETE") {
    const songId = decodeURIComponent(songMatch[1]);
    await env.DB.prepare("DELETE FROM song_revisions WHERE song_id=?").bind(songId).run();
    await env.DB.prepare("DELETE FROM songs WHERE id=?").bind(songId).run();
    return json({ ok: true });
  }



  if (path === "/api/admin/song-usage" && request.method === "DELETE") {
    const body=await request.json<any>().catch(()=>({}));
    const all=body?.all===true;
    const from=String(body?.from||"").trim();
    const to=String(body?.to||"").trim();

    if(!all){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)){
        return json({error:"A valid From and To date are required."},{status:400});
      }
      if(from>to)return json({error:"The From date must be on or before the To date."},{status:400});
    }

    const countRow=all
      ?await env.DB.prepare("SELECT COUNT(*) AS total FROM song_usage").first<any>()
      :await env.DB.prepare("SELECT COUNT(*) AS total FROM song_usage WHERE usage_day>=? AND usage_day<=?").bind(from,to).first<any>();
    const deleted=Number(countRow?.total||0);

    if(deleted){
      if(all)await env.DB.prepare("DELETE FROM song_usage").run();
      else await env.DB.prepare("DELETE FROM song_usage WHERE usage_day>=? AND usage_day<=?").bind(from,to).run();
    }

    return json({ok:true,deleted,from:all?null:from,to:all?null:to,all});
  }

  if (path === "/api/song-usage/stats" && request.method === "GET") {
    const from=String(url.searchParams.get("from")||"").trim();
    const to=String(url.searchParams.get("to")||"").trim();
    const serviceTypes=url.searchParams.getAll("serviceType").map(String).filter(Boolean);

    const clauses:string[]=[];
    const binds:any[]=[];
    if(/^\d{4}-\d{2}-\d{2}$/.test(from)){clauses.push("u.usage_day>=?");binds.push(from)}
    if(/^\d{4}-\d{2}-\d{2}$/.test(to)){clauses.push("u.usage_day<=?");binds.push(to)}
    if(serviceTypes.length){
      clauses.push(`u.service_type_key IN (${serviceTypes.map(()=>"?").join(",")})`);
      binds.push(...serviceTypes);
    }
    const where=clauses.length?`WHERE ${clauses.join(" AND ")}`:"";

    const rows = await env.DB.prepare(
      `SELECT u.song_id, u.song_title, COUNT(*) AS uses, MAX(u.exported_at) AS last_used
       FROM song_usage u
       ${where}
       GROUP BY u.song_id, u.song_title
       ORDER BY uses DESC, u.song_title COLLATE NOCASE`
    ).bind(...binds).all<any>();

    const totals = await env.DB.prepare(
      `SELECT COUNT(*) AS total_usages,
              COUNT(DISTINCT u.service_id || ':' || u.usage_day) AS service_days,
              MIN(u.usage_day) AS first_day,
              MAX(u.usage_day) AS last_day
       FROM song_usage u
       ${where}`
    ).bind(...binds).first<any>();

    const serviceTypeRows=await env.DB.prepare(
      `SELECT service_type_key,
              MAX(service_type_name) AS service_type_name,
              COUNT(DISTINCT service_id || ':' || usage_day) AS service_days
       FROM song_usage
       WHERE service_type_key IS NOT NULL AND service_type_key<>''
       GROUP BY service_type_key
       ORDER BY CASE WHEN service_type_key='one-off' THEN 1 ELSE 0 END,
                service_type_name COLLATE NOCASE`
    ).all<any>();

    const songs=(rows.results||[]).map((r:any)=>({
      songId:r.song_id,
      title:r.song_title,
      uses:Number(r.uses||0),
      lastUsed:r.last_used
    }));

    return json({
      songs,
      serviceTypes:(serviceTypeRows.results||[]).map((r:any)=>({
        key:String(r.service_type_key),
        name:String(r.service_type_name||"Regular service"),
        serviceDays:Number(r.service_days||0)
      })),
      totalUsages:Number(totals?.total_usages||0),
      serviceDays:Number(totals?.service_days||0),
      firstDay:totals?.first_day||null,
      lastDay:totals?.last_day||null,
      from:from||null,
      to:to||null,
      selectedServiceTypes:serviceTypes
    });
  }

  const exportCheckMatch = path.match(/^\/api\/services\/([^/]+)\/export-check$/);
  if (exportCheckMatch && request.method === "GET") {
    const serviceId = decodeURIComponent(exportCheckMatch[1]);
    const exportData = await getServiceForExport(env, serviceId);
    if (!exportData) return json({ error: "Service not found." }, { status: 404 });

    const check = await validateExport(request, env, exportData);
    return json({ errors: check.errors, warnings: check.warnings, canExportIncomplete: check.skipItemIds.length > 0 });
  }

  const exportMatch = path.match(/^\/api\/services\/([^/]+)\/export\.osz$/);
  if (exportMatch && request.method === "GET") {
    const serviceId = decodeURIComponent(exportMatch[1]);
    const exportData = await getServiceForExport(env, serviceId);
    if (!exportData) return json({ error: "Service not found." }, { status: 404 });

    const check = await validateExport(request, env, exportData);
    const allowIncomplete = url.searchParams.get("allowIncomplete") === "1";
    if (check.errors.length && !allowIncomplete) {
      return json({ error: "Service is not ready to export.", errors: check.errors, warnings: check.warnings, canExportIncomplete: check.skipItemIds.length > 0 }, { status: 409 });
    }

    const requestUser = await getRequestUser(request, env);
    const actorName = requestUser.displayName;


    // Song statistics are updated only by a successful export request. For a
    // given service and service-date, this transaction replaces the previous
    // snapshot, so repeated download/share actions do not inflate counts.
    const usageDay=String(exportData.date_iso||new Date().toISOString().slice(0,10));
    const exportedAt=new Date().toISOString();
    await env.DB.prepare("DELETE FROM song_usage WHERE service_id=? AND usage_day=?")
      .bind(serviceId,usageDay).run();
    const songsByIdForUsage=new Map(check.songs.map((s:any)=>[String(s.id),s]));
    const songsByTitleForUsage=new Map(check.songs.map((s:any)=>[String(s.title||'').toLowerCase(),s]));
    for(const wrapped of exportData.items){
      const item=wrapped.item;
      if(!item?.projected || item.type!=="song")continue;
      if(allowIncomplete && check.skipItemIds.includes(String(item.id)))continue;
      const song=songsByIdForUsage.get(String(item.songId??"")) ||
        songsByTitleForUsage.get(String(item.title||"").toLowerCase()) ||
        (item.serviceSong && Array.isArray(item.serviceSong.sections) ? item.serviceSong : null);
      if(!song)continue;
      const serviceTypeKey=exportData.kind==="event"
        ?"one-off"
        :String(exportData.service_type_id||`legacy:${exportData.title||"regular-service"}`);
      const serviceTypeName=exportData.kind==="event"
        ?"One-off services"
        :String(exportData.service_type_name||exportData.title||"Regular service");
      await env.DB.prepare(
        `INSERT INTO song_usage(service_id,usage_day,song_id,song_title,exported_at,service_type_key,service_type_name)
         VALUES(?,?,?,?,?,?,?)`
      ).bind(
        serviceId,usageDay,String(song.id||item.songId||`service-only:${item.id}`),String(song.title||item.title||"Song"),exportedAt,
        serviceTypeKey,serviceTypeName
      ).run();
    }

    if (url.searchParams.get("markProjector") === "1") {
      await env.DB.prepare(
        `UPDATE services
         SET downloaded_for_device_at=datetime('now'),
             downloaded_snapshot=?,
             updated_at=datetime('now')
         WHERE id=?`
      ).bind(serviceSnapshotForExport(exportData), serviceId).run();

      await env.DB.prepare(
        `INSERT INTO service_audit(service_id,actor,action,detail,created_at)
         VALUES(?,?,?,?,datetime('now'))`
      ).bind(serviceId, actorName, allowIncomplete && check.errors.length ? "downloaded incomplete OpenLP service for projector" : "downloaded OpenLP service for projector", "").run();
    } else {
      await env.DB.prepare(
        `INSERT INTO service_audit(service_id,actor,action,detail,created_at)
         VALUES(?,?,?,?,datetime('now'))`
      ).bind(serviceId, actorName, allowIncomplete && check.errors.length ? "downloaded incomplete OpenLP service" : "downloaded OpenLP service", "").run();
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        void streamOpenLpZip(
          request,
          env,
          exportData,
          check.songs,
          controller,
          allowIncomplete ? new Set(check.skipItemIds) : new Set()
        );
      }
    });

    const headers = new Headers();
    // .osz is ZIP-structured internally, but it is an OpenLP service file.
    // Advertising application/zip makes iOS Files / Share workflows treat it
    // as a generic archive and can result in it being renamed/unpacked.
    // Deliver it as opaque binary while preserving the .osz filename.
    const downloadName=safeDownloadName(exportData);
    headers.set("content-type", "application/octet-stream");
    headers.set("content-disposition", `attachment; filename="${downloadName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
    headers.set("x-content-type-options", "nosniff");
    headers.set("cache-control", "no-store");
    return new Response(stream, { headers });
  }

  if (path === "/api/bootstrap" && request.method === "GET") {
    return json({...await bootstrap(env),user:await getRequestUser(request,env)});
  }

  if (path === "/api/seed" && request.method === "POST") {
    const body = await request.json<any>();
    if (!Array.isArray(body.services)) return json({ error: "Invalid seed payload." }, { status: 400 });

    await upsertSettings(env, body.settings || {});
    if (body.activeServiceId) {
      await upsertSettings(env, { activeServiceId: body.activeServiceId });
    }

    for (const service of body.services) {
      await upsertService(env, service);
      let pos = 0;
      for (const item of service.items || []) {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO service_items(id,service_id,position,item_json,updated_at)
           VALUES(?,?,?,?,datetime('now'))`
        ).bind(String(item.id), String(service.id), pos++, JSON.stringify(item)).run();
      }
      for (const a of service.activity || []) {
        await env.DB.prepare(
          `INSERT INTO service_audit(service_id,actor,action,detail,created_at)
           VALUES(?,?,?,?,datetime('now'))`
        ).bind(String(service.id), String(a[0] || ""), "history", String(a[1] || "")).run();
      }
    }
    return json({ ok: true });
  }

  if (path === "/api/full-backup" && request.method === "GET") {
    try{
      const databaseBackup=await buildDatabaseBackup(env);
      const manifest=await buildFullBackupManifest(env,databaseBackup);
      const stream=new ReadableStream<Uint8Array>({
        start(controller){
          streamFullBackup(env,databaseBackup,manifest,controller);
        }
      });
      const stamp=manifest.createdAt.replace(/[:.]/g,"-");
      return new Response(stream,{
        headers:{
          "content-type":"application/zip",
          "content-disposition":`attachment; filename="openlp-service-planner-full-${stamp}.zip"`,
          "cache-control":"no-store"
        }
      });
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:500});
    }
  }

  if (path === "/api/full-restore-preview" && request.method === "POST") {
    try{
      if(!request.body)return json({error:"Full backup file is missing."},{status:400});
      const {manifest,databaseBackup}=await inspectFullBackupReadable(request.body);
      await validateBackupAdministratorAccess(env,databaseBackup);
      return json({
        ok:true,
        createdAt:String(manifest.createdAt||databaseBackup.createdAt||""),
        appVersion:String(manifest.appVersion||databaseBackup.appVersion||""),
        mediaCount:Number(manifest.mediaCount||0),
        mediaBytes:Number(manifest.mediaBytes||0),
        summary:manifest.summary||{
          services:Array.isArray(databaseBackup?.tables?.services)?databaseBackup.tables.services.length:0,
          songs:Array.isArray(databaseBackup?.tables?.songs)?databaseBackup.tables.songs.length:0,
          users:Array.isArray(databaseBackup?.tables?.users)?databaseBackup.tables.users.length:0,
          mediaFiles:Number(manifest.mediaCount||0)
        }
      });
    }catch(error:any){return json({error:String(error?.message||error)},{status:400})}
  }

  if (path === "/api/full-restore" && request.method === "POST") {
    try{
      const confirmation=String(request.headers.get("x-planner-restore-confirmation")||"");
      if(confirmation!=="RESTORE"){
        return json({error:"Restore confirmation is missing."},{status:400});
      }
      if(!request.body)return json({error:"Full backup file is missing."},{status:400});
      const result=await restoreFullBackupReadable(env,request.body);
      return json(result);
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:400});
    }
  }

  if (path === "/api/database-backup" && request.method === "GET") {
    try{
      const backup=await buildDatabaseBackup(env);
      const stamp=backup.createdAt.replace(/[:.]/g,"-");
      return new Response(JSON.stringify(backup,null,2),{
        headers:{
          "content-type":"application/json; charset=utf-8",
          "content-disposition":`attachment; filename="openlp-service-planner-db-${stamp}.json"`,
          "cache-control":"no-store"
        }
      });
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:500});
    }
  }

  if (path === "/api/database-restore" && request.method === "POST") {
    try{
      const body=await request.json<any>();
      if(String(body?.confirmation||"")!=="RESTORE"){
        return json({error:"Restore confirmation is missing."},{status:400});
      }
      const result=await restoreDatabaseBackup(env,body?.backup);
      return json(result);
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:400});
    }
  }

  if (path === "/api/active-service" && request.method === "PUT") {
    const body=await request.json<any>();
    const serviceId=String(body?.serviceId||"");
    if(!serviceId)return json({error:"Missing service."},{status:400});
    const exists=await env.DB.prepare("SELECT id FROM services WHERE id=?").bind(serviceId).first<any>();
    if(!exists)return json({error:"Service not found."},{status:404});
    await upsertSettings(env,{activeServiceId:serviceId});
    return json({ok:true,activeServiceId:serviceId});
  }

  if (path === "/api/settings" && request.method === "PUT") {
    const body = await request.json<any>();
    const settings={...(body.settings||{})};
    if(Object.prototype.hasOwnProperty.call(settings,"songClassificationGroups")){
      settings.songClassificationGroups=cleanSongClassificationGroups(settings.songClassificationGroups);
    }
    await ensureUsableAdministrator(env,settings);
    await upsertSettings(env, settings);
    if(Object.prototype.hasOwnProperty.call(settings,"songClassificationGroups")){
      await normalizeAllSongClassifications(env);
    }
    return json({ ok: true });
  }

  if (path === "/api/services" && request.method === "POST") {
    const body = await request.json<any>();
    if (!body.service?.id) return json({ error: "Missing service." }, { status: 400 });
    const serviceId = String(body.service.id);
    const existing=await env.DB.prepare("SELECT id FROM services WHERE id=?").bind(serviceId).first<any>();
    if(existing)return json({error:"Service already exists. Reload the latest shared service before changing it."},{status:409});
    const items = Array.isArray(body.service.items) ? body.service.items : [];

    await upsertService(env, {...body.service,id:serviceId});

    // A POST carries the complete current service. Remove obsolete item rows
    // before writing its current items so repeated ChurchSuite syncs cannot
    // accumulate old generated IDs in D1.
    await env.DB.prepare(
      "DELETE FROM service_items WHERE service_id=?"
    ).bind(serviceId).run();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await env.DB.prepare(
        `INSERT INTO service_items(id,service_id,position,item_json,updated_at)
         VALUES(?,?,?,?,datetime('now'))`
      ).bind(String(item.id), serviceId, i, JSON.stringify(item)).run();
    }
    await upsertSettings(env, { activeServiceId: serviceId });
    return json({ ok: true, revision:0 });
  }


  if(path==="/api/services/bulk-delete" && request.method==="POST"){
    const body=await request.json<any>();
    const serviceIds=Array.isArray(body?.serviceIds)?body.serviceIds.map(String):[];
    if(!serviceIds.length)return json({error:"No services selected."},{status:400});
    if(serviceIds.length>200)return json({error:"Too many services selected at once."},{status:400});
    try{
      return json({ok:true,...await deletePlannerServices(env,serviceIds)});
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:500});
    }
  }

  const deleteServiceMatch = path.match(/^\/api\/services\/([^/]+)$/);
  if (deleteServiceMatch && request.method === "DELETE") {
    try{
      return json({ok:true,...await deletePlannerServices(env,[decodeURIComponent(deleteServiceMatch[1])])});
    }catch(error:any){
      return json({error:String(error?.message||error)},{status:500});
    }
  }

  const forceServiceMatch = path.match(/^\/api\/services\/([^/]+)\/force-replace$/);
  if (forceServiceMatch && request.method === "POST") {
    const serviceId=decodeURIComponent(forceServiceMatch[1]);
    const body=await request.json<any>();
    const claim=await claimServiceRevision(env,serviceId,body.baseRevision);
    if(!claim.ok)return json(claim,{status:claim.status});
    const service={...(body.service||{}),id:serviceId};
    const items=Array.isArray(service.items)?service.items:[];
    await upsertService(env,service);
    await env.DB.prepare("DELETE FROM service_items WHERE service_id=?").bind(serviceId).run();
    for(const item of items)await upsertItem(env,serviceId,item);
    if(items.length){
      await env.DB.batch(items.map((item:any,index:number)=>
        env.DB.prepare("UPDATE service_items SET position=?, updated_at=datetime('now') WHERE service_id=? AND id=?")
          .bind(index,serviceId,String(item.id))
      ));
    }
    return json({ok:true,revision:claim.revision});
  }

  const serviceMatch = path.match(/^\/api\/services\/([^/]+)$/);
  if (serviceMatch && request.method === "PUT") {
    const serviceId=decodeURIComponent(serviceMatch[1]);
    const body = await request.json<any>();
    const claim=await claimServiceRevision(env,serviceId,body.baseRevision);
    if(!claim.ok)return json(claim,{status:claim.status});
    const service={...(body.service||{}),id:serviceId};
    await upsertService(env, service);
    return json({ ok: true, revision:claim.revision });
  }

  const itemMatch = path.match(/^\/api\/services\/([^/]+)\/items\/([^/]+)$/);
  if (itemMatch && request.method === "PUT") {
    const serviceId = decodeURIComponent(itemMatch[1]);
    const body = await request.json<any>();
    const claim=await claimServiceRevision(env,serviceId,body.baseRevision);
    if(!claim.ok)return json(claim,{status:claim.status});
    const item={...(body.item||{}),id:decodeURIComponent(itemMatch[2])};
    await upsertItem(env, serviceId, item);
    return json({ ok: true, revision:claim.revision });
  }

  if (itemMatch && request.method === "DELETE") {
    const serviceId=decodeURIComponent(itemMatch[1]);
    const body=await request.json<any>().catch(()=>({}));
    const claim=await claimServiceRevision(env,serviceId,body.baseRevision);
    if(!claim.ok)return json(claim,{status:claim.status});
    await env.DB.prepare(
      "DELETE FROM service_items WHERE service_id=? AND id=?"
    ).bind(serviceId, decodeURIComponent(itemMatch[2])).run();
    return json({ ok: true, revision:claim.revision });
  }

  const orderMatch = path.match(/^\/api\/services\/([^/]+)\/order$/);
  if (orderMatch && request.method === "PUT") {
    const serviceId = decodeURIComponent(orderMatch[1]);
    const body = await request.json<any>();
    const claim=await claimServiceRevision(env,serviceId,body.baseRevision);
    if(!claim.ok)return json(claim,{status:claim.status});
    const ids = Array.isArray(body.itemIds) ? body.itemIds : [];
    const stmts = ids.map((id: string, index: number) =>
      env.DB.prepare(
        "UPDATE service_items SET position=?, updated_at=datetime('now') WHERE service_id=? AND id=?"
      ).bind(index, serviceId, String(id))
    );
    if (stmts.length) await env.DB.batch(stmts);
    return json({ ok: true, revision:claim.revision });
  }

  const auditDeleteMatch = path.match(/^\/api\/services\/([^/]+)\/audit$/);
  if (auditDeleteMatch && request.method === "DELETE") {
    const serviceId = decodeURIComponent(auditDeleteMatch[1]);
    await env.DB.prepare("DELETE FROM service_audit WHERE service_id=?").bind(serviceId).run();
    return json({ ok: true });
  }

  const auditMatch = path.match(/^\/api\/services\/([^/]+)\/audit$/);
  if (auditMatch && request.method === "POST") {
    const serviceId = decodeURIComponent(auditMatch[1]);
    const body = await request.json<any>();
    const user = await getRequestUser(request, env);
    await env.DB.prepare(
      `INSERT INTO service_audit(service_id,actor,action,detail,created_at)
       VALUES(?,?,?,?,datetime('now'))`
    ).bind(serviceId, user.displayName, String(body.action || "changed"), String(body.detail || "")).run();
    return json({ ok: true });
  }

  if (path === "/api/media-library/folders" && request.method === "GET") {
    const mediaType = String(url.searchParams.get("type") || "");
    const rows = await env.DB.prepare(
      `SELECT f.id,f.media_type,f.name,f.created_at,f.updated_at,
              COUNT(m.id) AS asset_count
       FROM media_library_folders f
       LEFT JOIN media_assets m ON m.library_folder_id=f.id AND m.retained=1
       WHERE (?='' OR f.media_type=?)
       GROUP BY f.id
       ORDER BY f.name COLLATE NOCASE`
    ).bind(mediaType, mediaType).all<any>();
    return json({ folders: rows.results.map(r=>({
      id:r.id,mediaType:r.media_type,name:r.name,assetCount:Number(r.asset_count||0)
    })) });
  }

  if (path === "/api/media-library/folders" && request.method === "POST") {
    const body = await request.json<any>();
    const mediaType = String(body.mediaType || "");
    const name = cleanLibraryFolderName(body.name);
    if (!mediaType || !name) return json({ error: "Media type and folder name are required." }, { status: 400 });
    try {
      const folder = await createMediaLibraryFolder(env, mediaType, name);
      return json({ ok:true, folder });
    } catch (error:any) {
      return json({ error:String(error?.message||error) }, { status:400 });
    }
  }

  if (path === "/api/media-library/folders/ensure" && request.method === "POST") {
    const body = await request.json<any>();
    const mediaType = String(body.mediaType || "");
    if (!mediaType) return json({ error: "Media type is required." }, { status: 400 });
    try {
      const folder = await ensureServiceItemLibraryFolder(
        env,
        mediaType,
        String(body.baseName || "Stored media"),
        String(body.dateLabel || "")
      );
      return json({ ok:true, folder });
    } catch (error:any) {
      return json({ error:String(error?.message||error) }, { status:400 });
    }
  }

  const mediaFolderMatch = path.match(/^\/api\/media-library\/folders\/([^/]+)$/);
  if (mediaFolderMatch && request.method === "PUT") {
    const folderId = decodeURIComponent(mediaFolderMatch[1]);
    const body = await request.json<any>();
    const name = cleanLibraryFolderName(body.name);
    if (!name) return json({ error:"Folder name is required." }, { status:400 });
    const folder = await env.DB.prepare("SELECT media_type FROM media_library_folders WHERE id=?").bind(folderId).first<any>();
    if (!folder) return json({ error:"Folder not found." }, { status:404 });
    const duplicate = await env.DB.prepare(
      "SELECT id FROM media_library_folders WHERE media_type=? AND name=? COLLATE NOCASE AND id<>?"
    ).bind(folder.media_type, name, folderId).first<any>();
    if (duplicate) return json({ error:"A folder with that name already exists." }, { status:409 });
    await env.DB.prepare(
      "UPDATE media_library_folders SET name=?,updated_at=datetime('now') WHERE id=?"
    ).bind(name, folderId).run();
    return json({ ok:true });
  }

  if (mediaFolderMatch && request.method === "DELETE") {
    const folderId = decodeURIComponent(mediaFolderMatch[1]);
    const used = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM media_assets WHERE retained=1 AND library_folder_id=?"
    ).bind(folderId).first<any>();
    if (Number(used?.n||0)>0) return json({ error:"Move or delete the files in this folder first." }, { status:409 });
    await env.DB.prepare("DELETE FROM media_library_folders WHERE id=?").bind(folderId).run();
    return json({ ok:true });
  }

  if (path === "/api/media-library/move" && request.method === "POST") {
    const body = await request.json<any>();
    const assetIds = Array.isArray(body.assetIds) ? body.assetIds.map(String) : [];
    const folderId = body.folderId ? String(body.folderId) : null;
    if (!assetIds.length) return json({ error:"Choose at least one library file." }, { status:400 });
    if (folderId) {
      const folder = await env.DB.prepare("SELECT id FROM media_library_folders WHERE id=?").bind(folderId).first<any>();
      if (!folder) return json({ error:"Destination folder not found." }, { status:404 });
    }
    for (const id of assetIds) {
      await env.DB.prepare(
        "UPDATE media_assets SET library_folder_id=? WHERE id=? AND retained=1"
      ).bind(folderId, id).run();
    }
    return json({ ok:true });
  }

  if (path === "/api/media" && request.method === "POST") {
    const form = await request.formData();
    const file = form.get("file");
    const serviceId = String(form.get("serviceId") || "");
    const itemId = String(form.get("itemId") || "");
    const mediaType = String(form.get("mediaType") || "file");
    const retain = String(form.get("retain") || "") === "true";
    const libraryGroupId = String(form.get("libraryGroupId") || "") || null;
    const libraryFolderId = String(form.get("libraryFolderId") || "") || null;
    const libraryOnly = String(form.get("libraryOnly") || "") === "true";
    if (!(file instanceof File) || (!libraryOnly && (!serviceId || !itemId))) {
      return json({ error: "Missing media upload data." }, { status: 400 });
    }

    const user = await getRequestUser(request, env);
    const bytes = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    let libraryId: string | null = null;

    if (retain || libraryOnly) {
      libraryId = crypto.randomUUID();
      const libraryKey = `library/${mediaType}/${libraryId}-${safeName}`;
      await env.MEDIA.put(libraryKey, bytes, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
      await env.DB.prepare(
        `INSERT INTO media_assets
         (id,service_id,item_id,r2_key,original_name,content_type,byte_size,sha256,created_at,created_by,retained,media_type,source_library_id,library_group_id,library_folder_id)
         VALUES(?,?,?,?,?,?,?,?,datetime('now'),?,1,?,NULL,?,?)`
      ).bind(libraryId, null, null, libraryKey, file.name, file.type || "application/octet-stream",
        file.size, sha256, user.displayName, mediaType, libraryGroupId, libraryFolderId).run();
    }

    if (libraryOnly) {
      return json({
        ok: true,
        asset: {
          id: libraryId,
          originalName: file.name,
          contentType: file.type || "application/octet-stream",
          byteSize: file.size,
          sha256,
          retained: true,
          mediaType,
          libraryGroupId,
          libraryFolderId
        }
      });
    }

    const id = crypto.randomUUID();
    const key = `services/${serviceId}/${itemId}/${id}-${safeName}`;
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    await env.DB.prepare(
      `INSERT INTO media_assets
       (id,service_id,item_id,r2_key,original_name,content_type,byte_size,sha256,created_at,created_by,retained,media_type,source_library_id,library_group_id)
       VALUES(?,?,?,?,?,?,?,?,datetime('now'),?,0,?,?,?)`
    ).bind(id, serviceId, itemId, key, file.name, file.type || "application/octet-stream",
      file.size, sha256, user.displayName, mediaType, libraryId, libraryGroupId).run();

    return json({
      ok: true,
      asset: { id, originalName: file.name, contentType: file.type || "application/octet-stream", byteSize: file.size, sha256, sourceLibraryId: libraryId },
      libraryAssetId: libraryId
    });
  }

  if (path === "/api/media-library" && request.method === "GET") {
    const mediaType = String(url.searchParams.get("type") || "");
    const rows = await env.DB.prepare(
      `SELECT m.id,m.service_id,m.item_id,m.original_name,m.content_type,m.byte_size,m.sha256,
              m.retained,m.media_type,m.source_library_id,m.library_group_id,m.library_folder_id,m.created_at,
              s.title AS service_title,s.date_iso AS service_date,
              si.item_json AS service_item_json,
              f.name AS library_folder_name
       FROM media_assets m
       LEFT JOIN services s ON s.id=m.service_id
       LEFT JOIN service_items si ON si.service_id=m.service_id AND si.id=m.item_id
       LEFT JOIN media_library_folders f ON f.id=m.library_folder_id
       WHERE (?='' OR m.media_type=?)
       ORDER BY m.retained DESC, s.date_iso DESC, m.created_at DESC`
    ).bind(mediaType, mediaType).all<any>();

    const retained = rows.results.filter(r=>Number(r.retained)===1);
    const serviceSpecific = rows.results.filter(r=>Number(r.retained)!==1);
    const usages = await env.DB.prepare(
      `SELECT m.source_library_id AS library_id,m.service_id,s.title AS service_title,s.date_iso AS service_date
       FROM media_assets m
       JOIN services s ON s.id=m.service_id
       WHERE m.source_library_id IS NOT NULL`
    ).all<any>();
    const usageMap = new Map<string, any[]>();
    for (const u of usages.results) {
      const key=String(u.library_id);
      if(!usageMap.has(key))usageMap.set(key,[]);
      usageMap.get(key)!.push({serviceId:u.service_id,title:u.service_title,dateISO:u.service_date});
    }

    return json({
      retained: retained.map(r=>({
        id:r.id,originalName:r.original_name,contentType:r.content_type,byteSize:r.byte_size,sha256:r.sha256,
        mediaType:r.media_type,libraryGroupId:r.library_group_id,libraryFolderId:r.library_folder_id,libraryFolderName:r.library_folder_name,usages:usageMap.get(String(r.id))||[]
      })),
      serviceSpecific: serviceSpecific.map(r=>{
        const serviceItem=safeJson<{title?:string;type?:string}>(
          r.service_item_json,
          {}
        );
        return {
          id:r.id,serviceId:r.service_id,itemId:r.item_id,originalName:r.original_name,contentType:r.content_type,
          byteSize:r.byte_size,sha256:r.sha256,mediaType:r.media_type,sourceLibraryId:r.source_library_id,
          libraryGroupId:r.library_group_id,serviceTitle:r.service_title,serviceDate:r.service_date,
          itemTitle:String(serviceItem.title||"Untitled item"),
          itemType:String(serviceItem.type||"")
        };
      })
    });
  }

  const retainMediaMatch = path.match(/^\/api\/media\/([^/]+)\/retain$/);
  if (retainMediaMatch && request.method === "POST") {
    const assetId=decodeURIComponent(retainMediaMatch[1]);
    const body=await request.json<any>().catch(()=>({}));
    const row=await env.DB.prepare("SELECT * FROM media_assets WHERE id=?").bind(assetId).first<any>();
    if(!row)return json({error:"Media not found."},{status:404});
    if(Number(row.retained)===1)return json({ok:true,libraryAssetId:row.id});
    if(row.source_library_id)return json({ok:true,libraryAssetId:row.source_library_id});

    const object=await env.MEDIA.get(row.r2_key);
    if(!object)return json({error:"Media object missing."},{status:404});
    const bytes=await object.arrayBuffer();
    const libraryId=crypto.randomUUID();
    const mediaType=String(body.mediaType||row.media_type||"file");
    const libraryFolderId=body.libraryFolderId?String(body.libraryFolderId):null;
    const safeName=String(row.original_name).replace(/[^a-zA-Z0-9._-]+/g,"_");
    const key=`library/${mediaType}/${libraryId}-${safeName}`;
    await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:row.content_type||"application/octet-stream"}});
    await env.DB.prepare(
      `INSERT INTO media_assets
       (id,service_id,item_id,r2_key,original_name,content_type,byte_size,sha256,created_at,created_by,retained,media_type,library_group_id,library_folder_id)
       VALUES(?,?,?,?,?,?,?,?,datetime('now'),?,1,?,?,?)`
    ).bind(libraryId,null,null,key,row.original_name,row.content_type,row.byte_size,row.sha256,row.created_by,mediaType,body.libraryGroupId||row.library_group_id||null,libraryFolderId).run();
    await env.DB.prepare("UPDATE media_assets SET source_library_id=?,media_type=? WHERE id=?")
      .bind(libraryId,mediaType,assetId).run();
    return json({ok:true,libraryAssetId:libraryId});
  }

  if (path === "/api/media-library/use" && request.method === "POST") {
    const body=await request.json<any>();
    const serviceId=String(body.serviceId||"");
    const itemId=String(body.itemId||"");
    const assetIds=Array.isArray(body.assetIds)?body.assetIds.map(String):[];
    if(!serviceId||!itemId||!assetIds.length)return json({error:"Missing library selection."},{status:400});
    const user=await getRequestUser(request,env);
    const assets:any[]=[];
    for(const libraryId of assetIds){
      const row=await env.DB.prepare("SELECT * FROM media_assets WHERE id=? AND retained=1").bind(libraryId).first<any>();
      if(!row)continue;
      const object=await env.MEDIA.get(row.r2_key);
      if(!object)continue;
      const bytes=await object.arrayBuffer();
      const id=crypto.randomUUID();
      const safeName=String(row.original_name).replace(/[^a-zA-Z0-9._-]+/g,"_");
      const key=`services/${serviceId}/${itemId}/${id}-${safeName}`;
      await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:row.content_type||"application/octet-stream"}});
      await env.DB.prepare(
        `INSERT INTO media_assets
         (id,service_id,item_id,r2_key,original_name,content_type,byte_size,sha256,created_at,created_by,retained,media_type,source_library_id,library_group_id)
         VALUES(?,?,?,?,?,?,?,?,datetime('now'),?,0,?,?,?)`
      ).bind(id,serviceId,itemId,key,row.original_name,row.content_type,row.byte_size,row.sha256,user.displayName,row.media_type,libraryId,row.library_group_id).run();
      assets.push({id,originalName:row.original_name,contentType:row.content_type,byteSize:row.byte_size,sha256:row.sha256,sourceLibraryId:libraryId});
    }
    return json({ok:true,assets});
  }

  const mediaDeleteMatch = path.match(/^\/api\/media\/([^/]+)$/);
  if (mediaDeleteMatch && request.method === "DELETE") {
    const assetId = decodeURIComponent(mediaDeleteMatch[1]);
    const row = await env.DB.prepare(
      "SELECT r2_key,retained FROM media_assets WHERE id=?"
    ).bind(assetId).first<any>();
    if (!row) return json({ error: "Media not found." }, { status: 404 });
    if(Number(row.retained)===1){
      const used=await env.DB.prepare("SELECT COUNT(*) AS n FROM media_assets WHERE source_library_id=?").bind(assetId).first<any>();
      if(Number(used?.n||0)>0)return json({error:"This library file is still used by one or more services."},{status:409});
    }
    await env.MEDIA.delete(row.r2_key);
    await env.DB.prepare("DELETE FROM media_assets WHERE id=?").bind(assetId).run();
    return json({ ok: true });
  }

  const mediaRenameMatch = path.match(/^\/api\/media\/([^/]+)\/rename$/);
  if (mediaRenameMatch && request.method === "PUT") {
    const assetId=decodeURIComponent(mediaRenameMatch[1]);
    const body=await request.json<any>().catch(()=>({}));
    const name=String(body.name||"").trim().slice(0,240);
    if(!name)return json({error:"File name is required."},{status:400});
    const row=await env.DB.prepare("SELECT id FROM media_assets WHERE id=?").bind(assetId).first<any>();
    if(!row)return json({error:"Media not found."},{status:404});
    await env.DB.prepare(
      "UPDATE media_assets SET original_name=? WHERE id=?"
    ).bind(name,assetId).run();
    return json({ok:true,name});
  }

  const mediaMatch = path.match(/^\/api\/media\/([^/]+)$/);
  if (mediaMatch && request.method === "GET") {
    const row = await env.DB.prepare(
      "SELECT r2_key,original_name,content_type FROM media_assets WHERE id=?"
    ).bind(decodeURIComponent(mediaMatch[1])).first<any>();
    if (!row) return json({ error: "Media not found." }, { status: 404 });

    const object = await env.MEDIA.get(row.r2_key);
    if (!object) return json({ error: "Media object missing." }, { status: 404 });

    const headers = new Headers();
    const contentType=String(row.content_type||"application/octet-stream").toLowerCase();
    headers.set("content-type",contentType);
    const safeInline=/^(?:image\/(?:jpeg|png|webp|gif)|video\/(?:mp4|webm|quicktime)|application\/pdf)(?:;|$)/i.test(contentType);
    const download=url.searchParams.get("download")==="1" || !safeInline;
    const safeFileName=String(row.original_name||"media").replace(/["\r\n]/g,"");
    headers.set("content-disposition", `${download?"attachment":"inline"}; filename="${safeFileName}"`);
    return new Response(object.body, { headers });
  }

  return json({ error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Cloudflare.Env): Promise<Response> {
    const url=new URL(request.url);
    const authResponse=await handleAuthRequest(request,env);
    if(authResponse)return secureResponse(authResponse);
    const user=await getAuthUser(request,env);
    if(!user){
      if(url.pathname.startsWith("/api/"))return secureResponse(json({error:"Authentication required."},{status:401}));
      return secureResponse(Response.redirect(`${url.origin}/login?return=${encodeURIComponent(url.pathname+url.search)}`,303));
    }
    if(!sameOriginUnsafeRequest(request))return secureResponse(json({error:"Cross-origin request rejected."},{status:403}));

    if(url.pathname==="/first-login"){
      const requested=String(url.searchParams.get("continue")||"/");
      const safeContinue=requested.startsWith("/")&&!requested.startsWith("//")?requested:"/";
      return secureResponse(new Response(firstLoginAccessPage(user,await churchSuiteServiceListAvailable(env),safeContinue),{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store, private",pragma:"no-cache"}}));
    }

    if(url.pathname==="/service-list-unavailable"){
      if(user.accessLevel===1){
        return secureResponse(new Response(churchSuiteServiceListUnavailablePage(),{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store, private",pragma:"no-cache"}}));
      }
      return secureResponse(Response.redirect(`${url.origin}/`,303));
    }

    if(!url.pathname.startsWith("/api/")){
      const published=await publishedChurchSuiteDirectory(request,env);
      if(published)return secureResponse(published);
    }

    if(user.accessLevel===1){
      if(url.pathname.startsWith("/api/")){
        return secureResponse(json({error:"ChurchSuite Service list access only.",serviceListAvailable:await churchSuiteServiceListAvailable(env)},{status:403}));
      }
      if(await churchSuiteServiceListAvailable(env)){
        const p=normalizePublishedDirectoryPath(await plannerSetting(env,"churchSuiteDirectoryPath","churchsuite-plans"));
        if(url.pathname!==p&&url.pathname!==`${p}/`)return secureResponse(Response.redirect(`${url.origin}${p}`,303));
        return secureResponse(new Response("The ChurchSuite Service list page could not be loaded.",{status:503,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}}));
      }
      return secureResponse(Response.redirect(`${url.origin}/service-list-unavailable`,303));
    }

    if(url.pathname.startsWith("/api/")){
      const clearingAudit=request.method==="DELETE"&&/^\/api\/services\/[^/]+\/audit$/.test(url.pathname);
      const adminOnly=url.pathname==="/api/settings"||url.pathname==="/api/churchsuite/status"||url.pathname==="/api/churchsuite/service-names"||url.pathname.startsWith("/api/admin/")||url.pathname==="/api/full-backup"||url.pathname==="/api/full-restore"||url.pathname==="/api/full-restore-preview"||url.pathname==="/api/database-backup"||url.pathname==="/api/database-restore"||url.pathname==="/api/seed"||clearingAudit;
      if(adminOnly&&user.accessLevel<3)return secureResponse(json({error:"Administrator access is required."},{status:403}));
      return secureResponse(await handleApi(request,env));
    }

    const assetResponse=await env.ASSETS.fetch(request);
    const headers=new Headers(assetResponse.headers);
    const contentType=headers.get("content-type")||"";
    if(contentType.includes("text/html")){headers.set("cache-control","no-store, private");headers.set("pragma","no-cache");}
    return secureResponse(new Response(assetResponse.body,{status:assetResponse.status,statusText:assetResponse.statusText,headers}));
  }
} satisfies ExportedHandler<Cloudflare.Env>;
