
export type PlannerAuthUser = {
  email:string;
  displayName:string;
  authenticated:true;
  authMethod:"local"|"microsoft"|"churchsuite";
  accessLevel:1|2|3;
  disabled:boolean;
};

const COOKIE="__Host-openlp_planner_session";
const SESSION_HOURS=12;
const PBKDF2_ITERATIONS=100000;

function envAny(env:Cloudflare.Env){return env as any}
function b64url(bytes:Uint8Array){
  let s=""; for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function fromB64url(value:string){
  const s=value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"=");
  const raw=atob(s); return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function randomToken(bytes=32){const b=new Uint8Array(bytes);crypto.getRandomValues(b);return b64url(b)}
async function sha256Bytes(value:string|Uint8Array){
  const bytes=typeof value==="string"?new TextEncoder().encode(value):value;
  return new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
}
async function sha256Hex(value:string){
  return [...await sha256Bytes(value)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function cookies(request:Request){
  const out:Record<string,string>={};
  for(const bit of (request.headers.get("cookie")||"").split(";")){
    const i=bit.indexOf("=");if(i<0)continue;
    out[bit.slice(0,i).trim()]=decodeURIComponent(bit.slice(i+1).trim());
  }
  return out;
}
function sessionCookie(token:string,maxAge=SESSION_HOURS*3600){
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}
function clearSessionCookie(){return `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`}
function safeReturnTo(value:string|null){
  const v=String(value||"/"); return v.startsWith("/")&&!v.startsWith("//")?v:"/";
}
async function destinationForUser(env:Cloudflare.Env,user:PlannerAuthUser,requested="/"){
  if(user.accessLevel===1){
    const enabledRow=await env.DB.prepare(
      "SELECT value_json FROM planner_settings WHERE key='churchSuiteDirectoryEnabled'"
    ).first<any>();
    const modeRow=await env.DB.prepare(
      "SELECT value_json FROM planner_settings WHERE key='churchSuiteMode'"
    ).first<any>();
    const pathRow=await env.DB.prepare(
      "SELECT value_json FROM planner_settings WHERE key='churchSuiteDirectoryPath'"
    ).first<any>();

    let directoryEnabled=false;
    let churchSuiteMode="off";
    let directoryPath="churchsuite-plans";
    try{directoryEnabled=!!JSON.parse(String(enabledRow?.value_json??"false"))}catch(_){}
    try{churchSuiteMode=String(JSON.parse(String(modeRow?.value_json??'"off"'))||"off")}catch(_){}
    try{directoryPath=String(JSON.parse(String(pathRow?.value_json??'"churchsuite-plans"'))||"churchsuite-plans")}catch(_){}

    const serviceListAvailable=directoryEnabled && ["on","manual","auto"].includes(churchSuiteMode);
    const clean=`/${directoryPath.replace(/^\/+|\/+$/g,"")}`;
    // Never send a ChurchSuite-Service-list-only account to the main Planner
    // when the feature is unavailable. This stable notice route is also safe
    // for an already-authenticated browser and cannot redirect back into itself.
    return serviceListAvailable?clean:"/service-list-unavailable";
  }

  const safe=safeReturnTo(requested);
  if(
    safe==="/login" ||
    safe.startsWith("/auth/") ||
    safe==="/service-list-unavailable"
  ) return "/";
  return safe||"/";
}
function friendly(email:string){
  const local=email.split("@")[0]||"User";
  return local.split(/[._-]+/).filter(Boolean).map(x=>x[0]?.toUpperCase()+x.slice(1)).join(" ")||email;
}
function allowedDomain(env:Cloudflare.Env){return String(envAny(env).MICROSOFT_ALLOWED_DOMAIN||"kpc.org.au").toLowerCase()}
function bootstrapAdminEmail(env:Cloudflare.Env){
  return String(envAny(env).PLANNER_BOOTSTRAP_ADMIN_EMAIL||"").trim().toLowerCase();
}
function setupToken(env:Cloudflare.Env){
  return String(envAny(env).PLANNER_SETUP_TOKEN||"");
}
function adminRecoveryToken(env:Cloudflare.Env){
  return String(envAny(env).PLANNER_ADMIN_RECOVERY_TOKEN||"");
}
async function enabledAdministratorExists(env:Cloudflare.Env){
  const row=await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM users WHERE disabled=0 AND access_level=3"
  ).first<any>();
  return Number(row?.n||0)>0;
}
async function secureTextEquals(a:string,b:string){
  const left=await sha256Bytes(a),right=await sha256Bytes(b);
  if(left.length!==right.length)return false;
  let diff=0;
  for(let i=0;i<left.length;i++)diff|=left[i]^right[i];
  return diff===0;
}

async function bootstrapAdminAllowed(env:Cloudflare.Env,email:string){
  const bootstrap=bootstrapAdminEmail(env);
  if(!bootstrap || email.toLowerCase()!==bootstrap)return false;
  return !(await enabledAdministratorExists(env));
}

async function microsoftDomainSelfEnrollEnabled(env:Cloudflare.Env){
  const row=await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key='microsoftAutoEnrollDomainUsers'"
  ).first<any>();
  if(!row)return true;
  try{return JSON.parse(String(row.value_json))!==false}catch(_){return true}
}

function sameOriginUnsafeAuthRequest(request:Request){
  if(["GET","HEAD","OPTIONS"].includes(request.method))return true;
  const url=new URL(request.url);
  const origin=request.headers.get("origin");
  if(origin)return origin===url.origin;
  const referer=request.headers.get("referer");
  if(referer){try{return new URL(referer).origin===url.origin}catch(_){return false}}
  return String(request.headers.get("sec-fetch-site")||"").toLowerCase()==="same-origin";
}

export function microsoftConfigStatus(env:Cloudflare.Env){
  const e=envAny(env);
  const status={
    clientId:typeof e.MICROSOFT_CLIENT_ID==="string" && e.MICROSOFT_CLIENT_ID.trim().length>0,
    clientSecret:typeof e.MICROSOFT_CLIENT_SECRET==="string" && e.MICROSOFT_CLIENT_SECRET.trim().length>0,
    tenantId:typeof e.MICROSOFT_TENANT_ID==="string" && e.MICROSOFT_TENANT_ID.trim().length>0,
    allowedDomain:allowedDomain(env)
  };
  return {...status,configured:status.clientId&&status.clientSecret&&status.tenantId};
}
function microsoftConfigured(env:Cloudflare.Env){
  return microsoftConfigStatus(env).configured;
}
export async function microsoftSignInEnabled(env:Cloudflare.Env){
  if(!microsoftConfigured(env))return false;
  const row=await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key='microsoftSsoSignInEnabled'"
  ).first<any>();
  if(!row)return true; // preserve existing installations on upgrade
  try{return JSON.parse(String(row.value_json))!==false}catch(_){return true}
}
const CHURCHSUITE_OIDC_DISCOVERY_URL = "https://login.churchsuite.com/.well-known/openid-configuration";
const CHURCHSUITE_OIDC_SCOPE = "openid email profile";

