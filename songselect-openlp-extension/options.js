const DEFAULT_PLANNER_URL='';
const KEY='plannerUrl';
const input=document.getElementById('plannerUrl');
const status=document.getElementById('status');
const permissionStatus=document.getElementById('permissionStatus');

function normalise(value){
  const url=new URL(String(value||'').trim());
  if(!/^https?:$/.test(url.protocol))throw new Error('Use an http or https Planner address.');
  url.search='';
  url.hash='';
  if(!url.pathname.endsWith('/'))url.pathname+='/';
  return url.href;
}
function permissionPattern(urlString){
  const url=new URL(urlString);
  return `${url.origin}/*`;
}
async function refreshPermissionStatus(urlString){
  try{
    const url=normalise(urlString);
    const has=await chrome.permissions.contains({origins:[permissionPattern(url)]});
    permissionStatus.textContent=has
      ?'Planner site access: granted ✓'
      :'Planner site access: NOT granted — click Save and approve access.';
  }catch(_){
    permissionStatus.textContent='';
  }
}
async function load(){
  const stored=await chrome.storage.sync.get(KEY);
  input.value=stored?.[KEY]||DEFAULT_PLANNER_URL;
  await refreshPermissionStatus(input.value);
}
input.addEventListener('input',()=>refreshPermissionStatus(input.value));
document.getElementById('reset').onclick=()=>{
  input.value='';
  status.textContent='';
  permissionStatus.textContent='Enter your deployed Planner URL, then click Save.';
};
document.getElementById('save').onclick=async()=>{
  status.textContent='';
  try{
    const url=normalise(input.value);
    const pattern=permissionPattern(url);
    const granted=await chrome.permissions.request({origins:[pattern]});
    if(!granted)throw new Error('Permission to the Planner site was not granted.');
    await chrome.storage.sync.set({[KEY]:url});
    input.value=url;
    status.textContent='Saved ✓';
    await refreshPermissionStatus(url);
  }catch(error){
    status.textContent=error?.message||String(error);
  }
};
load().catch(error=>{status.textContent=error?.message||String(error);});