// Keep the existing environment-variable names for deployment compatibility.
// These are the Client ID and Client Secret from the ChurchSuite OIDC/OAuth App.
export function churchSuiteOAuthConfigStatus(env:Cloudflare.Env){
  const e=envAny(env);
  const status={
    clientId:typeof e.CHURCHSUITE_OIDC_CLIENT_ID==="string" && e.CHURCHSUITE_OIDC_CLIENT_ID.trim().length>0,
    clientSecret:typeof e.CHURCHSUITE_OIDC_CLIENT_SECRET==="string" && e.CHURCHSUITE_OIDC_CLIENT_SECRET.trim().length>0
  };
  return {...status,configured:status.clientId&&status.clientSecret};
}
function churchSuiteOAuthConfigured(env:Cloudflare.Env){
  return churchSuiteOAuthConfigStatus(env).configured;
}
async function churchSuiteOAuthSignInEnabled(env:Cloudflare.Env){
  if(!churchSuiteOAuthConfigured(env))return false;
  const row=await env.DB.prepare(
    "SELECT value_json FROM planner_settings WHERE key='myChurchSuiteSignInEnabled'"
  ).first<any>();
  if(!row)return false;
  try{return JSON.parse(String(row.value_json))===true}catch(_){return false}
}

async function churchSuiteOidcMetadata(){
  const response=await fetch(CHURCHSUITE_OIDC_DISCOVERY_URL,{headers:{accept:"application/json"}});
  if(!response.ok)throw new Error("My ChurchSuite OpenID configuration could not be loaded.");
  const meta=await response.json<any>();
  if(!meta?.authorization_endpoint||!meta?.token_endpoint||!meta?.jwks_uri){
    throw new Error("My ChurchSuite OpenID configuration is incomplete.");
  }
  return meta;
}

async function verifyChurchSuiteIdToken(env:Cloudflare.Env,idToken:string,nonce:string,meta:any){
  const bits=idToken.split(".");
  if(bits.length!==3)throw new Error("My ChurchSuite returned an invalid ID token.");
  const header=JSON.parse(new TextDecoder().decode(fromB64url(bits[0])));
  const claims=JSON.parse(new TextDecoder().decode(fromB64url(bits[1])));
  const jwksResp=await fetch(String(meta.jwks_uri),{headers:{accept:"application/json"}});
  if(!jwksResp.ok)throw new Error("My ChurchSuite signing keys could not be loaded.");
  const jwks=await jwksResp.json<any>();
  if(String(header.alg||"")!=="RS256")throw new Error("My ChurchSuite ID token signing algorithm is invalid.");
  const jwk=(jwks.keys||[]).find((k:any)=>k.kid===header.kid);
  if(!jwk)throw new Error("My ChurchSuite token signing key was not found.");
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const ok=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,fromB64url(bits[2]),new TextEncoder().encode(`${bits[0]}.${bits[1]}`));
  if(!ok)throw new Error("My ChurchSuite ID token signature is invalid.");
  const now=Math.floor(Date.now()/1000),clientId=String(envAny(env).CHURCHSUITE_OIDC_CLIENT_ID||"");
  const aud=claims.aud;
  const audienceOk=Array.isArray(aud)?aud.map(String).includes(clientId):String(aud)===clientId;
  if(!audienceOk)throw new Error("My ChurchSuite token audience is invalid.");
  if(Number(claims.exp||0)<=now)throw new Error("My ChurchSuite sign-in has expired.");
  if(Number(claims.iat||0)>now+300)throw new Error("My ChurchSuite token issue time is invalid.");
  if(String(claims.nonce||"")!==nonce)throw new Error("My ChurchSuite sign-in nonce is invalid or missing.");
  if(meta.issuer&&String(claims.iss)!==String(meta.issuer))throw new Error("My ChurchSuite token issuer is invalid.");
  if(!String(claims.sub||"").trim())throw new Error("My ChurchSuite did not supply a stable user identity.");
  return claims;
}

async function churchSuiteUserInfo(accessToken:string,meta:any){
  const endpoint=String(meta?.userinfo_endpoint||"https://login.churchsuite.com/oauth2/userinfo");
  const response=await fetch(endpoint,{headers:{authorization:`Bearer ${accessToken}`,accept:"application/json"}});
  if(!response.ok)return null;
  try{return await response.json<any>()}catch(_){return null}
}

async function passwordHash(password:string,saltB64?:string,iterations=PBKDF2_ITERATIONS){
  const safeIterations=Math.max(1,Math.min(100000,Number(iterations)||PBKDF2_ITERATIONS));
  const salt=saltB64?fromB64url(saltB64):crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations:safeIterations},key,256);
  return {salt:b64url(salt),hash:b64url(new Uint8Array(bits)),iterations:safeIterations};
}
async function verifyPassword(password:string,salt:string,expected:string,iterations=PBKDF2_ITERATIONS){
  const got=await passwordHash(password,salt,iterations);
  const a=fromB64url(got.hash),b=fromB64url(expected);
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
async function rowToUser(row:any,method?:PlannerAuthUser["authMethod"]):Promise<PlannerAuthUser>{
  return {
    email:String(row.email),displayName:String(row.display_name||row.email),authenticated:true,
    authMethod:method||(
      row.auth_method==="local"?"local":
      row.auth_method==="churchsuite"?"churchsuite":"microsoft"
    ),
    accessLevel:Math.max(1,Math.min(3,Number(row.access_level||1))) as 1|2|3,
    disabled:!!Number(row.disabled||0)
  };
}
async function sessionFor(env:Cloudflare.Env,email:string){
  const token=randomToken(32),tokenHash=await sha256Hex(token);
  // Opportunistic cleanup keeps expired runtime-only authentication rows from
  // growing forever without requiring a scheduler on Cloudflare or Debian.
  await env.DB.batch([
    env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at<=datetime('now')"),
    env.DB.prepare("DELETE FROM auth_oidc_states WHERE expires_at<=datetime('now')"),
    env.DB.prepare(`INSERT INTO auth_sessions(token_hash,email,created_at,expires_at)
      VALUES(?,?,datetime('now'),datetime('now',?))`).bind(tokenHash,email,`+${SESSION_HOURS} hours`)
  ]);
  return token;
}
async function userByEmail(env:Cloudflare.Env,email:string){
  return env.DB.prepare(`SELECT email,display_name,auth_method,access_level,disabled,password_hash,password_salt,password_iterations,
    failed_login_count,locked_until,microsoft_oid,churchsuite_sub,last_login_at,microsoft_sso_enabled,churchsuite_sso_enabled FROM users WHERE lower(email)=lower(?)`).bind(email).first<any>();
}
async function userByMicrosoftOid(env:Cloudflare.Env,oid:string){
  if(!oid)return null;
  return env.DB.prepare(`SELECT email,display_name,auth_method,access_level,disabled,password_hash,password_salt,password_iterations,
    failed_login_count,locked_until,microsoft_oid,churchsuite_sub,last_login_at,microsoft_sso_enabled,churchsuite_sso_enabled FROM users WHERE microsoft_oid=?`).bind(oid).first<any>();
}

export async function getAuthUser(request:Request,env:Cloudflare.Env):Promise<PlannerAuthUser|null>{
  const token=cookies(request)[COOKIE];
  if(token){
    const row=await env.DB.prepare(`SELECT u.email,u.display_name,u.auth_method,u.access_level,u.disabled
      FROM auth_sessions s JOIN users u ON u.email=s.email
      WHERE s.token_hash=? AND s.expires_at>datetime('now')`)
      .bind(await sha256Hex(token)).first<any>();
    if(row&&!Number(row.disabled||0))return rowToUser(
      row,
      row.auth_method==="local"?"local":row.auth_method==="churchsuite"?"churchsuite":"microsoft"
    );
  }
  return null;
}
export async function requireAuthUser(request:Request,env:Cloudflare.Env){
  const user=await getAuthUser(request,env); if(!user)throw new Error("Authentication required."); return user;
}


function setupPage(env:Cloudflare.Env,error=""){
  const safeError=error.replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]||c));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Initial setup · OpenLP Service Planner</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f7;color:#1d1d1f;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
main{width:min(460px,calc(100% - 28px));margin:7vh auto}.card{background:#fff;border:1px solid rgba(0,0,0,.09);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.06)}
h1{font-size:25px;margin:0 0 5px}.meta{color:#6e6e73;font-size:12px;margin:0 0 18px}.error{background:#fff1f0;color:#8b2b25;border-radius:10px;padding:9px 11px;margin-bottom:12px}
label{display:block;font-size:11px;font-weight:700;margin:10px 0 4px}input{width:100%;border:1px solid #d1d1d6;border-radius:9px;padding:10px 11px;font:inherit}button{width:100%;display:block;border:0;border-radius:10px;padding:11px 13px;font:650 14px inherit;text-align:center;cursor:pointer;background:#1d1d1f;color:#fff;margin-top:16px}</style></head>
<body><main><div class="card"><h1>Initial setup</h1>
<p class="meta">Create the first OpenLP Service Planner Administrator. This can be a normal email/password account and does not require Microsoft Entra ID.</p>
${safeError?`<div class="error">${safeError}</div>`:""}
<form method="post" action="/auth/setup">
<label>Setup token</label><input name="setupToken" type="password" autocomplete="off" required>
<label>Administrator email</label><input name="email" type="email" autocomplete="username" required>
<label>Display name</label><input name="displayName" autocomplete="name">
<label>Password</label><input name="password" type="password" autocomplete="new-password" minlength="12" required>
<p class="meta">Use at least 12 characters. The setup page closes permanently once an enabled Administrator exists.</p>
<button type="submit">Create Administrator</button>
</form></div></main></body></html>`;
}

function adminRecoveryPage(error="",success=""){
  const escHtml=(value:string)=>String(value||"").replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]||c));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Administrator recovery · OpenLP Service Planner</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f7;color:#1d1d1f;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
main{width:min(460px,calc(100% - 28px));margin:8vh auto}.card{background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:16px;padding:24px;box-shadow:0 8px 30px rgba(0,0,0,.06)}
h1{font-size:22px;margin:0 0 8px}.meta{color:#6e6e73;font-size:13px}.error{background:#fff1f0;color:#8b2b25;padding:10px;border-radius:9px;margin:12px 0}.success{background:#edf7ed;color:#245b2a;padding:10px;border-radius:9px;margin:12px 0}
label{display:block;font-weight:650;margin:13px 0 5px}input{width:100%;padding:10px 11px;border:1px solid #c7c7cc;border-radius:9px;font:inherit}button{width:100%;border:0;border-radius:10px;padding:11px 13px;background:#1d1d1f;color:#fff;font-weight:650;margin-top:16px;cursor:pointer}a{color:inherit}</style></head>
<body><main><div class="card"><h1>Administrator recovery</h1><p class="meta">Emergency recovery is temporarily enabled by the hosting administrator.</p>
${error?`<div class="error">${escHtml(error)}</div>`:""}${success?`<div class="success">${escHtml(success)}</div>`:""}
<form method="post" action="/auth/admin-recovery"><label>Recovery token</label><input name="recoveryToken" type="password" autocomplete="off" required>
<label>Local Administrator email</label><input name="email" type="email" autocomplete="username" required>
<label>New password</label><input name="password" type="password" autocomplete="new-password" minlength="12" required>
<label>Confirm new password</label><input name="confirmPassword" type="password" autocomplete="new-password" minlength="12" required>
<button type="submit">Reset Administrator password</button></form>
<p class="meta"><strong>After recovery:</strong> remove <code>PLANNER_ADMIN_RECOVERY_TOKEN</code> from the hosting environment and redeploy/restart the Planner.</p><p class="meta"><a href="/login">Return to sign in</a></p></div></main></body></html>`;
}

async function loginPage(env:Cloudflare.Env,returnTo:string,error=""){
  const microsoft=await microsoftSignInEnabled(env);
  const churchSuiteOAuth=await churchSuiteOAuthSignInEnabled(env);
  const externalSignInAvailable=churchSuiteOAuth||microsoft;
  const microsoftDomain=allowedDomain(env).replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]||c));
  const initialSetupAvailable=!!setupToken(env) && !(await enabledAdministratorExists(env));
  const safeError=error.replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]||c));
  const localForm=`<form method="post" action="/auth/local"><input type="hidden" name="return" value="${returnTo.replace(/"/g,"&quot;")}">
<label>Email</label><input name="email" type="email" autocomplete="username" required>
<label>Password</label><input name="password" type="password" autocomplete="current-password" required><div style="height:14px"></div><button type="submit">Sign in</button>
</form>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign in · OpenLP Service Planner</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5f7;color:#1d1d1f;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif}
main{width:min(430px,calc(100% - 28px));margin:10vh auto}.card{background:#fff;border:1px solid rgba(0,0,0,.09);border-radius:18px;padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.06)}
h1{font-size:25px;margin:0 0 5px}.meta{color:#6e6e73;font-size:12px;margin:0 0 20px}.error{background:#fff1f0;color:#8b2b25;border-radius:10px;padding:9px 11px;margin-bottom:12px}
a.ms,button{width:100%;display:block;border:0;border-radius:10px;padding:11px 13px;font:650 14px inherit;text-align:center;cursor:pointer;text-decoration:none}
a.ms{background:#1d1d1f;color:white;margin-bottom:12px}button{background:#1d1d1f;color:white}.local-primary{margin-bottom:16px}.local-primary h2{font-size:14px;margin:0 0 8px}details.local-login{margin-top:16px;border-top:1px solid #e5e5e7;padding-top:13px}details.local-login summary{cursor:pointer;color:#6e6e73;font-size:12px;font-weight:650;list-style-position:outside;margin-left:16px}details.local-login[open] summary{margin-bottom:10px}
label{display:block;font-size:11px;font-weight:700;margin:10px 0 4px}input{width:100%;border:1px solid #d1d1d6;border-radius:9px;padding:10px 11px;font:inherit}</style></head>
<body><main><div class="card"><h1>OpenLP Service Planner</h1><p class="meta">Use any sign-in method enabled by your church. New My ChurchSuite members begin with ChurchSuite Service list access only.</p>
${safeError?`<div class="error">${safeError}</div>`:""}
${initialSetupAvailable?`<a class="ms" href="/setup">Initial setup · create first Administrator</a>`:""}
${!externalSignInAvailable?`<div class="local-primary"><h2>Sign in with OpenLP Planner User</h2>${localForm}</div>`:""}
${churchSuiteOAuth?`<a class="ms churchsuite-signin" href="/auth/churchsuite?return=${encodeURIComponent(returnTo)}">Sign in with My ChurchSuite</a>`:""}
${microsoft?`<a class="ms" href="/auth/microsoft?return=${encodeURIComponent(returnTo)}">Sign in with @${microsoftDomain} SSO</a>`:""}
${externalSignInAvailable?`<details class="local-login"><summary>Sign in with OpenLP Planner User</summary>${localForm}</details>`:""}</div></main></body></html>`;
}

async function microsoftMetadata(env:Cloudflare.Env){
  const tenant=encodeURIComponent(String(envAny(env).MICROSOFT_TENANT_ID||allowedDomain(env)));
  const r=await fetch(`https://login.microsoftonline.com/${tenant}/v2.0/.well-known/openid-configuration`);
  if(!r.ok)throw new Error("Microsoft OpenID configuration could not be loaded.");
  return r.json<any>();
}
async function verifyMicrosoftIdToken(env:Cloudflare.Env,idToken:string,nonce:string){
  const bits=idToken.split("."); if(bits.length!==3)throw new Error("Microsoft returned an invalid ID token.");
  const header=JSON.parse(new TextDecoder().decode(fromB64url(bits[0])));
  const claims=JSON.parse(new TextDecoder().decode(fromB64url(bits[1])));
  const meta=await microsoftMetadata(env);
  const jwks=await (await fetch(meta.jwks_uri)).json<any>();
  if(String(header.alg||"")!=="RS256")throw new Error("Microsoft ID token signing algorithm is invalid.");
  const jwk=(jwks.keys||[]).find((k:any)=>k.kid===header.kid);
  if(!jwk)throw new Error("Microsoft token signing key was not found.");
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const ok=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,fromB64url(bits[2]),new TextEncoder().encode(`${bits[0]}.${bits[1]}`));
  if(!ok)throw new Error("Microsoft ID token signature is invalid.");
  const now=Math.floor(Date.now()/1000),clientId=String(envAny(env).MICROSOFT_CLIENT_ID||"");
  if(String(claims.aud)!==clientId)throw new Error("Microsoft token audience is invalid.");
  if(Number(claims.exp||0)<=now)throw new Error("Microsoft sign-in has expired.");
  if(Number(claims.iat||0)>now+300)throw new Error("Microsoft token issue time is invalid.");
  if(claims.nbf!==undefined && Number(claims.nbf)>now+300)throw new Error("Microsoft token is not yet valid.");
  if(String(claims.nonce||"")!==nonce)throw new Error("Microsoft sign-in nonce is invalid or missing.");
  if(meta.issuer&&String(claims.iss)!==String(meta.issuer))throw new Error("Microsoft token issuer is invalid.");
  return claims;
}


export async function handleAuthRequest(request:Request,env:Cloudflare.Env):Promise<Response|null>{
  const url=new URL(request.url);
  if(url.pathname==="/auth/session-status"&&request.method==="GET"){
    const user=await getAuthUser(request,env);
    return new Response(JSON.stringify({
      authenticated:!!user,
      email:user?.email||null,
      accessLevel:user?.accessLevel||null,
      authMethod:user?.authMethod||null
    },null,2),{headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
  }

  if(url.pathname==="/auth/config-status"&&request.method==="GET"){
    const status=microsoftConfigStatus(env);
    return new Response(JSON.stringify({
      microsoft:{
        configured:status.configured,
        MICROSOFT_CLIENT_ID:status.clientId,
        MICROSOFT_CLIENT_SECRET:status.clientSecret,
        MICROSOFT_TENANT_ID:status.tenantId,
        MICROSOFT_ALLOWED_DOMAIN:status.allowedDomain
      },
      myChurchSuite:(()=>{
        const cs=churchSuiteOAuthConfigStatus(env);
        return {
          configured:cs.configured,
          CHURCHSUITE_OIDC_CLIENT_ID:cs.clientId,
          CHURCHSUITE_OIDC_CLIENT_SECRET:cs.clientSecret
        };
      })()
    },null,2),{
      headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
    });
  }

  if(url.pathname==="/admin-recovery"&&request.method==="GET"){
    if(!adminRecoveryToken(env))return new Response("Not found",{status:404,headers:{"cache-control":"no-store"}});
    return new Response(adminRecoveryPage(url.searchParams.get("error")||"",url.searchParams.get("success")||""),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
  }
  if(url.pathname==="/auth/admin-recovery"&&request.method==="POST"){
    if(!adminRecoveryToken(env))return new Response("Not found",{status:404,headers:{"cache-control":"no-store"}});
    if(!sameOriginUnsafeAuthRequest(request))return new Response("Cross-origin request rejected.",{status:403,headers:{"cache-control":"no-store"}});
    const form=await request.formData(),supplied=String(form.get("recoveryToken")||"");
    const email=String(form.get("email")||"").trim().toLowerCase(),password=String(form.get("password")||""),confirmPassword=String(form.get("confirmPassword")||"");
    const fail=(message:string)=>Response.redirect(`${url.origin}/admin-recovery?error=${encodeURIComponent(message)}`,303);
    if(!await secureTextEquals(supplied,adminRecoveryToken(env)))return fail("Recovery token was not accepted.");
    if(password.length<12)return fail("Use a password of at least 12 characters.");
    if(password.length>1024)return fail("Password is too long.");
    if(password!==confirmPassword)return fail("The new passwords do not match.");
    const row=await userByEmail(env,email);
    if(!row||Number(row.disabled||0)||Number(row.access_level||0)!==3||row.auth_method!=="local")return fail("That email is not an enabled local Administrator account.");
    const hashed=await passwordHash(password);
    await env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,failed_login_count=0,locked_until=NULL,updated_at=datetime('now') WHERE email=?`).bind(hashed.hash,hashed.salt,hashed.iterations,email).run();
    await env.DB.prepare("DELETE FROM auth_sessions WHERE email=?").bind(email).run();
    return Response.redirect(`${url.origin}/admin-recovery?success=${encodeURIComponent("Administrator password reset. Existing sessions were signed out. Remove the recovery token from the hosting environment now.")}`,303);
  }

  if(url.pathname==="/setup"&&request.method==="GET"){
    if(await enabledAdministratorExists(env))return Response.redirect(`${url.origin}/login`,303);
    if(!setupToken(env)){
      return Response.redirect(`${url.origin}/login?error=${encodeURIComponent("Initial setup is not enabled on this server.")}`,303);
    }
    return new Response(setupPage(env,url.searchParams.get("error")||""),{
      headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}
    });
  }

  if(url.pathname==="/auth/setup"&&request.method==="POST"){
    if(!sameOriginUnsafeAuthRequest(request))return new Response("Cross-origin request rejected.",{status:403});
    if(await enabledAdministratorExists(env))return Response.redirect(`${url.origin}/login`,303);
    const configuredToken=setupToken(env);
    if(!configuredToken)return Response.redirect(`${url.origin}/login`,303);

    const form=await request.formData();
    const suppliedToken=String(form.get("setupToken")||"");
    const email=String(form.get("email")||"").trim().toLowerCase();
    const displayName=String(form.get("displayName")||"").trim();
    const password=String(form.get("password")||"");

    if(!(await secureTextEquals(suppliedToken,configuredToken))){
      return Response.redirect(`${url.origin}/setup?error=${encodeURIComponent("The setup token is not correct.")}`,303);
    }

    try{
      await createLocalUser(env,{email,displayName,password,accessLevel:3});
      const session=await sessionFor(env,email);
      const headers=new Headers({location:"/","cache-control":"no-store"});
      headers.append("set-cookie",sessionCookie(session));
      return new Response(null,{status:303,headers});
    }catch(error:any){
      return Response.redirect(`${url.origin}/setup?error=${encodeURIComponent(String(error?.message||error))}`,303);
    }
  }

  if(url.pathname==="/login"&&request.method==="GET"){
    const existing=await getAuthUser(request,env);
    if(existing){
      const destination=await destinationForUser(env,existing,safeReturnTo(url.searchParams.get("return")));
      return Response.redirect(`${url.origin}${destination}`,303);
    }
    return new Response(await loginPage(env,safeReturnTo(url.searchParams.get("return")),url.searchParams.get("error")||""),{
      headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}
    });
  }
  if(url.pathname==="/auth/logout"){
    if(request.method!=="POST")return new Response("Method not allowed",{status:405,headers:{allow:"POST","cache-control":"no-store"}});
    if(!sameOriginUnsafeAuthRequest(request))return new Response("Cross-origin request rejected.",{status:403,headers:{"cache-control":"no-store"}});
    const token=cookies(request)[COOKIE];
    if(token)await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(await sha256Hex(token)).run();
    const h=new Headers({
      location:"/login",
      "cache-control":"no-store, private",
      pragma:"no-cache",
      "clear-site-data":"\"cache\", \"storage\""
    });
    h.append("set-cookie",clearSessionCookie());
    return new Response(null,{status:303,headers:h});
  }
  if(url.pathname==="/auth/local"&&request.method==="POST"){
    if(!sameOriginUnsafeAuthRequest(request)){
      return Response.redirect(`${url.origin}/login?error=${encodeURIComponent("Sign-in request was rejected.")}`,303);
    }
    const form=await request.formData(),email=String(form.get("email")||"").trim().toLowerCase();
    const password=String(form.get("password")||""),returnTo=safeReturnTo(String(form.get("return")||"/"));
    const passwordTooLong=password.length>1024;
    const row=await userByEmail(env,email);
    const locked=row?.locked_until&&new Date(String(row.locked_until).replace(" ","T")+"Z").getTime()>Date.now();
    let valid=false;
    if(row&&!passwordTooLong&&!locked&&!Number(row.disabled||0)&&row.auth_method==="local"&&row.password_hash&&row.password_salt){
      valid=await verifyPassword(
        password,
        String(row.password_salt),
        String(row.password_hash),
        Number(row.password_iterations||PBKDF2_ITERATIONS)
      );
    }
    if(!valid){
      if(row){
        // Do not let repeated requests extend an already-active lock forever.
        // Once a lock has expired, begin a fresh failure window.
        if(!locked){
          const hadExpiredLock=!!row.locked_until;
          const failures=(hadExpiredLock?0:Number(row.failed_login_count||0))+1;
          await env.DB.prepare(`UPDATE users SET failed_login_count=?,
            locked_until=CASE WHEN ?>=5 THEN datetime('now','+15 minutes') ELSE NULL END,
            updated_at=datetime('now') WHERE email=?`).bind(failures,failures,email).run();
        }
      }else await passwordHash(passwordTooLong?"invalid-password":(password||"invalid-password"));
      return Response.redirect(`${url.origin}/login?return=${encodeURIComponent(returnTo)}&error=${encodeURIComponent("Email or password was not accepted.")}`,303);
    }
    const firstLogin=!row?.last_login_at;
    await env.DB.prepare("UPDATE users SET failed_login_count=0,locked_until=NULL,last_login_at=datetime('now') WHERE email=?").bind(email).run();
    const refreshed=await userByEmail(env,email);
    const signedInUser=await rowToUser(refreshed,"local");
    const destination=await destinationForUser(env,signedInUser,returnTo);
    const target=firstLogin?`/first-login?continue=${encodeURIComponent(destination)}`:destination;
    const token=await sessionFor(env,email),h=new Headers({location:target,"cache-control":"no-store"});
    h.append("set-cookie",sessionCookie(token));
    return new Response(null,{status:303,headers:h});
  }
  if(url.pathname==="/auth/churchsuite"&&request.method==="GET"){
    if(!(await churchSuiteOAuthSignInEnabled(env))){
      return Response.redirect(`${url.origin}/login?error=${encodeURIComponent("My ChurchSuite sign-in is not enabled.")}`,303);
    }
    try{
      const meta=await churchSuiteOidcMetadata();
      const state=randomToken(24),nonce=randomToken(24),returnTo=safeReturnTo(url.searchParams.get("return"));
      await env.DB.prepare(`INSERT INTO auth_oidc_states(state,nonce,code_verifier,return_to,created_at,expires_at)
        VALUES(?,?,?,?,datetime('now'),datetime('now','+10 minutes'))`)
        .bind(state,nonce,randomToken(48),returnTo).run();

      const q=new URLSearchParams({
        response_type:"code",
        client_id:String(envAny(env).CHURCHSUITE_OIDC_CLIENT_ID),
        scope:CHURCHSUITE_OIDC_SCOPE,
        state,
        nonce,
        redirect_uri:`${url.origin}/auth/churchsuite/callback`
      });
      return Response.redirect(`${meta.authorization_endpoint}?${q}`,302);
    }catch(error:any){
      return Response.redirect(`${url.origin}/login?error=${encodeURIComponent(String(error?.message||error))}`,303);
    }
  }

  if(url.pathname==="/auth/churchsuite/callback"&&request.method==="GET"){
    try{
      if(!(await churchSuiteOAuthSignInEnabled(env)))throw new Error("My ChurchSuite sign-in is not enabled.");
      const state=String(url.searchParams.get("state")||"");
      const code=String(url.searchParams.get("code")||"");
      const providerError=String(url.searchParams.get("error_description")||url.searchParams.get("error")||"");
      if(providerError)throw new Error(providerError);

      const saved=await env.DB.prepare(`SELECT state,nonce,return_to FROM auth_oidc_states
        WHERE state=? AND expires_at>datetime('now')`).bind(state).first<any>();
      if(!saved||!code)throw new Error("My ChurchSuite sign-in state is invalid or expired.");
      await env.DB.prepare("DELETE FROM auth_oidc_states WHERE state=?").bind(state).run();

      const meta=await churchSuiteOidcMetadata();
      const clientId=String(envAny(env).CHURCHSUITE_OIDC_CLIENT_ID||"").trim();
      const clientSecret=String(envAny(env).CHURCHSUITE_OIDC_CLIENT_SECRET||"").trim();
      const form=new URLSearchParams({
        code,
        client_id:clientId,
        redirect_uri:`${url.origin}/auth/churchsuite/callback`,
        grant_type:"authorization_code"
      });
      const tokenHeaders:Record<string,string>={
        "content-type":"application/x-www-form-urlencoded",
        "accept":"application/json"
      };
      const tokenAuthMethods=Array.isArray(meta.token_endpoint_auth_methods_supported)
        ? meta.token_endpoint_auth_methods_supported.map(String)
        : [];
      if(tokenAuthMethods.includes("client_secret_basic")){
        const bytes=new TextEncoder().encode(`${clientId}:${clientSecret}`);
        let raw=""; for(const b of bytes)raw+=String.fromCharCode(b);
        tokenHeaders.authorization=`Basic ${btoa(raw)}`;
      }else{
        // ChurchSuite's OIDC guide also illustrates credentials in the form
        // body, so retain that standards-compatible fallback if discovery ever
        // stops advertising client_secret_basic.
        form.set("client_secret",clientSecret);
      }
      const tokenResp=await fetch(String(meta.token_endpoint),{
        method:"POST",
        headers:tokenHeaders,
        body:form
      });
      let token:any={};
      try{token=await tokenResp.json<any>()}catch(_){}
      if(!tokenResp.ok||!token.id_token){
        throw new Error(token.error_description||token.error||"My ChurchSuite token exchange failed.");
      }

      const claims=await verifyChurchSuiteIdToken(env,String(token.id_token),String(saved.nonce),meta);
      const userInfo=token.access_token?await churchSuiteUserInfo(String(token.access_token),meta):null;
      if(userInfo?.sub && String(userInfo.sub)!==String(claims.sub)){
        throw new Error("My ChurchSuite UserInfo identity did not match the ID token.");
      }

      // ChurchSuite explicitly requires `sub` as the immutable unique person
      // identifier. Email is mutable/non-unique and must never be the linkage key.
      const subject=String(claims.sub||"").trim();
      const email=String(claims.email||userInfo?.email||"").trim().toLowerCase();
      const displayName=String(claims.name||userInfo?.name||`${claims.given_name||userInfo?.given_name||""} ${claims.family_name||userInfo?.family_name||""}`.trim()||friendly(email)).trim()||friendly(email);

      if(!subject)throw new Error("My ChurchSuite did not supply a stable user identity.");
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
        throw new Error("My ChurchSuite did not supply an email address for this person.");
      }

      let row=await env.DB.prepare(
        "SELECT email,display_name,auth_method,access_level,disabled,password_hash,password_salt,password_iterations,failed_login_count,locked_until,microsoft_oid,churchsuite_sub,last_login_at,microsoft_sso_enabled,churchsuite_sso_enabled FROM users WHERE churchsuite_sub=?"
      ).bind(subject).first<any>();

      if(!row){
        const emailRow=await userByEmail(env,email);
        if(emailRow){
          // Email is never sufficient by itself. An Administrator must have
          // explicitly enabled My ChurchSuite SSO for this existing account.
          if(!Number(emailRow.churchsuite_sso_enabled||0)){
            throw new Error("This email is already used by another Planner account. Ask a Planner Administrator to enable My ChurchSuite SSO for that account.");
          }
          if(String(emailRow.churchsuite_sub||"").trim()){
            throw new Error("This Planner account is already linked to a different My ChurchSuite identity.");
          }
          await env.DB.prepare("UPDATE users SET churchsuite_sub=?,updated_at=datetime('now') WHERE lower(email)=lower(?)")
            .bind(subject,email).run();
          row=await userByEmail(env,email);
        }else{
          // Every genuinely new My ChurchSuite person starts at minimum access.
          await env.DB.prepare(`INSERT INTO users(
            email,display_name,auth_method,access_level,disabled,churchsuite_sub,churchsuite_sso_enabled,created_at,updated_at
          ) VALUES(?,?,?,1,0,?,1,datetime('now'),datetime('now'))`)
          .bind(email,displayName,"churchsuite",subject).run();
          row=await userByEmail(env,email);
        }
      }

      const firstLogin=!row?.last_login_at;
      if(Number(row?.disabled||0))throw new Error("This planner account has been disabled.");
      if(!Number(row?.churchsuite_sso_enabled||0))throw new Error("My ChurchSuite SSO is not enabled for this Planner account.");

      // If the same ChurchSuite person later changes email, follow the immutable
      // `sub` identity and update the Planner email when it is not already used.
      const oldEmail=String(row.email||"").trim().toLowerCase();
      if(oldEmail!==email && row.churchsuite_sub && String(row.churchsuite_sub)===subject){
        const conflict=await userByEmail(env,email);
        if(conflict && String(conflict.churchsuite_sub||"")!==subject){
          throw new Error("The email returned by My ChurchSuite is already used by another Planner account.");
        }
        await env.DB.prepare("UPDATE users SET email=?,updated_at=datetime('now') WHERE churchsuite_sub=?")
          .bind(email,subject).run();
      }

      await env.DB.prepare(`UPDATE users SET
        churchsuite_sub=COALESCE(churchsuite_sub,?),
        display_name=CASE WHEN trim(COALESCE(display_name,''))='' THEN ? ELSE display_name END,
        auth_method=CASE
          WHEN auth_method='local' THEN auth_method
          WHEN microsoft_oid IS NOT NULL AND trim(microsoft_oid)<>'' THEN auth_method
          ELSE 'churchsuite'
        END,
        last_login_at=datetime('now'),
        updated_at=datetime('now')
        WHERE lower(email)=lower(?)`)
        .bind(subject,displayName,email).run();

      const currentRow=await userByEmail(env,email);
      const signedInUser=await rowToUser(currentRow,"churchsuite");
      const destination=await destinationForUser(env,signedInUser,safeReturnTo(saved.return_to));
      const target=firstLogin?`/first-login?continue=${encodeURIComponent(destination)}`:destination;
      const session=await sessionFor(env,email);
      const h=new Headers({location:target,"cache-control":"no-store"});
      h.append("set-cookie",sessionCookie(session));
      return new Response(null,{status:303,headers:h});
    }catch(error:any){
      return Response.redirect(`${url.origin}/login?error=${encodeURIComponent(String(error?.message||error))}`,303);
    }
  }

  if(url.pathname==="/auth/microsoft"&&request.method==="GET"){
    if(!(await microsoftSignInEnabled(env)))return Response.redirect(`${url.origin}/login?error=${encodeURIComponent("Microsoft SSO is not enabled.")}`,303);
    const meta=await microsoftMetadata(env),state=randomToken(24),nonce=randomToken(24),verifier=randomToken(48);
    const challenge=b64url(await sha256Bytes(verifier)),returnTo=safeReturnTo(url.searchParams.get("return"));
    await env.DB.prepare(`INSERT INTO auth_oidc_states(state,nonce,code_verifier,return_to,created_at,expires_at)
      VALUES(?,?,?,?,datetime('now'),datetime('now','+10 minutes'))`).bind(state,nonce,verifier,returnTo).run();
    const q=new URLSearchParams({client_id:String(envAny(env).MICROSOFT_CLIENT_ID),response_type:"code",
      redirect_uri:`${url.origin}/auth/microsoft/callback`,response_mode:"query",scope:"openid profile email",state,nonce,
      code_challenge:challenge,code_challenge_method:"S256"});
    return Response.redirect(`${meta.authorization_endpoint}?${q}`,302);
  }
  if(url.pathname==="/auth/microsoft/callback"&&request.method==="GET"){
    try{
      const state=String(url.searchParams.get("state")||""),code=String(url.searchParams.get("code")||"");
      const saved=await env.DB.prepare(`SELECT state,nonce,code_verifier,return_to FROM auth_oidc_states
        WHERE state=? AND expires_at>datetime('now')`).bind(state).first<any>();
      if(!saved||!code)throw new Error("Microsoft sign-in state is invalid or expired.");
      await env.DB.prepare("DELETE FROM auth_oidc_states WHERE state=?").bind(state).run();
      const meta=await microsoftMetadata(env),form=new URLSearchParams({client_id:String(envAny(env).MICROSOFT_CLIENT_ID),
        client_secret:String(envAny(env).MICROSOFT_CLIENT_SECRET),grant_type:"authorization_code",code,
        redirect_uri:`${url.origin}/auth/microsoft/callback`,code_verifier:String(saved.code_verifier),scope:"openid profile email"});
      const tokenResp=await fetch(meta.token_endpoint,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:form});
      const token=await tokenResp.json<any>();
      if(!tokenResp.ok||!token.id_token)throw new Error(token.error_description||"Microsoft token exchange failed.");
      const claims=await verifyMicrosoftIdToken(env,String(token.id_token),String(saved.nonce));
      const email=String(claims.preferred_username||claims.email||"").trim().toLowerCase();
      const microsoftOid=String(claims.oid||claims.sub||"").trim();
      if(!microsoftOid)throw new Error("Microsoft did not supply a stable user identity.");
      if(!email.endsWith(`@${allowedDomain(env)}`))throw new Error(`Only @${allowedDomain(env)} Microsoft accounts may sign in.`);

      // Microsoft documents oid/sub as durable identity and preferred_username
      // as mutable display/login data. Resolve an already-linked account by the
      // stable identity first, not by email.
      let row=await userByMicrosoftOid(env,microsoftOid);
      if(row){
        const oldEmail=String(row.email||"").trim().toLowerCase();
        if(oldEmail!==email){
          const conflict=await userByEmail(env,email);
          if(conflict && String(conflict.microsoft_oid||"")!==microsoftOid){
            throw new Error("The email returned by Microsoft is already used by another Planner account.");
          }
          await env.DB.prepare("UPDATE users SET email=?,updated_at=datetime('now') WHERE microsoft_oid=?")
            .bind(email,microsoftOid).run();
          row=await userByMicrosoftOid(env,microsoftOid);
        }
      }else{
        const emailRow=await userByEmail(env,email);
        if(emailRow){
          const linkedOid=String(emailRow.microsoft_oid||"").trim();
          if(linkedOid && linkedOid!==microsoftOid){
            throw new Error("This Planner account is already linked to a different Microsoft identity.");
          }
          // Email is not enough to link an identity. The Administrator must
          // explicitly enable Microsoft SSO for this existing account. Existing
          // linked Microsoft accounts are enabled by migration 0019.
          if(!linkedOid && !Number(emailRow.microsoft_sso_enabled||0)){
            throw new Error("This email is already used by another Planner account. Ask a Planner Administrator to enable Microsoft SSO for that account.");
          }
          if(!linkedOid){
            await env.DB.prepare("UPDATE users SET microsoft_oid=?,updated_at=datetime('now') WHERE lower(email)=lower(?)")
              .bind(microsoftOid,email).run();
            row=await userByMicrosoftOid(env,microsoftOid);
          }else row=emailRow;
        }else{
          const bootstrapAdmin=await bootstrapAdminAllowed(env,email);
          if(!bootstrapAdmin && !(await microsoftDomainSelfEnrollEnabled(env))){
            throw new Error(`Your @${allowedDomain(env)} Microsoft account is valid, but automatic first-time access is disabled. Ask a Planner Administrator to add or approve your account.`);
          }
          await env.DB.prepare(`INSERT INTO users(email,display_name,auth_method,access_level,disabled,microsoft_oid,microsoft_sso_enabled,created_at,updated_at)
            VALUES(?,?,?,?,0,?,1,datetime('now'),datetime('now'))`)
            .bind(email,String(claims.name||friendly(email)),"microsoft",bootstrapAdmin?3:1,microsoftOid).run();
          row=await userByMicrosoftOid(env,microsoftOid);
        }
      }
      const firstLogin=!row?.last_login_at;
      if(Number(row?.disabled||0))throw new Error("This planner account has been disabled.");
      if(!Number(row?.microsoft_sso_enabled||0))throw new Error("Microsoft SSO is not enabled for this Planner account.");
      await env.DB.prepare(`UPDATE users SET auth_method=CASE WHEN auth_method='local' THEN auth_method ELSE 'microsoft' END,
        microsoft_oid=COALESCE(microsoft_oid,?),last_login_at=datetime('now'),updated_at=datetime('now') WHERE email=?`)
        .bind(microsoftOid,email).run();
      const currentRow=await userByMicrosoftOid(env,microsoftOid);
      const signedInUser=await rowToUser(currentRow,"microsoft");
      const destination=await destinationForUser(env,signedInUser,safeReturnTo(saved.return_to));
      const target=firstLogin?`/first-login?continue=${encodeURIComponent(destination)}`:destination;
      const session=await sessionFor(env,email),h=new Headers({location:target,"cache-control":"no-store"});
      h.append("set-cookie",sessionCookie(session));
      return new Response(null,{status:303,headers:h});
    }catch(error:any){
      return Response.redirect(`${url.origin}/login?error=${encodeURIComponent(String(error?.message||error))}`,303);
    }
  }
  return null;
}

export async function listUsers(env:Cloudflare.Env){
  const rows=await env.DB.prepare(`SELECT email,display_name,auth_method,access_level,disabled,last_login_at,created_at,password_hash,password_salt,
    microsoft_oid,churchsuite_sub,microsoft_sso_enabled,churchsuite_sso_enabled
    FROM users ORDER BY display_name COLLATE NOCASE,email COLLATE NOCASE`).all<any>();
  return (rows.results||[]).map((r:any)=>({
    email:r.email,
    displayName:r.display_name,
    authMethod:r.auth_method||"microsoft",
    microsoftLinked:!!String(r.microsoft_oid||"").trim(),
    myChurchSuiteLinked:!!String(r.churchsuite_sub||"").trim(),
    localPasswordEnabled:!!String(r.password_hash||"").trim()&&!!String(r.password_salt||"").trim(),
    microsoftSsoEnabled:!!Number(r.microsoft_sso_enabled||0),
    myChurchSuiteSsoEnabled:!!Number(r.churchsuite_sso_enabled||0),
    accessLevel:Number(r.access_level||1),
    disabled:!!Number(r.disabled||0),
    lastLoginAt:r.last_login_at||null,
    createdAt:r.created_at
  }));
}
export async function createLocalUser(env:Cloudflare.Env,input:any){
  const email=String(input.email||"").trim().toLowerCase(),displayName=String(input.displayName||"").trim()||friendly(email);
  const accessLevel=Math.max(1,Math.min(3,Number(input.accessLevel||1))),password=String(input.password||"");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw new Error("Enter a valid email address.");
  if(password.length<12)throw new Error("Local passwords must be at least 12 characters.");
  if(password.length>1024)throw new Error("Local passwords must be no more than 1024 characters.");
  if(await userByEmail(env,email))throw new Error("A user with that email already exists.");
  const p=await passwordHash(password);
  await env.DB.prepare(`INSERT INTO users(email,display_name,auth_method,access_level,disabled,password_hash,password_salt,password_iterations,created_at,updated_at)
    VALUES(?,?,?, ?,0,?,?,?,datetime('now'),datetime('now'))`)
    .bind(email,displayName,"local",accessLevel,p.hash,p.salt,p.iterations).run();
}
export async function updateManagedUser(env:Cloudflare.Env,email:string,input:any,currentEmail:string){
  const row=await userByEmail(env,email);if(!row)throw new Error("User not found.");
  const accessLevel=Math.max(1,Math.min(3,Number(input.accessLevel??row.access_level??1)));
  const disabled=input.disabled===undefined?!!Number(row.disabled||0):!!input.disabled;
  if(email.toLowerCase()===currentEmail.toLowerCase()&&(disabled||accessLevel<3))throw new Error("You cannot disable or remove your own administrator access.");
  const displayName=String(input.displayName||row.display_name||email).trim();
  const microsoftSsoEnabled=input.microsoftSsoEnabled===undefined?!!Number(row.microsoft_sso_enabled||0):!!input.microsoftSsoEnabled;
  const churchSuiteSsoEnabled=input.myChurchSuiteSsoEnabled===undefined?!!Number(row.churchsuite_sso_enabled||0):!!input.myChurchSuiteSsoEnabled;
  const localPasswordEnabled=!!String(row.password_hash||"").trim()&&!!String(row.password_salt||"").trim();
  const microsoftUsable=microsoftSsoEnabled && await microsoftSignInEnabled(env);
  const churchSuiteUsable=churchSuiteSsoEnabled && await churchSuiteOAuthSignInEnabled(env);
  if(!disabled&&!localPasswordEnabled&&!microsoftUsable&&!churchSuiteUsable){
    throw new Error("Leave at least one currently usable login method enabled, or disable this account. An SSO method does not count while it is disabled for the installation.");
  }
  await env.DB.prepare(`UPDATE users SET display_name=?,access_level=?,disabled=?,microsoft_sso_enabled=?,churchsuite_sso_enabled=?,updated_at=datetime('now') WHERE email=?`)
    .bind(displayName,accessLevel,disabled?1:0,microsoftSsoEnabled?1:0,churchSuiteSsoEnabled?1:0,email).run();
  const providerRevoked=(!!Number(row.microsoft_sso_enabled||0)&&!microsoftSsoEnabled) || (!!Number(row.churchsuite_sso_enabled||0)&&!churchSuiteSsoEnabled);
  if(disabled || providerRevoked)await env.DB.prepare("DELETE FROM auth_sessions WHERE email=?").bind(email).run();
}
export async function resetLocalUserPassword(env:Cloudflare.Env,email:string,password:string){
  const row=await userByEmail(env,email);
  if(!row||row.auth_method!=="local")throw new Error("That is not a local-password account.");
  if(password.length<12)throw new Error("Local passwords must be at least 12 characters.");
  if(password.length>1024)throw new Error("Local passwords must be no more than 1024 characters.");
  const p=await passwordHash(password);
  await env.DB.prepare(`UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,failed_login_count=0,
    locked_until=NULL,updated_at=datetime('now') WHERE email=?`).bind(p.hash,p.salt,p.iterations,email).run();
  await env.DB.prepare("DELETE FROM auth_sessions WHERE email=?").bind(email).run();
}

export async function deleteManagedUser(env:Cloudflare.Env,email:string,currentEmail:string){
  const target=String(email||"").trim().toLowerCase();
  const current=String(currentEmail||"").trim().toLowerCase();
  if(!target)throw new Error("User email is required.");
  if(target===current)throw new Error("You cannot delete your own currently signed-in administrator account.");

  const row=await userByEmail(env,target);
  if(!row)throw new Error("User not found.");

  // Activity/audit history stores the actor/display name as historical text,
  // not a foreign-key dependency on users, so deleting the account leaves that
  // history intact.
  await env.DB.batch([
    env.DB.prepare("DELETE FROM auth_sessions WHERE lower(email)=lower(?)").bind(target),
    env.DB.prepare("DELETE FROM users WHERE lower(email)=lower(?)").bind(target)
  ]);

  return {
    ok:true,
    deletedEmail:target,
    authMethod:String(row.auth_method||"microsoft")
  };
}
