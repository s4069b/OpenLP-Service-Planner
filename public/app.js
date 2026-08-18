
const STORAGE_KEY='openlp-service-planner-v11';
const SONGS_KEY='openlp-service-planner-v11-songs';
const LAST_SCREEN_KEY='openlp-service-planner-last-screen-v1';

let authenticatedUser=null;
let microsoftAllowedDomain='configured Microsoft domain';
const editorNameKey='openlp-service-planner-editor-name';
function currentEditor(){
  if(authenticatedUser?.displayName) return authenticatedUser.displayName;
  try{return localStorage.getItem(editorNameKey)||'Steve';}catch(_){return 'Steve';}
}
function setCurrentEditor(name){
  try{localStorage.setItem(editorNameKey,name||'Steve');}catch(_){}
  const avatar=document.querySelector('.avatar');
  if(avatar){
    const initials=(name||'Steve').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('');
    avatar.textContent=initials||'ME';
    avatar.title=`${name||'Steve'} · Profile and settings`;
  }
}
function applyAccessVisibility(){
  const level=Number(authenticatedUser?.accessLevel||2);
  if($('#settingsBtn'))$('#settingsBtn').hidden=level<3;
}


const defaultServices=[
  {
    id:'svc-2026-08-16-am',
    title:'Morning Service',
    dateISO:'2026-08-16',
    date:'Sunday 16 August 2026',
    theme:'KSSS (am) white',
    published:false,
    items:[
      {id:1, type:'text', title:'Welcome', person:'Steve', notes:'Brief welcome and call to worship', projected:false, ready:true, by:currentEditor(), changed:'8:42am'},
      {id:2, type:'song', songId:237, title:'Only A Holy God', person:'Music', projected:true, ready:true, detail:'Usual arrangement', verse:'v1 v2 c1 v3 c1 v4 c1 c1', musicNote:'Usually in D', by:'Sarah', changed:'9:03am'},
      {id:3, type:'images', title:'Notices', person:'Steve', projected:true, ready:true, detail:'6 images · autoplay loop · 7 sec', autoplay:'loop', interval:7, by:'Mary', changed:'9:24am'},
      {id:4, type:'text', title:'Prayer', person:'David', projected:false, ready:true, notes:'Prayer for church family and mission partners', by:'David', changed:'9:30am'},
      {id:5, type:'bible', title:'Bible Reading', person:'Peter', projected:true, ready:false, detail:'Romans 8:1–17', passage:'Romans 8:1–17', by:currentEditor(), changed:'9:34am'},
      {id:6, type:'images', title:'Sermon', person:'John', projected:true, ready:true, detail:'24 images', notes:'Life in the Spirit', autoplay:'off', interval:0, by:'John', changed:'9:41am'},
      {id:7, type:'video', title:'Mission Video', person:'', projected:true, ready:true, detail:'mission-update.mp4 · auto start', autoStart:true, by:'Mary', changed:'9:44am'},
      {id:8, type:'song', title:'In Christ Alone', person:'Music', projected:true, ready:true, detail:'Usual arrangement', verse:'v1 v2 v3 v4', musicNote:'Capo 2', by:'Sarah', changed:'9:47am'},
      {id:9, type:'text', title:'Closing Prayer', person:'John', projected:false, ready:true, by:'John', changed:'9:48am'}
    ],
    activity:[
      ['Sarah','added In Christ Alone','9:47am'],
      ['Mary','added Mission Video','9:44am'],
      ['John','added 24 sermon images','9:41am'],
      [currentEditor(),'added Bible Reading','9:34am'],
      ['David','updated Prayer notes','9:30am']
    ]
  },
  {
    id:'svc-2026-08-16-pm',
    title:'Night Service',
    dateISO:'2026-08-16',
    date:'Sunday 16 August 2026',
    theme:'KSSS (am)',
    published:false,
    items:[
      {id:101,type:'text',title:'Welcome',person:'Alex',projected:false,ready:true,by:'Alex',changed:'Yesterday'},
      {id:102,type:'song',title:'All Glory Be To Christ',person:'Music',projected:true,ready:true,detail:'Usual arrangement',verse:'v1 c1 v2 c1 v3 c1',musicNote:'Usually in G',by:'Alex',changed:'Yesterday'},
      {id:103,type:'text',title:'Prayer',person:'Alex',projected:false,ready:true,by:'Alex',changed:'Yesterday'},
      {id:104,type:'images',title:'Sermon',person:'',projected:true,ready:false,detail:'Waiting for slides',autoplay:'off',interval:0,by:'Alex',changed:'Yesterday'}
    ],
    activity:[['Alex','created Night Service','Yesterday']]
  },
  {
    id:'svc-2026-08-23-am',
    title:'Morning Service',
    dateISO:'2026-08-23',
    date:'Sunday 23 August 2026',
    theme:'KSSS (am) white',
    published:false,
    items:[
      {id:201,type:'text',title:'Welcome',person:'',projected:false,ready:true,by:currentEditor(),changed:'Today'},
      {id:202,type:'text',title:'Prayer',person:'',projected:false,ready:true,by:currentEditor(),changed:'Today'},
      {id:203,type:'images',title:'Sermon',person:'',projected:true,ready:false,detail:'Waiting for slides',autoplay:'off',interval:0,by:currentEditor(),changed:'Today'}
    ],
    activity:[[currentEditor(),'created Morning Service','Today']]
  },
  {
    id:'svc-2026-08-09-am',
    title:'Morning Service',
    dateISO:'2026-08-09',
    date:'Sunday 9 August 2026',
    theme:'KSSS (am) white',
    published:true,
    items:[
      {id:301,type:'text',title:'Welcome',person:'Steve',projected:false,ready:true,by:currentEditor(),changed:'9 Aug'},
      {id:302,type:'song',title:'Yet Not I But Through Christ In Me',person:'Music',projected:true,ready:true,verse:'v1 c1 v2 c1 v3 c1 v4 c1',musicNote:'Usually in C',by:'Sarah',changed:'9 Aug'},
      {id:303,type:'images',title:'Sermon',person:'John',projected:true,ready:true,detail:'22 images',autoplay:'off',by:'John',changed:'9 Aug'}
    ],
    activity:[[currentEditor(),'published OpenLP service','9 Aug']]
  }
];

function loadPlannerState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      // An empty service array is a valid saved Planner state. Older builds
      // treated zero services as "no saved state" and resurrected the bundled
      // defaults after deletion.
      if(parsed && Array.isArray(parsed.services)) return parsed;
    }
  }catch(_){}
  return {
    revision:0,
    activeServiceId:'svc-2026-08-16-am',
    settings:{
      retainPastServices:12,
      defaultMorningTheme:'KSSS (am) white',
      defaultNightTheme:'KSSS (am)',
      libraryImportedAt:'13 Aug 2026',
      libraryFileName:'songs.sqlite',
      librarySongCount:332
    },
    services:structuredClone(defaultServices)
  };
}

const state=loadPlannerState();
state.services=Array.isArray(state.services)?state.services:[];
if(state.settings?.churchSuiteDefaultImportMode==='mapped')state.settings.churchSuiteDefaultImportMode='all';
state.settings=state.settings||{};
if(!state.settings.timeZone)state.settings.timeZone='Australia/Brisbane';
if(!Array.isArray(state.settings.serviceTemplates))state.settings.serviceTemplates=[];
if(!state.settings.defaultTemplateByServiceType||typeof state.settings.defaultTemplateByServiceType!=='object')state.settings.defaultTemplateByServiceType={};
if(!state.settings.serviceTemplateOverrideByServiceId||typeof state.settings.serviceTemplateOverrideByServiceId!=='object')state.settings.serviceTemplateOverrideByServiceId={};

function serviceTemplates(){return Array.isArray(state.settings.serviceTemplates)?state.settings.serviceTemplates:[];}
function serviceTemplateById(id){return serviceTemplates().find(t=>String(t.id)===String(id));}
function configuredDefaultTemplateIdForService(service){
  const serviceTypeId=String(service?.serviceTypeId||'');
  return serviceTypeId?String(state.settings.defaultTemplateByServiceType?.[serviceTypeId]||''):'';
}
function defaultTemplateIdForService(service){
  const serviceId=String(service?.id||'');
  const overrides=state.settings.serviceTemplateOverrideByServiceId||{};
  if(serviceId && Object.prototype.hasOwnProperty.call(overrides,serviceId)){
    const value=String(overrides[serviceId]||'');
    return value==='__none__'?'':value;
  }
  return configuredDefaultTemplateIdForService(service);
}
function serviceTemplateChoiceLabel(service){
  const effective=defaultTemplateIdForService(service);
  const configured=configuredDefaultTemplateIdForService(service);
  const overrides=state.settings.serviceTemplateOverrideByServiceId||{};
  const hasOverride=!!service?.id&&Object.prototype.hasOwnProperty.call(overrides,String(service.id));
  if(!effective)return hasOverride?'No template · service override':'No template';
  const name=serviceTemplateById(effective)?.name||'Template';
  return hasOverride?`${name} · service override`:configured&&effective===configured?`${name} · default`:name;
}
function defaultTemplateIdForPlanTitle(title){
  const mapped=churchSuiteMappedServiceType(title||'');
  return mapped?.serviceTypeId?String(state.settings.defaultTemplateByServiceType?.[String(mapped.serviceTypeId)]||''):'';
}
function churchSuiteTemplateServiceType(planTitle,existing=null){
  if(existing?.serviceTypeId)return serviceTypeById(existing.serviceTypeId)||{
    id:String(existing.serviceTypeId),
    name:String(existing.serviceTypeName||planTitle||'Service')
  };
  const mapped=churchSuiteMappedServiceType(planTitle||'');
  if(mapped?.serviceTypeId){
    const type=serviceTypeById(mapped.serviceTypeId);
    if(type)return type;
  }
  const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const titleNorm=norm(planTitle);
  return regularServiceTypes()
    .filter(type=>titleNorm.startsWith(norm(type.name)))
    .sort((a,b)=>norm(b.name).length-norm(a.name).length)[0]||null;
}
function importModeLabel(mode,templateId=''){
  if(mode==='template')return `Template: ${serviceTemplateById(templateId)?.name||'Choose template'}`;
  return mode==='songs'?'Songs only':mode==='select'?'Selected Types':'All configured Types';
}

const DEFAULT_REGULAR_SERVICE_TYPES=[
  {id:'morning-church',name:'Morning Church',weekday:0,defaultTheme:state.settings.defaultMorningTheme||'KSSS (am) white'},
  {id:'nightchurch',name:'NightChurch',weekday:0,defaultTheme:state.settings.defaultNightTheme||'KSSS (am)'}
];
function slugServiceType(value){
  const base=String(value||'service').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return base||`service-${Date.now()}`;
}
function regularServiceTypes(){
  const rows=Array.isArray(state.settings.regularServiceTypes)
    ?state.settings.regularServiceTypes
    :DEFAULT_REGULAR_SERVICE_TYPES;
  return rows.map((x,i)=>({
    id:String(x.id||slugServiceType(x.name||`service-${i+1}`)),
    name:String(x.name||`Regular service ${i+1}`),
    weekday:Number.isInteger(Number(x.weekday))?Number(x.weekday):0,
    defaultTheme:String(x.defaultTheme||'Default')
  }));
}
function serviceTypeById(id){
  return regularServiceTypes().find(x=>String(x.id)===String(id));
}
function plannerThemeNames(){
  return [...new Set([
    'Default',
    'KSSS (am) white',
    'KSSS (am)',
    ...((state.settings.customThemes||[]).map(x=>String(x||'').trim()).filter(Boolean))
  ])];
}
function churchSuiteServiceMappings(){
  return Array.isArray(state.settings.churchSuiteServiceMappings)
    ?state.settings.churchSuiteServiceMappings.map(x=>({
        churchSuiteName:String(x.churchSuiteName||'').trim(),
        plannerTypeId:String(x.plannerTypeId||'one-off')
      })).filter(x=>x.churchSuiteName)
    :[];
}
function inferChurchSuitePlannerTypeId(planTitle){
  const title=String(planTitle||'').trim().toLowerCase();
  if(!title)return 'one-off';

  // Prefer the longest matching regular service name so more-specific types
  // win when one configured name is a prefix of another.
  const matches=regularServiceTypes()
    .filter(t=>title.startsWith(String(t.name||'').trim().toLowerCase()))
    .sort((a,b)=>String(b.name||'').length-String(a.name||'').length);

  return matches[0]?.id||'one-off';
}
function churchSuitePlanSelectionGroup(planTitle){
  const title=String(planTitle||'').trim();
  const lower=title.toLowerCase();
  const match=regularServiceTypes()
    .filter(t=>lower.startsWith(String(t.name||'').trim().toLowerCase()))
    .sort((a,b)=>String(b.name||'').length-String(a.name||'').length)[0];
  if(match)return {key:`type:${match.id}`,label:String(match.name||title)};

  const mapped=churchSuiteServiceMappings().find(x=>String(x.churchSuiteName||'').trim().toLowerCase()===lower);
  if(mapped?.plannerTypeId&&mapped.plannerTypeId!=='one-off'){
    const type=serviceTypeById(mapped.plannerTypeId);
    if(type)return {key:`type:${type.id}`,label:String(type.name||title)};
  }

  // For an unmapped title, use the leading words before the usual title
  // separators. This keeps useful ChurchSuite prefixes available without
  // making assumptions about the remainder of the event title.
  const prefix=title.split(/\s+(?:[-–—|:]|\d{1,2}[:.]\d{2})/)[0].trim();
  return {key:`prefix:${prefix.toLowerCase()}`,label:prefix||title||'Other'};
}

function churchSuiteMappedServiceType(planTitle){
  const title=String(planTitle||'').trim().toLowerCase();
  const row=churchSuiteServiceMappings().find(x=>x.churchSuiteName.toLowerCase()===title);

  // A saved explicit mapping always wins, including an explicit One-off choice.
  const plannerTypeId=row?.plannerTypeId||inferChurchSuitePlannerTypeId(planTitle);

  if(plannerTypeId==='one-off'){
    return {
      kind:'event',
      serviceTypeId:null,
      serviceTypeName:'One-off services',
      mapped:!!row,
      inferred:!row
    };
  }

  const type=serviceTypeById(plannerTypeId);
  return type
    ?{
        kind:'regular',
        serviceTypeId:type.id,
        serviceTypeName:type.name,
        defaultTheme:type.defaultTheme,
        mapped:!!row,
        inferred:!row
      }
    :{
        kind:'event',
        serviceTypeId:null,
        serviceTypeName:'One-off services',
        mapped:!!row,
        inferred:!row
      };
}
function inferRegularServiceType(service){
  if(service?.kind==='event')return null;
  if(service?.serviceTypeId){
    return serviceTypeById(service.serviceTypeId)||{
      id:String(service.serviceTypeId),
      name:String(service.serviceTypeName||service.title||'Regular service'),
      weekday:new Date(`${service.dateISO||'2026-01-04'}T12:00:00`).getDay(),
      defaultTheme:String(service.theme||'Default')
    };
  }
  const title=String(service?.title||'').toLowerCase().replace(/\s+/g,'');
  if(title.includes('night'))return serviceTypeById('nightchurch')||DEFAULT_REGULAR_SERVICE_TYPES[1];
  if(title.includes('morning'))return serviceTypeById('morning-church')||DEFAULT_REGULAR_SERVICE_TYPES[0];
  return regularServiceTypes().find(t=>String(t.name).toLowerCase()===String(service?.title||'').toLowerCase())||null;
}
function ensureRegularServiceTypeSetup(){
  if(!Array.isArray(state.settings.regularServiceTypes)||!state.settings.regularServiceTypes.length){
    state.settings.regularServiceTypes=DEFAULT_REGULAR_SERVICE_TYPES.map(x=>({...x}));
  }
  for(const service of state.services||[]){
    if(service.kind==='event'){
      service.serviceTypeId=null;
      service.serviceTypeName='One-off services';
      continue;
    }
    const type=inferRegularServiceType(service);
    if(type){
      service.kind='regular';
      service.serviceTypeId=type.id;
      service.serviceTypeName=type.name;
    }else{
      // Preserve an existing unrecognised regular service by adding it as a
      // configurable regular type rather than silently turning it into a one-off.
      const name=String(service.title||'Regular service');
      let id=slugServiceType(name);
      let n=2;
      while(state.settings.regularServiceTypes.some(t=>String(t.id)===id))id=`${slugServiceType(name)}-${n++}`;
      const weekday=service.dateISO?new Date(`${service.dateISO}T12:00:00`).getDay():0;
      const created={id,name,weekday,defaultTheme:String(service.theme||'Default')};
      state.settings.regularServiceTypes.push(created);
      service.kind='regular';
      service.serviceTypeId=id;
      service.serviceTypeName=name;
    }
  }
}
ensureRegularServiceTypeSetup();

function plannerTimeZone(){
  return state.settings?.timeZone||'Australia/Brisbane';
}
function formatActivityTime(value){
  if(!value)return '';
  const raw=String(value).trim();
  if(!raw)return '';
  if(/^just now$/i.test(raw))return 'just now';
  const normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? raw.replace(' ','T')+'Z'
    : raw;
  const d=new Date(normalized);
  if(Number.isNaN(d.getTime()))return raw;
  try{
    return new Intl.DateTimeFormat('en-AU',{
      timeZone:plannerTimeZone(),
      day:'numeric',month:'short',year:'numeric',
      hour:'numeric',minute:'2-digit'
    }).format(d);
  }catch(_){
    return raw;
  }
}

if(!state.settings.exportTransferHelp)state.settings.exportTransferHelp="Download the .osz file, then transfer it to the projection laptop using a USB drive or LocalSend. LocalSend only needs both devices on the same local network; the venue does not need internet access.";


function churchSuiteDuplicateScore(item){
  let score=0;
  if(item?.songId)score+=8;
  if(Array.isArray(item?.media)&&item.media.length)score+=8+item.media.length;
  if(item?.ready)score+=3;
  if(item?.churchSuiteWritePending)score+=2;
  if(item?.ignoreImages||item?.ignoreVideo||item?.ignoreBible)score+=2;
  if(item?.notes)score+=1;
  if(item?.verse)score+=1;
  return score;
}

function dedupeChurchSuiteItems(service){
  if(!service?.items?.length)return false;
  const bestBySource=new Map();
  const firstIndex=new Map();
  const localItems=[];
  let changed=false;

  service.items.forEach((item,index)=>{
    if(!item?.churchSuiteSourceId){
      localItems.push({item,index});
      return;
    }
    const key=String(item.churchSuiteSourceId);
    if(!firstIndex.has(key))firstIndex.set(key,index);
    const existing=bestBySource.get(key);
    if(!existing){
      bestBySource.set(key,item);
      return;
    }
    changed=true;
    if(churchSuiteDuplicateScore(item)>churchSuiteDuplicateScore(existing)){
      bestBySource.set(key,item);
    }
  });

  if(!changed)return false;

  const rows=[
    ...[...bestBySource.entries()].map(([sourceId,item])=>({item,index:firstIndex.get(sourceId)})),
    ...localItems
  ].sort((a,b)=>a.index-b.index);

  service.items=rows.map(x=>x.item);
  return true;
}

function dedupeAllChurchSuiteItems(){
  let changed=false;
  for(const service of state.services||[]){
    if(dedupeChurchSuiteItems(service))changed=true;
  }
  return changed;
}

function currentService(){
  return state.services.find(s=>s.id===state.activeServiceId) || state.services[0];
}
dedupeAllChurchSuiteItems();

// Older builds could leave the ChurchSuite account base URL on an otherwise
// unlinked service. A service-level link exists only when a real plan ID or
// identifier is attached.
for(const service of state.services||[]){
  if(!hasChurchSuitePlanReference(service)){
    service.churchSuitePlanUrl='';
    service.churchSuiteLastUpdated='';
  }
}


function markChurchSuiteOutOfSync(reason){
  const s=currentService();
  if(!s || !(s.churchSuitePlanId||s.churchSuitePlanIdentifier||s.churchSuitePlanUrl))return;
  s.churchSuiteOutOfSync=true;
  s.churchSuiteOutOfSyncReason=reason||'Local changes differ from ChurchSuite';
}
function clearChurchSuiteOutOfSync(service=currentService()){
  if(!service)return;
  service.churchSuiteOutOfSync=false;
  service.churchSuiteOutOfSyncReason='';
}

function markServiceEdited(action='edited service'){
  const s=currentService();
  if(!s) return;
  s.lastEditedAt=new Date().toISOString();
  s.lastEditedBy=currentEditor();
  s.lastEditedAction=action;
  persistPlanner();
}

function formatLastEdited(iso){
  if(!iso) return '';
  const d=new Date(iso);
  if(Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU',{
    timeZone:plannerTimeZone(),
    day:'numeric',month:'short',hour:'numeric',minute:'2-digit'
  }).format(d);
}

Object.defineProperties(state,{
  service:{get(){return currentService()}},
  items:{
    get(){return currentService()?.items||[]},
    set(v){const s=currentService();if(s)s.items=v}
  },
  activity:{
    get(){return currentService()?.activity||[]},
    set(v){const s=currentService();if(s)s.activity=v}
  },
  theme:{
    get(){return currentService()?.theme||'Default'},
    set(v){const s=currentService();if(s)s.theme=v}
  }
});


let remoteAvailable=false;
let remoteSaveTimer=null;
let remoteSaveInFlight=false;

const UNDO_LIMIT=12;
const undoStacks=new Map();
const redoStacks=new Map();
const undoBaselines=new Map();
let applyingUndo=false;

function undoCoreSnapshot(service){
  return structuredClone({
    title:service.title,
    dateISO:service.dateISO,
    date:service.date,
    theme:service.theme,
    published:!!service.published,
    kind:service.kind||'regular',
    items:service.items||[],
    churchSuiteOutOfSync:!!service.churchSuiteOutOfSync,
    churchSuiteOutOfSyncReason:service.churchSuiteOutOfSyncReason||''
  });
}
function undoSignature(snapshot){ return JSON.stringify(snapshot); }
function resetUndoBaseline(service=currentService()){
  if(!service)return;
  const snap=undoCoreSnapshot(service);
  undoBaselines.set(String(service.id),{snapshot:snap,signature:undoSignature(snap)});
  updateUndoButton();
}
function resetAllUndoBaselines(){
  undoBaselines.clear();
  for(const service of state.services||[]){
    const snap=undoCoreSnapshot(service);
    undoBaselines.set(String(service.id),{snapshot:snap,signature:undoSignature(snap)});
  }
  updateUndoButton();
}
function captureUndoChange(){
  if(applyingUndo)return;
  const service=currentService();
  if(!service)return;
  const key=String(service.id);
  const current=undoCoreSnapshot(service);
  const signature=undoSignature(current);
  const baseline=undoBaselines.get(key);
  if(!baseline){
    undoBaselines.set(key,{snapshot:current,signature});
    return;
  }
  if(signature===baseline.signature)return;
  const stack=undoStacks.get(key)||[];
  stack.push(baseline.snapshot);
  while(stack.length>UNDO_LIMIT)stack.shift();
  undoStacks.set(key,stack);
  redoStacks.set(key,[]);
  undoBaselines.set(key,{snapshot:current,signature});
  updateUndoButton();
}
function updateUndoButton(){
  const service=currentService();
  const key=service?String(service.id):'';
  const undoCount=service?(undoStacks.get(key)||[]).length:0;
  const redoCount=service?(redoStacks.get(key)||[]).length:0;

  const undo=document.querySelector('#undoBtn');
  if(undo){
    undo.disabled=!undoCount;
    undo.title=undoCount?`Undo last change (${undoCount} available)`:'Nothing to undo';
  }
  const redo=document.querySelector('#redoBtn');
  if(redo){
    redo.disabled=!redoCount;
    redo.title=redoCount?`Redo last undone change (${redoCount} available)`:'Nothing to redo';
  }
}

async function undoLastChange(){
  const service=currentService();
  if(!service)return;
  const key=String(service.id);
  const stack=undoStacks.get(key)||[];
  const previous=stack.pop();
  if(!previous)return;
  const currentSnapshot=undoCoreSnapshot(service);
  const redo=redoStacks.get(key)||[];
  redo.push(currentSnapshot);
  while(redo.length>UNDO_LIMIT)redo.shift();
  redoStacks.set(key,redo);
  const beforeIds=new Set((service.items||[]).map(i=>String(i.id)));
  applyingUndo=true;
  try{
    service.title=previous.title;
    service.dateISO=previous.dateISO;
    service.date=previous.date;
    service.theme=previous.theme;
    service.published=previous.published;
    service.kind=previous.kind;
    service.items=structuredClone(previous.items||[]);
    service.churchSuiteOutOfSync=!!previous.churchSuiteOutOfSync;
    service.churchSuiteOutOfSyncReason=previous.churchSuiteOutOfSyncReason||'';
    service.lastEditedAt=new Date().toISOString();
    service.lastEditedBy=currentEditor();
    service.lastEditedAction='undid last change';
    undoStacks.set(key,stack);
    resetUndoBaseline(service);
    persistPlanner();

    if(remoteAvailable){
      const restoredIds=new Set(service.items.map(i=>String(i.id)));
      for(const oldId of beforeIds){
        if(!restoredIds.has(oldId)) await deleteRemoteItem(service.id,oldId);
      }
      await saveServiceMeta();
      for(const item of service.items) await saveServiceItem(item);
      await saveItemOrder();
      appendAudit('undid last change');
    }
  }finally{
    applyingUndo=false;
  }
  render();
}


async function redoLastChange(){
  const service=currentService();
  if(!service)return;
  const key=String(service.id);
  const redo=redoStacks.get(key)||[];
  const next=redo.pop();
  if(!next)return;

  const currentSnapshot=undoCoreSnapshot(service);
  const undo=undoStacks.get(key)||[];
  undo.push(currentSnapshot);
  while(undo.length>UNDO_LIMIT)undo.shift();
  undoStacks.set(key,undo);
  redoStacks.set(key,redo);

  const beforeIds=new Set((service.items||[]).map(i=>String(i.id)));
  applyingUndo=true;
  try{
    service.title=next.title;
    service.dateISO=next.dateISO;
    service.date=next.date;
    service.theme=next.theme;
    service.published=next.published;
    service.kind=next.kind;
    service.items=structuredClone(next.items||[]);
    service.churchSuiteOutOfSync=!!next.churchSuiteOutOfSync;
    service.churchSuiteOutOfSyncReason=next.churchSuiteOutOfSyncReason||'';
    service.lastEditedAt=new Date().toISOString();
    service.lastEditedBy=currentEditor();
    service.lastEditedAction='redid last change';
    resetUndoBaseline(service);
    persistPlanner();

    if(remoteAvailable){
      const restoredIds=new Set(service.items.map(i=>String(i.id)));
      for(const oldId of beforeIds){
        if(!restoredIds.has(oldId))await deleteRemoteItem(service.id,oldId);
      }
      await saveServiceMeta();
      for(const item of service.items)await saveServiceItem(item);
      await saveItemOrder();
      appendAudit('redid last change');
    }
  }finally{
    applyingUndo=false;
  }
  render();
}


resetAllUndoBaselines();

function plannerPayload(){
  return {
    activeServiceId:state.activeServiceId,
    settings:state.settings,
    services:state.services
  };
}

function persistPlanner(){
  captureUndoChange();
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      revision:state.revision||0,
      ...plannerPayload()
    }));
    if(document.querySelector('#saveState')) document.querySelector('#saveState').textContent=remoteAvailable?'Saved':'Saved locally';
  }catch(_){
    if(document.querySelector('#saveState')) document.querySelector('#saveState').textContent='Not saved';
  }
}
async function saveRemotePlanner(){
  if(!remoteAvailable || remoteSaveInFlight) return;
  remoteSaveInFlight=true;
  try{
    const response=await fetch('/api/state',{
      method:'PUT',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        baseRevision:state.revision||0,
        payload:plannerPayload()
      })
    });

    if(redirectForExpiredPlannerSession(response))return;

    if(response.status===409){
      const conflict=await response.json().catch(()=>({}));
      if(document.querySelector('#saveState')) document.querySelector('#saveState').textContent='Changed elsewhere';
      state.remoteConflict=conflict;
      return;
    }

    if(!response.ok) throw new Error(`Save failed ${response.status}`);
    const result=await response.json();
    state.revision=result.revision;
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      revision:state.revision,
      ...plannerPayload()
    }));
    if(document.querySelector('#saveState')) document.querySelector('#saveState').textContent='Saved';
  }catch(err){
    console.warn(err);
    if(document.querySelector('#saveState')) document.querySelector('#saveState').textContent='Saved locally';
  }finally{
    remoteSaveInFlight=false;
  }
}


function redirectForExpiredPlannerSession(response){
  if(response?.status!==401)return false;
  const returnTo=`${location.pathname}${location.search}${location.hash||''}`;
  const target=`/login?return=${encodeURIComponent(returnTo)}&error=${encodeURIComponent('Your Planner session has expired. Please sign in again.')}`;
  location.replace(target);
  return true;
}

async function apiFetch(path, options={}){
  const response=await fetch(path,{
    credentials:'same-origin',
    headers:{'content-type':'application/json','accept':'application/json',...(options.headers||{})},
    ...options
  });
  if(redirectForExpiredPlannerSession(response)){
    throw new Error('Planner session expired.');
  }
  if(!response.ok){
    const data=await response.json().catch(()=>({}));
    throw new Error(data.error||`Request failed ${response.status}`);
  }
  return response.json();
}

async function saveServiceItem(item){
  if(!remoteAvailable) return;
  const service=currentService();
  try{
    await apiFetch(`/api/services/${encodeURIComponent(service.id)}/items/${encodeURIComponent(item.id)}`,{
      method:'PUT',
      body:JSON.stringify({item})
    });
  }catch(err){
    console.warn(err);
  }
}

async function saveServiceItemFor(serviceId,item){
  if(!remoteAvailable) return;
  try{
    await apiFetch(`/api/services/${encodeURIComponent(serviceId)}/items/${encodeURIComponent(item.id)}`,{
      method:'PUT',
      body:JSON.stringify({item})
    });
  }catch(err){
    console.warn(err);
  }
}

async function saveServiceMeta(){
  if(!remoteAvailable) return;
  const s=currentService();
  try{
    await apiFetch(`/api/services/${encodeURIComponent(s.id)}`,{
      method:'PUT',
      body:JSON.stringify({
        service:{
          id:s.id,title:s.title,dateISO:s.dateISO,date:s.date,theme:s.theme,
          published:!!s.published,kind:s.kind||'regular',
          downloadedForDeviceAt:s.downloadedForDeviceAt||null,
          downloadedSnapshot:s.downloadedSnapshot||null,
          lastEditedAt:s.lastEditedAt||null,
          lastEditedBy:s.lastEditedBy||null,
          lastEditedAction:s.lastEditedAction||null,
          churchSuitePlanId:s.churchSuitePlanId??null,
          churchSuitePlanIdentifier:s.churchSuitePlanIdentifier||null,
          churchSuitePlanUrl:s.churchSuitePlanUrl||null,
          churchSuiteLastUpdated:s.churchSuiteLastUpdated||null,
          churchSuiteLastSynced:s.churchSuiteLastSynced||null,
          churchSuiteImportMode:s.churchSuiteImportMode||null,
          serviceTemplateId:s.serviceTemplateId||null,
          churchSuiteOutOfSync:!!s.churchSuiteOutOfSync,
          churchSuiteOutOfSyncReason:s.churchSuiteOutOfSyncReason||null
        }
      })
    });
  }catch(err){
    console.warn(err);
  }
}

async function appendAudit(action, detail='',scope='service'){
  if(!remoteAvailable || scope==='library') return;
  const s=currentService();
  if(!s?.id)return;
  try{
    await apiFetch(`/api/services/${encodeURIComponent(s.id)}/audit`,{
      method:'POST',
      body:JSON.stringify({actor:currentEditor(),action,detail})
    });
  }catch(err){
    console.warn(err);
  }
}

async function saveActiveServiceRemote(serviceId){
  if(!remoteAvailable||!serviceId)return;
  try{
    await apiFetch('/api/active-service',{
      method:'PUT',
      body:JSON.stringify({serviceId:String(serviceId)})
    });
  }catch(err){
    console.warn('Could not save active service.',err);
  }
}

async function createRemoteService(service){
  if(!remoteAvailable) return;
  try{
    await apiFetch('/api/services',{
      method:'POST',
      body:JSON.stringify({service})
    });
  }catch(err){
    console.warn(err);
  }
}


async function deleteRemoteService(serviceId){
  if(!remoteAvailable)return {ok:true,localOnly:true,deleted:[String(serviceId)]};
  return apiFetch(`/api/services/${encodeURIComponent(serviceId)}`,{method:'DELETE'});
}

async function deleteRemoteServices(serviceIds){
  const ids=[...new Set((serviceIds||[]).map(String).filter(Boolean))];
  if(!ids.length)return {ok:true,deleted:[]};
  if(!remoteAvailable)return {ok:true,localOnly:true,deleted:ids};
  return apiFetch('/api/services/bulk-delete',{
    method:'POST',
    body:JSON.stringify({serviceIds:ids})
  });
}

async function removeServicesAfterConfirmedDelete(serviceIds,serverResult=null){
  const ids=new Set((serviceIds||[]).map(String));
  state.services=state.services.filter(service=>!ids.has(String(service.id)));
  state.activeServiceId=serverResult?.activeServiceId||(
    ids.has(String(state.activeServiceId)) ? (state.services[0]?.id||'') : state.activeServiceId
  );
  if(!state.services.length){
    state.activeServiceId='';
    rememberLastScreen('services');
  }
  persistPlanner();
}

async function deleteRemoteItem(serviceId,itemId){
  if(!remoteAvailable) return;
  try{
    await apiFetch(`/api/services/${encodeURIComponent(serviceId)}/items/${encodeURIComponent(itemId)}`,{
      method:'DELETE'
    });
  }catch(err){
    console.warn(err);
  }
}

async function saveItemOrder(){
  if(!remoteAvailable) return;
  const s=currentService();
  try{
    await apiFetch(`/api/services/${encodeURIComponent(s.id)}/order`,{
      method:'PUT',
      body:JSON.stringify({itemIds:s.items.map(x=>String(x.id))})
    });
  }catch(err){
    console.warn(err);
  }
}


async function saveLibrarySongRemote(song){
  if(!remoteAvailable) return {ok:true,localOnly:true};
  return apiFetch(`/api/songs/${encodeURIComponent(song.id)}`,{
    method:'PUT',
    body:JSON.stringify({song,actor:currentEditor()})
  });
}

async function latestSongRevision(songId){
  if(!remoteAvailable)return {available:false};
  try{
    return await apiFetch(`/api/songs/${encodeURIComponent(songId)}/history/latest`);
  }catch(_){
    return {available:false};
  }
}
async function restoreLatestSongRevision(songId){
  if(!remoteAvailable)throw new Error('Song version history is available on the shared Cloudflare library.');
  return apiFetch(`/api/songs/${encodeURIComponent(songId)}/history/restore-latest`,{method:'POST'});
}
function nextSongCopyId(){
  return `copy-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

async function createLibrarySongRemote(song){
  if(!remoteAvailable) return;
  try{
    await apiFetch('/api/songs',{
      method:'POST',
      body:JSON.stringify({song,actor:currentEditor()})
    });
  }catch(err){
    console.warn(err);
  }
}

async function deleteLibrarySongRemote(songId){
  if(!remoteAvailable)return {ok:true,localOnly:true};
  return apiFetch(`/api/songs/${encodeURIComponent(songId)}`,{method:'DELETE'});
}

function songServiceUsages(song){
  const usages=[];
  for(const service of state.services||[]){
    for(const item of service.items||[]){
      if(item.type!=='song')continue;
      if(String(item.songId||'')===String(song.id)){
        usages.push({service,item});
      }
    }
  }
  return usages;
}

function duplicateBaseTitle(title){
  return String(title||'')
    .trim()
    .replace(/\s*[—–-]\s*[^—–-]+$/,'')
    .replace(/\s*\([^()]{1,40}\)\s*$/,'')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}

function duplicateSongGroups(){
  const groups=[];
  const seen=new Set();

  for(const song of songs){
    if(seen.has(String(song.id)))continue;

    const base=duplicateBaseTitle(song.title);
    const ccli=String(song.ccliNumber||'').trim();
    const related=songs.filter(other=>{
      if(String(other.id)===String(song.id))return true;
      const sameCcli=!!ccli && ccli===String(other.ccliNumber||'').trim();
      const sameBase=!!base && base===duplicateBaseTitle(other.title);
      return sameCcli||sameBase;
    });

    if(related.length<2)continue;
    related.forEach(x=>seen.add(String(x.id)));

    const exactTitles=new Set(related.map(x=>String(x.title||'').trim().toLowerCase()));
    groups.push({
      key:ccli?`ccli:${ccli}`:`title:${base}`,
      label:ccli?`CCLI #${ccli}`:(related[0]?.title||'Duplicate songs'),
      exact:exactTitles.size===1,
      songs:related
    });
  }

  return groups.sort((a,b)=>String(a.label).localeCompare(String(b.label)));
}

function openDuplicateSongCleanup(){
  const groups=duplicateSongGroups();
  const selected=new Set();

  if(!groups.length){
    openSheet(`<h2>Remove duplicate songs</h2>
      <div class="success-card"><strong>No duplicate groups found.</strong><p>No exact duplicates or likely title-suffix variants were detected.</p></div>
      <div class="sheet-actions"><button class="primary" id="doneDuplicateSongs">Done</button></div>`);
    $('#doneDuplicateSongs').onclick=openSongLibrary;
    return;
  }

  openSheet(`<h2>Remove duplicate songs</h2>
    <p class="meta">This lists exact duplicates and likely variants with title suffixes. Nothing is deleted automatically. Songs currently used in a service are protected.</p>

    <div class="duplicate-song-groups">
      ${groups.map((group,gi)=>`
        <section class="duplicate-song-group">
          <div class="duplicate-song-group-title">
            <strong>${esc(group.label)}</strong>
            <span>${group.exact?'Exact duplicate title':'Duplicate / suffix variants'}</span>
          </div>
          ${group.songs.map(song=>{
            const usages=songServiceUsages(song);
            const protectedSong=usages.length>0;
            return `<label class="duplicate-song-row ${protectedSong?'duplicate-song-protected':''}">
              <input type="checkbox" data-duplicate-song="${esc(String(song.id))}" ${protectedSong?'disabled':''}>
              <span class="duplicate-song-main">
                <strong>${esc(song.title)}</strong>
                <small>${song.authors?.length?esc(song.authors.join(', ')):'No author'}${song.ccliNumber?` · CCLI #${esc(song.ccliNumber)}`:''}</small>
              </span>
              <span class="duplicate-song-usage">${protectedSong?`Used in ${usages.length} service${usages.length===1?'':'s'} — protected`:'Not used in a service'}</span>
            </label>`;
          }).join('')}
        </section>`).join('')}
    </div>

    <div class="sheet-actions">
      <button class="secondary" id="backDuplicateSongs">Back</button>
      <button class="danger solid-danger" id="deleteDuplicateSongs" disabled>Delete selected</button>
    </div>`);

  const deleteBtn=$('#deleteDuplicateSongs');
  const update=()=>{
    deleteBtn.disabled=!selected.size;
    deleteBtn.textContent=selected.size?`Delete selected (${selected.size})`:'Delete selected';
  };

  body.querySelectorAll('[data-duplicate-song]').forEach(box=>{
    box.onchange=()=>{
      const id=String(box.dataset.duplicateSong);
      if(box.checked)selected.add(id);else selected.delete(id);
      update();
    };
  });
  $('#backDuplicateSongs').onclick=openSongLibrary;
  update();

  deleteBtn.onclick=()=>{
    const chosen=songs.filter(song=>selected.has(String(song.id)));
    if(!chosen.length)return;

    openSheet(`<h2>Confirm duplicate deletion</h2>
      <div class="warning-card">
        <strong>Delete ${chosen.length} song${chosen.length===1?'':'s'} from the shared library?</strong>
        <p>${chosen.map(song=>esc(song.title)).join('<br>')}</p>
      </div>
      <p class="meta">This permanently removes the selected unused copies from the Song Library. Songs in existing services have been protected from selection.</p>
      <div class="sheet-actions">
        <button class="secondary" id="cancelDuplicateDelete">Cancel</button>
        <button class="danger solid-danger" id="confirmDuplicateDelete">Delete permanently</button>
      </div>`);

    $('#cancelDuplicateDelete').onclick=openDuplicateSongCleanup;
    $('#confirmDuplicateDelete').onclick=async()=>{
      const btn=$('#confirmDuplicateDelete');
      btn.disabled=true;
      btn.textContent='Deleting…';
      try{
        for(const song of chosen){
          // Re-check at delete time in case service usage changed while dialog was open.
          if(songServiceUsages(song).length)continue;
          await deleteLibrarySongRemote(song.id);
          songs=songs.filter(x=>String(x.id)!==String(song.id));
        }
        persistSongs();
        
        openDuplicateSongCleanup();
      }catch(err){
        appAlert(`Duplicate cleanup stopped: ${err.message||String(err)}`);
        openDuplicateSongCleanup();
      }
    };
  };
}


async function loadAuthenticatedUser(){
  if(!remoteAvailable) return;
  try{
    const data=await apiFetch('/api/me');
    if(data?.user){
      authenticatedUser=data.user;
      setCurrentEditor(data.user.displayName||data.user.email||'Editor');
      applyAccessVisibility();
    }
  }catch(err){
    console.warn(err);
  }
}

async function saveAuthenticatedDisplayName(name){
  if(!remoteAvailable || !authenticatedUser?.authenticated) return;
  try{
    const data=await apiFetch('/api/me',{
      method:'PUT',
      body:JSON.stringify({displayName:name})
    });
    if(data?.user){
      authenticatedUser=data.user;
      setCurrentEditor(data.user.displayName||name);
    }
  }catch(err){
    console.warn(err);
  }
}

async function bootstrapRemote(){
  try{
    const response=await fetch('/api/bootstrap',{
      headers:{'accept':'application/json'},
      credentials:'same-origin',
      cache:'no-store'
    });
    if(redirectForExpiredPlannerSession(response))return;
    if(response.status===403){
      const data=await response.json().catch(()=>({}));
      if(
        String(data.error||'').includes('ChurchSuite Service list access only') ||
        String(data.error||'').includes('Service List access only')
      ){
        location.replace(
          data.serviceListAvailable===false
            ?'/service-list-unavailable'
            :'/'
        );
        return;
      }
    }
    if(!response.ok){
      // Hosted failures must not expose locally cached planner state.
      if(location.protocol==='https:' || location.hostname!=='localhost'){
        document.body.innerHTML='<main style="max-width:560px;margin:12vh auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif"><h1>OpenLP Service Planner</h1><p>The planner could not verify your session.</p><p><a href="/login">Return to sign in</a></p></main>';
        return;
      }
      await loadSongLibrary();
      return;
    }
    const data=await response.json();
    remoteAvailable=true;
    if(data?.authConfig?.allowedDomain)microsoftAllowedDomain=String(data.authConfig.allowedDomain);
    if(data?.user){
      authenticatedUser=data.user;
      setCurrentEditor(data.user.displayName||data.user.email||'Editor');
      applyAccessVisibility();
    }else{
      await loadAuthenticatedUser();
    }
    await loadSongLibrary();

    if(data?.initialized || data?.services?.length){
      const browserActiveServiceId=String(state.activeServiceId||'');
      state.services=Array.isArray(data.services)?data.services:[];
      state.settings=data.settings||state.settings;
      // A refresh should stay on the service this browser was editing. The
      // shared server active-service value may have been changed by another
      // browser/user, so prefer the browser's saved choice when it still exists.
      state.activeServiceId=state.services.some(s=>String(s.id)===browserActiveServiceId)
        ?browserActiveServiceId
        :(data.activeServiceId||state.services[0]?.id||'');
      const removedDuplicates=dedupeAllChurchSuiteItems();
      resetAllUndoBaselines();
      if(removedDuplicates)persistPlanner();
      render();
      return;
    }

    // Genuinely first server run only: seed the structured tables from the
    // current/default state. An initialized planner with zero services must
    // stay empty rather than resurrecting deleted services.
    await apiFetch('/api/seed',{
      method:'POST',
      body:JSON.stringify(plannerPayload())
    });
    const seeded=await apiFetch('/api/bootstrap');
    if(seeded?.authConfig?.allowedDomain)microsoftAllowedDomain=String(seeded.authConfig.allowedDomain);
    if(seeded?.services?.length){
      state.services=seeded.services;
      state.settings=seeded.settings||state.settings;
      state.activeServiceId=seeded.activeServiceId||state.services[0]?.id;
      const removedDuplicates=dedupeAllChurchSuiteItems();
      resetAllUndoBaselines();
      if(removedDuplicates)persistPlanner();
      render();
    }
  }catch(_){
    // Local development may still use static mode, but the hosted planner must
    // never reveal cached planner data after authentication fails.
    if(location.protocol==='https:' || location.hostname!=='localhost'){
      const returnTo=`${location.pathname}${location.search}`;
      location.replace(`/login?return=${encodeURIComponent(returnTo)}`);
      return;
    }
    await loadSongLibrary();
  }
}
function formatServiceDate(iso){
  const d=new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);
}

function serviceIsPast(s){
  const today='2026-08-13';
  return s.dateISO < today;
}

function applyRetention(){
  const keep=Number(state.settings.retainPastServices||0);
  if(!keep) return;
  const past=state.services.filter(serviceIsPast).sort((a,b)=>b.dateISO.localeCompare(a.dateISO));
  const removeIds=new Set(past.slice(keep).map(s=>s.id));
  if(removeIds.size){
    state.services=state.services.filter(s=>!removeIds.has(s.id));
  }
}

applyRetention();

let songs=[];
try{
  const savedSongs=localStorage.getItem(SONGS_KEY);
  if(savedSongs) songs=JSON.parse(savedSongs);
}catch(_){}

function persistSongs(){
  try{
    localStorage.setItem(SONGS_KEY,JSON.stringify(songs));
  }catch(err){
    console.warn('Could not cache song library locally.',err);
  }
}

const DEFAULT_SONG_CLASSIFICATION_GROUPS=[
  {id:'collection',name:'Collection',rule:'one-or-more',defaultId:'uncategorised',
   items:[{id:'core',name:'Core'},{id:'new',name:'New'},{id:'timeless',name:'Timeless'},{id:'uncategorised',name:'Uncategorised'}]},
  {id:'review',name:'Review',rule:'zero-or-more',defaultId:'',
   items:[{id:'drop-this-song',name:'Drop this song'},{id:'try-in-future',name:'Try in the future'}]},
  {id:'service-position',name:'Service position',rule:'zero-or-more',defaultId:'',
   items:[{id:'opener',name:'Opener'},{id:'closer',name:'Closer'}]}
];
function songClassificationGroups(){
  const groups=state.settings.songClassificationGroups;
  return Array.isArray(groups)&&groups.length?groups:DEFAULT_SONG_CLASSIFICATION_GROUPS;
}
function classificationItemMap(){
  const map=new Map();
  for(const group of songClassificationGroups()){
    for(const item of group.items||[])map.set(String(item.id),{...item,group});
  }
  return map;
}
function defaultSongClassifications(){
  const out=[];
  for(const group of songClassificationGroups()){
    if(group.rule==='exactly-one'||group.rule==='one-or-more'){
      const id=group.defaultId||(group.items||[])[0]?.id;
      if(id)out.push(String(id));
    }
  }
  return [...new Set(out)];
}
function normalizeSongClassificationsLocal(value){
  const selected=new Set((Array.isArray(value)?value:[]).map(String));
  const out=[];
  for(const group of songClassificationGroups()){
    const valid=(group.items||[]).map(x=>String(x.id)).filter(id=>selected.has(id));
    if(group.rule==='exactly-one'){
      const id=valid[0]||group.defaultId||(group.items||[])[0]?.id;
      if(id)out.push(String(id));
    }else if(group.rule==='one-or-more'){
      if(valid.length)out.push(...valid);
      else{
        const id=group.defaultId||(group.items||[])[0]?.id;
        if(id)out.push(String(id));
      }
    }else out.push(...valid);
  }
  return [...new Set(out)];
}
function classificationNames(song){
  const map=classificationItemMap();
  return normalizeSongClassificationsLocal(song.classifications||[])
    .map(id=>map.get(id)?.name).filter(Boolean);
}
function classificationControls(song){
  const selected=new Set(normalizeSongClassificationsLocal(
    song.classifications?.length?song.classifications:defaultSongClassifications()
  ));
  return songClassificationGroups().map(group=>`
    <fieldset class="song-classification-group" data-song-class-group="${esc(group.id)}" data-rule="${esc(group.rule)}">
      <legend>${esc(group.name)}</legend>
      <div class="song-classification-options">
        ${(group.items||[]).map(item=>`
          <label class="classification-option">
            <input type="checkbox" name="songClass" value="${esc(item.id)}" ${selected.has(String(item.id))?'checked':''}>
            <span>${esc(item.name)}</span>
          </label>`).join('')}
      </div>
      <small>${group.rule==='exactly-one'?'Choose one':group.rule==='one-or-more'?'Choose one or more':'Optional'}</small>
    </fieldset>`).join('');
}
function collectClassificationControls(container=document){
  return normalizeSongClassificationsLocal(
    [...container.querySelectorAll('input[name="songClass"]:checked')].map(x=>x.value)
  );
}
function enforceClassificationControlRules(container=document){
  container.querySelectorAll('[data-song-class-group]').forEach(groupEl=>{
    const rule=groupEl.dataset.rule;
    const boxes=[...groupEl.querySelectorAll('input[type="checkbox"]')];
    boxes.forEach(box=>box.addEventListener('change',()=>{
      if(rule==='exactly-one'&&box.checked)boxes.forEach(other=>{if(other!==box)other.checked=false});
      if((rule==='exactly-one'||rule==='one-or-more')&&!boxes.some(x=>x.checked))box.checked=true;
    }));
  });
}

async function saveSongClassifications(song, classifications){
  const next=normalizeSongClassificationsLocal(classifications);
  song.classifications=next;
  persistSongs();
  await saveLibrarySongRemote(song);
  return next;
}

function openQuickSongClassification(songId,onBack){
  const song=songs.find(x=>String(x.id)===String(songId));
  if(!song)return;

  openSheet(`<h2>Classify song</h2>
    <div class="classification-song-head">
      <strong>${esc(song.title)}</strong>
      ${song.authors?.length?`<span>${esc(song.authors.join(', '))}</span>`:''}
    </div>
    <div class="song-classification-editor quick-classification-editor">
      ${classificationControls(song)}
    </div>
    <p class="meta" id="quickClassificationStatus">Changes update the shared Song Library.</p>
    <div class="sheet-actions">
      <button class="secondary" id="quickClassificationBack">Back</button>
      <button class="primary" id="quickClassificationSave">Save classifications</button>
    </div>`);

  enforceClassificationControlRules(body);

  $('#quickClassificationBack').onclick=()=>onBack?onBack():openSongLibrary();
  $('#quickClassificationSave').onclick=async()=>{
    const btn=$('#quickClassificationSave');
    const status=$('#quickClassificationStatus');
    btn.disabled=true;
    btn.textContent='Saving…';
    try{
      await saveSongClassifications(song,collectClassificationControls(body));
      status.textContent='Classifications saved ✓';
      setTimeout(()=>onBack?onBack():openSongLibrary(),250);
    }catch(err){
      status.textContent='Could not save: '+(err.message||String(err));
      btn.disabled=false;
      btn.textContent='Save classifications';
    }
  };
}



async function loadSongLibrary(){
  if(remoteAvailable){
    try{
      const data=await apiFetch('/api/songs');
      if(Array.isArray(data.songs) && data.songs.length){
        songs=data.songs.map(song=>({
          ...song,
          classifications:normalizeSongClassificationsLocal(song.classifications||defaultSongClassifications())
        }));
        persistSongs();
        return;
      }
    }catch(err){
      console.warn(err);
    }
  }

  if(!songs.length){
    try{
      songs=await fetch('songs.json').then(r=>r.json());
      persistSongs();
    }catch(_){}
  }
}
function formatBytes(value){
  const n=Number(value||0);
  if(n<1024)return `${n} B`;
  if(n<1024*1024)return `${(n/1024).toFixed(n<10240?1:0)} KB`;
  if(n<1024*1024*1024)return `${(n/1024/1024).toFixed(n<10*1024*1024?1:0)} MB`;
  return `${(n/1024/1024/1024).toFixed(1)} GB`;
}


const $=s=>document.querySelector(s), list=$('#serviceList'), sheet=$('#sheet'), body=$('#sheetBody');

let plannerDialogQueue=Promise.resolve();
function queuePlannerDialog(options={}){
  const run=()=>new Promise(resolve=>{
    const dialog=$('#plannerDialog');
    const form=$('#plannerDialogForm');
    const title=$('#plannerDialogTitle');
    const message=$('#plannerDialogMessage');
    const inputWrap=$('#plannerDialogInputWrap');
    const input=$('#plannerDialogInput');
    const inputLabel=$('#plannerDialogInputLabel');
    const cancel=$('#plannerDialogCancel');
    const confirm=$('#plannerDialogConfirm');
    if(!dialog||!form||!title||!message||!inputWrap||!input||!cancel||!confirm){
      resolve(options.kind==='confirm'?false:options.kind==='prompt'?null:undefined);
      return;
    }
    title.textContent=String(options.title||'OpenLP Service Planner');
    message.textContent=String(options.message||'');
    const wantsInput=options.kind==='prompt';
    inputWrap.hidden=!wantsInput;
    inputLabel.textContent=String(options.inputLabel||'Value');
    input.value=wantsInput?String(options.initialValue||''):'';
    input.placeholder=wantsInput?String(options.placeholder||''):'';
    cancel.hidden=options.kind==='alert';
    cancel.textContent=String(options.cancelLabel||'Cancel');
    confirm.textContent=String(options.confirmLabel||'OK');
    confirm.className=options.danger?'danger solid-danger':'primary';
    let settled=false;
    const finish=value=>{
      if(settled)return;
      settled=true;
      dialog.removeEventListener('close',onClose);
      resolve(value);
    };
    const onClose=()=>{
      if(options.kind==='confirm')finish(dialog.returnValue==='confirm');
      else if(options.kind==='prompt')finish(dialog.returnValue==='confirm'?input.value:null);
      else finish(undefined);
    };
    dialog.addEventListener('close',onClose,{once:true});
    form.onsubmit=e=>{
      const submitter=e.submitter;
      dialog.returnValue=submitter?.value||'cancel';
    };
    dialog.showModal();
    requestAnimationFrame(()=>wantsInput?input.focus():confirm.focus());
  });
  const pending=plannerDialogQueue.then(run,run);
  plannerDialogQueue=pending.then(()=>undefined,()=>undefined);
  return pending;
}
function appAlert(message,{title='OpenLP Service Planner',confirmLabel='OK'}={}){
  return queuePlannerDialog({kind:'alert',title,message,confirmLabel});
}
function appConfirm(message,{title='Confirm',confirmLabel='Continue',cancelLabel='Cancel',danger=false}={}){
  return queuePlannerDialog({kind:'confirm',title,message,confirmLabel,cancelLabel,danger});
}
function appPrompt(message,initialValue='',{title='OpenLP Service Planner',inputLabel='Value',confirmLabel='OK',cancelLabel='Cancel',placeholder=''}={}){
  return queuePlannerDialog({kind:'prompt',title,message,inputLabel,initialValue,confirmLabel,cancelLabel,placeholder});
}


function esc(s=''){
  return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
}

function renderHelpMarkdown(value){
  // Safe, deliberately small Markdown subset for projector transfer instructions.
  // Protect escaped markdown characters first, then escape HTML, then format.
  const ESC_STAR='@@OSP_ESC_STAR@@';
  const ESC_UNDERSCORE='@@OSP_ESC_UNDERSCORE@@';
  const ESC_BACKSLASH='@@OSP_ESC_BACKSLASH@@';

  let source=String(value||'')
    .replace(/\\\\/g,ESC_BACKSLASH)
    .replace(/\\\*/g,ESC_STAR)
    .replace(/\\_/g,ESC_UNDERSCORE);

  let text=esc(source);
  text=text
    .replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g,'<strong>$1</strong>')
    .replace(/(^|[^\*])\*([^*\n]+)\*/g,'$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g,'$1<em>$2</em>')
    .replaceAll(ESC_STAR,'*')
    .replaceAll(ESC_UNDERSCORE,'_')
    .replaceAll(ESC_BACKSLASH,'\\');

  const lines=text.split(/\r?\n/);
  let html='';
  let inList=false;
  const closeList=()=>{if(inList){html+='</ul>';inList=false;}};
  for(const line of lines){
    const bullet=line.match(/^\s*[-•]\s+(.+)$/);
    if(bullet){
      if(!inList){html+='<ul>';inList=true;}
      html+=`<li>${bullet[1]}</li>`;
      continue;
    }
    closeList();
    if(!line.trim())html+='<div class="transfer-help-spacer"></div>';
    else html+=`<div>${line}</div>`;
  }
  closeList();
  return html;
}

function sectionName(s){
  const names={v:'Verse',c:'Chorus',b:'Bridge',p:'Pre-Chorus',t:'Tag',e:'Ending',i:'Intro',o:'Other'};
  const base=names[s.type]||'Section';
  if(s.type==='v') return `${base} ${s.label||''}`.trim();
  if((s.label||'1')==='1') return base;
  return `${base} ${s.label}`.trim();
}

function projectorSnapshot(service){
  return JSON.stringify({
    title:service.title,
    dateISO:service.dateISO,
    theme:service.theme,
    items:service.items
  });
}

function projectorState(service){
  if(!service.downloadedForDeviceAt) return 'none';
  return service.downloadedSnapshot===projectorSnapshot(service) ? 'downloaded' : 'stale';
}

function applyProjectorState(){
  const service=currentService();
  const status=projectorState(service);
  document.body.classList.toggle('projector-downloaded',status==='downloaded');
  document.body.classList.toggle('projector-stale',status==='stale');

  const note=$('#projectorStatusNote');
  if(note){
    note.classList.remove('current','stale');
    if(status==='downloaded'){
      note.hidden=false;
      note.classList.add('current');
      note.textContent='This version has been downloaded for the projection laptop.';
    }else if(status==='stale'){
      note.hidden=false;
      note.classList.add('stale');
      note.textContent='This service has changed since it was downloaded.';
    }else{
      note.hidden=true;
      note.textContent='';
    }
  }
}

function renderHeader(){
  const s=currentService();
  $('#serviceDate').textContent=s.date;
  $('#serviceTitle').textContent=s.title;
  $('#themeBtn').textContent=s.theme;
  document.title=`${s.title} · OpenLP Service Planner`;
  const last=$('#lastEdited');
  if(last){
    last.textContent=s.lastEditedAt
      ? `Last edited ${formatLastEdited(s.lastEditedAt)} · by ${s.lastEditedBy||'Unknown'}`
      : 'No edits recorded yet';
  }
  applyProjectorState();

  const clearProjectorMark=$('#clearProjectorMarkBtn');
  if(clearProjectorMark){
    const projector=projectorState(s);
    clearProjectorMark.hidden=!(projector==='downloaded'||projector==='stale');
  }

  const syncNote=$('#churchSuiteSyncNote');
  if(syncNote){
    const show=!!(churchSuiteEnabled()&&s.churchSuiteOutOfSync && (s.churchSuitePlanId||s.churchSuitePlanUrl));
    syncNote.hidden=!show;
    syncNote.textContent=show
      ?`ChurchSuite: local service differs${s.churchSuiteOutOfSyncReason?` — ${s.churchSuiteOutOfSyncReason}`:''}.`
      :'';
  }
  const templateButton=$('#currentServiceTemplateBtn');
  if(templateButton){
    templateButton.textContent=`Template: ${serviceTemplateChoiceLabel(s)}`;
    templateButton.title='Choose a template for this service';
  }
  const plannerSync=$('#plannerSyncChurchSuiteBtn');
  if(plannerSync){
    plannerSync.hidden=!(churchSuiteEnabled()&&(s.churchSuitePlanId||s.churchSuitePlanUrl));
    plannerSync.classList.toggle('sync-attention',!!s.churchSuiteOutOfSync);
  }
  // View CS Plan is not a permanent footer control. Create it only when this
  // specific service has a validated, saved ChurchSuite Plan Page URL.
  const footerSync=$('#plannerSyncChurchSuiteBtn');
  let plannerViewPlan=$('#plannerViewChurchSuiteBtn');
  const planUrl=churchSuiteEnabled()?actualChurchSuitePlanUrl(s):'';
  if(planUrl){
    if(!plannerViewPlan){
      plannerViewPlan=document.createElement('a');
      plannerViewPlan.id='plannerViewChurchSuiteBtn';
      plannerViewPlan.className='secondary footer-churchsuite-link';
      plannerViewPlan.target='_blank';
      plannerViewPlan.rel='noopener';
      plannerViewPlan.textContent='View CS Plan ↗';
      footerSync?.insertAdjacentElement('afterend',plannerViewPlan);
    }
    plannerViewPlan.href=planUrl;
  }else if(plannerViewPlan){
    plannerViewPlan.remove();
  }
  const missingPlanLink=$('#churchSuitePlanLinkMissing');
  if(missingPlanLink){
    missingPlanLink.hidden=!(churchSuiteEnabled()&&!!s.churchSuitePlanIdentifier&&!actualChurchSuitePlanUrl(s));
  }
  updateUndoButton();
}

let openLPOnlyView=false;

function render(){
  const service=currentService();
  if(!service){
    persistPlanner();
    document.title='Service plans · OpenLP Service Planner';
    document.querySelector('main.shell').hidden=true;
    $('#servicesPage').hidden=false;
    $('#plannerHeaderNav').hidden=true;
    $('#servicesHeaderNav').hidden=false;
    $('#plannerFooter').hidden=true;
    $('#servicesFooter').hidden=false;
    document.body.classList.add('services-page-open');
    renderServicesPage();
    renderMicrosoftSsoRenewalWarning();
    return;
  }

  renderHeader();
  persistPlanner();
  const visibleItems=openLPOnlyView?state.items.filter(x=>x.projected):state.items;
  list.innerHTML=visibleItems.map(x=>`<article class="item ${x.projected&&!x.ready?'needs-editing':''} ${x.templateProtected?'template-protected':x.retainOnChurchSuiteSync?'churchsuite-retained':''}" data-id="${x.id}">
    <button class="handle" type="button" title="Drag to reorder" aria-label="Drag ${esc(x.title)} to reorder">≡</button>
    <div>
      <div class="item-title">${esc(x.title)}</div>
      <div class="item-sub">
        ${x.person?`<span class="person">${esc(x.person)}</span>`:''}
        ${serviceItemDetailForDisplay(x)?`<span>${esc(serviceItemDetailForDisplay(x))}</span>`:''}
        ${x.type==='song'&&x.musicNote?`<span class="music-note">♪ ${esc(x.musicNote)}</span>`:''}
        ${x.projected?'<span class="projection-chip">Projection</span>':'<span>Run sheet only</span>'}
        ${(x.ignoreImages||x.ignoreVideo||x.ignoreBible)?'<span class="no-attachments-chip">No attachments</span>':''}
        ${x.type==='images'&&x.churchSuiteSourceId&&!x.ready?`
          <label class="inline-ignore-images" title="Keep this item but do not require images">
            <input type="checkbox" data-ignore-images="${esc(String(x.id))}">
            <span>Ignore images</span>
          </label>
        `:''}
        ${x.type==='video'&&x.churchSuiteSourceId&&!x.ready?`
          <label class="inline-ignore-video" title="Keep this item but do not require video">
            <input type="checkbox" data-ignore-video="${esc(String(x.id))}">
            <span>Ignore video</span>
          </label>
        `:''}
        ${x.type==='bible'&&x.churchSuiteSourceId&&!x.ready?`
          <label class="inline-ignore-bible" title="Keep this item but do not require Bible projection">
            <input type="checkbox" data-ignore-bible="${esc(String(x.id))}">
            <span>Ignore Bible</span>
          </label>
        `:''}
        ${churchSuiteEnabled()&&x.type==='song'&&x.churchSuiteWritePending?`<span class="churchsuite-pending-chip">ChurchSuite update pending</span>`:''}
        ${churchSuiteEnabled()&&x.type==='song'&&x.extraChurchSuiteSong?`<span class="churchsuite-extra-song-chip">Extra ChurchSuite song</span>`:''}
        ${x.type==='song'&&x.templateSongPlaceholder?`<span class="template-song-placeholder-chip">${churchSuiteEnabled()?'Awaiting ChurchSuite song':'Empty Song position'}</span>`:''}
        ${x.templateProtected?`<span class="template-item-chip">Template</span>`:(churchSuiteEnabled()&&x.retainOnChurchSuiteSync)?`<span class="churchsuite-retained-chip">Kept on ChurchSuite sync</span>`:''}
        ${churchSuiteEnabled()&&x.churchSuiteExcludedFromLastSync?`<span class="churchsuite-not-synced-chip">Not included in latest ChurchSuite sync</span>`:''}
      </div>
    </div>
    <div class="item-actions">
      ${x.projected?`<div class="status ${x.ready?'ready':'missing'}">${x.ready
        ?(churchSuiteEnabled()&&x.type==='song'&&x.churchSuiteSourceId&&x.churchSuiteWritePending?'✓ Local copy updated':'✓ Ready')
        :'○ Missing'}</div>`:'<div class="status">Plan</div>'}
      <button class="item-delete" type="button" data-delete="${x.id}" aria-label="Delete ${esc(x.title)}" title="Delete item"><svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
<path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/>
</svg></button>
    </div>
  </article>`).join('');

  list.querySelectorAll('.item').forEach(el=>{
    const id=el.dataset.id;
    const handle=el.querySelector('.handle');

    el.addEventListener('click',e=>{
      if(e.target.closest('.handle')) return;
      editItem(id);
    });

    handle.addEventListener('pointerdown',e=>{
      if(openLPOnlyView)return;
      startReorder(e,el);
    });
  });


  list.querySelectorAll('[data-ignore-images]').forEach(toggle=>{
    toggle.onclick=e=>e.stopPropagation();
    toggle.onchange=e=>{
      e.stopPropagation();
      const item=state.items.find(i=>String(i.id)===String(toggle.dataset.ignoreImages));
      if(!item)return;

      if(toggle.checked){
        item.projected=false;
        item.ready=true;
        item.detail='No attachments';
        item.ignoreImages=true;
        item.changed='just now';
        item.by=currentEditor();
        persistPlanner();
        saveServiceItem(item);
        markServiceEdited('ignored imported image presentation');
        appendAudit('ignored images',item.title);
        render();
      }
    };
  });



  list.querySelectorAll('[data-ignore-video]').forEach(toggle=>{
    toggle.onclick=e=>e.stopPropagation();
    toggle.onchange=e=>{
      e.stopPropagation();
      const item=state.items.find(i=>String(i.id)===String(toggle.dataset.ignoreVideo));
      if(!item)return;
      if(toggle.checked){
        item.ignoreVideo=true;
        item.projected=false;
        item.ready=true;
        item.detail='No attachments';
        item.changed='just now';
        item.by=currentEditor();
        persistPlanner();
        saveServiceItem(item);
        markServiceEdited('ignored imported video');
        appendAudit('ignored video',item.title);
        render();
      }
    };
  });

  list.querySelectorAll('[data-ignore-bible]').forEach(toggle=>{
    toggle.onclick=e=>e.stopPropagation();
    toggle.onchange=e=>{
      e.stopPropagation();
      const item=state.items.find(i=>String(i.id)===String(toggle.dataset.ignoreBible));
      if(!item)return;

      if(toggle.checked){
        item.ignoreBible=true;
        item.projected=false;
        item.ready=true;
        item.detail='No attachments';
        item.changed='just now';
        item.by=currentEditor();
        persistPlanner();
        saveServiceItem(item);
        markServiceEdited('ignored imported Bible projection');
        appendAudit('ignored Bible projection',item.title);
        render();
      }
    };
  });

  list.querySelectorAll('[data-delete]').forEach(btn=>{
    let armed=false;
    let timer=null;
    btn.onclick=e=>{
      e.stopPropagation();
      const id=btn.dataset.delete;
      const item=state.items.find(x=>String(x.id)===String(id));
      if(!item) return;

      if(!armed){
        armed=true;
        btn.classList.add('armed');
        btn.textContent='Delete?';
        btn.title='Click again to confirm';
        clearTimeout(timer);
        timer=setTimeout(()=>{
          armed=false;
          btn.classList.remove('armed');
          btn.innerHTML=`<svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
<path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/>
</svg>`;
          btn.title='Delete item';
        },3000);
        return;
      }

      clearTimeout(timer);
      const title=item.title;
      state.items=state.items.filter(x=>String(x.id)!==String(id));
      persistPlanner();
      deleteRemoteItem(currentService().id,id);
      markServiceEdited('deleted item');
      appendAudit('deleted item',title);
      render();
    };
  });

  const projected=state.items.filter(x=>x.projected), ready=projected.filter(x=>x.ready).length;
  $('#readyCount').textContent=`${ready} of ${projected.length}`;
  $('#readyBar').style.width=`${projected.length?ready/projected.length*100:100}%`;

  setTimeout(renderMicrosoftSsoRenewalWarning,0);
}

function startReorder(e, source){
  if(e.button!==undefined && e.button!==0) return;
  e.preventDefault();
  e.stopPropagation();

  const sourceId=String(source.dataset.id);
  const rect=source.getBoundingClientRect();
  const offsetY=e.clientY-rect.top;

  const ghost=source.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.removeAttribute('data-id');
  ghost.style.width=`${rect.width}px`;
  ghost.style.left=`${rect.left}px`;
  ghost.style.top=`${rect.top}px`;
  document.body.appendChild(ghost);

  source.classList.add('drag-source');
  document.body.classList.add('reordering');

  let moved=false;
  let lastClientY=e.clientY;

  function setGhost(y){
    ghost.style.top=`${y-offsetY}px`;
  }

  function clearTargets(){
    list.querySelectorAll('.item').forEach(x=>x.classList.remove('drop-before','drop-after'));
  }

  function onMove(ev){
    if(ev.pointerId!==e.pointerId) return;
    ev.preventDefault();
    lastClientY=ev.clientY;
    setGhost(ev.clientY);

    const hit=document.elementsFromPoint(ev.clientX,ev.clientY)
      .find(node=>node.classList?.contains('item') && node!==source);

    clearTargets();
    if(!hit) return;

    const hitRect=hit.getBoundingClientRect();
    const before=ev.clientY < hitRect.top + hitRect.height/2;
    hit.classList.add(before?'drop-before':'drop-after');

    const sourceRect=source.getBoundingClientRect();

    if(before){
      if(hit.previousElementSibling!==source){
        hit.before(source);
        moved=true;
      }
    }else{
      if(hit.nextElementSibling!==source){
        hit.after(source);
        moved=true;
      }
    }
  }

  function finish(ev){
    if(ev.pointerId!==e.pointerId) return;
    ev.preventDefault();

    document.removeEventListener('pointermove',onMove,{passive:false});
    document.removeEventListener('pointerup',finish,{passive:false});
    document.removeEventListener('pointercancel',finish,{passive:false});

    ghost.remove();
    source.classList.remove('drag-source');
    clearTargets();
    document.body.classList.remove('reordering');

    if(moved){
      const orderedIds=[...list.querySelectorAll('.item')].map(x=>String(x.dataset.id));
      const position=new Map(orderedIds.map((id,index)=>[id,index]));
      state.items.sort((a,b)=>(position.get(String(a.id))??999999)-(position.get(String(b.id))??999999));

      const movedTitle=state.items.find(x=>String(x.id)===String(sourceId))?.title||'item';
      state.activity.unshift([currentEditor(),`moved ${movedTitle}`,'just now']);

      render();
      const confirmed=[...list.querySelectorAll('.item')].find(el=>String(el.dataset.id)===String(sourceId));
      if(confirmed){
        confirmed.classList.add('move-confirmed');
        setTimeout(()=>confirmed.classList.remove('move-confirmed'),1000);
      }
      markChurchSuiteOutOfSync('Item order changed locally');
      persistPlanner();
      saveItemOrder();
      saveServiceMeta();
      markServiceEdited('reordered service items');
      appendAudit('reordered service items');
    }
  }

  setGhost(e.clientY);
  document.addEventListener('pointermove',onMove,{passive:false});
  document.addEventListener('pointerup',finish,{passive:false});
  document.addEventListener('pointercancel',finish,{passive:false});
}
function cleanupSheetInteractionState(){
  document.querySelectorAll('.media-drag-ghost').forEach(x=>x.remove());
  document.querySelectorAll('.image-media-row').forEach(x=>x.classList.remove('media-drag-source','media-drop-before','media-drop-after'));
  document.body.classList.remove('reordering-media');
}
function closeSheetSafely(){
  cleanupSheetInteractionState();
  sheet.close();
}
function setSheetCloseAction(handler=closeSheetSafely){
  const close=$('#sheetClose');
  if(close)close.onclick=handler;
}

function openSheet(html){
  const titleEl=$('#sheetTitle');
  const footer=$('#sheetFooter');
  body.innerHTML=html;
  footer.innerHTML='';
  // Every screen starts with a fresh, working ×. Multi-step screens may
  // deliberately override it below to mirror Back, Cancel, or Done.
  setSheetCloseAction(closeSheetSafely);

  // Titles belong in the fixed sheet header.
  const titleRow=body.querySelector('.sheet-title-row');
  const h2=(titleRow?.querySelector('h2'))||body.querySelector('h2');
  titleEl.textContent=h2?.textContent?.trim()||'OpenLP Service Planner';
  if(h2)h2.remove();

  // Old top Save/Done controls are superseded by the fixed footer.
  body.querySelectorAll('#saveSettingsTop,#saveItemTop').forEach(el=>el.remove());
  if(titleRow && !titleRow.textContent.trim() && !titleRow.querySelector('button,a,input,select')) titleRow.remove();

  // Move the final action group into the fixed footer.
  const actionGroups=[...body.querySelectorAll('.sheet-actions')];
  const actions=actionGroups.at(-1);
  if(actions){
    while(actions.firstChild)footer.appendChild(actions.firstChild);
    actions.remove();
  }else{
    const done=document.createElement('button');
    done.type='button';
    done.className='primary';
    done.id='sheetDefaultDone';
    done.textContent='Done';
    done.onclick=closeSheetSafely;
    footer.appendChild(done);
  }

  sheet.showModal();
}
setSheetCloseAction(closeSheetSafely);


const FLOAT_ADD_KEY='openlp-service-planner-add-position-v2';
try{localStorage.removeItem('openlp-service-planner-add-position');}catch(_){}

function initFloatingAdd(){
  const fab=$('#addFab');
  const grip=$('#addGrip');
  const action=$('#addBtn');
  if(!fab || !grip || !action) return;

  fab.hidden=false;
  fab.style.display='flex';

  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(FLOAT_ADD_KEY)||'null');}catch(_){}

  function clamp(left,top){
    const margin=14;
    const w=fab.offsetWidth||122;
    const h=fab.offsetHeight||42;
    return {
      left:Math.min(Math.max(margin,left),Math.max(margin,window.innerWidth-w-margin)),
      top:Math.min(Math.max(margin,top),Math.max(margin,window.innerHeight-h-margin))
    };
  }

  function place(left,top,persist=false){
    const p=clamp(left,top);
    fab.style.left=`${p.left}px`;
    fab.style.top=`${p.top}px`;
    fab.style.right='auto';
    fab.style.bottom='auto';
    if(persist){
      try{localStorage.setItem(FLOAT_ADD_KEY,JSON.stringify(p));}catch(_){}
    }
  }

  function defaultPlace(){
    const w=fab.offsetWidth||122;
    const h=fab.offsetHeight||42;
    if(window.matchMedia('(max-width: 700px)').matches){
      const margin=16;
      place(window.innerWidth-w-margin,window.innerHeight-h-margin,false);
      return;
    }
    const left=(window.innerWidth*0.58)-(w/2);
    const top=(window.innerHeight*0.66)-(h/2);
    place(left,top,false);
  }

  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const validSaved=
      saved &&
      Number.isFinite(saved.left) &&
      Number.isFinite(saved.top) &&
      saved.left>24 &&
      saved.top>60;

    if(validSaved){
      place(saved.left,saved.top,false);
    }else{
      defaultPlace();
    }
  }));

  let drag=null;
  let longPressTimer=null;

  function beginDrag(e,immediate=false){
    if(e.button!==undefined && e.button!==0) return;
    const rect=fab.getBoundingClientRect();
    const candidate={
      pointerId:e.pointerId,
      dx:e.clientX-rect.left,
      dy:e.clientY-rect.top,
      startX:e.clientX,
      startY:e.clientY,
      active:false
    };

    drag=candidate;

    const activate=()=>{
      if(!drag || drag.pointerId!==candidate.pointerId) return;
      drag.active=true;
      fab.classList.add('floating-add-dragging');
      try{fab.setPointerCapture?.(candidate.pointerId);}catch(_){}
    };

    if(immediate){
      activate();
    }else{
      clearTimeout(longPressTimer);
      longPressTimer=setTimeout(activate,430);
    }
  }

  function moveDrag(e){
    if(!drag || drag.pointerId!==e.pointerId) return;

    const movedFar=
      Math.abs(e.clientX-drag.startX)>8 ||
      Math.abs(e.clientY-drag.startY)>8;

    if(!drag.active){
      if(movedFar){
        clearTimeout(longPressTimer);
        longPressTimer=null;
      }
      return;
    }

    e.preventDefault();
    place(e.clientX-drag.dx,e.clientY-drag.dy,false);
  }

  function endDrag(e){
    if(!drag || drag.pointerId!==e.pointerId) return;
    clearTimeout(longPressTimer);
    longPressTimer=null;

    const wasActive=drag.active;
    drag=null;

    if(wasActive){
      e.preventDefault();
      e.stopPropagation();
      const rect=fab.getBoundingClientRect();
      place(rect.left,rect.top,true);
      fab.classList.remove('floating-add-dragging');
      fab.dataset.suppressClick='1';
      setTimeout(()=>delete fab.dataset.suppressClick,60);
      try{fab.releasePointerCapture?.(e.pointerId);}catch(_){}
    }
  }

  // Grip starts dragging immediately.
  grip.addEventListener('pointerdown',e=>{
    e.preventDefault();
    e.stopPropagation();
    beginDrag(e,true);
  });

  // Long-press anywhere else on the floating pill to drag.
  action.addEventListener('pointerdown',e=>{
    beginDrag(e,false);
  });

  fab.addEventListener('pointermove',moveDrag);
  fab.addEventListener('pointerup',endDrag);
  fab.addEventListener('pointercancel',endDrag);

  // Normal tap/click still opens Add Item unless that gesture became a drag.
  action.addEventListener('click',e=>{
    if(fab.dataset.suppressClick){
      e.preventDefault();
      e.stopPropagation();
    }
  },true);

  window.addEventListener('resize',()=>{
    const rect=fab.getBoundingClientRect();
    place(rect.left,rect.top,true);
  });
}


$('#undoBtn').onclick=undoLastChange;
$('#redoBtn').onclick=redoLastChange;
$('#openLPViewBtn').onclick=()=>{
  openLPOnlyView=!openLPOnlyView;
  const btn=$('#openLPViewBtn');
  btn.setAttribute('aria-pressed',openLPOnlyView?'true':'false');
  btn.textContent=openLPOnlyView?'Full Service':'OpenLP View';
  document.body.classList.toggle('openlp-only-view',openLPOnlyView);
  render();
};
$('#plannerSyncChurchSuiteBtn').onclick=()=>{
  if(!churchSuiteEnabled())return;
  const s=currentService();
  if(!s || !(s.churchSuitePlanId||s.churchSuitePlanUrl))return;
  openChurchSuiteImportModeChoice({
    title:`Sync ${s.title}`,
    onBack:()=>sheet.close(),
    onConfirm:(importMode,templateId='')=>openChurchSuiteServiceScan(actualChurchSuitePlanUrl(s),s.id,{theme:s.theme,planId:s.churchSuitePlanId||null,importMode,templateId:templateId||defaultTemplateIdForService(s)})
  });
};

$('#addBtn').onclick=()=>{openSheet(`<h2>Add to service</h2><div class="choice-grid">
  <button class="choice" data-type="song"><strong>Song</strong><span>Shared song library, including songs pasted from SongSelect.</span></button>
  <button class="choice" data-type="images"><strong>Images (for notices)</strong><span>Ordered JPG/PNG slides. Auto play and loop are available for notice slides.</span></button>
  <button class="choice" data-type="sermon-images"><strong>Sermon Images</strong><span>Ordered JPG/PNG sermon slides. Exports to OpenLP as Images; auto play and loop are off by default.</span></button>
  <button class="choice" data-type="video"><strong>Video</strong><span>Video file; auto-start is enabled by default.</span></button>
  <button class="choice" data-type="text"><strong>Text / plan item</strong><span>Run-sheet information only. This never goes into the OpenLP service.</span></button>
  <div class="choice choice-with-link">
  <button class="choice-main" data-type="bible"><strong>Bible passage</strong><span>Paste clean passage text and translation for offline projection. Leave out footnotes, study notes, cross-references and other page furniture.</span></button>
  <a class="choice-link" href="https://www.biblegateway.com" target="_blank" rel="noopener">Open BibleGateway.com ↗</a>
</div>
  <button class="choice" data-type="pdf"><strong>PDF</strong><span>Converted into image slides before export, so it works like an ordinary image presentation in OpenLP.</span></button>
  <button class="choice choice-disabled" type="button" disabled><strong>PowerPoint</strong><span>Later feature — deliberately disabled for now.</span></button>
</div>
<div class="sheet-actions"><button class="secondary" id="cancelAddItem">Cancel</button></div>`);$('#cancelAddItem').onclick=()=>sheet.close();};
body.addEventListener('click',e=>{
  const c=e.target.closest('[data-type]');
  if(c && c.dataset.type) chooseType(c.dataset.type);
});


async function deleteMediaAsset(assetId){
  if(!remoteAvailable) return;
  await apiFetch(`/api/media/${encodeURIComponent(assetId)}`,{method:'DELETE'});
}


let pdfJsPromise=null;
async function getPdfJs(){
  if(!pdfJsPromise){
    pdfJsPromise=import('/vendor/pdfjs/pdf.min.mjs')
      .then(lib=>{
        lib.GlobalWorkerOptions.workerSrc='/vendor/pdfjs/pdf.worker.min.mjs';
        return lib;
      });
  }
  return pdfJsPromise;
}

function canvasToJpeg(canvas,quality=.88){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not create PDF page image.')),'image/jpeg',quality);
  });
}

async function convertPdfToImageFiles(file,onProgress=()=>{}){
  const pdfjs=await getPdfJs();
  const bytes=await file.arrayBuffer();
  const pdf=await pdfjs.getDocument({data:bytes}).promise;
  const files=[];
  const base=file.name.replace(/\.pdf$/i,'')||'pdf';

  for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
    onProgress(pageNo,pdf.numPages);
    const page=await pdf.getPage(pageNo);
    const natural=page.getViewport({scale:1});
    const scale=Math.min(2,1600/Math.max(1,natural.width));
    const viewport=page.getViewport({scale});
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(viewport.width);
    canvas.height=Math.ceil(viewport.height);
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    await page.render({canvasContext:ctx,viewport}).promise;
    const blob=await canvasToJpeg(canvas,.88);
    files.push(new File(
      [blob],
      `${base}-page-${String(pageNo).padStart(3,'0')}.jpg`,
      {type:'image/jpeg'}
    ));
    page.cleanup?.();
  }
  pdf.cleanup?.();
  pdf.destroy?.();
  return files;
}

async function uploadMediaFile(file,serviceId,itemId,{retain=false,mediaType='file',libraryGroupId='',libraryFolderId=''}={}){
  const form=new FormData();
  form.set('file',file);
  form.set('serviceId',String(serviceId));
  form.set('itemId',String(itemId));
  form.set('retain',retain?'true':'false');
  form.set('mediaType',String(mediaType));
  if(libraryGroupId)form.set('libraryGroupId',String(libraryGroupId));
  if(libraryFolderId)form.set('libraryFolderId',String(libraryFolderId));
  const response=await fetch('/api/media',{method:'POST',body:form});
  if(redirectForExpiredPlannerSession(response))throw new Error('Planner session expired.');
  if(!response.ok){
    const data=await response.json().catch(()=>({}));
    throw new Error(data.error||`Upload failed ${response.status}`);
  }
  return response.json();
}



async function uploadDirectLibraryMedia(file,mediaType,{libraryGroupId='',libraryFolderId=''}={}){
  const form=new FormData();
  form.set('file',file);
  form.set('mediaType',String(mediaType));
  form.set('retain','true');
  form.set('libraryOnly','true');
  if(libraryGroupId)form.set('libraryGroupId',String(libraryGroupId));
  if(libraryFolderId)form.set('libraryFolderId',String(libraryFolderId));
  const response=await fetch('/api/media',{method:'POST',body:form});
  if(redirectForExpiredPlannerSession(response))throw new Error('Planner session expired.');
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||`Upload failed (${response.status})`);
  return data;
}

function wirePreviewHeaderClose(returnToSource){
  const close=$('#sheetClose');
  if(!close)return;
  const replacement=close.cloneNode(true);
  close.replaceWith(replacement);
  replacement.onclick=returnToSource;
}

function openMediaFullPreview(type,title,assets,onBack){
  const safeTitle=esc(title||mediaTypeLabel(type));
  const returnToSource=()=>onBack?onBack():sheet.close();

  if(type==='video'){
    const asset=assets[0];
    openSheet(`<h2>${safeTitle}</h2>
      <div class="full-media-preview"><video src="/api/media/${encodeURIComponent(asset.id)}" controls autoplay playsinline></video></div>
      <div class="sheet-actions"><button class="primary" id="closeMediaPreview">Done</button></div>`);
    $('#closeMediaPreview').onclick=returnToSource;
    wirePreviewHeaderClose(returnToSource);
    return;
  }

  let page=0;
  const renderPage=()=>{
    const asset=assets[page];
    openSheet(`<h2>${safeTitle}</h2>
      <div class="full-media-preview"><img src="/api/media/${encodeURIComponent(asset.id)}" alt="${safeTitle}"></div>
      ${assets.length>1?`<p class="meta media-preview-page">Page ${page+1} of ${assets.length}</p>`:''}
      <div class="sheet-actions">
        ${assets.length>1?`<button class="secondary" id="mediaPreviewPrev" ${page===0?'disabled':''}>Previous</button>
        <button class="secondary" id="mediaPreviewNext" ${page===assets.length-1?'disabled':''}>Next</button>`:''}
        <button class="primary" id="closeMediaPreview">Done</button>
      </div>`);
    if($('#mediaPreviewPrev'))$('#mediaPreviewPrev').onclick=()=>{page=Math.max(0,page-1);renderPage()};
    if($('#mediaPreviewNext'))$('#mediaPreviewNext').onclick=()=>{page=Math.min(assets.length-1,page+1);renderPage()};
    $('#closeMediaPreview').onclick=returnToSource;
    wirePreviewHeaderClose(returnToSource);
  };
  renderPage();
}

async function loadPlannerMediaLibrary(type){
  if(!remoteAvailable)return {retained:[],serviceSpecific:[]};
  return apiFetch(`/api/media-library?type=${encodeURIComponent(type)}`);
}
async function loadPlannerMediaFolders(type){
  if(!remoteAvailable)return [];
  const data=await apiFetch(`/api/media-library/folders?type=${encodeURIComponent(type)}`);
  return data.folders||[];
}
async function createPlannerMediaFolder(mediaType,name){
  return apiFetch('/api/media-library/folders',{
    method:'POST',
    body:JSON.stringify({mediaType,name})
  });
}
async function ensurePlannerMediaFolder(mediaType,baseName,dateISO){
  const dateLabel=dateISO
    ?new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${dateISO}T12:00:00`))
    :'';
  const data=await apiFetch('/api/media-library/folders/ensure',{
    method:'POST',
    body:JSON.stringify({mediaType,baseName,dateLabel})
  });
  return data.folder;
}
async function renamePlannerMediaFolder(folderId,name){
  return apiFetch(`/api/media-library/folders/${encodeURIComponent(folderId)}`,{
    method:'PUT',
    body:JSON.stringify({name})
  });
}
async function deletePlannerMediaFolder(folderId){
  return apiFetch(`/api/media-library/folders/${encodeURIComponent(folderId)}`,{method:'DELETE'});
}
async function movePlannerLibraryAssets(assetIds,folderId){
  return apiFetch('/api/media-library/move',{
    method:'POST',
    body:JSON.stringify({assetIds,folderId:folderId||null})
  });
}
async function renamePlannerMediaAsset(assetId,name){
  return apiFetch(`/api/media/${encodeURIComponent(assetId)}/rename`,{
    method:'PUT',
    body:JSON.stringify({name})
  });
}
function downloadPlannerMediaAsset(assetId){
  const a=document.createElement('a');
  a.href=`/api/media/${encodeURIComponent(assetId)}?download=1`;
  a.download='';
  document.body.appendChild(a);
  a.click();
  a.remove();
}


async function usePlannerLibraryAssets(assetIds,serviceId,itemId){
  return apiFetch('/api/media-library/use',{
    method:'POST',
    body:JSON.stringify({assetIds,serviceId,itemId})
  });
}
async function retainServiceMedia(assetId,mediaType,libraryGroupId='',libraryFolderId=''){
  return apiFetch(`/api/media/${encodeURIComponent(assetId)}/retain`,{
    method:'POST',
    body:JSON.stringify({mediaType,libraryGroupId,libraryFolderId})
  });
}
function mediaStorageType(type){return type==='sermon-images'?'images':type}
function mediaTypeLabel(type){return (type==='images'||type==='sermon-images')?'Image':type==='video'?'Video':'PDF'}
function updateMediaItemDetail(item){
  const count=(item.media||[]).length;
  if(item.type==='images'||item.type==='sermon-images'){
    item.detail=count?`${count} image${count===1?'':'s'}${item.autoplay==='loop'?' · autoplay loop':''}`:'No images yet';
    item.ready=count>0;
  }else if(item.type==='video'){
    item.detail=count?`${item.media[0]?.originalName||'Video'}${item.autoStart?' · auto start':''}`:'No video yet';
    item.ready=count>0;
  }else if(item.type==='pdf'){
    item.detail=count?`${count} PDF page${count===1?'':'s'} · converted to images`:'No PDF yet';
    item.ready=count>0;
  }
}
async function openPlannerMediaPicker(type,{onChoose,onBack=null,multiple=true}={}){
  openSheet(`<h2>OpenLP Planner library</h2>
    <p class="meta">Loading retained ${mediaTypeLabel(type).toLowerCase()} files…</p>
    <div class="sheet-actions"><button class="secondary" id="plannerMediaLoadingBack">Back</button></div>`);
  if($('#plannerMediaLoadingBack'))$('#plannerMediaLoadingBack').onclick=()=>onBack?onBack():sheet.close();
  try{
    const [data,folders]=await Promise.all([loadPlannerMediaLibrary(mediaStorageType(type)),loadPlannerMediaFolders(mediaStorageType(type))]);
    const retained=data.retained||[];
    const groups=[];
    if(type==='pdf'){
      const byGroup=new Map();
      for(const a of retained){
        const key=a.libraryGroupId||a.id;
        if(!byGroup.has(key))byGroup.set(key,[]);
        byGroup.get(key).push(a);
      }
      for(const [key,assets] of byGroup)groups.push({
        key,assets,
        folderId:assets[0]?.libraryFolderId||'',
        title:assets[0]?.originalName?.replace(/-page-\d+\.jpg$/i,'')||'PDF presentation'
      });
    }else{
      for(const a of retained)groups.push({key:a.id,assets:[a],folderId:a.libraryFolderId||'',title:a.originalName});
    }

    const folderMap=new Map(folders.map(f=>[String(f.id),{...f,groups:[]}]));
    const unfiled={id:'',name:'Unfiled',groups:[]};
    for(const group of groups){
      const target=group.folderId&&folderMap.has(String(group.folderId))?folderMap.get(String(group.folderId)):unfiled;
      target.groups.push(group);
    }
    const visibleFolders=[...folderMap.values()].filter(f=>f.groups.length);
    if(unfiled.groups.length)visibleFolders.push(unfiled);

    openSheet(`<h2>OpenLP Planner library</h2>
      <p class="meta">Choose retained files for this service item.</p>
      <div class="planner-media-folder-picker">
        ${visibleFolders.length?visibleFolders.map(folder=>`
          <details class="planner-library-folder" open>
            <summary><span class="planner-folder-name"><span class="folder-icon">▰</span><strong>${esc(folder.name)}</strong><small>${folder.groups.length} item${folder.groups.length===1?'':'s'}</small></span></summary>
            <div class="planner-media-picker">
              ${folder.groups.map(g=>{
                const i=groups.indexOf(g);
                return `<label class="planner-media-pick">
                  <input type="${multiple?'checkbox':'radio'}" name="plannerMediaPick" data-library-pick="${i}">
                  ${type==='images'||type==='pdf'?`<img src="/api/media/${encodeURIComponent(g.assets[0].id)}" alt="">`:'<span class="media-library-icon">▶</span>'}
                  <span><strong>${esc(g.title)}</strong><small>${g.assets.length>1?`${g.assets.length} pages · `:''}${g.assets[0].usages?.length?`Used in ${g.assets[0].usages.map(u=>u.title).join(', ')}`:'Not currently used'}</small></span>
                </label>`;
              }).join('')}
            </div>
          </details>`).join('')
        :'<p class="meta">No retained files of this type yet.</p>'}
      </div>
      <div class="sheet-actions"><button class="secondary" id="plannerMediaBack">Back</button>${groups.length?'<button class="primary" id="plannerMediaUse">Use selected</button>':''}</div>`);
    $('#plannerMediaBack').onclick=()=>onBack?onBack():sheet.close();
    if($('#plannerMediaUse'))$('#plannerMediaUse').onclick=()=>{
      const picked=[...body.querySelectorAll('[data-library-pick]:checked')]
        .map(el=>groups[Number(el.dataset.libraryPick)]).filter(Boolean);
      if(!picked.length)return;
      onChoose(picked.flatMap(g=>g.assets.map(a=>a.id)));
    };
  }catch(err){
    openSheet(`<h2>OpenLP Planner library</h2><div class="warning-card"><strong>Library could not be loaded.</strong><p>${esc(err.message||String(err))}</p></div><div class="sheet-actions"><button class="primary" id="plannerMediaBack">Done</button></div>`);
    $('#plannerMediaBack').onclick=()=>onBack?onBack():sheet.close();
  }
}



function bibleFormattingPreviewHtml(value){
  const safe=esc(String(value||''));
  const formatted=safe
    .replace(/\{st\}([\s\S]*?)\{\/st\}/g,'<strong>$1</strong>')
    .replace(/\{su\}([\s\S]*?)\{\/su\}/g,'<sup>$1</sup>')
    .replace(/\n/g,'<br>');
  return formatted
    ?`<details class="bible-formatting-preview" open><summary>Formatted passage preview</summary><div>${formatted}</div></details>`
    :'';
}

function bibleRemovedReviewHtml(removed){
  const rows=(removed||[]).filter(x=>String(x?.text||'').trim());
  if(!rows.length)return '<p class="meta">Nothing identifiable was removed from this paste.</p>';

  const grouped=new Map();
  for(const row of rows){
    const category=String(row.category||'Other');
    const text=String(row.text||'').replace(/\s+/g,' ').trim();
    if(!text)continue;
    const key=`${category}\u0000${text}`;
    if(grouped.has(key))continue;
    grouped.set(key,{category,text});
  }

  const all=[...grouped.values()];
  const first=all.slice(0,3);
  const remaining=all.slice(3);
  const renderRows=list=>list.map(row=>`
    <div class="bible-removed-row">
      <strong>${esc(row.category)}</strong>
      <span>${esc(row.text)}</span>
    </div>`).join('');

  return `<div class="bible-removed-review">
    <div class="bible-removed-review-head">Removed by parser · ${all.length} item${all.length===1?'':'s'} — cross-check</div>
    <div class="bible-removed-list bible-removed-preview">
      ${renderRows(first)}
    </div>
    ${remaining.length?`<details class="bible-removed-more">
      <summary>Show ${remaining.length} more removed item${remaining.length===1?'':'s'}</summary>
      <div class="bible-removed-list">${renderRows(remaining)}</div>
    </details>`:''}
  </div>`;
}

function cleanBibleGatewayHtml(html,{preferPassageRoot=false}={}){
  const parser=new DOMParser();
  const doc=parser.parseFromString(String(html||''),'text/html');
  const removed=[];

  // Clipboard HTML is usually already passage-focused. A full page returned
  // by automatic fetch is not, so prefer Bible Gateway's passage container
  // when one can be identified. Always retain a defensive fallback.
  const passageRoot=preferPassageRoot
    ? (
        doc.querySelector('.passage-text') ||
        doc.querySelector('.passage-content') ||
        doc.querySelector('[class*="passage-text"]') ||
        doc.querySelector('[class*="passage-content"]') ||
        doc.querySelector('[data-bible-passage]')
      )
    : null;
  const sourceRoot=passageRoot || doc.body || doc.documentElement;
  if(!sourceRoot)return {text:'',removed:[]};

  // Work on a detached copy when a specific passage container was selected,
  // so page furniture elsewhere in the fetched document cannot leak in.
  const root=passageRoot ? passageRoot.cloneNode(true) : sourceRoot;

  const recordAndRemove=(selector,category)=>{
    root.querySelectorAll(selector).forEach(el=>{
      const text=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(text)removed.push({category,text});
      el.remove();
    });
  };

  root.querySelectorAll('script,style,button,svg,nav,aside').forEach(el=>el.remove());

  recordAndRemove('.footnotes,.footnote,.footnote-text','Footnote');
  recordAndRemove('.crossrefs,.cross-references,.crossreference','Cross-reference');
  recordAndRemove('.passage-other-trans,.passage-top,header','Page furniture');
  recordAndRemove('h1,h2,h3,h4,h5,h6,.passage-heading,.heading,.s1,.s2,.s3','Heading');

  const chapterToken=text=>`{st}${String(text||'').trim()}{/st}`;
  const verseToken=text=>`{su}${String(text||'').trim()}{/su}`;

  // First mark Bible Gateway's explicit chapter and verse elements using
  // OpenLP's built-in formatting tags. A trailing space is included so the
  // nearest following letter is always exactly one space away after cleanup.
  root.querySelectorAll([
    '.chapternum','.chapter-num','[class*="chapternum"]'
  ].join(',')).forEach(el=>{
    const text=(el.textContent||'').trim();
    if(text)el.replaceWith(doc.createTextNode(`${chapterToken(text)} `));
    else el.remove();
  });

  root.querySelectorAll([
    '.versenum','.verse-num','[class*="versenum"]'
  ].join(',')).forEach(el=>{
    const text=(el.textContent||'').trim();
    if(text)el.replaceWith(doc.createTextNode(`${verseToken(text)} `));
    else el.remove();
  });

  // Bible Gateway also sometimes places numeric verse markers in otherwise
  // unclassified <sup> elements. Treat those as verse numbers. Explicit
  // chapter elements above have already been replaced.
  root.querySelectorAll('sup').forEach(el=>{
    const cls=(el.className||'').toString().toLowerCase();
    const text=(el.textContent||'').trim();

    if(/^\d+[a-z]?$/i.test(text)){
      el.replaceWith(doc.createTextNode(`${verseToken(text)} `));
      return;
    }

    if(/^\[?[a-z]\]?$/i.test(text) || cls.includes('footnote') || cls.includes('crossref')){
      if(text)removed.push({category:'Footnote/reference marker',text});
      el.remove();
    }else{
      el.replaceWith(...el.childNodes);
    }
  });

  root.querySelectorAll('a').forEach(a=>{
    const cls=(a.className||'').toString().toLowerCase();
    const href=(a.getAttribute('href')||'').toLowerCase();
    const txt=(a.textContent||'').trim();
    if(
      cls.includes('footnote') || cls.includes('crossref') ||
      href.includes('#fen-') || href.includes('#cen-') ||
      /^\[[a-z0-9]+\]$/i.test(txt)
    ){
      if(txt)removed.push({
        category:cls.includes('crossref')||href.includes('#cen-')?'Cross-reference marker':'Footnote/reference marker',
        text:txt
      });
      a.remove();
    }else{
      a.replaceWith(...a.childNodes);
    }
  });

  root.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
  root.querySelectorAll('p,div,li').forEach(el=>{
    if(el.nextSibling)el.appendChild(doc.createTextNode('\n'));
  });

  let text=(root.textContent||'')
    .replace(/\u00a0/g,' ')
    .replace(/[ \t]+\n/g,'\n')
    .replace(/\n[ \t]+/g,'\n')
    .replace(/[ \t]{2,}/g,' ')
    .replace(/(\{\/(?:st|su)\})\s*/g,'$1 ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();

  const markers=[...text.matchAll(/\[([a-z][a-z0-9]?)\]/gi)].map(m=>m[0]);
  for(const marker of markers)removed.push({category:'Footnote/reference marker',text:marker});
  text=text
    .replace(/\[[a-z][a-z0-9]?\]/gi,'')
    .replace(/[ \t]{2,}/g,' ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();

  return {text,removed};
}

function cleanBibleGatewayPlainText(text){
  const removed=[];
  let value=String(text||'');

  const markers=[...value.matchAll(/\[([a-z][a-z0-9]?)\]/gi)].map(m=>m[0]);
  for(const marker of markers)removed.push({category:'Footnote/reference marker',text:marker});

  value=value
    .replace(/\[[a-z][a-z0-9]?\]/gi,'')
    .replace(/[ \t]{2,}/g,' ')
    .replace(/\n{3,}/g,'\n\n')
    .trim();

  return {text:value,removed};
}

function wireBibleGatewayPaste({passageSelector,versionSelector,textSelector,cleanSelector,buttonSelector,fetchButtonSelector,statusSelector,reviewSelector,previewSelector}){
  const passage=$(passageSelector);
  const version=$(versionSelector);
  const text=$(textSelector);
  const clean=$(cleanSelector);
  const button=$(buttonSelector);
  const fetchButton=fetchButtonSelector?$(fetchButtonSelector):null;
  const status=$(statusSelector);
  const review=$(reviewSelector);
  const preview=$(previewSelector);

  const updatePreview=()=>{
    if(preview)preview.innerHTML=bibleFormattingPreviewHtml(text?.value||'');
  };
  text?.addEventListener('input',updatePreview);
  updatePreview();

  const updateLink=()=>{
    if(!button)return;
    const ref=(passage?.value||'').trim();
    const ver=(version?.value||'').trim()||'NIV';
    button.disabled=!ref;
    if(fetchButton)fetchButton.disabled=!ref;
    if(ref){
      button.dataset.href=`https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${encodeURIComponent(ver)}`;
    }
  };
  passage?.addEventListener('input',updateLink);
  version?.addEventListener('input',updateLink);
  updateLink();

  if(button)button.onclick=()=>{
    const href=button.dataset.href;
    if(href)window.open(href,'_blank','noopener');
  };

  if(fetchButton)fetchButton.onclick=async()=>{
    const ref=(passage?.value||'').trim();
    const ver=(version?.value||'').trim()||'NIV';
    if(!ref)return;

    const original=fetchButton.textContent;
    fetchButton.disabled=true;
    fetchButton.textContent='Fetching…';
    if(status)status.textContent='Trying Bible Gateway automatically…';

    try{
      const params=new URLSearchParams({search:ref,version:ver});
      const response=await apiFetch('/api/bible-gateway/fetch?'+params.toString());
      const html=String(response.html||'');
      if(!html)throw new Error('Bible Gateway returned no page content.');

      const result=cleanBibleGatewayHtml(html,{preferPassageRoot:true});
      const cleaned=String(result?.text||'').trim();
      if(!cleaned || cleaned.length<20){
        throw new Error('The fetched Bible Gateway page could not be recognised.');
      }

      text.value=cleaned;
      text.dispatchEvent(new Event('input',{bubbles:true}));
      if(review)review.innerHTML=bibleRemovedReviewHtml(result.removed||[]);
      if(status){
        status.textContent='Automatic fetch worked. Please cross-check the passage and anything shown under Removed by parser.';
      }
      updatePreview();
    }catch(err){
      console.warn('Bible Gateway automatic fetch/parser failed',err);
      if(status){
        status.textContent='Automatic fetch could not recognise the Bible Gateway page. Use “Open in Bible Gateway” and paste instead.';
      }
    }finally{
      fetchButton.disabled=!(passage?.value||'').trim();
      fetchButton.textContent=original;
    }
  };

  if(clean)clean.addEventListener('change',()=>{
    if(!clean.checked){
      if(status)status.textContent='Automatic paste cleanup is off.';
      if(review)review.innerHTML='';
    }
  });

  if(text)text.addEventListener('paste',e=>{
    if(!clean?.checked)return;

    const html=e.clipboardData?.getData('text/html')||'';
    const plain=e.clipboardData?.getData('text/plain')||'';
    const result=html?cleanBibleGatewayHtml(html):cleanBibleGatewayPlainText(plain);
    const cleaned=result?.text||'';
    if(!cleaned)return;

    e.preventDefault();
    const start=text.selectionStart??text.value.length;
    const end=text.selectionEnd??text.value.length;
    text.setRangeText(cleaned,start,end,'end');
    text.dispatchEvent(new Event('input',{bubbles:true}));

    if(status){
      status.textContent=html
        ?'Bible Gateway paste cleaned. Chapter numbers are bold; verse numbers are superscript.'
        :'Plain-text paste cleaned where identifiable. Numbers were preserved, but chapter/verse formatting requires the rich Bible Gateway paste.';
    }
    if(review){
      review.innerHTML=bibleRemovedReviewHtml(result.removed||[]);
    }
    updatePreview();
  });
}


const naturalFileNameCollator=new Intl.Collator(undefined,{
  numeric:true,
  sensitivity:'base'
});
function sortFilesByName(files){
  // Image uploads always use natural filename order unless the user later
  // reorders the service presentation manually.
  return [...files].sort((a,b)=>
    naturalFileNameCollator.compare(
      String(a?.name||a?.originalName||''),
      String(b?.name||b?.originalName||'')
    )
  );
}
function sortImageRowsByFilename(container){
  if(!container)return;
  const rows=[...container.querySelectorAll('.image-media-row')];
  rows.sort((a,b)=>{
    const aName=a.querySelector('.media-label')?.textContent?.replace(/^\s*\d+\s*/,'')||'';
    const bName=b.querySelector('.media-label')?.textContent?.replace(/^\s*\d+\s*/,'')||'';
    return naturalFileNameCollator.compare(aName,bName);
  });
  rows.forEach((row,i)=>{
    container.appendChild(row);
    const n=row.querySelector('.media-label strong');
    if(n)n.textContent=String(i+1);
  });
}
function chooseType(type){
  if(type==='song') return songPicker();
  const names={images:'Image presentation','sermon-images':'Sermon Images',video:'Video',text:'Plan item',bible:'Bible Reading',pdf:'PDF presentation'};
  const imageType=type==='images'||type==='sermon-images';
  openSheet(`<h2>Add ${names[type]}</h2>
    <div class="field"><label>Title</label><input id="newTitle" value="${names[type]}"></div>
    ${type==='text'?'<div class="field"><label>Person / leader</label><input id="newPerson"></div><div class="field"><label>Notes</label><textarea id="newNotes"></textarea></div>':''}
    ${type==='bible'?`
      <div class="field"><label>Passage</label><input id="newPassage" placeholder="Romans 8:1–17"></div>
      <div class="field"><label>Translation</label><input id="newBibleVersion" placeholder="e.g. NIV"></div>
      <div class="bible-gateway-tools">
        <button class="secondary" type="button" id="newBibleGatewayBtn">Open in Bible Gateway ↗</button>
        <button class="secondary" type="button" id="newBibleGatewayFetchBtn">Try automatic fetch</button>
        <label class="bible-clean-toggle"><input id="newCleanBiblePaste" type="checkbox" checked><span>Clean Bible Gateway paste automatically</span></label>
      </div>
      <p class="meta">Before copying, it is still best to turn off headings, footnotes and cross-references in Bible Gateway. <strong>Leave chapter and verse numbers on:</strong> on a rich Bible Gateway paste, chapter numbers are converted to OpenLP bold tags and verse numbers to OpenLP superscript tags. Anything identifiable that is removed is listed below for cross-checking. Untick cleanup if it causes a problem.</p>
      <div class="field"><label>Passage text</label><textarea id="newBibleText" class="bible-text" placeholder="Paste the Bible passage here…"></textarea><p class="meta bible-paste-status" id="newBiblePasteStatus"></p><div id="newBibleFormatPreview" class="bible-format-preview"></div><div id="newBibleRemovedReview"></div></div>
      <p class="meta">The passage is stored in the .osz itself, so the projector laptop does not need internet access or this Bible installed.</p>`:''}
    ${imageType?`<div class="media-source-actions"><button class="secondary" type="button" id="choosePlannerMedia">OpenLP Planner library</button><span>or upload</span></div><div class="field"><label>Upload images</label><input id="newMediaFiles" type="file" accept="image/jpeg,image/png" multiple><p class="meta">Images are added in filename order by default.</p></div><label class="toggle"><span>Store uploaded images in OpenLP Planner library</span><input id="retainNewMedia" type="checkbox"></label><div class="toggle"><span>Auto play</span><input id="newAuto" type="checkbox" ${type==='images'?'checked':''}></div><div class="toggle"><span>Loop</span><input id="newLoop" type="checkbox" ${type==='images'?'checked':''}></div><div class="field"><label>Interval (seconds)</label><input id="newInterval" type="number" value="7" min="1"></div>`:''}
    ${type==='video'?'<div class="media-source-actions"><button class="secondary" type="button" id="choosePlannerMedia">OpenLP Planner library</button><span>or upload</span></div><div class="field"><label>Upload video</label><input id="newMediaFiles" type="file" accept="video/*"></div><label class="toggle"><span>Store uploaded video in OpenLP Planner library</span><input id="retainNewMedia" type="checkbox"></label><div class="toggle"><span>Auto start when live</span><input id="newStart" type="checkbox" checked></div>':''}
    ${type==='pdf'?`<div class="media-source-actions"><button class="secondary" type="button" id="choosePlannerMedia">OpenLP Planner library</button><span>or upload</span></div><div class="field"><label>Upload PDF</label><input id="newMediaFiles" type="file" accept="application/pdf"></div><label class="toggle"><span>Store this PDF presentation in OpenLP Planner library</span><input id="retainNewMedia" type="checkbox"></label>
      <p class="meta">The planner converts each PDF page to a JPEG slide before upload. The exported OpenLP service therefore does not depend on OpenLP's PDF/Presentations plugin.</p>`:''}
    <div class="sheet-actions"><button class="primary" id="createItem">Add</button></div>`);
  if(type==='bible'){
    wireBibleGatewayPaste({
      passageSelector:'#newPassage',
      versionSelector:'#newBibleVersion',
      textSelector:'#newBibleText',
      cleanSelector:'#newCleanBiblePaste',
      buttonSelector:'#newBibleGatewayBtn',
      fetchButtonSelector:'#newBibleGatewayFetchBtn',
      statusSelector:'#newBiblePasteStatus',
      reviewSelector:'#newBibleRemovedReview',
      previewSelector:'#newBibleFormatPreview'
    });
  }

  const buildNewItem=()=>({
      id:Date.now(),type,title:$('#newTitle').value||names[type],
      person:$('#newPerson')?.value||'',notes:$('#newNotes')?.value||'',
      passage:$('#newPassage')?.value||'',
      bibleVersion:$('#newBibleVersion')?.value||'',
      bibleText:$('#newBibleText')?.value||'',
      projected:type!=='text',
      ready:type==='text'||(type==='bible'&&!!($('#newPassage')?.value&&$('#newBibleText')?.value)),
      detail:type==='bible'?($('#newPassage')?.value||'Passage not set'):imageType?'No images yet':type==='video'?'No video yet':type==='pdf'?'No PDF yet':'',
      autoplay:imageType&&$('#newAuto')?.checked?($('#newLoop')?.checked?'loop':'once'):'off',
      interval:+($('#newInterval')?.value||0),autoStart:$('#newStart')?.checked??true,
      by:currentEditor(),changed:'just now',media:[]
    });

  if($('#choosePlannerMedia'))$('#choosePlannerMedia').onclick=()=>{
    const title=$('#newTitle').value||names[type];
    const autoplay=imageType&&$('#newAuto')?.checked?($('#newLoop')?.checked?'loop':'once'):'off';
    const interval=+($('#newInterval')?.value||0);
    const autoStart=$('#newStart')?.checked??true;
    openPlannerMediaPicker(type,{
      multiple:type!=='video',
      onBack:()=>chooseType(type),
      onChoose:async assetIds=>{
        const newItem={
          id:Date.now(),type,title,person:'',notes:'',projected:true,ready:false,
          detail:imageType?'No images yet':type==='video'?'No video yet':'No PDF yet',
          autoplay,interval,autoStart,by:currentEditor(),changed:'just now',media:[]
        };
        state.items.push(newItem);
        persistPlanner(); saveServiceItem(newItem); render();
        try{
          const result=await usePlannerLibraryAssets(assetIds,currentService().id,newItem.id);
          newItem.media=result.assets||[];
          updateMediaItemDetail(newItem);
          persistPlanner(); saveServiceItem(newItem);
          markServiceEdited(`added ${type} from OpenLP Planner library`);
          appendAudit('added library media',newItem.title);
          sheet.close(); render();
        }catch(err){ appAlert(err.message||String(err)); }
      }
    });
  };

  $('#createItem').onclick=async()=>{
    const createBtn=$('#createItem');
    if(createBtn.disabled) return;
    createBtn.disabled=true;

    const newItem=buildNewItem();

    state.items.push(newItem);
    const files=imageType
      ?sortFilesByName($('#newMediaFiles')?.files||[])
      :[...($('#newMediaFiles')?.files||[])];
    const retainMedia=!!$('#retainNewMedia')?.checked;
    const libraryGroupId=type==='pdf'&&retainMedia?crypto.randomUUID():'';
    let libraryFolderId='';
    if(retainMedia&&remoteAvailable){
      const folder=await ensurePlannerMediaFolder(type,newItem.title,currentService().dateISO);
      libraryFolderId=folder?.id||'';
    }

    // Close immediately so the same item cannot be accidentally added twice.
    sheet.close();
    persistPlanner();
    saveServiceItem(newItem);
    markServiceEdited('added item');
    appendAudit('added item',newItem.title);
    render();

    if(files.length && remoteAvailable){
      const uploadPromise=newItem.type==='pdf'
        ? (async()=>{
            newItem.detail='Converting PDF…';
            render();
            const pageFiles=await convertPdfToImageFiles(files[0],(page,total)=>{
              newItem.detail=`Converting PDF… ${page}/${total}`;
              render();
            });
            const results=await Promise.all(pageFiles.map(f=>uploadMediaFile(f,currentService().id,newItem.id,{retain:retainMedia,mediaType:'pdf',libraryGroupId,libraryFolderId})));
            return {results,pdfPages:pageFiles.length};
          })()
        : Promise.all(files.map(f=>uploadMediaFile(f,currentService().id,newItem.id,{retain:retainMedia,mediaType:type,libraryFolderId})))
            .then(results=>({results,pdfPages:0}));

      uploadPromise.then(({results,pdfPages})=>{
          newItem.media=(newItem.type==='images'||newItem.type==='sermon-images')
            ?sortFilesByName(results.map(r=>r.asset))
            :results.map(r=>r.asset);
          if(newItem.type==='images'||newItem.type==='sermon-images'){
            newItem.detail=`${newItem.media.length} image${newItem.media.length===1?'':'s'}${newItem.autoplay==='loop'?' · autoplay loop':''}`;
            newItem.ready=newItem.media.length>0;
          }
          if(newItem.type==='video'){
            newItem.detail=`${newItem.media[0]?.originalName||'Video'}${newItem.autoStart?' · auto start':''}`;
            newItem.ready=newItem.media.length>0;
          }
          if(newItem.type==='pdf'){
            newItem.detail=`${pdfPages} PDF page${pdfPages===1?'':'s'} · converted to images`;
            newItem.ready=newItem.media.length>0;
          }
          markServiceEdited(newItem.type==='pdf'?'converted PDF to image slides':(newItem.type==='images'||newItem.type==='sermon-images')?'uploaded images':'uploaded media');
          saveServiceItem(newItem);
          persistPlanner();
          render();
        })
        .catch(err=>{
          newItem.detail='PDF conversion/upload failed';
          newItem.ready=false;
          persistPlanner();
          render();
          appAlert(err.message);
        });
    }
  };
}

function songPicker(){
  openSheet(`<h2>Add song</h2>
    <div class="field"><label>Search song library</label><input id="songSearch" autocomplete="off" placeholder="Start typing…"></div>
    <div class="song-results" id="songResults"><div class="song-result">Loading song library…</div></div>
    <div class="song-picker-actions">
      <button class="secondary full" id="openSongLibraryManager">Manage song library</button>
    </div>
    <div class="import-divider"><span>Can't find it?</span></div>
    <button class="secondary full" id="songSelectImport">Add / import a song…</button>`);
  const input=$('#songSearch'), results=$('#songResults');
  function show(){
    const q=input.value.trim().toLowerCase();
    const set=(q?songs.filter(s=>(s.title+' '+s.alternateTitle+' '+(s.authors||[]).join(' ')+' '+classificationNames(s).join(' ')).toLowerCase().includes(q)):songs).slice(0,30);
    results.innerHTML=set.map(s=>`<div class="song-result song-result-with-action" data-song="${s.id}">
      <div class="song-result-main">
        <strong>${esc(s.title)}</strong>
        <small>${s.authors?.length?esc(s.authors.join(', '))+' · ':''}${s.verseOrder?`Usual order: ${esc(s.verseOrder)}`:'No saved verse order'}${s.musicNote?` · ♪ ${esc(s.musicNote)}`:''}</small>
        <span class="song-classification-summary-text">
          ${classificationNames(s).length?`Classifications: ${esc(classificationNames(s).join(' · '))}`:'Classifications: none'}
        </span>
      </div>
      <button class="secondary compact song-classify-action" type="button" data-classify-picker-song="${esc(s.id)}">Classify</button>
    </div>`).join('')||'<div class="song-result">No matching songs</div>';
    results.querySelectorAll('[data-song]').forEach(el=>el.onclick=()=>songPreview(el.dataset.song));
    results.querySelectorAll('[data-classify-picker-song]').forEach(btn=>btn.onclick=e=>{
      e.stopPropagation();
      openQuickSongClassification(btn.dataset.classifyPickerSong,songPicker);
    });
  }
  input.oninput=show;
  setTimeout(()=>{show();input.focus()},0);
  $('#openSongLibraryManager').onclick=openSongLibrary;
  $('#songSelectImport').onclick=()=>openSongAddMenu('service');
}



function xmlEsc(value){
  return String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

function songToOpenLyricsXml(song){
  const props=[];
  const titles=[song.title,song.alternateTitle].filter(Boolean)
    .map(t=>`<title>${xmlEsc(t)}</title>`).join('');
  props.push(`<titles>${titles}</titles>`);
  if(song.comments) props.push(`<comments><comment>${xmlEsc(song.comments)}</comment></comments>`);
  if(song.copyright) props.push(`<copyright>${xmlEsc(song.copyright)}</copyright>`);
  if(song.verseOrder) props.push(`<verseOrder>${xmlEsc(String(song.verseOrder).toLowerCase())}</verseOrder>`);
  if(song.ccliNumber) props.push(`<ccliNo>${xmlEsc(song.ccliNumber)}</ccliNo>`);
  if((song.authors||[]).length){
    props.push(`<authors>${song.authors.map(a=>`<author>${xmlEsc(a)}</author>`).join('')}</authors>`);
  }

  const lyrics=(song.sections||[]).map(sec=>{
    const text=String(sec.text||'').split(/\r?\n/).map(xmlEsc).join('<br/>');
    return `<verse name="${xmlEsc(sec.key||'v1')}"><lines>${text}</lines></verse>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n`+
    `<song xmlns="http://openlyrics.info/namespace/2009/song" version="0.8" createdIn="OpenLP Service Planner" modifiedIn="OpenLP Service Planner">`+
    `<properties>${props.join('')}</properties><lyrics>${lyrics}</lyrics></song>`;
}

function safeSongFilename(song){
  const author=(song.authors||[]).join(', ');
  const name=`${song.title||'Song'}${author?` (${author})`:''}`
    .replace(/[\\/:*?"<>|]+/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .slice(0,180);
  return `${name||'song'}.xml`;
}

function downloadBlob(blob,filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},1500);
}



function crc32(bytes){
  let table=crc32.table;
  if(!table){
    table=crc32.table=new Uint32Array(256);
    for(let n=0;n<256;n++){
      let c=n;
      for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
      table[n]=c>>>0;
    }
  }
  let c=0xffffffff;
  for(const b of bytes) c=table[(c^b)&0xff]^(c>>>8);
  return (c^0xffffffff)>>>0;
}

function dosDateTime(d=new Date()){
  let year=Math.max(1980,d.getFullYear());
  const date=((year-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const time=(d.getHours()<<11)|(d.getMinutes()<<5)|Math.floor(d.getSeconds()/2);
  return {date,time};
}

function u16(n){return new Uint8Array([n&255,(n>>>8)&255])}
function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function concatBytes(parts){
  const total=parts.reduce((n,p)=>n+p.length,0);
  const out=new Uint8Array(total);
  let off=0;
  for(const p of parts){out.set(p,off);off+=p.length}
  return out;
}

function makeStoredZip(files){
  const enc=new TextEncoder();
  const locals=[];
  const centrals=[];
  let offset=0;
  const dt=dosDateTime();

  for(const file of files){
    const nameBytes=enc.encode(file.name);
    const data=typeof file.data==='string'?enc.encode(file.data):file.data;
    const crc=crc32(data);
    const local=concatBytes([
      u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),
      u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),
      nameBytes,data
    ]);
    locals.push(local);

    const central=concatBytes([
      u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(dt.time),u16(dt.date),
      u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),u16(0),
      u16(0),u16(0),u32(0),u32(offset),nameBytes
    ]);
    centrals.push(central);
    offset+=local.length;
  }

  const centralBytes=concatBytes(centrals);
  const end=concatBytes([
    u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),
    u32(centralBytes.length),u32(offset),u16(0)
  ]);
  return new Blob([...locals,centralBytes,end],{type:'application/zip'});
}

function exportSongsZip(songList,filename='openlp-songs-openlyrics.zip'){
  const files=songList.map(song=>({
    name:safeSongFilename(song),
    data:songToOpenLyricsXml(song)
  }));
  downloadBlob(makeStoredZip(files),filename);
}

function openBulkSongClassification(songIds,onBack){
  const chosen=songs.filter(song=>songIds.has(String(song.id)));
  if(!chosen.length)return;

  const groups=songClassificationGroups();
  openSheet(`<h2>Classify selected songs</h2>
    <p class="meta"><strong>${chosen.length} song${chosen.length===1?'':'s'}</strong> selected. Choose only the changes you want to make; everything left as <strong>No change</strong> is preserved.</p>
    <div class="bulk-classification-editor">
      ${groups.map(group=>`<section class="classification-group bulk-classification-group">
        <div class="classification-group-head"><strong>${esc(group.name)}</strong><small>${esc(classificationRuleLabel(group.rule))}</small></div>
        ${(group.items||[]).map(item=>`<div class="bulk-classification-row">
          <span>${esc(item.name)}</span>
          <select data-bulk-classification="${esc(item.id)}" data-bulk-group="${esc(group.id)}" data-bulk-rule="${esc(group.rule)}">
            <option value="">No change</option>
            <option value="add">Add / set</option>
            <option value="remove">Remove</option>
          </select>
        </div>`).join('')}
      </section>`).join('')}
    </div>
    <p class="meta" id="bulkClassificationStatus">Required-group rules and defaults will still be enforced for every song.</p>
    <div class="sheet-actions"><button class="secondary" id="cancelBulkClassification">Back</button><button class="primary" id="saveBulkClassification">Apply to ${chosen.length} song${chosen.length===1?'':'s'}</button></div>`);

  // In an exactly-one group, selecting Add/set for one classification clears
  // any other Add/set choice in that same group. Existing values on each song
  // are otherwise left alone until Apply is pressed.
  body.querySelectorAll('[data-bulk-classification]').forEach(select=>select.onchange=()=>{
    if(select.dataset.bulkRule==='exactly-one'&&select.value==='add'){
      body.querySelectorAll(`[data-bulk-group="${CSS.escape(select.dataset.bulkGroup)}"]`).forEach(other=>{
        if(other!==select&&other.value==='add')other.value='';
      });
    }
  });

  $('#cancelBulkClassification').onclick=()=>onBack?onBack():openSongLibrary();
  $('#saveBulkClassification').onclick=async()=>{
    const button=$('#saveBulkClassification');
    const status=$('#bulkClassificationStatus');
    button.disabled=true; button.textContent='Applying…';
    const actions=[...body.querySelectorAll('[data-bulk-classification]')]
      .map(el=>({id:String(el.dataset.bulkClassification),groupId:String(el.dataset.bulkGroup),rule:String(el.dataset.bulkRule),action:el.value}))
      .filter(x=>x.action);
    try{
      for(const song of chosen){
        let next=new Set((song.classifications||[]).map(String));
        for(const action of actions){
          if(action.action==='add'){
            if(action.rule==='exactly-one'){
              const group=groups.find(g=>String(g.id)===action.groupId);
              for(const item of group?.items||[])next.delete(String(item.id));
            }
            next.add(action.id);
          }else if(action.action==='remove'){
            next.delete(action.id);
          }
        }
        await saveSongClassifications(song,[...next]);
      }
      status.textContent=`Classifications updated for ${chosen.length} song${chosen.length===1?'':'s'} ✓`;
      setTimeout(()=>onBack?onBack():openSongLibrary(),300);
    }catch(err){
      status.textContent='Could not update all selected songs: '+(err.message||String(err));
      button.disabled=false; button.textContent=`Apply to ${chosen.length} song${chosen.length===1?'':'s'}`;
    }
  };
}

function openSongLibrary(){
  const selected=new Set();

  openSheet(`<div class="sheet-title-row">
      <h2>Song library</h2>
    </div>

    <div class="song-library-toolbar">
      <div class="field library-search-field"><label>Search shared songs</label><input id="librarySearch" autocomplete="off" placeholder="Title, author or classification"></div>
      <div class="field library-classification-filter"><label>Classification</label><select id="libraryClassificationFilter">
        <option value="">All classifications</option>
        ${songClassificationGroups().map(group=>`<optgroup label="${esc(group.name)}">${(group.items||[]).map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</optgroup>`).join('')}
      </select></div>
      <div class="song-export-actions">
        <button class="secondary compact" id="findDuplicateSongs">Remove duplicates</button>
        <button class="secondary compact" id="selectVisibleSongs">Select visible</button>
        <button class="secondary compact" id="classifySelectedSongs" disabled>Classify selected</button>
        <button class="secondary compact" id="exportSelectedSongs" disabled>Export selected ZIP</button>
      </div>
    </div>

    <div class="song-results library-results" id="libraryResults"></div>
    <p class="meta">Selected-song ZIPs are transport bundles: unzip them, then in OpenLP use File → Import → Song → OpenLyrics and add the XML files.</p>
    <p class="meta">${remoteAvailable?'Changes are saved to the shared song library.':'Local mode: changes are saved in this browser.'}</p>
    <div class="song-library-fixed-footer"><button class="primary" id="libraryAddSong">＋ Song</button></div>`);

  const input=$('#librarySearch');
  const classFilter=$('#libraryClassificationFilter');
  const results=$('#libraryResults');
  const exportBtn=$('#exportSelectedSongs');
  const classifySelectedBtn=$('#classifySelectedSongs');

  function visibleSongs(){
    const q=input.value.trim().toLowerCase();
    const classId=classFilter.value;
    return songs.filter(s=>{
      const text=[s.title,s.alternateTitle,...(s.authors||[]),...classificationNames(s)].join(' ').toLowerCase();
      return (!q||text.includes(q))&&(!classId||(s.classifications||[]).map(String).includes(String(classId)));
    }).slice(0,100);
  }

  function updateExportState(){
    const count=selected.size;
    exportBtn.disabled=count===0;
    exportBtn.textContent=count?`Export selected ZIP (${count})`:'Export selected ZIP';
    classifySelectedBtn.disabled=count===0;
    classifySelectedBtn.textContent=count?`Classify selected (${count})`:'Classify selected';
  }

  function draw(){
    const set=visibleSongs();

    results.innerHTML=set.map(s=>`
      <div class="library-song-row">
        <input class="library-song-check" type="checkbox" data-select-song="${esc(s.id)}" ${selected.has(String(s.id))?'checked':''} aria-label="Select ${esc(s.title)}">
        <button class="library-song-open" data-library-song="${esc(s.id)}">
          <span>
            <strong>${esc(s.title)}</strong>
            <small>${s.authors?.length?esc(s.authors.join(', ')):'No author'}${s.ccliNumber?` · CCLI #${esc(s.ccliNumber)}`:''}</small>
            <span class="song-classification-summary-text">
              ${classificationNames(s).length?`Classifications: ${esc(classificationNames(s).join(' · '))}`:'Classifications: none'}
            </span>
          </span>
          <span class="library-song-meta">${s.verseOrder?esc(s.verseOrder):'No usual order'}${s.musicNote?` · ♪ ${esc(s.musicNote)}`:''}</span>
        </button>
        <button class="secondary compact song-classify-action" type="button" data-classify-library-song="${esc(s.id)}">Classify</button>
        <button class="item-delete library-song-delete" data-delete-library-song="${esc(s.id)}" title="Delete song" aria-label="Delete ${esc(s.title)}">
          <svg class="trash-icon" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/></svg>
        </button>
      </div>`).join('') || '<div class="song-result">No matching songs</div>';

    results.querySelectorAll('[data-library-song]').forEach(btn=>{
      btn.onclick=()=>editLibrarySong(btn.dataset.librarySong);
    });
    results.querySelectorAll('[data-select-song]').forEach(box=>{
      box.onchange=()=>{
        const id=String(box.dataset.selectSong);
        if(box.checked) selected.add(id); else selected.delete(id);
        updateExportState();
      };
    });

    results.querySelectorAll('[data-classify-library-song]').forEach(btn=>{
      btn.onclick=e=>{
        e.stopPropagation();
        openQuickSongClassification(btn.dataset.classifyLibrarySong,openSongLibrary);
      };
    });

    results.querySelectorAll('[data-delete-library-song]').forEach(btn=>{
      btn.onclick=e=>{
        e.stopPropagation();
        const song=songs.find(x=>String(x.id)===String(btn.dataset.deleteLibrarySong));
        if(!song)return;
        const usages=songServiceUsages(song);

        if(usages.length){
          openSheet(`<h2>Song is in use</h2>
            <div class="warning-card">
              <strong>${esc(song.title)}</strong>
              <p>This song is currently used in ${usages.length} service${usages.length===1?'':'s'} and cannot be deleted from the shared library yet.</p>
            </div>
            <ul class="song-usage-list">
              ${usages.map(({service})=>`<li>${esc(service.title)}${service.date?` · ${esc(service.date)}`:''}</li>`).join('')}
            </ul>
            <div class="sheet-actions"><button class="primary" id="closeUsedSongDelete">Done</button></div>`);
          $('#closeUsedSongDelete').onclick=openSongLibrary;
          return;
        }

        openSheet(`<h2>Delete song from library?</h2>
          <div class="warning-card">
            <strong>${esc(song.title)}</strong>
            <p>This will permanently remove the song from the shared Song Library.</p>
          </div>
          <p class="meta">This song is not currently used in any service.</p>
          <div class="sheet-actions">
            <button class="secondary" id="cancelLibrarySongDelete">Cancel</button>
            <button class="danger solid-danger" id="confirmLibrarySongDelete">Delete song</button>
          </div>`);
        $('#cancelLibrarySongDelete').onclick=openSongLibrary;
        $('#confirmLibrarySongDelete').onclick=async()=>{
          const confirm=$('#confirmLibrarySongDelete');
          confirm.disabled=true;
          confirm.textContent='Deleting…';
          try{
            await deleteLibrarySongRemote(song.id);
            songs=songs.filter(x=>String(x.id)!==String(song.id));
            persistSongs();
            
            openSongLibrary();
          }catch(err){
            appAlert(`Song could not be deleted.\n\n${err.message||String(err)}`);
            openSongLibrary();
          }
        };
      };
    });
    updateExportState();
  }

  input.oninput=draw;
  classFilter.onchange=draw;
  $('#libraryAddSong').onclick=()=>openSongAddMenu('library');
  $('#findDuplicateSongs').onclick=openDuplicateSongCleanup;
  classifySelectedBtn.onclick=()=>openBulkSongClassification(new Set(selected),openSongLibrary);
  $('#selectVisibleSongs').onclick=()=>{
    const visible=visibleSongs();
    const allSelected=visible.length && visible.every(s=>selected.has(String(s.id)));
    for(const s of visible){
      if(allSelected) selected.delete(String(s.id)); else selected.add(String(s.id));
    }
    draw();
  };
  exportBtn.onclick=()=>{
    const chosen=songs.filter(s=>selected.has(String(s.id)));
    if(chosen.length) exportSongsZip(chosen,'openlp-selected-songs.zip');
  };

  draw();
  setTimeout(()=>input.focus(),0);
}
function songPreview(songId){
  const s=songs.find(x=>String(x.id)===String(songId)); if(!s)return;
  const sections=(s.sections||[]).map(sec=>`<details class="lyric-section" open>
    <summary>${esc(sectionName(sec))}</summary>
    <div class="lyric-text">${esc(sec.text).replace(/\n/g,'<br>')}</div>
  </details>`).join('');
  openSheet(`<div class="song-head">
      <div><h2>${esc(s.title)}</h2>${s.authors?.length?`<p class="meta">${esc(s.authors.join(', '))}</p>`:''}</div>
    </div>
    ${sections||'<p class="meta">No parsed lyric sections were found in this imported library record.</p>'}
    <div class="field"><label>Usual verse order</label><input id="previewVerse" value="${esc(s.verseOrder||'')}"></div>
    <div class="field"><label>Usual music note for run sheet</label><input id="previewMusicNote" value="${esc(s.musicNote||'')}" placeholder="e.g. Usually in D, Capo 3"></div>
    <div class="song-meta">${s.ccliNumber?`<span>CCLI #${esc(s.ccliNumber)}</span>`:''}${s.copyright?`<span>${esc(s.copyright)}</span>`:''}</div>
    <div class="song-preview-classifications">
      <div><strong>Classifications</strong><span>${classificationNames(s).length?esc(classificationNames(s).join(' · ')):'None'}</span></div>
      <button class="secondary compact" id="classifyPreviewSong">Edit classifications</button>
    </div>
    <div class="sheet-actions">
      <button class="secondary" id="editLibrarySong">Edit library song</button>
      <button class="primary" id="addSongToService">Add to service</button>
    </div>`);
  $('#editLibrarySong').onclick=()=>editLibrarySong(s.id);
  $('#classifyPreviewSong').onclick=()=>openQuickSongClassification(s.id,()=>songPreview(s.id));
  $('#addSongToService').onclick=()=>{
    const usualOrder=$('#previewVerse').value.trim();
    const usualNote=$('#previewMusicNote').value.trim();
    s.verseOrder=usualOrder;
    s.musicNote=usualNote;
    state.items.push({
      id:Date.now(),type:'song',songId:s.id,title:s.title,person:'Music',
      projected:true,ready:true,detail:'Usual arrangement',
      verse:usualOrder,musicNote:usualNote,by:currentEditor(),changed:'just now'
    });
    const added=state.items[state.items.length-1];
    persistPlanner();
    saveServiceItem(added);
    markServiceEdited('added song');
    appendAudit('added song',added.title);
    sheet.close();render();
  };
}

function editLibrarySong(songId){
  const s=songs.find(x=>String(x.id)===String(songId));
  if(!s) return;

  openSheet(`<h2>Edit library song</h2>
    <p class="meta">Changes here become the shared defaults for future services.</p>

    <div class="field"><label>Title</label><input id="libTitle" value="${esc(s.title)}"></div>
    <div class="field"><label>Authors</label><input id="libAuthors" value="${esc((s.authors||[]).join(', '))}"></div>

    <div class="section-editor">
      ${(s.sections||[]).map((sec,i)=>`
        <div class="edit-section">
          <div class="section-line">
            <strong>${esc(sectionName(sec))}</strong>
            <input class="secKey" data-i="${i}" value="${esc(sec.key||'')}" title="OpenLP section key">
          </div>
          <textarea class="secText" data-i="${i}">${esc(sec.text||'')}</textarea>
        </div>`).join('')}
    </div>

    <div class="field">
      <label>Usual verse order</label>
      <input id="libOrder" value="${esc(s.verseOrder||'')}" placeholder="e.g. v1 c1 v2 c1 v3 c1">
      <p class="meta verse-order-help">
        Use OpenLP section keys in the order they should be projected. For example:
        <strong>v1 c1 v2 c1 v3 c1</strong> = Verse 1, Chorus 1, Verse 2, Chorus 1, Verse 3, Chorus 1.
        Other common keys include <strong>b1</strong> (Bridge 1), <strong>p1</strong> (Pre-chorus 1) and <strong>e1</strong> (Ending 1).
      </p>
    </div>
    <div class="field"><label>Usual music note</label><input id="libMusicNote" value="${esc(s.musicNote||'')}" placeholder="e.g. Usually in D, Capo 3"></div>
    <div class="field"><label>CCLI song #</label><input id="libCcli" value="${esc(s.ccliNumber||'')}"></div>
    <div class="field"><label>Copyright</label><textarea id="libCopyright">${esc(s.copyright||'')}</textarea></div>

    <div class="song-classification-editor"><h3>Classifications</h3>${classificationControls(s)}</div>

    <div class="song-safety-row">
      <button class="secondary" id="undoSavedSong" disabled>Undo most recent saved version</button>
      <span class="meta" id="songRevisionStatus">Checking saved history…</span>
    </div>

    <p class="meta master-save-status" id="songMasterSaveStatus">Saving changes updates the shared master song for everyone.</p>
    <div class="sheet-actions">
      <button class="secondary" id="cancelLibrarySong">Back to library</button>
      <button class="secondary" id="saveLibrarySongCopy">Save a Copy</button>
      <button class="primary" id="saveLibrarySong">Save changes to master</button>
    </div>`);

  enforceClassificationControlRules(body);

  let dirty=false;
  const save=$('#saveLibrarySong');

  const markDirty=()=>{
    dirty=true;
    save.textContent='Save changes to master';
  };

  body.querySelectorAll('#libTitle,#libAuthors,.secKey,.secText,#libOrder,#libMusicNote,#libCcli,#libCopyright,input[name="songClass"]')
    .forEach(el=>{
      el.addEventListener('input',markDirty);
      el.addEventListener('change',markDirty);
    });

  function draftSongFromEditor(base=s){
    const draft=structuredClone(base);
    draft.title=$('#libTitle').value.trim()||base.title;
    draft.authors=$('#libAuthors').value.split(',').map(x=>x.trim()).filter(Boolean);

    const sections=structuredClone(base.sections||[]);
    document.querySelectorAll('.secText').forEach((el,i)=>{
      if(sections[i]) sections[i].text=el.value;
    });
    document.querySelectorAll('.secKey').forEach((el,i)=>{
      if(!sections[i]) return;
      const key=el.value.trim().toLowerCase();
      if(!key) return;
      sections[i].key=key;
      const match=key.match(/^([a-z]+)(\d*)$/);
      if(match){
        sections[i].type=match[1].charAt(0);
        sections[i].label=match[2]||'1';
      }
    });
    draft.sections=sections;
    draft.verseOrder=$('#libOrder').value.trim();
    draft.musicNote=$('#libMusicNote').value.trim();
    draft.ccliNumber=$('#libCcli').value.trim();
    draft.copyright=$('#libCopyright').value.trim();
    draft.classifications=collectClassificationControls(body);
    return draft;
  }

  async function refreshRevisionStatus(){
    const btn=$('#undoSavedSong');
    const status=$('#songRevisionStatus');
    const latest=await latestSongRevision(s.id);
    if(!btn||!status)return;
    btn.disabled=!latest.available;
    status.textContent=latest.available
      ?`Previous version saved ${latest.savedAt?formatLastEdited(latest.savedAt):''}${latest.savedBy?` · by ${latest.savedBy}`:''}`
      :'No previous saved version yet';
  }

  refreshRevisionStatus();

  $('#cancelLibrarySong').onclick=()=>openSongLibrary();

  $('#saveLibrarySongCopy').onclick=()=>{
    const draft=draftSongFromEditor();
    openSheet(`<h2>Save a Copy</h2>
      <p class="meta">The original library song will not be changed. Add a short identifying suffix to distinguish this copy.</p>
      <div class="field"><label>Original title</label><div>${esc(draft.title)}</div></div>
      <div class="field"><label>Identifying suffix</label><input id="songCopySuffix" placeholder="e.g. Youth, Short version, NightChurch"></div>
      <div class="copy-title-preview"><small>New song title</small><strong id="songCopyPreview">${esc(draft.title)}</strong></div>
      <div class="sheet-actions"><button class="secondary" id="cancelSongCopy">Back</button><button class="primary" id="confirmSongCopy" disabled>Save Copy</button></div>`);

    const suffix=$('#songCopySuffix');
    const confirm=$('#confirmSongCopy');
    const preview=$('#songCopyPreview');
    const update=()=>{
      const value=suffix.value.trim();
      confirm.disabled=!value;
      preview.textContent=value?`${draft.title} — ${value}`:draft.title;
    };
    suffix.oninput=update;
    update();
    setTimeout(()=>suffix.focus(),0);

    $('#cancelSongCopy').onclick=()=>editLibrarySong(songId);
    confirm.onclick=async()=>{
      const value=suffix.value.trim();
      if(!value)return;
      confirm.disabled=true;
      confirm.textContent='Saving…';

      const copy=structuredClone(draft);
      copy.id=nextSongCopyId();
      copy.title=`${draft.title} — ${value}`;
      copy.source='planner-copy';
      copy.updatedAt=new Date().toISOString();
      copy.updatedBy=currentEditor();

      songs.push(copy);
      persistSongs();
      await createLibrarySongRemote(copy);
      
      openSongLibrary();
    };
  };

  $('#undoSavedSong').onclick=async()=>{
    const btn=$('#undoSavedSong');
    if(btn.disabled)return;
    openSheet(`<h2>Undo most recent saved version?</h2>
      <div class="warning-card"><strong>${esc(s.title)}</strong><p>This restores the version immediately before the most recent saved change. The current version is preserved in history, so this restore can itself be reversed.</p></div>
      <div class="sheet-actions"><button class="secondary" id="cancelSongRestore">Cancel</button><button class="primary" id="confirmSongRestore">Restore previous version</button></div>`);
    $('#cancelSongRestore').onclick=()=>editLibrarySong(songId);
    $('#confirmSongRestore').onclick=async()=>{
      const restore=$('#confirmSongRestore');
      restore.disabled=true;
      restore.textContent='Restoring…';
      try{
        const result=await restoreLatestSongRevision(s.id);
        if(!result?.song)throw new Error('Previous version was not returned.');
        const index=songs.findIndex(x=>String(x.id)===String(s.id));
        if(index>=0)songs[index]=result.song;
        persistSongs();

        // Existing service items keep their song slot but refresh the shared title
        // if they point to this exact library song.
        state.services.forEach(service=>{
          (service.items||[]).forEach(item=>{
            if(item.type==='song'&&String(item.songId)===String(s.id)){
              item.title=result.song.title;
            }
          });
        });
        persistPlanner();
        
        editLibrarySong(s.id);
      }catch(err){
        appAlert(err.message||String(err));
        editLibrarySong(songId);
      }
    };
  };

  save.onclick=async()=>{
    if(!dirty){
      save.textContent='No changes to save';
      setTimeout(()=>{ if(save)save.textContent='Save changes to master'; },900);
      return;
    }

    const oldTitle=s.title;
    const previous=structuredClone(s);
    const draft=draftSongFromEditor();
    const originalLabel='Save changes to master';

    save.disabled=true;
    save.textContent='Saving…';

    try{
      // Save the shared master first. Only update the browser copy after the
      // server confirms success, so the button can never silently appear to save.
      const result=await saveLibrarySongRemote(draft);
      Object.assign(s,draft);
      persistSongs();

      const affectedServiceItems=state.services.flatMap(service=>(service.items||[]))
        .filter(i=>i.type==='song' && (String(i.songId)===String(s.id) || i.title===oldTitle));
      affectedServiceItems.forEach(i=>{
        i.songId=s.id;
        i.title=s.title;
        i.changed='just now';
        i.by=currentEditor();
      });
      persistPlanner();

      if(s.title!==oldTitle && affectedServiceItems.length){
        markChurchSuiteOutOfSync('Song title changed locally');
        saveServiceMeta();
      }

      
      dirty=false;
      save.textContent='Saved ✓';
      render();

      // Leave visible acknowledgement before returning to the library.
      setTimeout(()=>openSongLibrary(),650);
    }catch(err){
      Object.assign(s,previous);
      save.disabled=false;
      save.textContent=originalLabel;
      const message=err?.message||String(err);
      const status=$('#songMasterSaveStatus');
      if(status){
        status.textContent=`Not saved: ${message}`;
        status.classList.add('save-error');
      }else{
        appAlert(`Song was not saved to the master library.\n\n${message}`);
      }
    }
  };
}


function songDuplicateMatch(song){
  const ccli=String(song.ccliNumber||'').trim();
  const title=duplicateBaseTitle(song.title);
  return songs.find(existing=>{
    if(ccli&&String(existing.ccliNumber||'').trim()===ccli)return true;
    return title&&duplicateBaseTitle(existing.title)===title;
  })||null;
}
async function addImportedSongToLibrary(song){
  const duplicate=songDuplicateMatch(song);
  if(duplicate)return {duplicate};
  const saved={
    ...song,
    id:song.id||Date.now(),
    classifications:normalizeSongClassificationsLocal(
      song.classifications?.length?song.classifications:defaultSongClassifications()
    )
  };
  songs.push(saved);
  persistSongs();
  await createLibrarySongRemote(saved);
  return {song:saved,duplicate:null};
}
function serviceOnlySongCopy(song){
  return {
    id:String(song?.id||`service-only-${Date.now()}`),
    title:String(song?.title||'Untitled song'),
    alternateTitle:String(song?.alternateTitle||''),
    authors:Array.isArray(song?.authors)?structuredClone(song.authors):[],
    sections:Array.isArray(song?.sections)?structuredClone(song.sections):[],
    verseOrder:String(song?.verseOrder||''),
    musicNote:String(song?.musicNote||''),
    ccliNumber:String(song?.ccliNumber||''),
    copyright:String(song?.copyright||''),
    comments:String(song?.comments||''),
    themeName:String(song?.themeName||''),
    source:'service-only'
  };
}

function addServiceOnlySongToCurrentService(song,detail='Service-only song'){
  const copy=serviceOnlySongCopy(song);
  const item={
    id:Date.now()+Math.floor(Math.random()*1000),
    type:'song',
    songId:null,
    serviceSong:copy,
    title:copy.title,
    person:'Music',
    projected:true,
    ready:true,
    detail,
    verse:copy.verseOrder||'',
    musicNote:copy.musicNote||'',
    by:currentEditor(),
    changed:'just now'
  };
  state.items.push(item);
  persistPlanner();
  saveServiceItem(item);
  markServiceEdited('added service-only song');
  appendAudit('added service-only song',item.title);
  return item;
}

function applyServiceOnlySongToChurchSuiteSlot(item,song){
  const copy=serviceOnlySongCopy(song);
  item.songId=null;
  item.serviceSong=copy;
  item.title=copy.title;
  item.ready=true;
  item.projected=true;
  item.churchSuiteWritePending=true;
  item.detail='Local copy updated · service only';
  item.verse=copy.verseOrder||'';
  item.musicNote=copy.musicNote||'';
  item.changed='just now';
  item.by=currentEditor();

  persistPlanner();
  saveServiceItem(item);
  markServiceEdited('updated local ChurchSuite song copy');
  appendAudit('updated local ChurchSuite song copy',copy.title);
}

function applyLibrarySongToChurchSuiteSlot(item,song,detail='Available locally · ChurchSuite update pending'){
  if(!item||!song)return;
  item.songId=song.id;
  item.serviceSong=null;
  item.title=song.title;
  item.ready=true;
  item.projected=true;
  item.churchSuiteWritePending=true;
  item.detail=detail;
  item.verse=song.verseOrder||'';
  item.musicNote=song.musicNote||'';
  item.changed='just now';
  item.by=currentEditor();

  persistPlanner();
  saveServiceItem(item);
  markServiceEdited('matched imported ChurchSuite song');
  appendAudit('matched ChurchSuite song',song.title);
}

function addLibrarySongToCurrentService(song,detail='Added from Song Library'){
  const item={
    id:Date.now()+Math.floor(Math.random()*1000),type:'song',songId:song.id,
    title:song.title,person:'Music',projected:true,ready:true,detail,
    verse:song.verseOrder||'',musicNote:song.musicNote||'',
    by:currentEditor(),changed:'just now'
  };
  state.items.push(item);
  persistPlanner();saveServiceItem(item);
  markServiceEdited('added song');appendAudit('added song',item.title);
}
function openSongAddMenu(destination='library',options={}){
  openSheet(`<h2>Add song</h2>
    <p class="meta">${destination==='service'
      ?'Create/import a song for this service. You can also keep it out of the shared Song Library.'
      :'Add to the shared OpenLP Song Library using the same song record, duplicate checks and classifications.'}</p>
    ${destination==='service'?`
      <div class="song-save-scope">
        <label class="choice-line"><input type="radio" name="songSaveScope" id="songSaveScopeLibrary" value="library" ${options.saveToLibrary===false?'':'checked'}><span><strong>Add to service &amp; library</strong><small>Save the song in the shared library for future services.</small></span></label>
        <label class="choice-line"><input type="radio" name="songSaveScope" id="songSaveScopeServiceOnly" value="service" ${options.saveToLibrary===false?'checked':''}><span><strong>Add to this service only</strong><small>Keep a complete song copy inside this service without adding it to the shared library.</small></span></label>
      </div>`:''}
    <div class="choice-grid song-import-choice-grid">
      <button class="choice" id="manualSongAdd"><strong>Create manually</strong><span>Enter a song yourself.</span></button>
      <button class="choice" id="songSelectSongAdd"><strong>CCLI / SongSelect paste</strong><span>Paste copied SongSelect lyrics.</span></button>
      <button class="choice" id="songSelectFileAdd"><strong>CCLI / SongSelect file</strong><span>Choose a downloaded SongSelect/CCLI text file.</span></button>
      <button class="choice" id="openLyricsSongAdd"><strong>OpenLyrics</strong><span>Import one or more XML files.</span></button>
    </div>
    <div class="sheet-actions"><button class="secondary" id="backFromSongAdd">Back</button></div>`);
  $('#backFromSongAdd').onclick=()=>typeof options.onBack==='function'
    ?options.onBack()
    :(destination==='service'?songPicker():openSongLibrary());

  const addSongOptions=()=>({
    ...options,
    saveToLibrary:destination!=='service' || !$('#songSaveScopeServiceOnly')?.checked
  });
  $('#manualSongAdd').onclick=()=>openManualSongAdd(destination,addSongOptions());
  $('#songSelectSongAdd').onclick=()=>songSelectPaste(destination,addSongOptions());
  $('#songSelectFileAdd').onclick=()=>openSongSelectFileImport(destination,addSongOptions());
  $('#openLyricsSongAdd').onclick=()=>openOpenLyricsImport(destination,addSongOptions());
}
const MANUAL_SECTION_TYPES=[
  {type:'v',name:'Verse'},
  {type:'c',name:'Chorus'},
  {type:'b',name:'Bridge'},
  {type:'p',name:'Pre-Chorus'},
  {type:'t',name:'Tag'},
  {type:'e',name:'Ending'},
  {type:'i',name:'Intro'},
  {type:'o',name:'Other'}
];

function manualSectionHeading(line){
  const text=String(line||'').trim().replace(/[:\-–—]+$/,'').trim();
  if(!text)return null;

  const compact=text.toLowerCase().replace(/[._]/g,' ').replace(/\s+/g,' ').trim();
  const aliases=[
    {re:/^(?:verse|v)\s*(\d+)?$/i,type:'v'},
    {re:/^(?:chorus|c)\s*(\d+)?$/i,type:'c'},
    {re:/^(?:bridge|b)\s*(\d+)?$/i,type:'b'},
    {re:/^(?:pre[ -]?chorus|prechorus|p)\s*(\d+)?$/i,type:'p'},
    {re:/^(?:tag|t)\s*(\d+)?$/i,type:'t'},
    {re:/^(?:ending|end|e)\s*(\d+)?$/i,type:'e'},
    {re:/^(?:intro|i)\s*(\d+)?$/i,type:'i'},
    {re:/^(?:other|section|o)\s*(\d+)?$/i,type:'o'}
  ];
  for(const alias of aliases){
    const match=compact.match(alias.re);
    if(match)return {type:alias.type,label:match[1]||'1'};
  }
  return null;
}

function parseManualSongLyrics(raw){
  const lines=String(raw||'').replace(/\r/g,'').split('\n');
  const sections=[];
  const order=[];
  const typeCounts={v:0,c:0,b:0,p:0,t:0,e:0,i:0,o:0};
  const knownBySignature=new Map();
  let current=null;

  const nextLabel=type=>String(++typeCounts[type]);
  const finish=()=>{
    if(!current)return;
    const text=current.lines.join('\n').trim();
    if(!text){current=null;return;}

    let label=String(current.label||'1');
    typeCounts[current.type]=Math.max(typeCounts[current.type]||0,Number(label)||0);
    let key=`${current.type}${label}`;
    const signature=`${key}\u0000${text}`;

    if(knownBySignature.has(signature)){
      order.push(knownBySignature.get(signature));
      current=null;
      return;
    }

    // Same explicit key but different words means a second section of that
    // component rather than silently overwriting the first one.
    if(sections.some(section=>section.key===key)){
      label=nextLabel(current.type);
      key=`${current.type}${label}`;
    }

    sections.push({key,type:current.type,label,text});
    knownBySignature.set(`${key}\u0000${text}`,key);
    order.push(key);
    current=null;
  };

  for(const line of lines){
    const heading=manualSectionHeading(line);
    if(heading){
      finish();
      const explicit=String(heading.label||'1');
      typeCounts[heading.type]=Math.max(typeCounts[heading.type]||0,Number(explicit)||0);
      current={type:heading.type,label:explicit,lines:[]};
      continue;
    }
    if(!current){
      current={type:'v',label:nextLabel('v'),lines:[]};
    }
    current.lines.push(line);
  }
  finish();

  return {
    sections,
    verseOrder:order.join(' ')
  };
}

function manualSectionTypeOptions(selected){
  return MANUAL_SECTION_TYPES.map(item=>`<option value="${item.type}" ${item.type===selected?'selected':''}>${item.name}</option>`).join('');
}

function openManualSongAdd(destination='library',options={}){
  const draft={
    id:Date.now(),
    title:String(options.prefillTitle||''),
    alternateTitle:'',
    authors:[],
    sections:[],
    verseOrder:'',
    musicNote:'',
    ccliNumber:String(options.prefillCcliNumber||''),
    copyright:'',
    comments:options.churchSuiteItem
      ?'Created from unmatched ChurchSuite song slot'
      :'Created in OpenLP Service Planner',
    themeName:'',
    source:'planner',
    classifications:defaultSongClassifications()
  };

  openSheet(`<h2>Create song</h2>
    <p class="meta">Create the same shared song record used by existing library songs. Paste structured lyrics and parse them, or add/edit the song sections yourself.</p>
    <div class="field"><label>Title</label><input id="manualSongTitle" value="${esc(draft.title)}"></div>
    <div class="field"><label>Authors</label><input id="manualSongAuthors" placeholder="Comma separated"></div>

    <div class="field">
      <label>Lyrics</label>
      <textarea id="manualSongLyrics" class="big-paste" placeholder="Verse 1
Amazing grace...

Chorus
...

Verse 2
..."></textarea>
      <p class="meta">Section headings understood include <strong>Verse 1</strong>, <strong>Chorus</strong>, <strong>Bridge</strong>, <strong>Pre-Chorus</strong>, <strong>Tag</strong>, <strong>Ending</strong> and <strong>Intro</strong>. If there are no headings, the text becomes Verse 1.</p>
      <button class="secondary compact" type="button" id="manualParseLyrics">Parse lyrics into sections</button>
    </div>

    <div class="manual-song-section-area">
      <div class="settings-subsection-head">
        <div><h3>Song sections</h3><p class="meta" id="manualSectionSummary">No sections yet. Parse the Lyrics box above or add one.</p></div>
        <button class="secondary compact" type="button" id="manualAddSection">＋ Section</button>
      </div>
      <div id="manualSongSections" class="section-editor manual-section-editor"></div>
    </div>

    <div class="field">
      <label>Usual verse order</label>
      <input id="manualSongOrder" placeholder="e.g. v1 c1 v2 c1 v3 c1">
      <p class="meta verse-order-help">This is the normal projection order. Parsing the Lyrics box fills it automatically; you can then change it.</p>
    </div>
    <div class="field"><label>Usual music note</label><input id="manualSongMusicNote" placeholder="e.g. Usually in D, Capo 3"></div>
    <div class="field"><label>CCLI song #</label><input id="manualSongCcli" value="${esc(draft.ccliNumber)}"></div>
    <div class="field"><label>Copyright</label><textarea id="manualSongCopyright"></textarea></div>

    <div class="song-classification-editor"><h3>Classifications</h3>${classificationControls(draft)}</div>
    <p class="meta" id="manualSongStatus"></p>
    <div class="sheet-actions"><button class="secondary" id="manualSongBack">Back</button><button class="primary" id="manualSongSave">${destination==='service'?'Add to library & service':'Add to Song Library'}</button></div>`);

  enforceClassificationControlRules(body);

  const sectionHost=$('#manualSongSections');
  const summary=$('#manualSectionSummary');
  let sectionCounter=0;

  const normaliseManualSection=(section={})=>{
    const type=MANUAL_SECTION_TYPES.some(x=>x.type===section.type)?section.type:'v';
    const label=String(section.label||'1').replace(/\D+/g,'')||'1';
    return {
      _editorId:section._editorId||`manual-section-${++sectionCounter}`,
      type,
      label,
      key:`${type}${label}`,
      text:String(section.text||'')
    };
  };

  const collectManualSections=()=>{
    const sections=[];
    sectionHost.querySelectorAll('[data-manual-section]').forEach(row=>{
      const type=row.querySelector('[data-manual-section-type]').value;
      const label=String(row.querySelector('[data-manual-section-label]').value||'1').replace(/\D+/g,'')||'1';
      const text=row.querySelector('[data-manual-section-text]').value.trim();
      if(text)sections.push({key:`${type}${label}`,type,label,text});
    });
    return sections;
  };

  const refreshSummary=()=>{
    const count=sectionHost.querySelectorAll('[data-manual-section]').length;
    summary.textContent=count
      ?`${count} section${count===1?'':'s'} · edit the type, number or lyrics below.`
      :'No sections yet. Parse the Lyrics box above or add one.';
  };

  const renderManualSections=sections=>{
    const clean=(sections||[]).map(normaliseManualSection);
    sectionHost.innerHTML=clean.map(section=>`<div class="edit-section manual-edit-section" data-manual-section="${esc(section._editorId)}">
      <div class="manual-section-head">
        <div class="field compact-field">
          <label>Component</label>
          <select data-manual-section-type>${manualSectionTypeOptions(section.type)}</select>
        </div>
        <div class="field compact-field manual-section-number">
          <label>Number</label>
          <input data-manual-section-label inputmode="numeric" value="${esc(section.label)}">
        </div>
        <button class="item-delete" type="button" data-remove-manual-section title="Remove section" aria-label="Remove section">×</button>
      </div>
      <textarea data-manual-section-text>${esc(section.text)}</textarea>
    </div>`).join('');

    sectionHost.querySelectorAll('[data-remove-manual-section]').forEach(button=>button.onclick=()=>{
      button.closest('[data-manual-section]')?.remove();
      refreshSummary();
    });
    refreshSummary();
  };

  $('#manualParseLyrics').onclick=()=>{
    const result=parseManualSongLyrics($('#manualSongLyrics').value);
    if(!result.sections.length){
      $('#manualSongStatus').textContent='No lyrics were found to parse.';
      return;
    }
    renderManualSections(result.sections);
    $('#manualSongOrder').value=result.verseOrder;
    $('#manualSongStatus').textContent=`Parsed ${result.sections.length} section${result.sections.length===1?'':'s'}. Please review them below.`;
  };

  $('#manualAddSection').onclick=()=>{
    const current=collectManualSections();
    const verseCount=current.filter(x=>x.type==='v').length;
    current.push({type:'v',label:String(verseCount+1),text:''});
    renderManualSections(current);
    const last=sectionHost.querySelector('[data-manual-section]:last-child [data-manual-section-text]');
    if(last)setTimeout(()=>last.focus(),0);
  };

  $('#manualSongBack').onclick=()=>openSongAddMenu(destination,options);
  $('#manualSongSave').onclick=async()=>{
    draft.title=$('#manualSongTitle').value.trim();
    if(!draft.title){$('#manualSongStatus').textContent='Enter a song title.';return}
    draft.authors=$('#manualSongAuthors').value.split(',').map(x=>x.trim()).filter(Boolean);
    draft.sections=collectManualSections();

    // If the user typed lyrics but forgot Parse, make a helpful final attempt
    // rather than saving an empty song.
    if(!draft.sections.length && $('#manualSongLyrics').value.trim()){
      const parsed=parseManualSongLyrics($('#manualSongLyrics').value);
      draft.sections=parsed.sections;
      if(!$('#manualSongOrder').value.trim())$('#manualSongOrder').value=parsed.verseOrder;
    }
    if(!draft.sections.length){$('#manualSongStatus').textContent='Add or parse at least one lyric section.';return}

    draft.verseOrder=$('#manualSongOrder').value.trim()||draft.sections.map(x=>x.key).join(' ');
    draft.musicNote=$('#manualSongMusicNote').value.trim();
    draft.ccliNumber=$('#manualSongCcli').value.trim();
    draft.copyright=$('#manualSongCopyright').value.trim();
    draft.classifications=collectClassificationControls(body);

    if(options.saveToLibrary!==false){
      const duplicate=songDuplicateMatch(draft);
      if(duplicate){$('#manualSongStatus').textContent='A matching song already exists: '+duplicate.title;return}
    }

    const save=$('#manualSongSave');
    save.disabled=true;
    save.textContent='Saving…';
    try{
      if(destination==='service' && options.saveToLibrary===false){
        if(typeof options.onServiceOnly==='function'){
          await options.onServiceOnly(draft);
        }else{
          addServiceOnlySongToCurrentService(draft,'Created manually · service only');
          editItem(state.items[state.items.length-1]?.id);
        }
        return;
      }

      const result=await addImportedSongToLibrary(draft);
      if(typeof options.onSaved==='function'){
        await options.onSaved(result.song);
        return;
      }
      if(destination==='service')addLibrarySongToCurrentService(result.song,'Created manually');
      destination==='service'?songPreview(result.song.id):openSongLibrary();
    }catch(err){
      $('#manualSongStatus').textContent='Could not save song: '+(err.message||String(err));
      save.disabled=false;
      save.textContent=destination==='service'?'Add to library & service':'Add to Song Library';
    }
  };
}

function xmlLocalName(node){
  return String(node?.localName||node?.nodeName||'').replace(/^.*:/,'').toLowerCase();
}
function xmlByLocalName(root,name){
  const wanted=String(name).toLowerCase();
  return [...root.getElementsByTagName('*')].filter(x=>xmlLocalName(x)===wanted);
}
function openLyricsText(node){
  let out='';
  const walk=current=>{
    for(const child of current.childNodes||[]){
      if(child.nodeType===3||child.nodeType===4)out+=child.nodeValue||'';
      else if(xmlLocalName(child)==='br')out+='\n';
      else walk(child);
    }
  };
  walk(node);
  return out.replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').trim();
}
function parseOpenLyricsXml(xmlText,fileName='OpenLyrics.xml'){
  const doc=new DOMParser().parseFromString(xmlText,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error(fileName+': invalid XML');
  const properties=xmlByLocalName(doc,'properties')[0]||doc;
  const lyrics=xmlByLocalName(doc,'lyrics')[0];
  const titles=xmlByLocalName(properties,'title').map(x=>x.textContent?.trim()).filter(Boolean);
  const authors=xmlByLocalName(properties,'author').map(x=>x.textContent?.trim()).filter(Boolean);
  const copyright=xmlByLocalName(properties,'copyright')[0]?.textContent?.trim()||'';
  const ccliNumber=xmlByLocalName(properties,'cclino')[0]?.textContent?.trim()||'';
  const verseOrder=xmlByLocalName(properties,'verseorder')[0]?.textContent?.trim()||'';
  const verses=lyrics?xmlByLocalName(lyrics,'verse'):[];
  const sections=verses.map((verse,index)=>{
    const key=(verse.getAttribute('name')||('v'+(index+1))).trim().toLowerCase();
    const match=key.match(/^([a-z]+)(\d*)/);
    const lines=xmlByLocalName(verse,'lines')[0]||verse;
    return {key,type:(match?.[1]||'v').charAt(0),label:match?.[2]||String(index+1),text:openLyricsText(lines)};
  }).filter(x=>x.text);
  if(!titles[0]||!sections.length)throw new Error(fileName+': title or lyric sections were not found');
  return {
    id:Date.now()+Math.floor(Math.random()*1000000),
    title:titles[0],alternateTitle:titles[1]||'',authors,sections,
    verseOrder:verseOrder||sections.map(x=>x.key).join(' '),
    musicNote:'',ccliNumber,copyright,
    comments:'Imported from OpenLyrics: '+fileName,themeName:'',source:'openlyrics',
    classifications:defaultSongClassifications()
  };
}
function openOpenLyricsImport(destination='library',options={}){
  openSheet(`<h2>Import OpenLyrics</h2>
    <p class="meta">Choose one or more OpenLyrics XML files. Files exported from OpenLP can be imported here.</p>
    <label class="secondary file-button full">Choose OpenLyrics XML files<input id="openLyricsFiles" type="file" accept=".xml,application/xml,text/xml" multiple></label>
    <div id="openLyricsImportStatus"></div>
    <div class="sheet-actions"><button class="secondary" id="openLyricsBack">Back</button></div>`);
  $('#openLyricsBack').onclick=()=>openSongAddMenu(destination,options);
  $('#openLyricsFiles').onchange=async e=>{
    const files=[...(e.target.files||[])];
    if(!files.length)return;
    const parsed=[],errors=[];
    for(const file of files){
      try{parsed.push(parseOpenLyricsXml(await file.text(),file.name))}
      catch(err){errors.push(err.message||String(err))}
    }
    const entries=parsed.map(song=>({song,duplicate:songDuplicateMatch(song)}));
    const status=$('#openLyricsImportStatus');
    status.innerHTML=`<div class="import-summary"><strong>${parsed.length} readable song${parsed.length===1?'':'s'}</strong>
      <span>${entries.filter(x=>x.duplicate).length} matching existing song${entries.filter(x=>x.duplicate).length===1?'':'s'} will be skipped.</span></div>
      ${errors.length?`<div class="warning-card">${errors.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}
      <div class="import-review-list">${entries.map(x=>`<div><strong>${esc(x.song.title)}</strong><span>${x.duplicate?'Already in library · '+esc(x.duplicate.title):'Ready to import'}</span></div>`).join('')}</div>
      <div class="sheet-actions"><button class="primary" id="confirmOpenLyricsImport" ${entries.every(x=>x.duplicate)?'disabled':''}>Import new songs</button></div>`;
    if($('#confirmOpenLyricsImport'))$('#confirmOpenLyricsImport').onclick=async()=>{
      if(destination==='service' && options.saveToLibrary===false){
        const newSongs=entries.filter(x=>!x.duplicate).map(x=>x.song);
        if(options.churchSuiteItem && newSongs.length!==1){
          status.insertAdjacentHTML('beforeend','<p class="warning-inline"><strong>Choose one file:</strong> a ChurchSuite song slot can be replaced by one song at a time.</p>');
          return;
        }
        if(!newSongs.length)return;
        if(typeof options.onServiceOnly==='function'){
          await options.onServiceOnly(newSongs[0]);
        }else{
          for(const song of newSongs)addServiceOnlySongToCurrentService(song,'Imported from OpenLyrics · service only');
          editItem(state.items[state.items.length-1]?.id);
        }
        return;
      }

      const added=[];
      for(const entry of entries){
        if(entry.duplicate)continue;
        const result=await addImportedSongToLibrary(entry.song);
        if(result.song)added.push(result.song);
      }
      if(typeof options.onSaved==='function'){
        if(added.length===1){
          await options.onSaved(added[0]);
          return;
        }
        if(added.length>1){
          status.insertAdjacentHTML('beforeend','<p class="meta">More than one new song was imported. Choose the song to use for this ChurchSuite slot from the library.</p>');
          setTimeout(()=>openSongAddMenu(destination,options),900);
          return;
        }
      }
      if(destination==='service'&&added.length===1){
        addLibrarySongToCurrentService(added[0],'Imported from OpenLyrics');
        songPreview(added[0].id);
      }else openSongLibrary();
    };
  };
}

function parseSongSelect(raw){
  const lines=raw.replace(/\r/g,'').split('\n').map(x=>x.trimEnd());
  while(lines.length && !lines[0].trim()) lines.shift();
  while(lines.length && !lines[lines.length-1].trim()) lines.pop();
  const title=(lines.shift()||'').trim();
  const sectionRe=/^(Verse|Chorus|Bridge|Pre[- ]?Chorus|Tag|Ending|Intro)(?:\s+(\d+))?$/i;
  const boiler=/^For use solely with the SongSelect|^All rights reserved\.?|^www\.ccli\.com$/i;
  let sections=[], current=null, metadata=[];
  for(const original of lines){
    const line=original.trim();
    const m=line.match(sectionRe);
    if(m){
      current={label:m[1], number:m[2]||'', lines:[]}; sections.push(current); continue;
    }
    if(current){
      // Metadata begins when we hit the author/CCLI tail after at least one section and a blank separator.
      if(/^CCLI Song #/i.test(line) || /^©/.test(line)){
        current=null; metadata.push(line); continue;
      }
      if(line==='' && sections.length && current.lines.length){ current.lines.push(''); continue; }
      current.lines.push(original);
    } else if(line && !boiler.test(line)){
      metadata.push(line);
    }
  }
  // Once sections have captured too much, peel known metadata from the tail of the final section.
  if(sections.length){
    let tail=sections[sections.length-1].lines;
    let idx=tail.findIndex(x=>/^CCLI Song #/i.test(x.trim()) || /^©/.test(x.trim()));
    if(idx>=0){ metadata.unshift(...tail.slice(idx).filter(x=>x.trim())); tail.splice(idx); }
  }
  const cleanMeta=metadata.filter(x=>x && !boiler.test(x));
  const ccliLine=cleanMeta.find(x=>/^CCLI Song #/i.test(x))||'';
  const copyright=cleanMeta.find(x=>/^©/.test(x))||'';
  const licenceLine=cleanMeta.find(x=>/^CCLI License #/i.test(x))||'';
  const authorCandidates=cleanMeta.filter(x=>!/^CCLI Song #/i.test(x)&&!/^CCLI License #/i.test(x)&&!/^©/.test(x)&&!boiler.test(x));
  const authors=authorCandidates.length?[authorCandidates[0]]:[];
  const typeMap={'verse':'v','chorus':'c','bridge':'b','pre-chorus':'p','pre chorus':'p','tag':'t','ending':'e','intro':'i'};
  let counts={};
  const parsedSections=sections.map(s=>{
    const key=s.label.toLowerCase().replace('pre chorus','pre-chorus');
    const typ=typeMap[key]||'o';
    counts[typ]=(counts[typ]||0)+1;
    const label=s.number||String(counts[typ]);
    return {key:`${typ}${label}`,type:typ,label,text:s.lines.join('\n').trim()};
  });
  const verseOrder=parsedSections.map(sec=>sec.key).join(' ');
  return {
    id:Date.now(), title, alternateTitle:'', authors, sections:parsedSections,
    verseOrder, musicNote:'', ccliNumber:ccliLine.replace(/^CCLI Song #/i,'').trim(),
    copyright, licenceNumber:licenceLine.replace(/^CCLI License #/i,'').trim(),
    comments:'Imported from SongSelect paste', themeName:''
  };
}


function openSongSelectFileImport(destination='library',options={}){
  openSheet(`<h2>Import CCLI / SongSelect file</h2>
    <p class="meta">Choose a SongSelect/CCLI lyrics text file. The file is read locally in your browser, then passed through the same SongSelect parser and review screen used by paste import.</p>
    <label class="secondary file-button full">Choose SongSelect / CCLI file
      <input id="songSelectImportFile" type="file"
        accept=".txt,.text,.rtf,.ccli,.songselect,text/plain,text/rtf,application/rtf">
    </label>
    <p class="meta" id="songSelectFileStatus"></p>
    <div class="sheet-actions">
      <button class="secondary" id="songSelectFileBack">Back</button>
    </div>`);

  $('#songSelectFileBack').onclick=()=>openSongAddMenu(destination,options);

  $('#songSelectImportFile').onchange=async e=>{
    const file=e.target.files?.[0];
    if(!file)return;

    const status=$('#songSelectFileStatus');
    status.textContent='Reading '+file.name+'…';

    try{
      let raw=await file.text();

      // Basic RTF files exported/downloaded as text can contain RTF control
      // words. This deliberately performs only a conservative text extraction;
      // the normal SongSelect parser remains responsible for recognising the
      // song metadata and lyric sections.
      if(
        file.name.toLowerCase().endsWith('.rtf') ||
        String(file.type||'').toLowerCase().includes('rtf') ||
        /^\\s*\\{\\\\rtf/i.test(raw)
      ){
        raw=raw
          .replace(/\\\\par[d]?\\b/g,'\\n')
          .replace(/\\\\line\\b/g,'\\n')
          .replace(/\\\\'[0-9a-fA-F]{2}/g,' ')
          .replace(/\\\\[a-zA-Z]+-?\\d* ?/g,'')
          .replace(/[{}]/g,'')
          .replace(/\\r/g,'');
      }

      const parsed=parseSongSelect(raw);
      if(!parsed.title || !parsed.sections?.length){
        status.textContent='I could not find a title and lyric sections in that file.';
        return;
      }

      parsed.comments=[
        parsed.comments||'',
        'Imported from CCLI / SongSelect file: '+file.name
      ].filter(Boolean).join(' · ');
      parsed.source='songselect-file';

      songSelectReview(parsed,destination,options);
    }catch(err){
      status.textContent='Could not read this file: '+(err.message||String(err));
    }
  };
}

function songSelectPaste(destination='service',options={}){
  openSheet(`<h2>Import from SongSelect</h2>
    <p class="meta">Open <a href="https://songselect.ccli.com" target="_blank" rel="noopener">SongSelect ↗</a>, open the song lyrics, use the Copy action, then paste the copied text below.</p>
    <p class="meta">In SongSelect, open the lyrics, click the copy button under <strong>Sheet Music Actions</strong>, then paste here.</p>
    <div class="field"><label>SongSelect copied text</label><textarea id="songPaste" class="big-paste" placeholder="Paste the copied SongSelect lyrics here…"></textarea></div>
    <div class="sheet-actions"><button class="secondary" id="songSelectPasteBack">Back</button><button class="primary" id="parseSong">Parse song</button></div>`);
  $('#songSelectPasteBack').onclick=()=>openSongAddMenu(destination,options);
  $('#parseSong').onclick=()=>{
    const parsed=parseSongSelect($('#songPaste').value);
    if(!parsed.title || !parsed.sections.length){
      appAlert('I could not find a title and lyric sections in that paste.');
      return;
    }
    songSelectReview(parsed,destination,options);
  };
}

function songSelectReview(s,destination='service',options={}){
  openSheet(`<h2>${esc(s.title)}</h2>
    <p class="meta">${s.authors.length?esc(s.authors.join(', ')):'Author not detected'}${s.ccliNumber?` · CCLI #${esc(s.ccliNumber)}`:''}</p>
    ${(s.sections||[]).map(sec=>`<details class="lyric-section" open><summary>${esc(sectionName(sec))}</summary><div class="lyric-text">${esc(sec.text).replace(/\n/g,'<br>')}</div></details>`).join('')}
    <div class="field"><label>Usual verse order</label><input id="importOrder" value="${esc(s.verseOrder)}"></div>
    <div class="field"><label>Usual music note for run sheet</label><input id="importMusicNote" placeholder="e.g. Usually in D"></div>
    ${s.copyright?`<p class="song-copyright">${esc(s.copyright)}</p>`:''}
    <div class="sheet-actions"><button class="secondary" id="backToPaste">Back</button><button class="primary" id="saveImportedSong">${destination==='service'?'Add to library & service':'Add to Song Library'}</button></div>`);
  $('#backToPaste').onclick=()=>songSelectPaste(destination,options);
  $('#saveImportedSong').onclick=async()=>{
    s.verseOrder=$('#importOrder').value.trim();
    s.musicNote=$('#importMusicNote').value.trim();
    s.source='songselect';
    s.classifications=defaultSongClassifications();
    const duplicate=options.saveToLibrary===false?null:songDuplicateMatch(s);
    if(duplicate){
      openSheet(`<h2>Song already in library</h2>
        <div class="warning-card"><strong>${esc(duplicate.title)}</strong><p>A matching CCLI number or title already exists.</p></div>
        <div class="sheet-actions"><button class="secondary" id="duplicateImportBack">Back</button><button class="primary" id="openDuplicateImportedSong">Open existing song</button></div>`);
      $('#duplicateImportBack').onclick=()=>songSelectReview(s,destination,options);
      $('#openDuplicateImportedSong').onclick=async()=>{
        if(typeof options.onSaved==='function'){
          await options.onSaved(duplicate);
          return;
        }
        destination==='service'?songPreview(duplicate.id):editLibrarySong(duplicate.id);
      };
      return;
    }
    if(destination==='service' && options.saveToLibrary===false){
      if(typeof options.onServiceOnly==='function'){
        await options.onServiceOnly(s);
      }else{
        const item=addServiceOnlySongToCurrentService(s,'Imported from SongSelect · service only');
        editItem(item.id);
      }
      return;
    }

    const result=await addImportedSongToLibrary(s);
    if(typeof options.onSaved==='function'){
      await options.onSaved(result.song);
      return;
    }
    if(destination==='service'){
      addLibrarySongToCurrentService(result.song,'Imported from SongSelect');
      songPreview(result.song.id);
    }else openSongLibrary();
  };
}


function enableImageMediaReorder(container,item,markDirty){
  if(!container) return;

  let activeDrag=null;

  function clearAllDragState(){
    document.querySelectorAll('.media-drag-ghost').forEach(x=>x.remove());
    container.querySelectorAll('.image-media-row').forEach(x=>{
      x.classList.remove(
        'media-drag-source',
        'media-drop-before',
        'media-drop-after',
        'media-move-confirmed'
      );
    });
    document.body.classList.remove('reordering-media');
    activeDrag=null;
  }

  function commitMediaOrder(){
    const mediaById=new Map((item.media||[]).map(m=>[String(m.id),m]));
    const ids=[...container.querySelectorAll('.image-media-row')]
      .map(row=>String(row.dataset.mediaId||''))
      .filter(Boolean);
    item.media=ids.map(id=>mediaById.get(id)).filter(Boolean);
  }

  container.querySelectorAll('.image-media-row').forEach(row=>{
    const handle=row.querySelector('.media-handle');
    if(!handle) return;

    handle.addEventListener('pointerdown',e=>{
      if(activeDrag) clearAllDragState();
      if(e.button!==undefined && e.button!==0) return;

      e.preventDefault();
      e.stopPropagation();

      const source=row;
      const rect=source.getBoundingClientRect();
      const pointerId=e.pointerId;
      const offsetY=e.clientY-rect.top;

      const ghost=source.cloneNode(true);
      ghost.classList.add('media-drag-ghost');
      ghost.style.width=`${rect.width}px`;
      ghost.style.left=`${rect.left}px`;
      ghost.style.top=`${rect.top}px`;
      document.body.appendChild(ghost);

      source.classList.add('media-drag-source');
      document.body.classList.add('reordering-media');

      activeDrag={pointerId,source,ghost,moved:false};

      function clearTargets(){
        container.querySelectorAll('.image-media-row').forEach(x=>{
          x.classList.remove('media-drop-before','media-drop-after');
        });
      }

      function onMove(ev){
        if(!activeDrag || ev.pointerId!==pointerId) return;
        ev.preventDefault();

        ghost.style.top=`${ev.clientY-offsetY}px`;

        const hit=document.elementsFromPoint(ev.clientX,ev.clientY)
          .find(n=>n.classList?.contains('image-media-row') && n!==source);

        clearTargets();
        if(!hit) return;

        const hitRect=hit.getBoundingClientRect();
        const before=ev.clientY < hitRect.top + hitRect.height/2;
        hit.classList.add(before?'media-drop-before':'media-drop-after');

        const beforeNode=source.previousElementSibling;
        const afterNode=source.nextElementSibling;

        if(before){
          if(hit!==afterNode && hit.previousElementSibling!==source){
            hit.before(source);
            activeDrag.moved=true;
            markDirty();
          }
        }else{
          if(hit!==beforeNode && hit.nextElementSibling!==source){
            hit.after(source);
            activeDrag.moved=true;
            markDirty();
          }
        }
      }

      function finish(ev){
        if(!activeDrag || ev.pointerId!==pointerId) return;
        ev.preventDefault();
        ev.stopPropagation();

        document.removeEventListener('pointermove',onMove,{passive:false});
        document.removeEventListener('pointerup',finish,{passive:false});
        document.removeEventListener('pointercancel',finish,{passive:false});

        const didMove=activeDrag.moved;
        commitMediaOrder();

        ghost.remove();
        source.classList.remove('media-drag-source');
        clearTargets();
        document.body.classList.remove('reordering-media');
        activeDrag=null;

        if(didMove){
          source.classList.add('media-move-confirmed');
          setTimeout(()=>source.classList.remove('media-move-confirmed'),900);
        }
      }

      document.addEventListener('pointermove',onMove,{passive:false});
      document.addEventListener('pointerup',finish,{passive:false});
      document.addEventListener('pointercancel',finish,{passive:false});
    });
  });

  // Ensure any stale visual state from a previous dialog instance is gone.
  clearAllDragState();
}
function editItem(id){
  const x=state.items.find(i=>String(i.id)===String(id));
  const originalItemTitle=x?.title||'';
    const librarySong=x.type==='song' ? songs.find(s=>String(s.id)===String(x.songId)) : null;
    const serviceOnlySong=x.type==='song'&&x.serviceSong ? x.serviceSong : null;
  openSheet(`<h2>${esc(x.title)}</h2>
    <div class="field"><label>Title</label><input id="editTitle" value="${esc(x.title)}"></div>
    <div class="field"><label>Person / leader</label><input id="editPerson" value="${esc(x.person||'')}"></div>
    ${x.type==='song'&&librarySong?`
      <div class="service-song-classification-summary">
        <div>
          <strong>Classifications</strong>
          <span>${classificationNames(librarySong).length?esc(classificationNames(librarySong).join(' · ')):'None'}</span>
        </div>
        <button class="secondary compact" id="classifyServiceSong">Classify</button>
      </div>
      <div class="service-song-library-actions">
        <button class="secondary" id="viewLyrics">View / edit song lyrics</button>
        ${churchSuiteEnabled()&&x.churchSuiteSourceId?`<button class="secondary" id="replaceImportedSong">Replace song</button>`:''}
      </div>`:''}
    ${churchSuiteEnabled()&&x.type==='song'&&x.extraChurchSuiteSong?`<div class="warning-card"><strong>Extra ChurchSuite song</strong><p>${esc(x.churchSuiteTemplateNote||'This ChurchSuite song was appended because the selected template had no remaining Song slot.')}</p></div>`:''}
    ${x.type==='song'&&serviceOnlySong?`
      <div class="service-song-classification-summary">
        <div><strong>Service-only song</strong><span>Complete local copy stored in this service · not in shared Song Library</span></div>
        ${churchSuiteEnabled()&&x.churchSuiteSourceId?`<button class="secondary compact" id="replaceImportedSong">Replace song</button>`:''}
      </div>
    `:''}
    ${x.type==='song'&&!librarySong&&!serviceOnlySong?`
      <div class="warning-card"><strong>${x.templateSongPlaceholder?(churchSuiteEnabled()?'Song not yet assigned in ChurchSuite':'Empty Song position'):(churchSuiteEnabled()?'ChurchSuite song slot is not matched to a local song.':'Song is not matched to the shared library.')}</strong><p>${x.templateSongPlaceholder?(churchSuiteEnabled()?'This template Song position is being kept in the service until ChurchSuite supplies a song. You can also choose a song locally if needed.':'This template contains an empty Song position. Choose a song from the library or leave the position empty.'):'Keep this position in the service order, choose a near match from the library, or create the missing song in the shared library and use it for this service.'}</p></div>
      <div class="service-song-unmatched-actions">
        <button class="secondary" id="chooseImportedSong">Choose song from library</button>
        <button class="primary" id="createImportedSong">Add new song</button>
      </div>
    `:''}
    ${x.type==='song'?`<div class="field"><label>Verse order for this service</label><input id="editVerse" value="${esc(x.verse||'')}"></div>
      <div class="field"><label>Music note for printed run sheet</label><input id="editMusicNote" value="${esc(x.musicNote||'')}" placeholder="e.g. Usually in D"></div>
      ${librarySong?`<div class="toggle"><span>Make music note the new usual note</span><input id="saveUsualNote" type="checkbox"></div>`:''}`:''}
    ${(x.type==='images'||x.type==='sermon-images')?`
      <div class="field"><label>Image presentation</label><div class="media-summary">${esc(x.detail||'No images yet')}</div></div>
      <div class="image-order-toolbar">
        <span class="meta">Image order</span>
        <button class="secondary compact" type="button" id="sortImagesByFilename">Sort by filename</button>
      </div>
      <div class="existing-media image-media-list" id="existingImageMedia">${(x.media||[]).map((m,i)=>`
        <div class="media-row image-media-row" data-media-id="${esc(m.id||'')}">
          <button class="media-handle" type="button" aria-label="Drag image to reorder">≡</button>
          <button type="button" class="image-thumb-button" data-preview-edit-media="${esc(m.id||'')}" data-preview-edit-name="${esc(m.originalName||'Image')}" aria-label="View larger image"><img class="media-thumb" src="/api/media/${encodeURIComponent(m.id||'')}" alt=""></button>
          <span class="media-label"><strong>${i+1}</strong> ${esc(m.originalName||'Image')}</span>
          <button type="button" class="media-mini-action" data-rename-edit-media="${esc(m.id||'')}" data-rename-edit-name="${esc(m.originalName||'Image')}" title="Rename">Rename</button>
          <button type="button" class="media-remove" data-remove-media="${esc(m.id||'')}" aria-label="Delete image" title="Delete image"><svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
<path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/>
</svg></button>
        </div>`).join('')}</div>
      <div class="media-source-actions"><button class="secondary" type="button" id="editChoosePlannerMedia">OpenLP Planner library</button><span>or upload</span></div>
      <div class="field"><label>Add more images</label><input id="editMediaFiles" type="file" accept="image/jpeg,image/png" multiple><p class="meta">Images are added in filename order by default.</p></div>
      <label class="toggle"><span>Store new uploads in OpenLP Planner library</span><input id="retainEditMedia" type="checkbox"></label>
      ${x.churchSuiteSourceId?`<label class="toggle"><span>Ignore images for this service</span><input id="editImagesGoWithout" type="checkbox" ${x.ignoreImages||x.projected===false?'checked':''}></label>
      <p class="meta">Attach images here, or choose “Go without images” to keep the ChurchSuite service-plan item on the run sheet without a projection item.</p>`:''}
      <div class="toggle"><span>Auto play</span><input id="editAuto" type="checkbox" ${x.autoplay!=='off'?'checked':''}></div>
      <div class="toggle"><span>Loop</span><input id="editLoop" type="checkbox" ${x.autoplay==='loop'?'checked':''}></div>
      <div class="field"><label>Interval (seconds)</label><input id="editInterval" type="number" min="1" value="${x.interval||7}"></div>`:''}
    ${x.type==='video'?`
      <div class="field"><label>Current video</label><div class="media-summary">${esc(x.media?.[0]?.originalName||x.detail||'No video uploaded')}</div></div>
      <div class="media-source-actions"><button class="secondary" type="button" id="editChoosePlannerMedia">OpenLP Planner library</button><span>or upload</span></div>
      <div class="field"><label>Replace video</label><input id="editMediaFiles" type="file" accept="video/*"></div>
      <label class="toggle"><span>Store new upload in OpenLP Planner library</span><input id="retainEditMedia" type="checkbox"></label>
      ${x.churchSuiteSourceId?`<label class="toggle"><span>Ignore video for this service</span><input id="editVideoIgnore" type="checkbox" ${x.ignoreVideo?'checked':''}></label>`:''}
      <div class="toggle"><span>Auto start when live</span><input id="editStart" type="checkbox" ${x.autoStart!==false?'checked':''}></div>`:''}
    ${x.type==='pdf'?`<div class="field"><label>PDF presentation</label><div class="media-summary">${esc(x.detail||'No PDF uploaded')}</div></div>
      <div class="media-source-actions"><button class="secondary" type="button" id="editChoosePlannerMedia">OpenLP Planner library</button><span>or upload</span></div>
      <div class="field"><label>Replace PDF</label><input id="editMediaFiles" type="file" accept="application/pdf"></div>
      <label class="toggle"><span>Store new PDF in OpenLP Planner library</span><input id="retainEditMedia" type="checkbox"></label>
      <p class="meta">PDF pages are stored/exported as image slides for reliable OpenLP projection.</p>`:''}
    ${x.type==='bible'?`
      <div class="field"><label>Passage</label><input id="editPassage" value="${esc(x.passage||x.detail||'')}"></div>
      <div class="field"><label>Translation</label><input id="editBibleVersion" value="${esc(x.bibleVersion||'')}"></div>
      <div class="bible-gateway-tools">
        <button class="secondary" type="button" id="editBibleGatewayBtn">Open in Bible Gateway ↗</button>
        <button class="secondary" type="button" id="editBibleGatewayFetchBtn">Try automatic fetch</button>
        <label class="bible-clean-toggle"><input id="editCleanBiblePaste" type="checkbox" checked><span>Clean Bible Gateway paste automatically</span></label>
      </div>
      <p class="meta">Before copying, it is still best to turn off headings, footnotes and cross-references in Bible Gateway. <strong>Leave chapter and verse numbers on:</strong> on a rich Bible Gateway paste, chapter numbers are converted to OpenLP bold tags and verse numbers to OpenLP superscript tags. Anything identifiable that is removed is listed below for cross-checking. Untick cleanup if it causes a problem.</p>
      <div class="field"><label>Passage text</label><textarea id="editBibleText" class="bible-text">${esc(x.bibleText||'')}</textarea><p class="meta bible-paste-status" id="editBiblePasteStatus"></p><div id="editBibleFormatPreview" class="bible-format-preview"></div><div id="editBibleRemovedReview"></div></div>
      ${x.churchSuiteSourceId?`<label class="toggle"><span>Ignore Bible projection for this service</span><input id="editBibleIgnore" type="checkbox" ${x.ignoreBible?'checked':''}></label>
      <p class="meta">Keep the ChurchSuite Bible-reading item on the run sheet without requiring a projected Bible item.</p>`:''}
    `:''}
    ${churchSuiteEnabled()&&x.churchSuiteSourceId?`<label class="toggle churchsuite-retain-toggle"><span><strong>Keep local changes after ChurchSuite sync</strong><small>Recommended. Future ChurchSuite syncs keep this edited Planner item instead of replacing it.</small></span><input id="editRetainChurchSuite" type="checkbox" ${x.retainOnChurchSuiteSync!==false?'checked':''}></label>`:''}
    <div class="field"><label>Run-sheet notes</label><textarea id="editNotes">${esc(x.notes||'')}</textarea></div>
    <div class="field"><label>Last changed</label><div>${esc(x.changed)} by ${esc(x.by)}</div></div>
    <div class="sheet-actions"><button class="secondary" id="saveItemStay" disabled>Save changes</button><button class="primary" id="saveItem">Done</button><button class="danger" id="deleteItem">Delete</button></div>`);
  const pendingRemovedMedia=new Set();

  if($('#sortImagesByFilename'))$('#sortImagesByFilename').onclick=()=>{
    sortImageRowsByFilename($('#existingImageMedia'));
    markDirty();
  };

  body.querySelectorAll('[data-preview-edit-media]').forEach(btn=>btn.onclick=()=>{
    const asset=(x.media||[]).find(m=>String(m.id)===String(btn.dataset.previewEditMedia));
    if(!asset)return;

    const editorDraft={
      title:$('#editTitle')?.value,
      person:$('#editPerson')?.value,
      notes:$('#editNotes')?.value,
      autoplay:$('#editAuto')?.checked,
      loop:$('#editLoop')?.checked,
      interval:$('#editInterval')?.value,
      ignoreImages:$('#editImagesGoWithout')?.checked
    };
    const wasDirty=editDirty;

    openMediaFullPreview('images',btn.dataset.previewEditName||asset.originalName,[asset],()=>{
      editItem(id);
      requestAnimationFrame(()=>{
        if(editorDraft.title!==undefined&&$('#editTitle'))$('#editTitle').value=editorDraft.title;
        if(editorDraft.person!==undefined&&$('#editPerson'))$('#editPerson').value=editorDraft.person;
        if(editorDraft.notes!==undefined&&$('#editNotes'))$('#editNotes').value=editorDraft.notes;
        if(editorDraft.autoplay!==undefined&&$('#editAuto'))$('#editAuto').checked=editorDraft.autoplay;
        if(editorDraft.loop!==undefined&&$('#editLoop'))$('#editLoop').checked=editorDraft.loop;
        if(editorDraft.interval!==undefined&&$('#editInterval'))$('#editInterval').value=editorDraft.interval;
        if(editorDraft.ignoreImages!==undefined&&$('#editImagesGoWithout'))$('#editImagesGoWithout').checked=editorDraft.ignoreImages;
        if(wasDirty)markDirty();
      });
    });
  });
  body.querySelectorAll('[data-rename-edit-media]').forEach(btn=>btn.onclick=async()=>{
    const asset=(x.media||[]).find(m=>String(m.id)===String(btn.dataset.renameEditMedia));
    if(!asset)return;
    const name=await appPrompt('File name',asset.originalName||'Image',{title:'Rename image',confirmLabel:'Rename'});
    if(!name?.trim()||name.trim()===asset.originalName)return;
    try{
      await renamePlannerMediaAsset(asset.id,name.trim());
      asset.originalName=name.trim();
      persistPlanner();
      await saveServiceItem(x);
      editItem(id);
    }catch(err){appAlert(err.message||String(err))}
  });

  body.querySelectorAll('[data-remove-media]').forEach(btn=>{
    let armed=false;
    let timer=null;

    btn.onclick=()=>{
      const assetId=btn.dataset.removeMedia;
      if(!assetId) return;

      if(!armed){
        armed=true;
        btn.classList.add('armed');
        btn.innerHTML='Delete?';
        btn.title='Click again to confirm';
        clearTimeout(timer);
        timer=setTimeout(()=>{
          armed=false;
          btn.classList.remove('armed');
          btn.innerHTML=`<svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
<path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/>
</svg>`;
          btn.title='Delete image';
        },3000);
        return;
      }

      clearTimeout(timer);
      pendingRemovedMedia.add(assetId);
      btn.closest('.media-row')?.remove();
      markDirty();
    };
  });

  if($('#editChoosePlannerMedia'))$('#editChoosePlannerMedia').onclick=()=>{
    openPlannerMediaPicker(x.type,{
      multiple:x.type!=='video',
      onBack:()=>editItem(id),
      onChoose:async assetIds=>{
        try{
          const result=await usePlannerLibraryAssets(assetIds,currentService().id,x.id);
          if(x.type==='images'||x.type==='sermon-images')x.media=[...(x.media||[]),...(result.assets||[])];
          else x.media=result.assets||[];
          x.ignoreImages=false;x.ignoreVideo=false;x.projected=true;
          updateMediaItemDetail(x);
          persistPlanner();saveServiceItem(x);
          markServiceEdited(`added ${x.type} from OpenLP Planner library`);
          appendAudit('added library media',x.title);
          editItem(id);
        }catch(err){appAlert(err.message||String(err))}
      }
    });
  };

  if(x.type==='bible'){
    wireBibleGatewayPaste({
      passageSelector:'#editPassage',
      versionSelector:'#editBibleVersion',
      textSelector:'#editBibleText',
      cleanSelector:'#editCleanBiblePaste',
      buttonSelector:'#editBibleGatewayBtn',
      fetchButtonSelector:'#editBibleGatewayFetchBtn',
      statusSelector:'#editBiblePasteStatus',
      reviewSelector:'#editBibleRemovedReview',
      previewSelector:'#editBibleFormatPreview'
    });
  }

  const editInputs=[...body.querySelectorAll('input, textarea, select')].filter(el=>el.id!=='saveItem');
  let editDirty=false;
  const closeItemEditor=()=>{
    document.querySelectorAll('.media-drag-ghost').forEach(el=>el.remove());
    document.querySelectorAll('.image-media-row').forEach(el=>el.classList.remove('media-drag-source','media-drop-before','media-drop-after'));
    document.body.classList.remove('reordering-media');
    sheet.close();
    render();
  };
  let exitWithoutSavingArmed=false;
  let exitWithoutSavingTimer=null;
  const resetDoneButton=()=>{
    exitWithoutSavingArmed=false;
    clearTimeout(exitWithoutSavingTimer);
    const done=$('#saveItem');
    if(done){done.textContent='Done';done.classList.remove('exit-unsaved-armed');}
    const top=$('#saveItemTop');
    if(top){top.textContent='Done';top.classList.remove('exit-unsaved-armed');}
  };
  const markDirty=()=>{
    editDirty=true;
    resetDoneButton();
    const stay=$('#saveItemStay');
    if(stay){
      stay.textContent='Save changes';
      stay.disabled=false;
      stay.classList.remove('secondary');
      stay.classList.add('primary');
    }
  };
  const requestDone=()=>{
    if(!editDirty){closeItemEditor();return;}
    if(exitWithoutSavingArmed){
      clearTimeout(exitWithoutSavingTimer);
      closeItemEditor();
      return;
    }
    exitWithoutSavingArmed=true;
    const arm=btn=>{
      if(!btn)return;
      btn.textContent='Exit without saving?';
      btn.classList.add('exit-unsaved-armed');
    };
    arm($('#saveItem'));arm($('#saveItemTop'));
    exitWithoutSavingTimer=setTimeout(resetDoneButton,2600);
  };
  editInputs.forEach(el=>{
    el.addEventListener('input',markDirty);
    el.addEventListener('change',markDirty);
  });
  if($('#editMediaFiles')){
    $('#editMediaFiles').addEventListener('change',()=>{
      if($('#editMediaFiles').files?.length){
        if($('#editImagesGoWithout'))$('#editImagesGoWithout').checked=false;
        if($('#editVideoIgnore'))$('#editVideoIgnore').checked=false;
      }
    });
  }

  if(x.type==='images'||x.type==='sermon-images') enableImageMediaReorder($('#existingImageMedia'),x,markDirty);

  if($('#viewLyrics')) $('#viewLyrics').onclick=()=>{
    if(!x.songId) x.songId=librarySong.id;
    songPreview(librarySong.id);
  };
  if($('#classifyServiceSong')) $('#classifyServiceSong').onclick=e=>{
    e.preventDefault();
    e.stopPropagation();
    openQuickSongClassification(String(librarySong.id),()=>editItem(String(id)));
  };
  const createSongForImportedSlot=()=>{
    const options={
      prefillTitle:x.title||'',
      churchSuiteItem:x,
      onBack:()=>editItem(id),
      onSaved:async song=>{
        applyLibrarySongToChurchSuiteSlot(x,song,'Local copy updated · saved to library');
        editItem(id);
      },
      onServiceOnly:async song=>{
        applyServiceOnlySongToChurchSuiteSlot(x,song);
        editItem(id);
      }
    };
    openSongAddMenu('service',options);
  };

  if($('#createImportedSong'))$('#createImportedSong').onclick=createSongForImportedSlot;

  const openImportedSongChoice=()=>{
    const candidates=songs.slice().sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));

    openSheet(`<h2>Choose song for this ChurchSuite slot</h2>
      <p class="meta">Search the shared song library. Choosing a song keeps this ChurchSuite slot in the same service-plan position.</p>
      <div class="field">
        <label>Search songs</label>
        <input id="importedSongSearch" type="search" placeholder="Start typing a song title…" autocomplete="off">
      </div>
      <div id="importedSongResults" class="song-search-results"></div>
      <div class="sheet-actions">
        <button class="secondary" id="cancelImportedSongChoice">Back</button>
        <button class="secondary" id="keepImportedSongUnmatched">Keep unmatched</button>
        <button class="primary" id="createImportedSongFromSearch">Add new song</button>
      </div>`);

    const results=$('#importedSongResults');
    const search=$('#importedSongSearch');

    const drawResults=()=>{
      const q=normalizeChurchSuiteName(search.value);
      const filtered=candidates
        .filter(song=>{
          if(!q)return true;
          return normalizeChurchSuiteName(song.title).includes(q) ||
            normalizeChurchSuiteName(song.alternateTitle||'').includes(q) ||
            String(song.ccliNumber||'').includes(q);
        })
        .slice(0,80);

      results.innerHTML=filtered.length
        ?filtered.map(song=>`
          <button type="button" class="song-search-result" data-import-song="${esc(String(song.id))}">
            <strong>${esc(song.title)}</strong>
            <small>${song.alternateTitle?`${esc(song.alternateTitle)} · `:''}${song.ccliNumber?`CCLI ${esc(String(song.ccliNumber))}`:''}</small>
          </button>`).join('')
        :'<div class="empty-search">No matching songs</div>';

      results.querySelectorAll('[data-import-song]').forEach(btn=>{
        btn.onclick=()=>{
          const song=songs.find(s=>String(s.id)===String(btn.dataset.importSong));
          if(!song)return;

          applyLibrarySongToChurchSuiteSlot(x,song);
          editItem(id);
        };
      });
    };

    search.oninput=drawResults;
    drawResults();
    setTimeout(()=>search.focus(),0);

    $('#cancelImportedSongChoice').onclick=()=>editItem(id);
    $('#keepImportedSongUnmatched').onclick=()=>editItem(id);
    $('#createImportedSongFromSearch').onclick=createSongForImportedSlot;
  };
  if($('#chooseImportedSong'))$('#chooseImportedSong').onclick=openImportedSongChoice;
  if($('#replaceImportedSong'))$('#replaceImportedSong').onclick=openImportedSongChoice;

  const saveItemChanges=async(stayOpen=false)=>{
    if(!editDirty){
      if(!stayOpen)closeItemEditor();
      return;
    }
    x.title=$('#editTitle').value; x.person=$('#editPerson').value; x.notes=$('#editNotes').value;
    if(churchSuiteEnabled()&&x.churchSuiteSourceId&&$('#editRetainChurchSuite')) x.retainOnChurchSuiteSync=!!$('#editRetainChurchSuite').checked;
    if(x.type==='song'){
      x.verse=$('#editVerse').value.trim();
      x.musicNote=$('#editMusicNote').value.trim();
      if(librarySong && $('#saveUsualNote')?.checked){
        librarySong.musicNote=x.musicNote;
        persistSongs();
        saveLibrarySongRemote(librarySong);
      }
    }
    if(x.type==='images'||x.type==='sermon-images'){
      let goWithout=!!$('#editImagesGoWithout')?.checked;
      x.ignoreImages=goWithout;
      x.projected=!goWithout;
      x.autoplay=$('#editAuto').checked?($('#editLoop').checked?'loop':'once'):'off';
      x.interval=+$('#editInterval').value;

      // Treat the rows still visible in the editor as the authoritative list
      // of existing images. This prevents removed images being reintroduced
      // by a later asynchronous save.
      const originalMedia=[...(x.media||[])];
      const mediaById=new Map(originalMedia.map(m=>[String(m.id),m]));
      const visibleIds=[...document.querySelectorAll('#existingImageMedia .image-media-row')]
        .map(r=>String(r.dataset.mediaId||''))
        .filter(Boolean);

      let finalMedia=visibleIds
        .map(id=>mediaById.get(id))
        .filter(Boolean)
        .filter(m=>!pendingRemovedMedia.has(String(m.id)));

      const files=sortFilesByName($('#editMediaFiles')?.files||[]);
      const retainMedia=!!$('#retainEditMedia')?.checked;

      const saveButtons=[$('#saveItem'),$('#saveItemStay'),$('#saveItemTop')].filter(Boolean);
      if(files.length || pendingRemovedMedia.size){
        saveButtons.forEach(btn=>{btn.disabled=true;btn.textContent='Saving images…'});
      }

      try{
        // Delete removed service-specific assets first and wait for completion.
        if(remoteAvailable && pendingRemovedMedia.size){
          await Promise.all([...pendingRemovedMedia].map(id=>deleteMediaAsset(id)));
        }

        // Then upload new files and append only the successfully-created assets.
        if(files.length && remoteAvailable){
          let libraryFolderId='';
          if(retainMedia){
            const folder=await ensurePlannerMediaFolder('images',x.title,currentService().dateISO);
            libraryFolderId=folder?.id||'';
          }

          const results=await Promise.all(
            files.map(f=>uploadMediaFile(
              f,
              currentService().id,
              x.id,
              {retain:retainMedia,mediaType:'images',libraryFolderId}
            ))
          );
          finalMedia=sortFilesByName([...finalMedia,...results.map(r=>r.asset)]);

          // Adding an image overrides "go without".
          goWithout=false;
          x.ignoreImages=false;
          x.projected=true;
          const ignoreToggle=$('#editImagesGoWithout');
          if(ignoreToggle)ignoreToggle.checked=false;
        }

        x.media=finalMedia;
        x.detail=goWithout
          ?'No attachments'
          :`${x.media.length} image${x.media.length===1?'':'s'}${x.autoplay==='loop'?' · autoplay loop':''}`;
        x.ready=goWithout||x.media.length>0;
      }catch(err){
        appAlert(`Images could not be saved.\n\n${err.message||String(err)}`);
        saveButtons.forEach(btn=>{
          btn.disabled=false;
          btn.textContent=btn.id==='saveItemStay'?'Save changes':'Done';
        });
        return;
      }
    }
    if(x.type==='video'){
      x.autoStart=$('#editStart').checked;
      const files=[...($('#editMediaFiles')?.files||[])];
      const ignoreVideo=!!$('#editVideoIgnore')?.checked;
      x.ignoreVideo=ignoreVideo;
      x.projected=!ignoreVideo;
      if(ignoreVideo){
        x.ready=true;
        x.detail='No attachments';
      }
      if(files.length && remoteAvailable){
        const oldAssets=[...(x.media||[])];
        const retainMedia=!!$('#retainEditMedia')?.checked;
        let libraryFolderId='';
        if(retainMedia){
          const folder=await ensurePlannerMediaFolder('video',x.title,currentService().dateISO);
          libraryFolderId=folder?.id||'';
        }
        const saveButtons=[$('#saveItem'),$('#saveItemStay'),$('#saveItemTop')].filter(Boolean);
        saveButtons.forEach(btn=>{btn.disabled=true;btn.textContent='Uploading video…'});
        const status=document.createElement('p');
        status.className='meta upload-progress-note';
        status.textContent=`Uploading ${files[0].name}…`;
        body.appendChild(status);
        try{
          const result=await uploadMediaFile(files[0],currentService().id,x.id,{retain:retainMedia,mediaType:'video',libraryFolderId});
          x.ignoreVideo=false;
          x.projected=true;
          const ignoreToggle=$('#editVideoIgnore');
          if(ignoreToggle)ignoreToggle.checked=false;
          x.media=[result.asset];
          x.detail=`${result.asset.originalName||'Video'}${x.autoStart?' · auto start':''}`;
          x.ready=true;
          status.textContent='Upload complete ✓';
          await Promise.all(oldAssets.map(a=>a.id?deleteMediaAsset(a.id):Promise.resolve()));
        }catch(err){
          status.textContent=`Upload failed: ${err.message||String(err)}`;
          status.classList.add('save-error');
          saveButtons.forEach(btn=>{
          btn.disabled=false;
          btn.textContent=btn.id==='saveItemStay'?'Save changes':'Done';
        });
          return;
        }
      }
    }
    if(x.type==='pdf'){
      const files=[...($('#editMediaFiles')?.files||[])];
      if(files.length && remoteAvailable){
        const oldAssets=[...(x.media||[])];
        const retainMedia=!!$('#retainEditMedia')?.checked;
        const libraryGroupId=retainMedia?crypto.randomUUID():'';
        let libraryFolderId='';
        if(retainMedia){
          const folder=await ensurePlannerMediaFolder('pdf',x.title,currentService().dateISO);
          libraryFolderId=folder?.id||'';
        }
        x.detail='Converting PDF…';render();
        convertPdfToImageFiles(files[0],(page,total)=>{x.detail=`Converting PDF… ${page}/${total}`;render()})
          .then(pageFiles=>Promise.all(pageFiles.map(f=>uploadMediaFile(f,currentService().id,x.id,{retain:retainMedia,mediaType:'pdf',libraryGroupId,libraryFolderId}))))
          .then(results=>{
            x.media=results.map(r=>r.asset);
            updateMediaItemDetail(x);
            Promise.all(oldAssets.map(a=>a.id?deleteMediaAsset(a.id):Promise.resolve())).catch(console.warn);
            persistPlanner();saveServiceItem(x);render();
          }).catch(err=>appAlert(err.message||String(err)));
      }
    }
    if(x.type==='bible'){
      x.passage=$('#editPassage').value;
      x.bibleVersion=$('#editBibleVersion').value;
      x.bibleText=$('#editBibleText').value;
      const ignoreBible=!!$('#editBibleIgnore')?.checked;
      x.ignoreBible=ignoreBible;
      x.projected=!ignoreBible;
      x.detail=ignoreBible?'No attachments':x.passage;
      x.ready=ignoreBible||!!(x.passage&&x.bibleText);
    }
    if(x.type==='song' && x.title!==originalItemTitle){
      markChurchSuiteOutOfSync('Song title changed locally');
    }
    x.changed='just now';x.by=currentEditor();
    persistPlanner();
    await saveServiceItem(x);
    markServiceEdited('edited item');
    appendAudit('edited item',x.title);
    if(stayOpen)editItem(id);else closeItemEditor();
    if(stayOpen)render();
  };
  $('#saveItem').onclick=requestDone;
  $('#saveItemStay').onclick=()=>saveItemChanges(true);
  if($('#saveItemTop'))$('#saveItemTop').onclick=requestDone;
  const itemEditorClose=$('#sheetClose');
  if(itemEditorClose)itemEditorClose.onclick=requestDone;
  $('#deleteItem').onclick=()=>{
    const service=currentService();
    const itemLabel=x.type==='bible'
      ?'scripture reading'
      :x.type==='images'
        ?'image presentation / sermon item'
        :x.type==='video'
          ?'video item'
          :x.type==='pdf'
            ?'PDF item'
            :x.type==='song'
              ?'song'
              :'service-plan item';

    openSheet(`<h2>Delete from this service?</h2>
      <div class="warning-card">
        <strong>${esc(x.title)}</strong>
        <p>You are about to delete this ${esc(itemLabel)} from <strong>${esc(service.title)}</strong>.</p>
      </div>
      <p class="meta">This removes the item from this OpenLP service plan. It does not delete the ChurchSuite service plan itself.</p>
      <div class="sheet-actions">
        <button class="secondary" id="cancelDeleteServiceItem">Cancel</button>
        <button class="danger solid-danger" id="confirmDeleteServiceItem">Delete from service</button>
      </div>`);

    $('#cancelDeleteServiceItem').onclick=()=>editItem(id);
    $('#confirmDeleteServiceItem').onclick=async()=>{
      const btn=$('#confirmDeleteServiceItem');
      btn.disabled=true;
      btn.textContent='Deleting…';
      state.items=state.items.filter(i=>String(i.id)!==String(id));
      persistPlanner();
      await deleteRemoteItem(service.id,id);
      markServiceEdited('deleted item');
      appendAudit('deleted item',x.title);
      sheet.close();
      render();
    };
  };
}


$('#serviceTitle').onclick=()=>openServiceSwitcher();
$('#serviceTitle').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openServiceSwitcher();}};
if($('#currentServiceTemplateBtn'))$('#currentServiceTemplateBtn').onclick=()=>openServiceTemplateOverride(currentService());
if($('#saveCurrentServiceTemplateBtn'))$('#saveCurrentServiceTemplateBtn').onclick=()=>saveServiceAsTemplate(currentService());
$('#settingsBtn').onclick=()=>openSettings();
$('#servicesLibraryBtn').onclick=()=>openLibraryHub();
$('.avatar').onclick=()=>openProfile();


function serviceProjectionReadiness(service){
  const projected=(service.items||[]).filter(item=>item.projected);
  const ready=projected.filter(item=>item.ready).length;
  return {ready,total:projected.length};
}

function serviceProjectorLabel(service){
  const status=projectorState(service);
  if(status==='downloaded') return 'Projector current';
  if(status==='stale') return 'Projector outdated';
  return '';
}




function rememberChurchSuitePlanBase(url){
  try{
    const u=new URL(url);
    if(u.hostname.endsWith('.churchsuite.com')){
      const base=`${u.protocol}//${u.hostname}`;
      if(state.settings.churchSuitePlanBaseUrl!==base){
        state.settings.churchSuitePlanBaseUrl=base;
      }
    }
  }catch(_){}
}
function churchSuitePublicPlanUrl(scan,suppliedUrl=''){
  if(suppliedUrl){
    rememberChurchSuitePlanBase(suppliedUrl);
    return suppliedUrl;
  }
  const apiUrl=String(scan?.publicUrl||scan?.public_url||scan?.url||'');
  if(apiUrl && /churchsuite\.com/i.test(apiUrl)){
    rememberChurchSuitePlanBase(apiUrl);
    return apiUrl;
  }
  let base=state.settings.churchSuitePlanBaseUrl||'';
  if(base){
    try{
      const parsed=new URL(base);
      base=`${parsed.protocol}//${parsed.hostname}`;
    }catch(_){
      base=String(base).replace(/\/$/,'');
    }
  }
  if(!base){
    const known=(state.services||[]).find(s=>s.churchSuitePlanUrl)?.churchSuitePlanUrl||'';
    if(known){
      rememberChurchSuitePlanBase(known);
      base=state.settings.churchSuitePlanBaseUrl||'';
    }
  }
  const identifier=String(scan?.identifier||'').trim();
  return base&&identifier?`${base}/-/plans/${encodeURIComponent(identifier)}`:'';
}

function hasChurchSuitePlanReference(service){
  return !!(
    service?.churchSuitePlanId ||
    String(service?.churchSuitePlanIdentifier||'').trim()
  );
}
function actualChurchSuitePlanUrl(service){
  if(!service)return '';
  const raw=String(service.churchSuitePlanUrl||'').trim();
  if(!raw)return '';

  // "View the ChurchSuite Plan" is shown only when this service actually has
  // a saved Plan Page URL. IDs/identifiers alone may allow syncing, but they
  // must not manufacture a visible View Plan button.
  try{
    const u=new URL(raw);
    if(/churchsuite\.com$/i.test(u.hostname) && /\/-\/plans\/[^/]+/i.test(u.pathname)){
      return raw;
    }
  }catch(_){}
  return '';
}

function churchSuiteEnabled(){ return ['on','manual','auto'].includes(state.settings?.churchSuiteMode); }
function churchSuiteAutoEnabled(){ return churchSuiteEnabled(); }
if(state.settings?.churchSuiteMode==='manual'||state.settings?.churchSuiteMode==='auto'){
  state.settings.churchSuiteMode='on';
}
function serviceProjectionLabel(s){ const p=serviceProjectionReadiness(s); return p.total?`${p.ready}/${p.total} ready`:'No projection'; }
function serviceProjectorCopyLabel(s){ const p=projectorState(s); return p==='downloaded'?'Current':p==='stale'?'Outdated':'Not downloaded'; }

function serviceProgressState(service){
  const today=new Date(); today.setHours(0,0,0,0);
  const serviceDay=service.dateISO?new Date(`${service.dateISO}T00:00:00`):null;
  if(serviceDay && !Number.isNaN(serviceDay.getTime()) && serviceDay<today){
    return {key:'old',label:'Old'};
  }
  const projector=projectorState(service);
  if(projector==='stale'){
    return {key:'amended',label:'Amended after download'};
  }
  if(projector==='downloaded'){
    return {key:'downloaded',label:'Downloaded'};
  }

  const allItems=service.items||[];
  if(allItems.length===0){
    return {key:'empty',label:'Empty'};
  }

  const readiness=serviceProjectionReadiness(service);
  const complete=readiness.ready===readiness.total;

  return complete
    ?{key:'complete',label:'Complete'}
    :{key:'incomplete',label:'Not complete'};
}

function serviceProgressBadge(service){
  const state=serviceProgressState(service);
  return `<span class="service-progress service-progress-${state.key}">${esc(state.label)}</span>`;
}
function serviceItemDetailForDisplay(item){
  if(!item)return '';
  if(!churchSuiteEnabled()&&item.type==='song'&&item.templateSongPlaceholder){
    return 'Empty Song position';
  }
  return String(item.detail||'');
}

function formatChurchSuiteUpdated(v){ return v?formatLastEdited(v):'Not yet'; }
function formatChurchSuiteSynced(v){ return v?formatLastEdited(v):'Not yet'; }

function rememberLastScreen(screen){
  try{localStorage.setItem(LAST_SCREEN_KEY,screen);}catch(_){}
}
function lastScreen(){
  try{return localStorage.getItem(LAST_SCREEN_KEY)||'planner';}catch(_){return 'planner';}
}

let selectedServiceIds=new Set();

function openServicesPage(){
  rememberLastScreen('services');
  document.querySelector('main.shell').hidden=true;
  $('#servicesPage').hidden=false;
  $('#plannerHeaderNav').hidden=true;
  $('#servicesHeaderNav').hidden=false;
  $('#plannerFooter').hidden=true;
  $('#servicesFooter').hidden=false;
  document.body.classList.add('services-page-open');
  renderServicesPage();
}
function closeServicesPage(){
  if(!currentService()){
    rememberLastScreen('services');
    renderServicesPage();
    return;
  }
  rememberLastScreen('planner');
  $('#servicesPage').hidden=true;
  document.querySelector('main.shell').hidden=false;
  $('#plannerHeaderNav').hidden=false;
  $('#servicesHeaderNav').hidden=true;
  $('#plannerFooter').hidden=false;
  $('#servicesFooter').hidden=true;
  document.body.classList.remove('services-page-open');
  render();
}
function renderServicesPage(){
  const services=[...(state.services||[])].sort((a,b)=>String(a.dateISO||'').localeCompare(String(b.dateISO||'')));
  const serviceIdSet=new Set(services.map(s=>String(s.id)));
  selectedServiceIds=new Set([...selectedServiceIds].filter(id=>serviceIdSet.has(String(id))));

  const updateServiceSelectionControls=()=>{
    const count=selectedServiceIds.size;
    const bulk=$('#servicesDeleteSelectedBtn');
    if(bulk){
      bulk.hidden=count===0;
      bulk.disabled=count===0;
      bulk.textContent=count?`Delete selected (${count})`:'Delete selected';
    }
    const all=$('#servicesSelectAll');
    if(all){
      all.checked=services.length>0 && services.every(s=>selectedServiceIds.has(String(s.id)));
      all.indeterminate=count>0 && count<services.length;
    }
  };

  $('#servicesSyncChurchSuiteBtn').hidden=!churchSuiteAutoEnabled();

  const publishedPlansBtn=$('#servicesPublishedPlansBtn');
  if(publishedPlansBtn){
    const directoryEnabled=churchSuiteEnabled()&&!!state.settings?.churchSuiteDirectoryEnabled;
    const showDirectoryLink=directoryEnabled && !!state.settings?.churchSuiteDirectoryShowServicesLink;
    const directoryPath=String(state.settings?.churchSuiteDirectoryPath||'churchsuite-plans')
      .trim().replace(/^\/+|\/+$/g,'').replace(/\s+/g,'-');
    publishedPlansBtn.hidden=!showDirectoryLink;
    publishedPlansBtn.href=`/${directoryPath||'churchsuite-plans'}`;
  }
  const csEnabled=churchSuiteEnabled();
  const subtitle=$('.services-page-subtitle');
  if(subtitle){
    subtitle.textContent=csEnabled
      ?'Plan ahead, review readiness and manage ChurchSuite links.'
      :'Plan ahead and review service readiness.';
  }
  $('#servicesPage').querySelectorAll('[data-cs-column]').forEach(el=>el.hidden=!csEnabled);

  $('#servicesTableBody').innerHTML=services.map(s=>`
    <tr data-service-row="${esc(s.id)}">
      <td class="service-select-cell"><input type="checkbox" data-select-service="${esc(s.id)}" ${selectedServiceIds.has(String(s.id))?'checked':''} aria-label="Select ${esc(s.title)}"></td>
      <td><button class="services-open-service" data-open-service="${esc(s.id)}"><strong>${esc(s.title)}</strong><small>${s.kind==='event'?'One-off event':'Service'}</small></button></td>
      <td>${esc(s.date||'')}</td><td>${serviceProgressBadge(s)}</td>
      <td data-cs-column>${churchSuiteEnabled()?(
        actualChurchSuitePlanUrl(s)
          ?`<a class="secondary compact churchsuite-view-plan" href="${esc(actualChurchSuitePlanUrl(s))}" target="_blank" rel="noopener">View the ChurchSuite Plan</a> <button class="secondary compact" data-sync-cs="${esc(s.id)}">Sync ChurchSuite</button>`
          :hasChurchSuitePlanReference(s)
            ?`<span>Linked</span> · <button class="text-action" data-sync-cs="${esc(s.id)}">Sync</button>`
            :`<span class="meta">Not linked</span>`
      ):''}</td>
      <td data-cs-column>${churchSuiteEnabled()?`<div class="churchsuite-service-times"><span><small>ChurchSuite updated</small>${esc(formatChurchSuiteUpdated(s.churchSuiteLastUpdated))}</span><span><small>Last synced</small>${esc(formatChurchSuiteSynced(s.churchSuiteLastSynced))}</span></div>`:''}</td>
      <td><div class="service-row-actions"><button class="secondary compact service-edit-btn" data-open-service="${esc(s.id)}">Open</button><button class="secondary compact" data-save-template="${esc(s.id)}">Save template</button><button class="item-delete service-delete-btn" data-page-delete="${esc(s.id)}" title="Delete service" aria-label="Delete ${esc(s.title)}"><svg class="trash-icon" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/></svg></button></div></td>
    </tr>`).join('');
  $('#servicesMobileList').innerHTML=services.map(s=>`
    <article class="service-mobile-card" data-service-row="${esc(s.id)}">
      <div class="service-mobile-head">
        <input class="service-mobile-select" type="checkbox" data-select-service="${esc(s.id)}" ${selectedServiceIds.has(String(s.id))?'checked':''} aria-label="Select ${esc(s.title)}">
        <button class="services-open-service" data-open-service="${esc(s.id)}"><strong>${esc(s.title)}</strong><small>${esc(s.date||'')}</small></button>
        <div class="service-row-actions"><button class="secondary compact service-edit-btn" data-open-service="${esc(s.id)}">Open</button><button class="secondary compact" data-save-template="${esc(s.id)}">Save template</button><button class="item-delete service-delete-btn" data-page-delete="${esc(s.id)}" title="Delete service" aria-label="Delete ${esc(s.title)}"><svg class="trash-icon" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/></svg></button></div>
      </div>
      <div class="service-mobile-grid">
        <span><small>Progress</small>${serviceProgressBadge(s)}</span>
        ${churchSuiteEnabled()?`<span><small>ChurchSuite updated</small>${esc(formatChurchSuiteUpdated(s.churchSuiteLastUpdated))}</span><span><small>Last synced</small>${esc(formatChurchSuiteSynced(s.churchSuiteLastSynced))}</span>`:`<span><small>Updated</small>${esc(s.lastEditedAt?formatLastEdited(s.lastEditedAt):'Not yet')}</span>`}
        ${churchSuiteEnabled()?`<span class="mobile-wide churchsuite-mobile-field"><small>ChurchSuite</small>${actualChurchSuitePlanUrl(s)?`<a class="secondary compact churchsuite-view-plan" href="${esc(actualChurchSuitePlanUrl(s))}" target="_blank" rel="noopener">View the ChurchSuite Plan</a>`:'Not linked'}</span>
        ${hasChurchSuitePlanReference(s)?`<span class="mobile-wide churchsuite-mobile-actions"><button class="secondary compact" data-sync-cs="${esc(s.id)}">Sync ChurchSuite</button></span>`:''}`:''}
      </div>
    </article>`).join('');
  $('#servicesPage').querySelectorAll('[data-select-service]').forEach(box=>box.onchange=()=>{
    const id=String(box.dataset.selectService);
    if(box.checked)selectedServiceIds.add(id);
    else selectedServiceIds.delete(id);
    // Desktop + mobile can both exist for the same service.
    $('#servicesPage').querySelectorAll(`[data-select-service="${CSS.escape(id)}"]`).forEach(peer=>peer.checked=box.checked);
    updateServiceSelectionControls();
  });
  const selectAll=$('#servicesSelectAll');
  if(selectAll){
    selectAll.onchange=()=>{
      selectedServiceIds=selectAll.checked
        ?new Set(services.map(s=>String(s.id)))
        :new Set();
      renderServicesPage();
    };
  }
  updateServiceSelectionControls();

  $('#servicesPage').querySelectorAll('[data-open-service]').forEach(b=>b.onclick=async()=>{
    state.activeServiceId=b.dataset.openService;
    persistPlanner();
    await saveActiveServiceRemote(state.activeServiceId);
    closeServicesPage();
    render();
  });
  $('#servicesPage').querySelectorAll('[data-save-template]').forEach(b=>b.onclick=()=>{const svc=state.services.find(x=>String(x.id)===String(b.dataset.saveTemplate));if(svc)saveServiceAsTemplate(svc)});
  $('#servicesPage').querySelectorAll('[data-sync-cs]').forEach(b=>b.onclick=()=>{
    const s=state.services.find(x=>String(x.id)===String(b.dataset.syncCs));
    if(!s)return;
    openChurchSuiteImportModeChoice({
      title:`Sync ${s.title}`,
      onBack:()=>renderServicesPage(),
      onConfirm:(importMode,templateId='')=>openChurchSuiteServiceScan(s.churchSuitePlanUrl||'',s.id,{theme:s.theme,planId:s.churchSuitePlanId||null,importMode,templateId:templateId||defaultTemplateIdForService(s)})
    });
  });
  $('#servicesPage').querySelectorAll('[data-page-delete]').forEach(b=>{let armed=false,timer=null;b.onclick=()=>{const s=state.services.find(x=>String(x.id)===String(b.dataset.pageDelete));if(!s)return;if(!armed){armed=true;b.classList.add('armed','delete-x-confirm');b.textContent='×';b.title='Click again to confirm delete';b.setAttribute('aria-label','Confirm delete');timer=setTimeout(()=>{armed=false;b.classList.remove('armed','delete-x-confirm');b.innerHTML='<svg class="trash-icon" viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/></svg>';b.title='Delete service';b.setAttribute('aria-label','Delete service')},3000);return}clearTimeout(timer);confirmDeleteServiceFromPage(s)}})
}
function confirmDeleteServiceFromPage(s){
  const linked=churchSuiteEnabled()&&hasChurchSuitePlanReference(s);
  openSheet(`<h2>Delete service?</h2>
    <div class="warning-card">
      <strong>${esc(s.title)} · ${esc(s.date||'')}</strong>
      <p>This removes the service and its saved item history from OpenLP Service Planner.</p>
    </div>
    ${linked?`<div class="warning-card local-delete-note">
      <strong>ChurchSuite will not be changed.</strong>
      <p>The linked ChurchSuite service plan will not be deleted or edited. If it is still an available published plan, it will appear in ChurchSuite import/sync again so it can be added back to this planner later.</p>
    </div>`:''}
    <p>This local deletion cannot be undone.</p>
    <div class="sheet-actions">
      <button class="secondary" id="cancelPageDelete">Cancel</button>
      <button class="danger solid-danger" id="confirmPageDelete">Delete from planner</button>
    </div>`);
  $('#cancelPageDelete').onclick=()=>sheet.close();
  $('#confirmPageDelete').onclick=async()=>{
    const id=String(s.id);
    const button=$('#confirmPageDelete');
    button.disabled=true;
    button.textContent='Deleting…';
    try{
      const result=await deleteRemoteService(id);
      await removeServicesAfterConfirmedDelete([id],result);
      selectedServiceIds.delete(id);
      sheet.close();
      renderServicesPage();
    }catch(err){
      button.disabled=false;
      button.textContent='Delete from planner';
      const message=err?.message||String(err);
      appAlert(`Service could not be deleted.\n\n${message}`);
    }
  };
}
function confirmDeleteSelectedServices(){
  const ids=[...selectedServiceIds];
  const services=ids.map(id=>state.services.find(s=>String(s.id)===String(id))).filter(Boolean);
  if(!services.length)return;

  const linkedCount=churchSuiteEnabled()?services.filter(hasChurchSuitePlanReference).length:0;
  openSheet(`<h2>Delete ${services.length} services?</h2>
    <div class="warning-card">
      <strong>${services.length} service plan${services.length===1?'':'s'} selected</strong>
      <p>This permanently removes the selected service plans and their saved item histories from OpenLP Service Planner.</p>
    </div>
    ${linkedCount?`<div class="warning-card local-delete-note">
      <strong>ChurchSuite will not be changed.</strong>
      <p>${linkedCount} selected service${linkedCount===1?' has':'s have'} a ChurchSuite reference. Their ChurchSuite plans will remain untouched.</p>
    </div>`:''}
    <div class="bulk-delete-service-list">
      ${services.slice(0,12).map(s=>`<div><strong>${esc(s.title)}</strong><span>${esc(s.date||'')}</span></div>`).join('')}
      ${services.length>12?`<p class="meta">…and ${services.length-12} more.</p>`:''}
    </div>
    <p class="meta" id="bulkDeleteServiceStatus">This cannot be undone.</p>
    <div class="sheet-actions">
      <button class="secondary" id="cancelBulkServiceDelete">Cancel</button>
      <button class="danger solid-danger" id="confirmBulkServiceDelete">Delete selected</button>
    </div>`);

  $('#cancelBulkServiceDelete').onclick=()=>sheet.close();
  $('#confirmBulkServiceDelete').onclick=async()=>{
    const button=$('#confirmBulkServiceDelete');
    const status=$('#bulkDeleteServiceStatus');
    button.disabled=true;
    button.textContent='Deleting…';
    status.textContent='Deleting selected services from the shared planner…';
    try{
      const result=await deleteRemoteServices(ids);
      await removeServicesAfterConfirmedDelete(ids,result);
      selectedServiceIds.clear();
      sheet.close();
      renderServicesPage();
    }catch(err){
      button.disabled=false;
      button.textContent='Delete selected';
      status.textContent='Delete failed: '+(err?.message||String(err));
    }
  };
}

function openChurchSuiteLinkDialog(id){
  const s=state.services.find(x=>String(x.id)===String(id));if(!s)return;
  const currentUrl=actualChurchSuitePlanUrl(s);
  openSheet(`<h2>ChurchSuite service plan</h2>
    <div class="field"><label>Published service plan URL</label><input id="churchSuitePlanUrl" type="url" value="${esc(currentUrl)}" placeholder="https://yourchurch.churchsuite.com/-/plans/..."></div>
    <p class="meta">This must be the URL of an actual ChurchSuite Plan Page, not the ChurchSuite account home/base address.</p>
    <p class="meta" id="churchSuiteLinkStatus"></p>
    <div class="sheet-actions"><button class="secondary" id="cancelCsLink">Cancel</button><button class="primary" id="saveCsLink">Done</button></div>`);
  let dirty=false;
  const i=$('#churchSuitePlanUrl'),save=$('#saveCsLink'),status=$('#churchSuiteLinkStatus');
  i.oninput=()=>{dirty=true;save.textContent='Save Changes';status.textContent=''};
  $('#cancelCsLink').onclick=()=>sheet.close();
  save.onclick=()=>{
    if(!dirty){sheet.close();return}
    const value=i.value.trim();
    if(value){
      try{
        const u=new URL(value);
        if(!/churchsuite\.com$/i.test(u.hostname) || !/\/-\/plans\/[^/]+/i.test(u.pathname)){
          status.textContent='Enter the published URL for a specific ChurchSuite plan (…/-/plans/…), not the ChurchSuite base address.';
          return;
        }
      }catch(_){
        status.textContent='Enter a valid ChurchSuite Plan Page URL.';
        return;
      }
    }
    s.churchSuitePlanUrl=value;
    if(!value && !s.churchSuitePlanId && !s.churchSuitePlanIdentifier){
      s.churchSuiteLastUpdated='';
    }
    markServiceEdited('changed ChurchSuite service-plan link');
    saveServiceMeta();
    sheet.close();
    renderServicesPage();
  };
}

function openAddServiceFromServicesPage(){
  const mode=state.settings.churchSuiteMode||'off';
  const csEnabled=mode==='manual'||mode==='auto';
  const themes=plannerThemeNames();
  const defaultTheme=state.settings.defaultMorningTheme||'Default';

  openSheet(`<h2>Add service</h2>

    ${csEnabled?`
      <div class="field">
        <label>ChurchSuite service plan URL</label>
        <input id="newServiceChurchSuiteUrl" type="url" placeholder="Paste ChurchSuite service plan URL">
      </div>
      <p class="meta">If a ChurchSuite URL is entered, the planner will scan that plan for the service title, date and service items. The OpenLP theme below remains your choice.</p>
      <div class="field">
        <label>ChurchSuite import</label>
        <select id="newChurchSuiteImportMode">
          ${serviceTemplates().length?`<option value="template" selected>Use a Template</option>`:''}
          <option value="songs">Songs only</option>
          <option value="all">All configured Types</option>
          <option value="select">Select Types for this import</option>
        </select>
      </div>
    `:''}

    <div id="manualServiceFields">
      <div class="field"><label>Title</label><input id="newServiceTitle" value="Morning Service"></div>
      <div class="field"><label>Date</label><input id="newServiceDate" type="date"></div>
      <div class="field"><label>Service type</label><select id="newServiceType">
        ${regularServiceTypes().map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}
        <option value="__oneoff__">One-off service</option>
      </select></div>
    </div>

    <div class="field service-theme-field">
      <label>OpenLP theme</label>
      <select id="newServiceTheme">
        ${themes.map(t=>`<option value="${esc(t)}" ${t===defaultTheme?'selected':''}>${esc(t)}</option>`).join('')}
      </select>
    </div>
    <p class="meta"><strong>Default</strong> tells OpenLP to use its own default theme. ChurchSuite does not set or change this choice.</p>

    <div class="sheet-actions">
      <button class="secondary" id="cancelServiceAdd">Cancel</button>
      <button class="primary" id="confirmServiceAdd">Add service</button>
    </div>`);

  const urlInput=$('#newServiceChurchSuiteUrl');
  const manualFields=$('#manualServiceFields');
  const confirmBtn=$('#confirmServiceAdd');
  if($('#newChurchSuiteImportMode')){
    const preferred=serviceTemplates().length?'template':(state.settings.churchSuiteDefaultImportMode||'all');
    if([...$('#newChurchSuiteImportMode').options].some(o=>o.value===preferred))$('#newChurchSuiteImportMode').value=preferred;
  }

  const syncAddMode=()=>{
    const hasChurchSuiteUrl=!!urlInput?.value.trim();
    if(hasChurchSuiteUrl){
      manualFields.classList.add('manual-fields-optional');
      confirmBtn.textContent='Scan ChurchSuite plan';
    }else{
      manualFields.classList.remove('manual-fields-optional');
      confirmBtn.textContent='Add service';
    }
  };

  if(urlInput){
    urlInput.addEventListener('input',syncAddMode);
    urlInput.addEventListener('change',syncAddMode);
  }
  syncAddMode();

  const newServiceTypeSelect=$('#newServiceType');
  if(newServiceTypeSelect){
    const applyTypeTheme=()=>{
      if(newServiceTypeSelect.value==='__oneoff__'){
        $('#newServiceTheme').value='Default';
      }else{
        const t=serviceTypeById(newServiceTypeSelect.value);
        if(t&&[...$('#newServiceTheme').options].some(o=>o.value===t.defaultTheme))$('#newServiceTheme').value=t.defaultTheme;
      }
    };
    newServiceTypeSelect.addEventListener('change',applyTypeTheme);
    applyTypeTheme();
  }

  $('#cancelServiceAdd').onclick=()=>sheet.close();

  confirmBtn.onclick=()=>{
    const churchSuiteUrl=urlInput?.value.trim()||'';
    const selectedTheme=$('#newServiceTheme').value||'Default';
    const importMode=$('#newChurchSuiteImportMode')?.value||state.settings.churchSuiteDefaultImportMode||'all';

    if(churchSuiteUrl){
      openChurchSuiteServiceScan(churchSuiteUrl,null,{theme:selectedTheme,importMode});
      return;
    }

    const dateISO=$('#newServiceDate').value;
    if(!dateISO){
      appAlert('Choose a service date.');
      return;
    }

    const title=$('#newServiceTitle').value.trim()||'Service';
    const d=new Date(`${dateISO}T12:00:00`);
    const id=`service-${Date.now()}`;

    const service={
      id,
      title,
      dateISO,
      date:new Intl.DateTimeFormat('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d),
      kind:$('#newServiceType').value==='__oneoff__'?'event':'regular',
      serviceTypeId:$('#newServiceType').value==='__oneoff__'?null:$('#newServiceType').value,
      serviceTypeName:$('#newServiceType').value==='__oneoff__'?'One-off services':(serviceTypeById($('#newServiceType').value)?.name||title),
      theme:selectedTheme,
      published:false,
      items:[],
      activity:[[currentEditor(),`created ${title}`,'just now']],
      lastEditedAt:new Date().toISOString(),
      lastEditedBy:currentEditor(),
      lastEditedAction:'created service',
      churchSuitePlanUrl:'',
      churchSuiteLastUpdated:null
    };

    state.services.push(service);
    state.activeServiceId=id;
    persistPlanner();
    createRemoteService(service);
    sheet.close();
    renderServicesPage();
  };
}


function normalizeChurchSuiteName(value){
  return String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
}

function matchChurchSuiteType(typeName){
  const wanted=normalizeChurchSuiteName(typeName);
  return (state.settings.churchSuiteTypes||[]).find(row=>
    normalizeChurchSuiteName(row.name)===wanted
  )||null;
}

function matchLibrarySong(title,ccli=null){
  const wantedCcli=String(ccli||'').replace(/\D/g,'');
  if(wantedCcli){
    const byCcli=songs.find(song=>String(song.ccliNumber||'').replace(/\D/g,'')===wantedCcli);
    if(byCcli)return byCcli;
  }
  const wanted=normalizeChurchSuiteName(title);
  return songs.find(song=>
    normalizeChurchSuiteName(song.title)===wanted ||
    normalizeChurchSuiteName(song.alternateTitle)===wanted
  )||null;
}

async function scanChurchSuitePlan(url,planId=null){
  if(!remoteAvailable){
    throw new Error('ChurchSuite API access needs the deployed Cloudflare Worker.');
  }
  return await apiFetch('/api/churchsuite/scan-plan',{
    method:'POST',
    body:JSON.stringify({url,planId})
  });
}

function mapChurchSuiteScanItems(scanItems,importMode='all',selectedTypes=null){
  const mapped=[];
  const unmappedTypes=[];
  const missingSongs=[];

  (scanItems||[]).forEach((component,index)=>{
    const isSong=component.kind==='song';
    const sourceId=component.sourceId||`churchsuite-${index+1}`;

    if(isSong){
      const song=matchLibrarySong(component.title,component.ccli);
      if(!song)missingSongs.push(component.title);

      mapped.push({
        id:`cs-${sourceId}`,
        type:'song',
        songId:song?.id||null,
        title:component.title||'Song',
        person:'Music',
        projected:true,
        ready:!!song,
        detail:song?'Usual arrangement':'Song not found in song library',
        verse:song?.verseOrder||'',
        musicNote:song?.musicNote||'',
        by:currentEditor(),
        changed:'just now',
        churchSuiteSourceId:sourceId,
        churchSuiteType:'Song',
        churchSuiteCcli:component.ccli||null,
        churchSuiteDetails:''
      });
      return;
    }

    if(importMode==='songs')return;

    const typeName=component.typeName||'';
    if(importMode==='select' && Array.isArray(selectedTypes) && !selectedTypes.includes(typeName))return;
    const typeRule=matchChurchSuiteType(typeName);
    if(!typeRule){
      if(typeName&&!unmappedTypes.includes(typeName))unmappedTypes.push(typeName);
      return;
    }

    const importAs=typeRule.importAs||'ignore';
    if(importAs==='ignore')return;

    const base={
      id:`cs-${sourceId}`,
      title:component.title||typeName||'ChurchSuite item',
      person:'',
      by:currentEditor(),
      changed:'just now',
      churchSuiteSourceId:sourceId,
      churchSuiteType:typeName,
      churchSuiteDetails:component.details||''
    };

    if(importAs==='text'){
      mapped.push({...base,type:'text',projected:false,ready:true,notes:component.details||''});
    }else if(importAs==='bible'){
      const ref=component.details||component.title||'';
      mapped.push({...base,type:'bible',projected:true,ready:false,detail:ref,passage:ref});
    }else if(importAs==='sermon'){
      mapped.push({
        ...base,
        type:'images',
        title:component.title||'Sermon',
        projected:true,
        ready:false,
        detail:'Waiting for sermon images',
        autoplay:'off',
        interval:0,
        sermonImages:true,
        imageCategory:'sermon'
      });
    }else if(importAs==='images'){
      mapped.push({...base,type:'images',projected:true,ready:false,detail:'Waiting for images',autoplay:'loop',interval:7});
    }else if(importAs==='video'){
      mapped.push({...base,type:'video',projected:true,ready:false,detail:'Waiting for video',autoStart:true});
    }else if(importAs==='pdf'){
      mapped.push({...base,type:'pdf',projected:true,ready:false,detail:'Waiting for PDF'});
    }
  });

  return {mapped,unmappedTypes,missingSongs};
}

function churchSuiteScanItemPreview(scanItems){
  return (scanItems||[]).map((item,index)=>{
    const isSong=item.kind==='song';
    const rule=isSong?{importAs:'song'}:matchChurchSuiteType(item.typeName);
    const rawTarget=isSong?'song':(rule?.importAs||'');
    const target=rawTarget
      ?({song:'Song',text:'Text',bible:'Bible',sermon:'Sermon',images:'Images',video:'Video',pdf:'PDF',ignore:'Ignore'}[rawTarget]||rawTarget)
      :'Not mapped';
    return `<div class="cs-scan-item ${!isSong&&!rule?'scan-unmapped':''}">
      <span class="cs-scan-order">${String(index+1).padStart(2,'0')}</span>
      <div class="cs-scan-item-main">
        <strong>${esc(item.title||item.typeName||'Untitled item')}</strong>
        <small>${isSong?'Song':esc(item.typeName||'No ChurchSuite Type')}</small>
        ${item.details?`<p>${esc(item.details)}</p>`:''}
      </div>
      <span class="cs-scan-map">${esc(target)}</span>
    </div>`;
  }).join('');
}




function templateItemKind(item){
  return item?.templateMode==='keep'?'keep':'sync';
}
function templateKeptItemMatchesLocal(slot,item){
  if(!slot||!item||item.churchSuiteSourceId)return false;
  if(slot.templateSourceItemId && String(slot.templateSourceItemId)===String(item.id))return true;
  if(String(slot.type||'')!==String(item.type||''))return false;
  const norm=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  const slotTitle=norm(slot.title);
  const itemTitle=norm(item.title);
  return !!slotTitle && slotTitle===itemTitle;
}
function templateManagedLocalIds(template,items){
  const used=new Set();
  const ids=new Set();
  const locals=(items||[]).filter(item=>!item.churchSuiteSourceId);
  for(const slot of template?.items||[]){
    if(templateItemKind(slot)!=='keep')continue;
    const exact=slot.templateSourceItemId
      ?locals.find(item=>!used.has(String(item.id))&&String(item.id)===String(slot.templateSourceItemId))
      :null;
    const match=exact||locals.find(item=>!used.has(String(item.id))&&templateKeptItemMatchesLocal(slot,item));
    if(match){used.add(String(match.id));ids.add(String(match.id));}
  }
  return ids;
}
function templateItemSummary(item){
  if(!churchSuiteEnabled()){
    if(isTemplateSongSlot(item))return `Song position`;
    return `Keep ${item.title||item.type||'item'} in template`;
  }
  if(templateItemKind(item)==='sync')return `Sync ${item.churchSuiteType||item.type||'item'} from ChurchSuite`;
  return `Keep ${item.title||item.type||'local item'} from template`;
}
function preserveLocalAttachments(previous,nextItem){
  if(!previous||!nextItem)return nextItem;
  if(Array.isArray(previous.media)&&previous.media.length){
    nextItem.media=structuredClone(previous.media);
    nextItem.projected=previous.projected!==false;
    nextItem.ready=previous.ready!==false;
    if(previous.autoplay!==undefined)nextItem.autoplay=previous.autoplay;
    if(previous.interval!==undefined)nextItem.interval=previous.interval;
    if(previous.autoStart!==undefined)nextItem.autoStart=previous.autoStart;
    if(previous.ignoreImages!==undefined)nextItem.ignoreImages=previous.ignoreImages;
    if(previous.ignoreVideo!==undefined)nextItem.ignoreVideo=previous.ignoreVideo;
    if(previous.ignoreBible!==undefined)nextItem.ignoreBible=previous.ignoreBible;
    updateMediaItemDetail(nextItem);
  }
  return nextItem;
}
async function makeTemplateMediaDurable(item){
  const copy=structuredClone(item);
  if(!remoteAvailable || !Array.isArray(copy.media) || !copy.media.length)return copy;
  const mediaType=mediaStorageType(copy.type);
  const durable=[];
  for(const asset of copy.media){
    let libraryId=asset.sourceLibraryId||asset.id;
    if(!asset.sourceLibraryId){
      const result=await retainServiceMedia(asset.id,mediaType);
      libraryId=result.libraryAssetId;
    }
    durable.push({id:String(libraryId),originalName:asset.originalName||'',contentType:asset.contentType||'',byteSize:asset.byteSize||0,templateLibraryAsset:true});
  }
  copy.media=durable;
  try{
    const library=await loadPlannerMediaLibrary(mediaType);
    const byId=new Map((library.retained||[]).map(a=>[String(a.id),a]));
    const sourceRows=durable.map(a=>byId.get(String(a.id))).filter(Boolean);
    const folderIds=[...new Set(sourceRows.map(a=>String(a.libraryFolderId||'')).filter(Boolean))];
    if(sourceRows.length===durable.length && folderIds.length===1){
      copy.templateLibraryFolderId=folderIds[0];
      copy.templateLibraryFolderName=String(sourceRows[0]?.libraryFolderName||'');
      copy.templateUseCurrentFolderContents=true;
    }
  }catch(_){ }
  return copy;
}
async function saveServiceAsTemplate(service){
  if(!service)return;
  const csTemplates=churchSuiteEnabled();
  openSheet(`<h2>Save service as template</h2>
    <p class="meta">${csTemplates
      ?'Choose which positions are refreshed from ChurchSuite and which local items stay in the template.'
      :'Save this service order, theme and local items as a reusable template.'} If a kept media item currently comes entirely from one Planner library folder, the template will remember that folder and use its current contents.</p>
    <div class="field"><label>Template name</label><input id="templateName" value="${esc(service.serviceTypeName||service.title||'Service template')}"></div>
    <div class="field"><label>OpenLP theme</label><select id="templateTheme">${plannerThemeNames().map(theme=>`<option value="${esc(theme)}" ${String(service.theme||'Default')===String(theme)?'selected':''}>${esc(theme)}</option>`).join('')}</select><p class="meta">Services created or re-synced with this template use this OpenLP theme.</p></div>
    <div class="template-item-list">${(service.items||[]).map((item,index)=>{
      const defaultKeep=!item.churchSuiteSourceId || item.retainOnChurchSuiteSync || item.type==='sermon-images';
      return `<div class="template-item-row"><span class="template-position">${index+1}</span><div><strong>${esc(item.title)}</strong><small>${esc(csTemplates?(item.churchSuiteType||item.type||'item'):(item.type||'item'))}</small></div>${item.type==='song'?`<select data-template-item-mode="${esc(String(item.id))}" disabled><option value="sync" selected>${csTemplates?'Song position · next ChurchSuite song':'Song position'}</option></select>`:(csTemplates?`<select data-template-item-mode="${esc(String(item.id))}"><option value="sync" ${defaultKeep?'':'selected'}>Sync from ChurchSuite</option><option value="keep" ${defaultKeep?'selected':''}>Keep in template</option></select>`:`<select data-template-item-mode="${esc(String(item.id))}" disabled><option value="keep" selected>Keep in template</option></select>`)}</div>`;
    }).join('')}</div>
    <label class="toggle"><span>Make this the default template for ${esc(service.serviceTypeName||service.title||'this service type')}</span><input id="templateMakeDefault" type="checkbox" ${service.serviceTypeId?'checked':'disabled'}></label>
    <div class="sheet-actions"><button class="secondary" id="cancelTemplateSave">Cancel</button><button class="primary" id="confirmTemplateSave">Save template</button></div>`);
  const cancelTemplateSave=()=>closeSheetSafely();
  $('#cancelTemplateSave').onclick=cancelTemplateSave;
  setSheetCloseAction(cancelTemplateSave);
  $('#confirmTemplateSave').onclick=async()=>{
    const name=$('#templateName').value.trim(); if(!name){await appAlert('Give the template a name.');return;}
    const btn=$('#confirmTemplateSave'); btn.disabled=true;btn.textContent='Saving template…';
    try{
      const templateItems=[];
      for(const item of service.items||[]){
        const selectedMode=body.querySelector(`[data-template-item-mode="${CSS.escape(String(item.id))}"]`)?.value||(csTemplates?'sync':'keep');
        const mode=item.type==='song'?'sync':(csTemplates?selectedMode:'keep');
        if(mode==='sync'){
          templateItems.push({
            templateMode:'sync',
            churchSuiteType:item.type==='song'?'Song':(item.churchSuiteType||null),
            type:item.type,
            sourcePosition:(service.items||[]).indexOf(item),
            title:item.type==='song'?(item.title||'Song'):(item.title||'')
          });
        }else{
          const durable=await makeTemplateMediaDurable(item);
          durable.templateMode='keep';
          durable.templateSourceItemId=String(item.id);
          durable.templateProtected=true;
          durable.retainOnChurchSuiteSync=true;
          delete durable.churchSuiteSourceId;
          delete durable.churchSuiteExcludedFromLastSync;
          templateItems.push(durable);
        }
      }
      const id=`tpl-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      const template={id,name,serviceTypeId:service.serviceTypeId||null,serviceTypeName:service.serviceTypeName||service.title||'',theme:$('#templateTheme')?.value||service.theme||'Default',items:templateItems,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      state.settings.serviceTemplates=[...serviceTemplates(),template];
      if(service.serviceTypeId && $('#templateMakeDefault')?.checked)state.settings.defaultTemplateByServiceType[String(service.serviceTypeId)]=id;
      persistPlanner();
      if(remoteAvailable)await apiFetch('/api/settings',{method:'PUT',body:JSON.stringify({settings:state.settings})});
      sheet.close();
      await appAlert(`Template “${name}” saved.`,{title:'Template saved'});
    }catch(err){btn.disabled=false;btn.textContent='Save template';appAlert(err?.message||String(err));}
  };
}
function openTemplateChooser({onChoose,onBack=null,preferredId=''}={}){
  const templates=serviceTemplates();
  if(!templates.length){appAlert('No service templates have been saved yet.');return;}
  const sorted=[...templates].sort((a,b)=>(String(a.id)===String(preferredId)?-1:String(b.id)===String(preferredId)?1:String(a.name).localeCompare(String(b.name))));
  openSheet(`<h2>Use a Template</h2><p class="meta">Choose the service pattern to apply to this ChurchSuite plan.</p><div class="template-choice-list">${sorted.map(t=>`<button class="choice ${String(t.id)===String(preferredId)?'template-default-choice':''}" data-use-template="${esc(t.id)}"><strong>${esc(t.name)}</strong><span>${t.items?.length||0} positions${String(t.id)===String(preferredId)?' · default for this service type':''}</span></button>`).join('')}</div><div class="sheet-actions"><button class="secondary" id="templateChoiceBack">Back</button></div>`);
  let choosing=false;
  const leaveTemplateChooser=()=>{
    if(choosing)return;
    cancelChurchSuiteOperation();
    onBack?onBack():closeSheetSafely();
  };
  $('#templateChoiceBack').onclick=leaveTemplateChooser;
  setSheetCloseAction(leaveTemplateChooser);
  body.querySelectorAll('[data-use-template]').forEach(btn=>btn.onclick=()=>{
    if(choosing)return;
    const t=serviceTemplateById(btn.dataset.useTemplate);
    if(!t)return;
    choosing=true;
    body.querySelectorAll('[data-use-template]').forEach(other=>other.disabled=true);
    $('#templateChoiceBack').disabled=true;
    btn.classList.add('choice-working');
    const strong=btn.querySelector('strong');
    if(strong)strong.textContent=`✓ ${strong.textContent.replace(/^✓\s*/,'')}`;
    setTimeout(()=>onChoose(t),30);
  });
}
function churchSuiteTemplateSlotMatches(templateItem,incoming){
  if(templateItem.churchSuiteType && incoming.churchSuiteType)return String(templateItem.churchSuiteType).toLowerCase()===String(incoming.churchSuiteType).toLowerCase();
  return String(templateItem.type||'')===String(incoming.type||'');
}
function isTemplateSongSlot(slot){
  if(!slot)return false;
  if(String(slot.type||'').toLowerCase()==='song')return true;
  if(String(slot.churchSuiteType||'').trim().toLowerCase()==='song')return true;
  const title=String(slot.title||'').trim().toLowerCase();
  return title==='song' || /^song\s*\d*$/.test(title);
}
function templateServiceRole(value){
  return String(value||'').trim().toLowerCase()
    .replace(/\b(images?|slides?|presentation|projection|local|item)\b/g,' ')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function templateKeptSlotMatchesIncoming(slot,incoming){
  const slotType=templateServiceRole(slot.churchSuiteType);
  const incomingType=templateServiceRole(incoming.churchSuiteType);
  if(slotType&&incomingType&&slotType===incomingType)return true;

  const slotTitle=templateServiceRole(slot.title);
  const incomingTitle=templateServiceRole(incoming.title);
  if(slotTitle&&incomingTitle&&slotTitle===incomingTitle)return true;
  if(slotTitle&&incomingType&&slotTitle===incomingType)return true;
  if(slotType&&incomingTitle&&slotType===incomingTitle)return true;

  // Common local presentation names such as "Sermon Images" intentionally
  // replace the ChurchSuite "Sermon" slot rather than adding a second sermon.
  if(slotTitle&&incomingTitle&&(slotTitle.includes(incomingTitle)||incomingTitle.includes(slotTitle)))return true;
  return false;
}
async function applyTemplateToMappedItems(template,mapped,serviceId,existingItems=[]){
  if(!template)return mapped;
  const pool=[...(mapped||[])];
  const out=[];

  for(let index=0;index<(template.items||[]).length;index++){
    const slot=template.items[index];

    // A Song position is always a positional ChurchSuite Song slot. Older
    // templates may have saved blank Song items as "keep" simply because no
    // ChurchSuite song/source existed when the template was created.
    if(isTemplateSongSlot(slot)){
      const at=pool.findIndex(x=>String(x.type||'').toLowerCase()==='song');
      if(at>=0){
        const incoming=pool.splice(at,1)[0];
        incoming.templateSongSlot=true;
        incoming.templateSongSlotIndex=index;
        incoming.templateId=template.id;
        incoming.templateProtected=false;
        incoming.templateSongPlaceholder=false;
        incoming.extraChurchSuiteSong=false;
        out.push(incoming);
      }else{
        // If this service already has a locally chosen song in this same
        // template position, keep it until ChurchSuite supplies a replacement.
        const previousSong=(existingItems||[]).find(old=>
          old?.type==='song' &&
          Number(old.templateSongSlotIndex)===index &&
          (
            String(old.templateId||'')===String(template.id||'') ||
            old.templateSongPlaceholder ||
            old.templateSongSlot
          )
        );

        if(previousSong && (previousSong.songId||previousSong.serviceSong)){
          out.push({
            ...structuredClone(previousSong),
            templateSongSlot:true,
            templateSongSlotIndex:index,
            templateId:template.id,
            templateProtected:true,
            retainOnChurchSuiteSync:true,
            templateSongPlaceholder:false,
            churchSuiteSourceId:null,
            churchSuiteTemplateNote:'Local song retained in template Song slot until ChurchSuite assigns a song.'
          });
        }else{
          out.push({
            id:`tpl-song-${Date.now()}-${index}-${Math.random().toString(36).slice(2,6)}`,
            type:'song',
            songId:null,
            title:String(slot.title||'Song').trim()||'Song',
            person:'Music',
            projected:true,
            ready:false,
            detail:'Not yet assigned in ChurchSuite',
            verse:'',
            musicNote:'',
            by:currentEditor(),
            changed:'just now',
            templateSongSlot:true,
            templateSongSlotIndex:index,
            templateSongPlaceholder:true,
            templateProtected:true,
            templateId:template.id,
            retainOnChurchSuiteSync:true,
            churchSuiteType:'Song',
            churchSuiteTemplateNote:'Song slot retained from template — no ChurchSuite song is assigned yet.'
          });
        }
      }
      continue;
    }

    if(templateItemKind(slot)==='sync'){
      const at=pool.findIndex(x=>churchSuiteTemplateSlotMatches(slot,x));
      if(at>=0)out.push(pool.splice(at,1)[0]);
      continue;
    }

    const replaceAt=pool.findIndex(x=>templateKeptSlotMatchesIncoming(slot,x));
    if(replaceAt>=0)pool.splice(replaceAt,1);

    const item=structuredClone(slot);
    item.id=`tplitem-${Date.now()}-${index}-${Math.random().toString(36).slice(2,6)}`;
    item.templateProtected=true;
    item.templateId=template.id;
    item.retainOnChurchSuiteSync=true;
    item.changed='just now';
    item.by=currentEditor();

    const previousTemplateItem=(existingItems||[]).find(old=>
      old?.templateProtected &&
      String(old.templateId||'')===String(template.id||'') &&
      (String(old.templateSourceItemId||'')===String(slot.templateSourceItemId||'') || templateKeptItemMatchesLocal(slot,old))
    );
    if(previousTemplateItem)preserveLocalAttachments(previousTemplateItem,item);

    if(remoteAvailable && !(Array.isArray(item.media)&&item.media.length&&previousTemplateItem)){
      let ids=[];
      if(item.templateUseCurrentFolderContents&&item.templateLibraryFolderId){
        const library=await loadPlannerMediaLibrary(mediaStorageType(item.type));
        ids=(library.retained||[])
          .filter(a=>String(a.libraryFolderId||'')===String(item.templateLibraryFolderId))
          .map(a=>String(a.id));
      }else if(Array.isArray(item.media)&&item.media.length){
        ids=item.media.map(a=>String(a.id)).filter(Boolean);
      }
      if(ids.length){
        const result=await usePlannerLibraryAssets(ids,serviceId,item.id);
        item.media=result.assets||[];
        updateMediaItemDetail(item);
      }else if(['images','sermon-images','video','pdf'].includes(item.type)){
        item.media=[];
        updateMediaItemDetail(item);
      }
    }
    out.push(item);
  }

  const extraSongs=pool
    .filter(item=>String(item.type||'').toLowerCase()==='song')
    .map((item,index)=>({
      ...item,
      extraChurchSuiteSong:true,
      extraChurchSuiteSongNumber:index+1,
      churchSuiteTemplateNote:'Extra ChurchSuite song — no Song slot was available in the selected template.'
    }));

  return [...out,...extraSongs];
}


function openCreateServiceTemplateFromLibrary(){
  const services=[...(state.services||[])].sort((a,b)=>String(a.dateISO||'').localeCompare(String(b.dateISO||''))||String(a.title||'').localeCompare(String(b.title||'')));
  openSheet(`<h2>Create Service Template</h2>
    <p class="meta">${churchSuiteEnabled()
      ?'A useful template starts from a service, because that gives it real ChurchSuite positions, local sermon/notices items, media settings and service order.'
      :'A useful template can start from an existing service so it inherits its order, local sermon/notices items, media settings and OpenLP theme.'}</p>
    ${services.length?`<div class="template-create-service-list">
      <strong>Create from an existing service</strong>
      ${services.map(service=>`<button type="button" class="choice" data-template-from-service="${esc(service.id)}">
        <strong>${esc(service.title)}</strong>
        <span>${esc(service.date||service.dateISO||'')} · ${(service.items||[]).length} item${(service.items||[]).length===1?'':'s'}</span>
      </button>`).join('')}
    </div>`:`<div class="warning-card"><strong>No service is available to use yet.</strong><p>Create a service first, add the structure and local items you want, then use <strong>Save as template</strong>.</p></div>`}
    <div class="template-create-new-service">
      <strong>Or start with a new service</strong>
      <p class="meta">Create and prepare the service, then use the <strong>Save as template</strong> button on that service.</p>
      <button type="button" class="secondary" id="createServiceForTemplate">Create a service</button>
    </div>
    <div class="sheet-actions"><button class="primary" id="createTemplateBack">Back to Templates</button></div>`);

  const leaveCreateTemplate=()=>openServiceTemplateManager('library');
  $('#createTemplateBack').onclick=leaveCreateTemplate;
  setSheetCloseAction(leaveCreateTemplate);
  body.querySelectorAll('[data-template-from-service]').forEach(btn=>btn.onclick=()=>{
    const service=state.services.find(s=>String(s.id)===String(btn.dataset.templateFromService));
    if(service)saveServiceAsTemplate(service);
  });
  $('#createServiceForTemplate').onclick=()=>{
    sheet.close();
    openServicesPage();
    openAddServiceFromServicesPage();
  };
}


function normalizeTemplateForEditor(template){
  const draft=structuredClone(template||{});
  draft.name=String(draft.name||'Service template');
  draft.theme=String(draft.theme||'Default');
  draft.items=Array.isArray(draft.items)?draft.items.filter(Boolean):[];
  draft.items=draft.items.map((item,index)=>{
    const next={...item};
    next.type=String(next.type||'text');
    next.title=String(next.title||next.churchSuiteType||(
      next.type==='song'?'Song':
      next.type==='sermon-images'?'Sermon Images':
      next.type==='images'?'Images':
      next.type==='bible'?'Bible Reading':
      next.type==='video'?'Video':
      next.type==='pdf'?'PDF':'Service item'
    ));
    next.sourcePosition=Number.isFinite(Number(next.sourcePosition))?Number(next.sourcePosition):index;

    // Songs are a first-class template position, not a generic ChurchSuite
    // Type slot. Upgrade old song entries transparently when the editor opens.
    if(next.type==='song'){
      next.templateMode='sync';
      next.churchSuiteType='Song';
      next.title=next.title||'Song';
      delete next.templateProtected;
      delete next.retainOnChurchSuiteSync;
    }else if(next.templateMode!=='sync'&&next.templateMode!=='keep'){
      next.templateMode=next.churchSuiteSourceId?'sync':'keep';
    }
    return next;
  });
  return draft;
}

function openServiceTemplateManager(returnTo='library'){
  const rows=serviceTemplates();
  const defaults=state.settings.defaultTemplateByServiceType||{};
  const defaultNamesByTemplate=new Map();
  for(const type of regularServiceTypes()){
    const templateId=String(defaults[String(type.id)]||'');
    if(!templateId)continue;
    if(!defaultNamesByTemplate.has(templateId))defaultNamesByTemplate.set(templateId,[]);
    defaultNamesByTemplate.get(templateId).push(type.name);
  }
  const csTemplates=churchSuiteEnabled();
  openSheet(`<h2>Service Templates</h2>
    <p class="meta">${csTemplates
      ?'Templates define service order and decide which positions sync from ChurchSuite and which stay local.'
      :'Templates define reusable service order, OpenLP theme and local service items.'} Default assignment remains in Settings → Services; individual services can override their default from the service screen.</p>
    ${returnTo==='library'?`<div class="template-library-create-bar"><div><strong>Create a template</strong><span>Start from an existing service, or create a service first.</span></div><button type="button" class="primary" id="createServiceTemplateBtn">＋ Create template</button></div>`:''}
    <div class="template-manager-list">${rows.length?rows.map(t=>{
      const defaultFor=defaultNamesByTemplate.get(String(t.id))||[];
      return `<div class="template-manager-row">
        <div><strong>${esc(t.name)}</strong><small>${t.items?.length||0} positions · Theme: ${esc(t.theme||'Default')} · ${esc(t.serviceTypeName||'Any service')}${defaultFor.length?` · Default for ${esc(defaultFor.join(', '))}`:''}</small></div>
        <button class="secondary compact" data-template-edit="${esc(t.id)}">Edit</button>
        <button class="secondary compact" data-template-rename="${esc(t.id)}">Rename</button>
        <button class="danger compact" data-template-delete="${esc(t.id)}">Delete</button>
      </div>`;
    }).join(''):`<div class="template-empty-state"><strong>No templates have been saved.</strong><p>Create one from an existing service, or create and prepare a service first and then choose <strong>Save as template</strong>.</p>${returnTo==='library'?'<button type="button" class="primary" id="emptyCreateServiceTemplateBtn">Create template</button>':''}</div>`}</div>
    <div class="sheet-actions"><button class="primary" id="templateManagerDone">Done</button></div>`);
  const leaveTemplateManager=()=>returnTo==='settings'?openSettings():openLibraryHub();
  $('#templateManagerDone').onclick=leaveTemplateManager;
  setSheetCloseAction(leaveTemplateManager);
  if($('#createServiceTemplateBtn'))$('#createServiceTemplateBtn').onclick=openCreateServiceTemplateFromLibrary;
  if($('#emptyCreateServiceTemplateBtn'))$('#emptyCreateServiceTemplateBtn').onclick=openCreateServiceTemplateFromLibrary;
  body.querySelectorAll('[data-template-edit]').forEach(btn=>btn.onclick=async()=>{
    const t=serviceTemplateById(btn.dataset.templateEdit);
    if(!t){await appAlert('That template could not be found.');return;}
    try{
      openServiceTemplateEditor(t.id,returnTo);
    }catch(err){
      console.error('Could not open Service Template editor.',err);
      await appAlert(err?.message||String(err),{title:'Could not open template'});
      openServiceTemplateManager(returnTo);
    }
  });
  body.querySelectorAll('[data-template-rename]').forEach(btn=>btn.onclick=async()=>{
    const t=serviceTemplateById(btn.dataset.templateRename);if(!t)return;
    const name=await appPrompt('Template name',t.name,{title:'Rename template',confirmLabel:'Rename'});
    if(!name?.trim())return;
    t.name=name.trim();t.updatedAt=new Date().toISOString();
    persistPlanner();
    if(remoteAvailable)await apiFetch('/api/settings',{method:'PUT',body:JSON.stringify({settings:state.settings})});
    openServiceTemplateManager(returnTo);
  });
  body.querySelectorAll('[data-template-delete]').forEach(btn=>btn.onclick=async()=>{
    const t=serviceTemplateById(btn.dataset.templateDelete);if(!t)return;
    const ok=await appConfirm(`Delete template “${t.name}”? Existing services are not changed.`,{title:'Delete service template',confirmLabel:'Delete template',danger:true});
    if(!ok)return;
    state.settings.serviceTemplates=serviceTemplates().filter(x=>String(x.id)!==String(t.id));
    for(const [key,value] of Object.entries(state.settings.defaultTemplateByServiceType||{})){
      if(String(value)===String(t.id))delete state.settings.defaultTemplateByServiceType[key];
    }
    for(const [key,value] of Object.entries(state.settings.serviceTemplateOverrideByServiceId||{})){
      if(String(value)===String(t.id))delete state.settings.serviceTemplateOverrideByServiceId[key];
    }
    persistPlanner();
    if(remoteAvailable)await apiFetch('/api/settings',{method:'PUT',body:JSON.stringify({settings:state.settings})});
    openServiceTemplateManager(returnTo);
  });
}

function openServiceTemplateEditor(templateId,returnTo='library'){
  const original=serviceTemplateById(templateId);
  if(!original){openServiceTemplateManager(returnTo);return;}
  const draft=normalizeTemplateForEditor(original);
  let dirty=false;

  const renderEditor=()=>{
    const csTemplates=churchSuiteEnabled();
    openSheet(`<h2>Edit template · ${esc(draft.name)}</h2>
      <p class="meta">${csTemplates
        ?'Order here is the order used by <strong>Use a Template</strong>. Songs are separate ordered positions; non-song ChurchSuite items use their configured Type, while kept items remain local.'
        :'Set the reusable service order, Song positions, local items and OpenLP theme for this template.'}</p>
      <div class="field"><label>OpenLP theme</label><select id="templateEditorTheme">${plannerThemeNames().map(theme=>`<option value="${esc(theme)}" ${String(draft.theme||'Default')===String(theme)?'selected':''}>${esc(theme)}</option>`).join('')}</select><p class="meta">This theme is applied whenever this template is used to import or sync a service.</p></div>
      <div class="template-editor-list">${(draft.items||[]).length?(draft.items||[]).map((item,index)=>`
        <div class="template-editor-row" data-template-editor-index="${index}">
          <div class="template-editor-order">
            <button type="button" class="secondary compact" data-template-up="${index}" ${index===0?'disabled':''} aria-label="Move up">↑</button>
            <span>${index+1}</span>
            <button type="button" class="secondary compact" data-template-down="${index}" ${index===(draft.items||[]).length-1?'disabled':''} aria-label="Move down">↓</button>
          </div>
          <div class="template-editor-main">
            <input class="template-editor-title" data-template-title="${index}" value="${esc(item.title||item.churchSuiteType||item.type||'Service item')}">
            <small>${isTemplateSongSlot(item)
              ?(csTemplates?'Song position · fills from ChurchSuite in order':'Song position')
              :(csTemplates?esc(item.churchSuiteType||item.type||'item'):esc(item.type||'item'))}${item.templateLibraryFolderName?` · Folder: ${esc(item.templateLibraryFolderName)}`:''}${Array.isArray(item.media)&&item.media.length?` · ${item.media.length} stored attachment${item.media.length===1?'':'s'}`:''}</small>
          </div>
          ${isTemplateSongSlot(item)
            ?`<select data-template-mode="${index}" disabled><option selected>${csTemplates?'Song position · next ChurchSuite song':'Song position'}</option></select>`
            :(csTemplates?`<select data-template-mode="${index}">
              <option value="sync" ${templateItemKind(item)==='sync'?'selected':''}>Sync from ChurchSuite</option>
              <option value="keep" ${templateItemKind(item)==='keep'?'selected':''}>Keep in template</option>
            </select>`:`<select data-template-mode="${index}" disabled><option selected>Template item</option></select>`)}
          <button type="button" class="media-icon-action danger-quiet" data-template-remove="${index}" title="Remove position" aria-label="Remove position">×</button>
        </div>`).join(''):'<div class="template-empty-state"><strong>This template is empty.</strong><p>Add ChurchSuite sync slots or local Planner items below.</p></div>'}</div>
      <div class="template-editor-addbar">
        <span>Add another position to this template.</span>
        <button type="button" class="secondary" id="templateEditorAddItem">＋ Add item</button>
      </div>
      <div class="sheet-actions">
        <button class="secondary" id="templateEditorBack">Back</button>
        <button class="primary" id="templateEditorSave" ${dirty?'':'disabled'}>${dirty?'Save changes':'Saved'}</button>
      </div>`);

    const mark=()=>{dirty=true;const b=$('#templateEditorSave');if(b){b.disabled=false;b.textContent='Save changes';}};
    const addTemplateLocalItem=(type,title)=>{
      const item={
        id:`template-item-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        type,
        title,
        templateMode:'keep',
        templateProtected:true,
        retainOnChurchSuiteSync:true,
        projected:type!=='text',
        ready:type==='text',
        changed:'template',
        by:currentEditor()
      };
      if(type==='images'){item.autoplay='loop';item.interval=7;item.media=[];item.detail='No images yet';}
      if(type==='sermon-images'){item.autoplay='off';item.interval=0;item.media=[];item.sermonImages=true;item.imageCategory='sermon';item.detail='No sermon images yet';}
      if(type==='video'){item.autoStart=true;item.media=[];item.detail='No video yet';}
      if(type==='pdf'){item.media=[];item.detail='No PDF yet';}
      if(type==='bible'){item.passage='';item.bibleVersion='';item.bibleText='';item.detail='Bible passage';}
      if(type==='text'){item.notes='';item.detail='Run sheet only';}
      draft.items.push(item);
      dirty=true;
      renderEditor();
    };
    const openTemplateAddItem=()=>{
      openSheet(`<h2>Add template item</h2>
        <p class="meta">Add a ChurchSuite-controlled position or a local Planner item that stays in the template.</p>
        <div class="choice-grid">
          <button class="choice" type="button" data-template-add-song><strong>Song</strong><span>${csTemplates?'Add a Song position. ChurchSuite songs fill Song positions in order; an unassigned position remains visible.':'Add a reusable Song position to the template.'}</span></button>
          ${csTemplates?`<button class="choice" type="button" data-template-add-kind="sync"><strong>ChurchSuite item</strong><span>Add a non-song ChurchSuite Type such as Bible Reading, Notices or Sermon.</span></button>`:''}
          <button class="choice" type="button" data-template-add-local="sermon-images"><strong>Sermon Images</strong><span>Local sermon image item; kept in the template.</span></button>
          <button class="choice" type="button" data-template-add-local="images"><strong>Images / Notices</strong><span>Local image presentation; kept in the template.</span></button>
          <button class="choice" type="button" data-template-add-local="bible"><strong>Bible passage</strong><span>Local Bible item; kept in the template.</span></button>
          <button class="choice" type="button" data-template-add-local="video"><strong>Video</strong><span>Local video item; kept in the template.</span></button>
          <button class="choice" type="button" data-template-add-local="pdf"><strong>PDF</strong><span>Local PDF item; kept in the template.</span></button>
          <button class="choice" type="button" data-template-add-local="text"><strong>Text / plan item</strong><span>Local run-sheet-only item; kept in the template.</span></button>
        </div>
        <div class="sheet-actions"><button class="secondary" id="templateAddBack">Back</button></div>`);
      $('#templateAddBack').onclick=renderEditor;
      setSheetCloseAction(renderEditor);
      const addSong=body.querySelector('[data-template-add-song]');
      if(addSong)addSong.onclick=()=>{
        draft.items.push({
          templateMode:'sync',
          churchSuiteType:'Song',
          type:'song',
          title:'Song',
          sourcePosition:draft.items.length
        });
        dirty=true;
        renderEditor();
      };
      body.querySelectorAll('[data-template-add-local]').forEach(btn=>btn.onclick=()=>{
        const type=btn.dataset.templateAddLocal;
        const titles={images:'Images / Notices','sermon-images':'Sermon Images',bible:'Bible Reading',video:'Video',pdf:'PDF presentation',text:'Plan item'};
        addTemplateLocalItem(type,titles[type]||'Service item');
      });
      const sync=body.querySelector('[data-template-add-kind="sync"]');
      if(sync)sync.onclick=()=>{
        openSheet(`<h2>Add ChurchSuite item</h2>
          <div class="field"><label>ChurchSuite Type / position name</label><input id="templateSyncType" placeholder="e.g. Bible Reading, Notices, Sermon"></div>
          <div class="field"><label>Planner item type</label><select id="templateSyncPlannerType">
            <option value="bible">Bible passage</option>
            <option value="images">Images</option>
            <option value="sermon-images">Sermon Images</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="text">Text / plan item</option>
          </select></div>
          <div class="field"><label>Template label</label><input id="templateSyncTitle" placeholder="Optional; defaults to ChurchSuite Type"></div>
          <p class="meta">This is for non-song ChurchSuite Types. Add Songs using the separate <strong>Song</strong> item so their ordered placeholder behaviour remains predictable.</p>
          <div class="sheet-actions"><button class="secondary" id="templateSyncBack">Back</button><button class="primary" id="templateSyncAdd">Add slot</button></div>`);
        $('#templateSyncBack').onclick=openTemplateAddItem;
        setSheetCloseAction(openTemplateAddItem);
        $('#templateSyncAdd').onclick=()=>{
          const type=$('#templateSyncPlannerType').value;
          const csType=$('#templateSyncType').value.trim();
          if(!csType){appAlert('Enter the ChurchSuite Type or position name for this item.');return;}
          const title=$('#templateSyncTitle').value.trim()||csType;
          draft.items.push({
            templateMode:'sync',
            churchSuiteType:csType,
            type,
            title,
            sourcePosition:draft.items.length
          });
          dirty=true;
          renderEditor();
        };
      };
    };
    if($('#templateEditorTheme'))$('#templateEditorTheme').onchange=()=>{draft.theme=$('#templateEditorTheme').value||'Default';mark();};
    if($('#templateEditorAddItem'))$('#templateEditorAddItem').onclick=openTemplateAddItem;
    const leaveTemplateEditor=async()=>{
      if(dirty){
        const leave=await appConfirm('This template has unsaved changes.',{title:'Leave without saving?',confirmLabel:'Leave without saving',danger:true});
        if(!leave)return;
      }
      openServiceTemplateManager(returnTo);
    };
    $('#templateEditorBack').onclick=leaveTemplateEditor;
    setSheetCloseAction(leaveTemplateEditor);
    $('#templateEditorSave').onclick=async()=>{
      if(!dirty)return;
      const pos=state.settings.serviceTemplates.findIndex(t=>String(t.id)===String(templateId));
      if(pos<0)return;
      draft.updatedAt=new Date().toISOString();
      state.settings.serviceTemplates[pos]=structuredClone(draft);
      persistPlanner();
      if(remoteAvailable)await apiFetch('/api/settings',{method:'PUT',body:JSON.stringify({settings:state.settings})});
      dirty=false;
      renderEditor();
    };
    body.querySelectorAll('[data-template-title]').forEach(input=>input.oninput=()=>{
      const i=Number(input.dataset.templateTitle);
      if(!draft.items[i])return;
      draft.items[i].title=input.value;
      mark();
    });
    body.querySelectorAll('[data-template-mode]:not([disabled])').forEach(select=>select.onchange=()=>{
      const i=Number(select.dataset.templateMode);
      if(!draft.items[i])return;
      draft.items[i].templateMode=select.value;
      if(select.value==='keep'){draft.items[i].templateProtected=true;draft.items[i].retainOnChurchSuiteSync=true;}
      else {draft.items[i].templateProtected=false;}
      mark();
    });
    body.querySelectorAll('[data-template-up]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.templateUp);if(i<=0)return;
      [draft.items[i-1],draft.items[i]]=[draft.items[i],draft.items[i-1]];dirty=true;renderEditor();
    });
    body.querySelectorAll('[data-template-down]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.templateDown);if(i>=draft.items.length-1)return;
      [draft.items[i+1],draft.items[i]]=[draft.items[i],draft.items[i+1]];dirty=true;renderEditor();
    });
    body.querySelectorAll('[data-template-remove]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.templateRemove);draft.items.splice(i,1);dirty=true;renderEditor();
    });
  };
  renderEditor();
}

function openServiceTemplateOverride(service=currentService()){
  if(!service)return;
  const configuredDefault=configuredDefaultTemplateIdForService(service);
  const overrides=state.settings.serviceTemplateOverrideByServiceId||{};
  const serviceId=String(service.id);
  const hasOverride=Object.prototype.hasOwnProperty.call(overrides,serviceId);
  const currentRaw=hasOverride?String(overrides[serviceId]||''):configuredDefault;
  const current=currentRaw==='__none__'?'':currentRaw;

  openSheet(`<h2>Template for ${esc(service.title)}</h2>
    <p class="meta">This changes only this service. The default for ${esc(service.serviceTypeName||'its service type')} remains unchanged in Settings.</p>
    <div class="template-service-choice">
      <label class="template-service-choice-row">
        <input type="radio" name="serviceTemplateChoice" value="__default__" ${!hasOverride?'checked':''}>
        <span><strong>Use service-type default</strong><small>${configuredDefault?esc(serviceTemplateById(configuredDefault)?.name||'Configured template'):'No default template configured'}</small></span>
      </label>
      ${serviceTemplates().map(t=>`<label class="template-service-choice-row">
        <input type="radio" name="serviceTemplateChoice" value="${esc(t.id)}" ${hasOverride&&current===String(t.id)?'checked':''}>
        <span><strong>${esc(t.name)}</strong><small>${esc(t.serviceTypeName||'Any service')} · ${t.items?.length||0} positions</small></span>
      </label>`).join('')}
      <label class="template-service-choice-row">
        <input type="radio" name="serviceTemplateChoice" value="__none__" ${hasOverride&&currentRaw==='__none__'?'checked':''}>
        <span><strong>No template for this service</strong><small>${churchSuiteEnabled()?'ChurchSuite import choices remain available, but no template is preselected.':'This service will not use a saved template.'}</small></span>
      </label>
    </div>
    <div class="sheet-actions"><button class="secondary" id="cancelServiceTemplateChoice">Cancel</button><button class="primary" id="saveServiceTemplateChoice">Use selection</button></div>`);

  const cancelServiceTemplateChoice=()=>closeSheetSafely();
  $('#cancelServiceTemplateChoice').onclick=cancelServiceTemplateChoice;
  setSheetCloseAction(cancelServiceTemplateChoice);
  $('#saveServiceTemplateChoice').onclick=async()=>{
    const value=body.querySelector('input[name="serviceTemplateChoice"]:checked')?.value||'__default__';
    if(value==='__default__')delete state.settings.serviceTemplateOverrideByServiceId[serviceId];
    else state.settings.serviceTemplateOverrideByServiceId[serviceId]=value;
    persistPlanner();
    if(remoteAvailable)await apiFetch('/api/settings',{method:'PUT',body:JSON.stringify({settings:state.settings})});
    sheet.close();render();
  };
}


let churchSuiteFlowSequence=0;
let churchSuiteActiveOperation=null;

function beginChurchSuiteOperation(label='Working…'){
  // A new foreground operation supersedes anything stale from an earlier
  // Back/forward path. Individual screens still guard against double-clicks.
  if(churchSuiteActiveOperation)churchSuiteActiveOperation.cancelled=true;
  const operation={id:++churchSuiteFlowSequence,label,cancelled:false};
  churchSuiteActiveOperation=operation;
  return operation;
}
function churchSuiteOperationCurrent(operation){
  return !!operation && !operation.cancelled && churchSuiteActiveOperation===operation;
}
function finishChurchSuiteOperation(operation){
  if(churchSuiteActiveOperation===operation)churchSuiteActiveOperation=null;
}
function cancelChurchSuiteOperation(operation=null){
  const target=operation||churchSuiteActiveOperation;
  if(target)target.cancelled=true;
  if(churchSuiteActiveOperation===target)churchSuiteActiveOperation=null;
}

function openChurchSuiteImportModeChoice({title='ChurchSuite import',onConfirm,onBack=null,useServiceDefaults=false}){
  if(!churchSuiteEnabled()){
    if(onBack)onBack(); else closeSheetSafely();
    return;
  }
  openSheet(`<h2>${esc(title)}</h2>
    <p class="meta">Choose what to import from ChurchSuite for this operation.</p>
    <div class="choice-grid cs-import-mode-grid">
      ${serviceTemplates().length?`<button class="choice" type="button" data-cs-import-mode="template"><strong>Use a Template</strong><span>Use a saved service pattern; ChurchSuite-controlled slots sync while template items stay local.</span></button>`:''}
      <button class="choice" type="button" data-cs-import-mode="songs"><strong>Songs only</strong><span>Import only ChurchSuite song positions.</span></button>
      <button class="choice" type="button" data-cs-import-mode="all"><strong>All configured Types</strong><span>Import songs plus every configured ChurchSuite Type.</span></button>
      <button class="choice" type="button" data-cs-import-mode="select"><strong>Select Types</strong><span>Choose which ChurchSuite Types to use for this import.</span></button>
    </div>
    <div class="sheet-actions"><button class="secondary" id="backCsImportMode">Back</button></div>`);
  let advancing=false;
  let transitionToken=0;
  const leaveModeChoice=()=>{
    transitionToken++;
    advancing=false;
    cancelChurchSuiteOperation();
    onBack?onBack():sheet.close();
  };
  $('#backCsImportMode').textContent='Back';
  $('#backCsImportMode').onclick=leaveModeChoice;
  setSheetCloseAction(leaveModeChoice);

  body.querySelectorAll('[data-cs-import-mode]').forEach(btn=>btn.onclick=()=>{
    if(advancing)return;
    advancing=true;
    const token=++transitionToken;
    body.querySelectorAll('[data-cs-import-mode]').forEach(other=>{
      other.classList.toggle('selected',other===btn);
      other.disabled=true;
    });
    const strong=btn.querySelector('strong');
    if(strong)strong.textContent=`✓ ${strong.textContent.replace(/^✓\s*/,'')}`;
    btn.classList.add('choice-working');

    // Keep an escape route visible while advancing. Back/× invalidates the
    // pending transition so its callback cannot open another import screen.
    $('#backCsImportMode').disabled=false;
    $('#backCsImportMode').textContent='Cancel';

    const advance=()=>{
      if(token!==transitionToken)return;
      if(btn.dataset.csImportMode==='template'){
        if(useServiceDefaults)onConfirm('template','');
        else openTemplateChooser({
          onBack:()=>openChurchSuiteImportModeChoice({title,onConfirm,onBack,useServiceDefaults}),
          onChoose:template=>onConfirm('template',template.id)
        });
      }else onConfirm(btn.dataset.csImportMode);
    };
    setTimeout(advance,40);
  });
}

function openChurchSuiteTypeSelection({scan,url='',existingServiceId=null,scanOptions={},onConfirm,onBack=null}){
  const types=[...new Set((scan?.items||[])
    .filter(item=>item.kind!=='song' && item.typeName)
    .map(item=>item.typeName))];

  if(!types.length){
    onConfirm([]);
    return;
  }

  const configured=new Set((state.settings.churchSuiteTypes||[]).map(x=>x.name));
  const initial=new Set(
    Array.isArray(scanOptions.selectedTypes)
      ? scanOptions.selectedTypes
      : types.filter(t=>configured.has(t))
  );

  openSheet(`<h2>Select ChurchSuite Types</h2>
    <p class="meta">Choose which ChurchSuite Types to import this time. Songs are handled separately and are always available.</p>
    <div class="cs-type-pick-list">
      ${types.map((type,index)=>`
        <label class="cs-type-pick">
          <input type="checkbox" data-cs-pick="${index}" ${initial.has(type)?'checked':''}>
          <span>${esc(type)}</span>
          <small>${configured.has(type)?'Configured':'Not configured in Settings'}</small>
        </label>`).join('')}
    </div>
    <p class="meta">If a Type is missing or not configured, update <strong>Settings → Extensions → ChurchSuite service-plan types</strong> and scan again.</p>
    <div class="sheet-actions">
      <button class="secondary" id="cancelCsTypePick">Back</button>
      <button class="primary" id="confirmCsTypePick">Continue</button>
    </div>`);

  let typePickAdvancing=false;
  const leaveCsTypePick=()=>{
    if(typePickAdvancing)return;
    cancelChurchSuiteOperation();
    onBack?onBack():openChurchSuiteServiceScan(url,existingServiceId,scanOptions);
  };
  $('#cancelCsTypePick').onclick=leaveCsTypePick;
  setSheetCloseAction(leaveCsTypePick);
  $('#confirmCsTypePick').onclick=()=>{
    if(typePickAdvancing)return;
    typePickAdvancing=true;
    const selected=types.filter((type,index)=>$(`[data-cs-pick="${index}"]`)?.checked);
    body.querySelectorAll('button,input').forEach(el=>el.disabled=true);
    $('#confirmCsTypePick').textContent='Continuing…';
    setTimeout(()=>onConfirm(selected),20);
  };
}

function openChurchSuiteServiceScan(url,existingServiceId=null,scanOptions={}){
  if(!churchSuiteEnabled()){
    closeSheetSafely();
    return;
  }
  const existing=existingServiceId
    ? state.services.find(s=>String(s.id)===String(existingServiceId))
    : null;

  const planId=scanOptions.planId||existing?.churchSuitePlanId||null;
  const importMode=scanOptions.importMode||existing?.churchSuiteImportMode||state.settings.churchSuiteDefaultImportMode||'all';

  openSheet(`<h2>Scan ChurchSuite plan</h2>
    <div class="cs-scan-source">
      <strong>${planId?`ChurchSuite plan #${esc(String(planId))}`:'ChurchSuite service plan'}</strong>
      ${url?`<a href="${esc(url)}" target="_blank" rel="noopener">Open plan ↗</a>`:''}
    </div>

    <div class="warning-card">
      <strong>Preview before inserting</strong>
      <p>The planner will read the plan from ChurchSuite Core API v2, then show its title, date and mapped items. Nothing changes until you confirm.</p>
    </div>

    <div class="scan-theme-note">
      <small>OpenLP theme</small>
      <strong>${esc(scanOptions.theme||existing?.theme||'Default')}</strong>
    </div>
    <div class="scan-theme-note">
      <small>ChurchSuite import</small>
      <strong>${esc(importModeLabel(importMode,scanOptions.templateId||''))}</strong>
    </div>

    <p class="meta">The OpenLP theme remains independent of ChurchSuite. Existing service details and locally-added items are not removed silently.</p>

    <div class="sheet-actions">
      <button class="secondary" id="backFromChurchSuiteScan">Back</button>
      <button class="primary" id="startChurchSuiteScan">Scan plan</button>
    </div>`);

  const leaveChurchSuiteScan=()=>{
    cancelChurchSuiteOperation();
    closeSheetSafely();
    if(existing)openServicesPage();
    else openAddServiceFromServicesPage();
  };
  $('#backFromChurchSuiteScan').onclick=leaveChurchSuiteScan;
  setSheetCloseAction(leaveChurchSuiteScan);

  $('#startChurchSuiteScan').onclick=async()=>{
    const btn=$('#startChurchSuiteScan');
    btn.disabled=true;
    btn.textContent='Scanning…';

    try{
      const result=await scanChurchSuitePlan(url,planId);
      if(!result?.plan)throw new Error(result?.error||'ChurchSuite did not return a service plan.');
      const nextOptions={...scanOptions,planId:result.plan.id,importMode};
      if(importMode==='template'&&!nextOptions.templateId){
        const preferred=defaultTemplateIdForService(existing)||defaultTemplateIdForPlanTitle(result.plan.title);
        openTemplateChooser({preferredId:preferred,onBack:()=>openChurchSuiteServiceScan(url,existingServiceId,scanOptions),onChoose:template=>openChurchSuiteScanPreview(url,existingServiceId,{...nextOptions,templateId:template.id},result.plan)});
      }else if(importMode==='select'){
        openChurchSuiteTypeSelection({
          scan:result.plan,
          url,
          existingServiceId,
          scanOptions:nextOptions,
          onConfirm:selectedTypes=>{
            openChurchSuiteScanPreview(url,existingServiceId,{...nextOptions,selectedTypes},result.plan);
          }
        });
      }else{
        openChurchSuiteScanPreview(url,existingServiceId,nextOptions,result.plan);
      }
    }catch(err){
      openSheet(`<h2>ChurchSuite scan failed</h2>
        <div class="warning-card"><strong>The plan could not be scanned.</strong><p>${esc(err?.message||String(err))}</p></div>
        <p class="meta">Check the ChurchSuite connection in Settings and confirm the API user has Planning access.</p>
        <div class="sheet-actions"><button class="secondary" id="scanFailureBack">Back</button><button class="primary" id="scanFailureDone">Done</button></div>`);
      $('#scanFailureBack').onclick=()=>openChurchSuiteServiceScan(url,existingServiceId,scanOptions);
      const leaveScanFailure=()=>closeSheetSafely();
      $('#scanFailureDone').onclick=leaveScanFailure;
      setSheetCloseAction(leaveScanFailure);
    }
  };
}
function openChurchSuiteScanPreview(url,existingServiceId=null,scanOptions={},scan,diagnostics=null){
  const existing=existingServiceId
    ? state.services.find(s=>String(s.id)===String(existingServiceId))
    : null;

  const preview={
    title:String(scan?.title||'ChurchSuite service').trim()||'ChurchSuite service',
    dateISO:String(scan?.dateISO||'').trim(),
    dateText:String(scan?.dateText||'').trim(),
    modifiedAt:String(scan?.modifiedAt||'').trim(),
    planId:Number(scan?.id||scanOptions.planId||0)||null,
    identifier:String(scan?.identifier||'').trim(),
    items:Array.isArray(scan?.items)?scan.items:[]
  };

  const importMode=scanOptions.importMode||existing?.churchSuiteImportMode||state.settings.churchSuiteDefaultImportMode||'all';
  const mappedResult=mapChurchSuiteScanItems(preview.items,importMode==='template'?'all':importMode,scanOptions.selectedTypes||null);
  const destructive=[];

  if(existing){
    if(preview.title && preview.title!==existing.title){
      destructive.push(`Service title: “${existing.title}” → “${preview.title}”`);
    }
    if(preview.dateISO && preview.dateISO!==existing.dateISO){
      destructive.push(`Service date: ${existing.dateISO||'none'} → ${preview.dateISO}`);
    }

    const existingImported=(existing.items||[]).filter(i=>i.churchSuiteSourceId);
    if(existingImported.length){
      destructive.push(`${existingImported.length} previously imported ChurchSuite item${existingImported.length===1?'':'s'} will be replaced by the new scan`);
    }
  }

  const scanWarnings=[];
  if(!preview.dateISO){
    scanWarnings.push('No service date was found.');
  }
  if(!preview.items.length){
    scanWarnings.push('No ChurchSuite plan items were found.');
  }
  if(mappedResult.unmappedTypes.length){
    scanWarnings.push(`${mappedResult.unmappedTypes.length} ChurchSuite Type${mappedResult.unmappedTypes.length===1?' is':'s are'} not configured.`);
  }
  if(mappedResult.missingSongs.length){
    scanWarnings.push(`${mappedResult.missingSongs.length} song${mappedResult.missingSongs.length===1?' is':'s are'} not in the song library.`);
  }

  openSheet(`<h2>Confirm ChurchSuite insert</h2>
    <div class="cs-scan-source">
      <strong>${esc(preview.title)}</strong>
      <a href="${esc(url)}" target="_blank" rel="noopener">Open plan ↗</a>
    </div>

    <div class="scan-preview-grid">
      <div><small>Title</small><strong>${esc(preview.title)}</strong></div>
      <div><small>Date</small><strong>${esc(preview.dateISO||preview.dateText||'Not found')}</strong></div>
      <div><small>Plan items</small><strong>${preview.items.length}</strong></div>
      <div><small>Items to insert</small><strong>${mappedResult.mapped.length}</strong></div>
      <div><small>OpenLP theme</small><strong>${esc(scanOptions.theme||existing?.theme||'Default')}</strong></div>
      <div><small>ChurchSuite import</small><strong>${esc(importModeLabel(importMode,scanOptions.templateId||''))}</strong></div>
      ${importMode==='select'?`<div><small>Types selected</small><strong>${esc((scanOptions.selectedTypes||[]).join(', ')||'None')}</strong></div>`:''}
    </div>

    <div class="cs-scan-items">
      ${churchSuiteScanItemPreview(preview.items)}
    </div>

    ${scanWarnings.length?`
      <div class="warning-card">
        <strong>Check the scan before inserting</strong>
        <ul>${scanWarnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
        ${diagnostics?`
          <p class="meta"><strong>ChurchSuite selector diagnostics:</strong><br>
          ${Object.entries(diagnostics.selectors||{})
            .map(([selector,count])=>`${esc(selector)} = ${Number(count)}`)
            .join('<br>') || 'No selector diagnostics returned.'}</p>
        `:''}
      </div>
    `:''}

    ${importMode!=='songs'&&mappedResult.unmappedTypes.length?`
      <div class="warning-card churchsuite-types-note">
        <strong>Some ChurchSuite Types are not configured</strong>
        <p>Missing Types: ${mappedResult.unmappedTypes.map(esc).join(', ')}.</p>
        <p>If expected service items are missing from this scan, update <strong>Settings → Extensions → ChurchSuite service-plan types</strong>, then scan the plan again.</p>
      </div>
    `:importMode==='songs'
      ?`<p class="meta">Songs-only mode intentionally ignores other ChurchSuite service details. Add images, video, PDFs and other presentation material manually in the planner.</p>`
      :`<p class="meta">If the scan is missing expected service items, check <strong>Settings → Extensions → ChurchSuite service-plan types</strong> and scan again.</p>`
    }

    ${mappedResult.missingSongs.length?`
      <div class="warning-card">
        <strong>Songs missing from the OpenLP song library</strong>
        <p>${mappedResult.missingSongs.map(esc).join(', ')}</p>
        <p>These songs will be inserted as incomplete Song items so they can be added to the song library before export.</p>
      </div>
    `:''}

    ${destructive.length
      ?`<p class="meta">Review the scanned plan above. The exact local changes and confirmation are pinned below.</p>`
      :`<p class="meta">This will create a new service from the scanned ChurchSuite plan. The OpenLP theme remains independent of ChurchSuite.</p>`
    }

    <div class="sheet-actions">
      <div class="churchsuite-confirm-footer ${destructive.length?'has-changes':''}">
        ${destructive.length?`
          <div class="churchsuite-confirm-summary">
            <strong>What will change</strong>
            <ul>${destructive.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
          </div>
          <label class="churchsuite-confirm-check">
            <input type="checkbox" id="confirmChurchSuiteReplace">
            <span>I understand these ChurchSuite-imported service details/items will be replaced.</span>
          </label>
        `:''}
        <div class="churchsuite-confirm-actions">
          <button class="secondary" id="backToChurchSuiteScan">Back</button>
          <button class="primary" id="insertChurchSuitePlan"
            ${destructive.length||!preview.dateISO||!preview.items.length?'disabled':''}>
            ${existing?'Update service':'Insert service'}
          </button>
        </div>
      </div>
    </div>`);

  const leaveChurchSuiteScanPreview=()=>openChurchSuiteServiceScan(url,existingServiceId,scanOptions);
  $('#backToChurchSuiteScan').onclick=leaveChurchSuiteScanPreview;
  setSheetCloseAction(leaveChurchSuiteScanPreview);

  if($('#confirmChurchSuiteReplace')){
    $('#confirmChurchSuiteReplace').onchange=()=>{
      $('#insertChurchSuitePlan').disabled=
        !$('#confirmChurchSuiteReplace').checked || !preview.dateISO || !preview.items.length;
    };
  }

  $('#insertChurchSuitePlan').onclick=async()=>{
    if(!preview.dateISO){
      appAlert('A service date is required before this ChurchSuite plan can be inserted.');
      return;
    }

    const dateDisplay=formatServiceDate(preview.dateISO);
    const now=new Date().toISOString();
    let selectedTheme=scanOptions.theme||existing?.theme||'Default';
    const serviceTargetId=existing?.id||`service-${preview.dateISO}-${Date.now()}`;
    if(importMode==='template'){
      const template=serviceTemplateById(scanOptions.templateId);
      if(!template){await appAlert('The selected template could not be found.');return;}
      selectedTheme=template.theme||selectedTheme||'Default';
      mappedResult.mapped=await applyTemplateToMappedItems(template,mappedResult.mapped,serviceTargetId,existing?.items||[]);
    }

    if(existing){
      const previousImported=(existing.items||[]).filter(i=>i.churchSuiteSourceId);
      const activeTemplate=importMode==='template'?serviceTemplateById(scanOptions.templateId):null;
      const templateManagedIds=activeTemplate?templateManagedLocalIds(activeTemplate,existing.items||[]):new Set();
      const preservedLocal=(existing.items||[]).filter(i=>
        !i.churchSuiteSourceId &&
        !(importMode==='template'&&(i.templateProtected||templateManagedIds.has(String(i.id))))
      );
      const incomingSourceIds=new Set(mappedResult.mapped.map(i=>String(i.churchSuiteSourceId||'')));
      const preservedNotSynced=importMode==='template'?[]:previousImported
        .filter(i=>!incomingSourceIds.has(String(i.churchSuiteSourceId||'')))
        .map(i=>({...i,churchSuiteExcludedFromLastSync:true}));

      mappedResult.mapped=mappedResult.mapped.map(nextItem=>{
        const previous=previousImported.find(old=>String(old.churchSuiteSourceId)===String(nextItem.churchSuiteSourceId));
        if(!previous)return nextItem;
        nextItem.id=previous.id;
        delete nextItem.churchSuiteExcludedFromLastSync;
        preserveLocalAttachments(previous,nextItem);

        // An explicitly retained Planner item wins over the incoming ChurchSuite copy.
        // Keep the source identity so the item still occupies its ChurchSuite slot.
        if(previous.retainOnChurchSuiteSync){
          return {...structuredClone(previous),churchSuiteSourceId:nextItem.churchSuiteSourceId,churchSuiteType:nextItem.churchSuiteType,churchSuiteExcludedFromLastSync:false};
        }

        // Keep locally-added presentation assets and deliberate local completion choices
        // when the same ChurchSuite item is refreshed.
        if(nextItem.type==='images'){
          if(Array.isArray(previous.media)&&previous.media.length){
            nextItem.media=previous.media;
            nextItem.ready=true;
            nextItem.projected=previous.projected!==false;
            nextItem.ignoreImages=!!previous.ignoreImages;
            nextItem.autoplay=previous.autoplay||nextItem.autoplay;
            nextItem.interval=previous.interval||nextItem.interval;
            nextItem.detail=previous.ignoreImages
              ?'No attachments'
              :`${previous.media.length} image${previous.media.length===1?'':'s'}${previous.autoplay==='loop'?' · autoplay loop':''}`;
          }else if(previous.ignoreImages){
            nextItem.ignoreImages=true;
            nextItem.projected=false;
            nextItem.ready=true;
            nextItem.detail='No images required';
          }
        }

        if(nextItem.type==='bible'&&previous.ignoreBible){
          nextItem.ignoreBible=true;
          nextItem.projected=false;
          nextItem.ready=true;
          nextItem.detail='Bible projection not required';
        }

        if(nextItem.type==='song'&&(previous.songId||previous.serviceSong)){
          nextItem.songId=previous.songId;
          nextItem.title=previous.title;
          nextItem.ready=true;
          nextItem.projected=true;
          nextItem.verse=previous.verse||nextItem.verse||'';
          nextItem.musicNote=previous.musicNote||nextItem.musicNote||'';
          nextItem.detail=previous.churchSuiteWritePending
            ?'Available locally · ChurchSuite update pending'
            :(previous.detail||nextItem.detail);
          nextItem.churchSuiteWritePending=!!previous.churchSuiteWritePending;
        }

        return nextItem;
      });

      existing.title=preview.title;
      existing.dateISO=preview.dateISO;
      existing.date=dateDisplay;
      existing.theme=selectedTheme;
      existing.churchSuitePlanId=preview.planId;
      existing.churchSuitePlanIdentifier=preview.identifier;
      existing.churchSuitePlanUrl=churchSuitePublicPlanUrl(scan,url)||existing.churchSuitePlanUrl||'';
      existing.churchSuiteLastUpdated=preview.modifiedAt||now;
      existing.churchSuiteLastSynced=now;
      existing.churchSuiteImportMode=importMode;
      existing.serviceTemplateId=importMode==='template'?(scanOptions.templateId||existing.serviceTemplateId||null):existing.serviceTemplateId||null;
      clearChurchSuiteOutOfSync(existing);
      existing.churchSuiteSelectedTypes=importMode==='select'?(scanOptions.selectedTypes||[]):[];
      existing.items=[...mappedResult.mapped,...preservedLocal,...preservedNotSynced];
      existing.lastEditedAt=now;
      existing.lastEditedBy=currentEditor();
      existing.lastEditedAction='synced ChurchSuite plan';

      state.activeServiceId=existing.id;
      persistPlanner();

      dedupeChurchSuiteItems(existing);
      if(remoteAvailable){
        await createRemoteService(existing);
        appendAudit('synced ChurchSuite plan',`${preview.items.length} plan items scanned`);
      }

      sheet.close();
      closeServicesPage();
      render();
      return;
    }

    const id=serviceTargetId;
    const service={
      id,
      title:preview.title,
      dateISO:preview.dateISO,
      date:dateDisplay,
      kind:'regular',
      theme:selectedTheme,
      published:false,
      items:mappedResult.mapped,
      activity:[[currentEditor(),'imported ChurchSuite service plan','just now']],
      lastEditedAt:now,
      lastEditedBy:currentEditor(),
      lastEditedAction:'imported ChurchSuite service plan',
      churchSuitePlanId:preview.planId,
      churchSuitePlanIdentifier:preview.identifier,
      churchSuitePlanUrl:churchSuitePublicPlanUrl(scan,url)||'',
      churchSuiteLastUpdated:preview.modifiedAt||now,
      churchSuiteLastSynced:now,
      churchSuiteImportMode:importMode,
      serviceTemplateId:importMode==='template'?(scanOptions.templateId||null):null,
      churchSuiteOutOfSync:false,
      churchSuiteOutOfSyncReason:'',
      churchSuiteSelectedTypes:importMode==='select'?(scanOptions.selectedTypes||[]):[]
    };

    state.services.push(service);
    state.activeServiceId=id;
    persistPlanner();

    if(remoteAvailable){
      await createRemoteService(service);
      appendAudit('imported ChurchSuite plan',`${preview.items.length} plan items scanned`);
    }

    sheet.close();
    closeServicesPage();
    render();
  };
}
async function openChurchSuiteAutoSyncPreview(daysBack=0){
  if(!churchSuiteEnabled()){
    closeSheetSafely();
    return;
  }
  const requestedDaysBack=Math.max(0,Math.min(30,Number(daysBack)||0));

  openSheet(`<h2>ChurchSuite service plans</h2>
    <div class="cs-sync-window">
      <div>
        <strong>Services to show</strong>
        <p class="meta">Today is always included, even after the service has started or finished.</p>
      </div>
      <div class="cs-sync-window-controls">
        <select id="churchSuitePastWindow">
          <option value="0" ${requestedDaysBack===0?'selected':''}>Today + future</option>
          <option value="1" ${requestedDaysBack===1?'selected':''}>Yesterday + future</option>
          <option value="7" ${requestedDaysBack===7?'selected':''}>Last 7 days + future</option>
          <option value="30" ${requestedDaysBack===30?'selected':''}>Last 30 days + future</option>
        </select>
        <button class="secondary compact" id="reloadChurchSuiteWindow">Reload</button>
      </div>
    </div>
    <p class="meta" id="churchSuitePlanLoadNote">Loading published ChurchSuite plans…</p>
    <div id="churchSuitePlansList"></div>
    <div class="sheet-actions">
      <button class="secondary" id="closeCsSyncPreview">Done</button>
      <button class="primary" id="processSelectedCsPlans" disabled>Import/Sync</button>
    </div>`);

  const leaveCsSyncPreview=()=>{cancelChurchSuiteOperation();closeSheetSafely();};
  $('#closeCsSyncPreview').onclick=leaveCsSyncPreview;
  setSheetCloseAction(leaveCsSyncPreview);
  $('#reloadChurchSuiteWindow').onclick=()=>{
    const value=Number($('#churchSuitePastWindow').value||0);
    openChurchSuiteAutoSyncPreview(value);
  };

  // ChurchSuite's `starts_after` behaves as an exclusive boundary. Request
  // one extra day before our desired first date, then filter locally. This
  // guarantees that a plan dated today is included even if its clock time has
  // already passed.
  const today=new Date();
  today.setHours(12,0,0,0);

  const desiredStart=new Date(today);
  desiredStart.setDate(desiredStart.getDate()-requestedDaysBack);
  const desiredStartISO=desiredStart.toISOString().slice(0,10);

  const queryStart=new Date(desiredStart);
  queryStart.setDate(queryStart.getDate()-1);
  const queryStartISO=queryStart.toISOString().slice(0,10);

  const beforeDate=new Date(today);
  beforeDate.setDate(beforeDate.getDate()+120);
  const beforeISO=beforeDate.toISOString().slice(0,10);

  const note=$('#churchSuitePlanLoadNote');
  if(note){
    note.textContent=requestedDaysBack
      ?`Showing published plans from ${formatServiceDate(desiredStartISO)} through the next 120 days.`
      :'Showing published plans from today through the next 120 days.';
  }

  try{
    const result=await apiFetch(`/api/churchsuite/plans?starts_after=${encodeURIComponent(queryStartISO)}&starts_before=${encodeURIComponent(beforeISO)}`);
    const plans=(result.plans||[])
      .filter(plan=>String(plan.dateISO||'')>=desiredStartISO && String(plan.dateISO||'')<=beforeISO)
      .sort((a,b)=>`${a.dateISO} ${a.time||''}`.localeCompare(`${b.dateISO} ${b.time||''}`));

    const list=$('#churchSuitePlansList');

    if(!plans.length){
      list.innerHTML=`<div class="warning-card"><strong>No published plans found.</strong><p>No ChurchSuite plans were returned ${requestedDaysBack?`from ${esc(formatServiceDate(desiredStartISO))}`:'from today'} through the next 120 days.</p></div>`;
      return;
    }

    const selectionGroups=[...new Map(plans.map(plan=>{
      const group=churchSuitePlanSelectionGroup(plan.title);
      return [group.key,{...group,count:plans.filter(p=>churchSuitePlanSelectionGroup(p.title).key===group.key).length}];
    })).values()]
      .filter(group=>group.count>1)
      .sort((a,b)=>a.label.localeCompare(b.label));

    list.innerHTML=`<div class="cs-auto-toolbar">
        <label><input type="checkbox" id="selectAllCsPlans"> Select all services</label>
        <span id="churchSuiteSelectionCount">0 selected · ${plans.length} published</span>
      </div>
      ${selectionGroups.length?`<div class="cs-service-subset-toolbar"><span>Select by service</span><div>${selectionGroups.map(group=>`<button type="button" class="secondary compact" data-select-cs-group="${esc(group.key)}">${esc(group.label)} <small>${group.count}</small></button>`).join('')}<button type="button" class="secondary compact" id="clearCsPlanSelection">Clear</button></div></div>`:''}
      <div class="cs-auto-plan-list">${plans.map(plan=>{
        const existing=state.services.find(s=>Number(s.churchSuitePlanId)===Number(plan.id)||String(s.churchSuitePlanIdentifier||'')===String(plan.identifier||''));
        const isPast=String(plan.dateISO||'')<today.toISOString().slice(0,10);
        const isToday=String(plan.dateISO||'')===today.toISOString().slice(0,10);
        return `<label class="cs-auto-plan-row selectable ${existing?'already-added':''} ${isPast?'past-plan':''} ${isToday?'today-plan':''}">
          <input type="checkbox" data-cs-plan-select="${plan.id}" data-cs-plan-group="${esc(churchSuitePlanSelectionGroup(plan.title).key)}">
          <div>
            <strong>${esc(plan.title)}</strong>
            <small>${esc(plan.dateISO)}${plan.time?` · ${esc(plan.time)}`:''}${isToday?' · Today':isPast?' · Past':''}</small>
          </div>
          <span class="services-state">${existing?'Already added · will sync':'New · will add'}</span>
        </label>`;
      }).join('')}</div>`;

    const updateBatchButton=()=>{
      const all=[...list.querySelectorAll('[data-cs-plan-select]')];
      const chosen=all.filter(cb=>cb.checked).length;
      $('#processSelectedCsPlans').disabled=!chosen;
      $('#processSelectedCsPlans').textContent='Import/Sync';
      if($('#churchSuiteSelectionCount'))$('#churchSuiteSelectionCount').textContent=`${chosen} selected · ${plans.length} published`;
      if($('#selectAllCsPlans')){
        $('#selectAllCsPlans').checked=chosen===all.length&&all.length>0;
        $('#selectAllCsPlans').indeterminate=chosen>0&&chosen<all.length;
      }
    };

    $('#selectAllCsPlans').onchange=()=>{
      const checked=$('#selectAllCsPlans').checked;
      list.querySelectorAll('[data-cs-plan-select]').forEach(cb=>cb.checked=checked);
      updateBatchButton();
    };
    list.querySelectorAll('[data-select-cs-group]').forEach(btn=>btn.onclick=()=>{
      const group=String(btn.dataset.selectCsGroup||'');
      // A service subset selection replaces the current selection. This makes
      // “Morning Church” or “NightChurch” genuinely useful as one-click filters.
      list.querySelectorAll('[data-cs-plan-select]').forEach(cb=>cb.checked=String(cb.dataset.csPlanGroup||'')===group);
      updateBatchButton();
    });
    if($('#clearCsPlanSelection'))$('#clearCsPlanSelection').onclick=()=>{
      list.querySelectorAll('[data-cs-plan-select]').forEach(cb=>cb.checked=false);
      updateBatchButton();
    };
    list.querySelectorAll('[data-cs-plan-select]').forEach(cb=>cb.onchange=updateBatchButton);
    updateBatchButton();

    let selectionAdvancing=false;
    $('#processSelectedCsPlans').onclick=async()=>{
      if(selectionAdvancing)return;
      selectionAdvancing=true;
      const ids=[...list.querySelectorAll('[data-cs-plan-select]:checked')].map(cb=>Number(cb.dataset.csPlanSelect));
      const selectedPlans=plans.filter(p=>ids.includes(Number(p.id)));
      if(!selectedPlans.length){selectionAdvancing=false;return;}
      body.querySelectorAll('#churchSuitePlansList button,#churchSuitePlansList input,#churchSuitePastWindow,#reloadChurchSuiteWindow').forEach(el=>el.disabled=true);
      $('#processSelectedCsPlans').disabled=true;
      $('#processSelectedCsPlans').textContent='Continue…';

      openChurchSuiteImportModeChoice({
        title:`Import / sync ${selectedPlans.length} service${selectedPlans.length===1?'':'s'}`,
        useServiceDefaults:true,
        onBack:()=>openChurchSuiteAutoSyncPreview(requestedDaysBack),
        onConfirm:async(importMode,templateId='')=>{
          if(importMode==='template'){
            openChurchSuiteBatchTemplateConfirmation(selectedPlans,{
              syncDaysBack:requestedDaysBack,
              onBack:()=>openChurchSuiteAutoSyncPreview(requestedDaysBack)
            });
            return;
          }
          const operation=beginChurchSuiteOperation('Scanning ChurchSuite services…');
          if(!operation)return;
          const scanned=[];
          openSheet(`<h2>Preparing ChurchSuite services</h2>
            <div class="churchsuite-working-panel"><span class="thinking-spinner" aria-hidden="true"></span><strong id="churchSuiteWorkingText">Scanning selected services…</strong><p class="meta" id="churchSuiteWorkingProgress">0 of ${selectedPlans.length}</p></div>
            <div class="sheet-actions"><button class="secondary" id="cancelChurchSuiteScan">Cancel</button></div>`);
          $('#cancelChurchSuiteScan').onclick=()=>{
            cancelChurchSuiteOperation(operation);
            openChurchSuiteAutoSyncPreview(requestedDaysBack);
          };
          try{
            for(let index=0;index<selectedPlans.length;index++){
              if(!churchSuiteOperationCurrent(operation))return;
              const plan=selectedPlans[index];
              if($('#churchSuiteWorkingText'))$('#churchSuiteWorkingText').textContent=`Scanning ${plan.title}…`;
              if($('#churchSuiteWorkingProgress'))$('#churchSuiteWorkingProgress').textContent=`${index} of ${selectedPlans.length}`;
              const result=await scanChurchSuitePlan('',plan.id);
              if(!churchSuiteOperationCurrent(operation))return;
              if(result?.plan)scanned.push(result.plan);
              if($('#churchSuiteWorkingProgress'))$('#churchSuiteWorkingProgress').textContent=`${index+1} of ${selectedPlans.length}`;
            }
          }catch(err){
            if(!churchSuiteOperationCurrent(operation))return;
            finishChurchSuiteOperation(operation);
            appAlert(err?.message||String(err));
            openChurchSuiteAutoSyncPreview(requestedDaysBack);
            return;
          }
          if(!churchSuiteOperationCurrent(operation))return;
          finishChurchSuiteOperation(operation);
          const continueBatch=selectedTypes=>openChurchSuiteBatchPreview(scanned,{importMode,selectedTypes,syncDaysBack:requestedDaysBack,templateId});
          if(importMode==='select'){
            const unionScan={items:scanned.flatMap(plan=>plan.items||[])};
            openChurchSuiteTypeSelection({
              scan:unionScan,
              scanOptions:{importMode},
              onBack:()=>openChurchSuiteAutoSyncPreview(requestedDaysBack),
              onConfirm:selectedTypes=>continueBatch(selectedTypes)
            });
          }else continueBatch(null);
        }
      });
    };
  }catch(err){
    $('#churchSuitePlansList').innerHTML=`<div class="warning-card"><strong>ChurchSuite could not be loaded.</strong><p>${esc(err?.message||String(err))}</p></div>`;
  }
}



function churchSuiteTemplateSelectionKeys(plan){
  const keys=[];
  if(plan?.id!==undefined&&plan?.id!==null&&String(plan.id).trim())keys.push(`id:${String(plan.id).trim()}`);
  if(String(plan?.identifier||'').trim())keys.push(`identifier:${String(plan.identifier).trim()}`);
  const title=String(plan?.title||'').trim().toLowerCase().replace(/\s+/g,' ');
  const date=String(plan?.dateISO||'').trim();
  if(title||date)keys.push(`title-date:${date}|${title}`);
  return keys;
}
function templateSelectionForPlan(selections,plan){
  for(const key of churchSuiteTemplateSelectionKeys(plan)){
    const value=String(selections?.[key]||'').trim();
    if(value)return value;
  }
  // Backward compatibility with v1.76.14's plan-id-only map.
  const legacy=String(selections?.[String(plan?.id||'')]||'').trim();
  return legacy;
}
function setTemplateSelectionForPlan(selections,plan,templateId){
  const value=String(templateId||'').trim();
  for(const key of churchSuiteTemplateSelectionKeys(plan))selections[key]=value;
  if(plan?.id!==undefined&&plan?.id!==null)selections[String(plan.id)]=value;
}

function openChurchSuiteBatchTemplateConfirmation(plans,{syncDaysBack=0,onBack=null,plansAreScanned=false,templateSelections={}}={}){
  const templates=serviceTemplates();
  const rows=plans.map(plan=>{
    const existing=state.services.find(s=>Number(s.churchSuitePlanId)===Number(plan.id)||String(s.churchSuitePlanIdentifier||'')===String(plan.identifier||''));
    const mapped=churchSuiteMappedServiceType(plan.title);
    const resolvedServiceType=churchSuiteTemplateServiceType(plan.title,existing);
    const serviceTypeId=resolvedServiceType?.id||existing?.serviceTypeId||mapped.serviceTypeId||null;
    const serviceTypeName=resolvedServiceType?.name||existing?.serviceTypeName||mapped.serviceTypeName||plan.title;
    const configuredDefault=serviceTypeId?String(state.settings.defaultTemplateByServiceType?.[String(serviceTypeId)]||''):'';
    const carried=templateSelectionForPlan(templateSelections,plan);
    const effective=carried||(existing?defaultTemplateIdForService(existing):(configuredDefault||''));
    return {plan,existing,serviceTypeId,serviceTypeName,configuredDefault,selectedTemplateId:effective};
  });

  const render=()=>{
    openSheet(`<h2>Confirm templates</h2>
      <p class="meta">Review the template for each selected ChurchSuite service before anything is scanned or imported. Changing a row affects only this import unless you also choose <strong>Make default</strong>.</p>
      <div class="cs-batch-template-list">${rows.map((row,index)=>`
        <div class="cs-batch-template-row">
          <div><strong>${esc(row.plan.title)}</strong><small>${esc(row.plan.dateISO||'')} · ${esc(row.serviceTypeName||'Service')}</small></div>
          <select data-batch-template-select="${index}">
            <option value="">Choose template…</option>
            ${templates.map(t=>`<option value="${esc(t.id)}" ${String(row.selectedTemplateId)===String(t.id)?'selected':''}>${esc(t.name)}${String(row.configuredDefault)===String(t.id)?' · default':''}</option>`).join('')}
          </select>
          ${row.serviceTypeId?`<label class="template-default-inline ${row.selectedTemplateId?'':'is-disabled'}">
            <input type="checkbox" data-batch-template-default="${index}" ${row.selectedTemplateId?'':'disabled'}>
            <span data-batch-template-default-label="${index}">${
              row.configuredDefault
                ?`Make selected template the new default for ${esc(row.serviceTypeName)}`
                :`Make selected template the default for ${esc(row.serviceTypeName)}`
            }</span>
          </label>`:'<span class="meta">This plan is not matched to a recurring service type, so it cannot have a service-type default.</span>'}
        </div>`).join('')}</div>
      <div class="sheet-actions"><button class="secondary" id="batchTemplateBack">Back</button><button class="primary" id="batchTemplateContinue">Continue</button></div>`);

    const leave=()=>{
      cancelChurchSuiteOperation();
      onBack?onBack():openChurchSuiteAutoSyncPreview(syncDaysBack);
    };
    $('#batchTemplateBack').onclick=leave;
    setSheetCloseAction(leave);
    body.querySelectorAll('[data-batch-template-select]').forEach(select=>select.onchange=()=>{
      const index=Number(select.dataset.batchTemplateSelect);
      const row=rows[index];
      row.selectedTemplateId=select.value;
      setTemplateSelectionForPlan(templateSelections,row.plan,select.value);
      const box=body.querySelector(`[data-batch-template-default="${index}"]`);
      const label=body.querySelector(`[data-batch-template-default-label="${index}"]`);
      if(box){
        box.disabled=!select.value;
        if(!select.value)box.checked=false;
        box.closest('.template-default-inline')?.classList.toggle('is-disabled',!select.value);
      }
      if(label){
        label.textContent=row.configuredDefault
          ?`Make selected template the new default for ${row.serviceTypeName}`
          :`Make selected template the default for ${row.serviceTypeName}`;
      }
    });
    $('#batchTemplateContinue').onclick=async()=>{
      const missing=rows.filter(row=>!row.selectedTemplateId);
      if(missing.length){await appAlert(`Choose a template for: ${missing.map(r=>r.plan.title).join(', ')}.`);return;}
      const btn=$('#batchTemplateContinue');btn.disabled=true;btn.textContent='Saving choices…';
      let defaultsChanged=false;
      body.querySelectorAll('[data-batch-template-default]').forEach(box=>{
        if(!box.checked)return;
        const row=rows[Number(box.dataset.batchTemplateDefault)];
        if(row?.serviceTypeId&&row.selectedTemplateId){
          state.settings.defaultTemplateByServiceType[String(row.serviceTypeId)]=row.selectedTemplateId;
          row.configuredDefault=row.selectedTemplateId;
          defaultsChanged=true;
        }
      });
      if(defaultsChanged){
        persistPlanner();
        if(remoteAvailable)await apiFetch('/api/settings',{method:'PUT',body:JSON.stringify({settings:state.settings})});
      }
      for(const row of rows)setTemplateSelectionForPlan(templateSelections,row.plan,row.selectedTemplateId);

      if(plansAreScanned){
        cancelChurchSuiteOperation();
        openChurchSuiteBatchPreview(plans,{importMode:'template',syncDaysBack,templateSelections});
        return;
      }

      const operation=beginChurchSuiteOperation('Scanning ChurchSuite services…');
      const scanned=[];
      openSheet(`<h2>Preparing ChurchSuite services</h2>
        <div class="churchsuite-working-panel"><span class="thinking-spinner" aria-hidden="true"></span><strong id="churchSuiteWorkingText">Scanning selected services…</strong><p class="meta" id="churchSuiteWorkingProgress">0 of ${plans.length}</p></div>
        <div class="sheet-actions"><button class="secondary" id="cancelConfirmedTemplateScan">Cancel</button></div>`);
      const cancelScan=()=>{
        cancelChurchSuiteOperation(operation);
        openChurchSuiteBatchTemplateConfirmation(plans,{syncDaysBack,onBack,plansAreScanned:false,templateSelections});
      };
      $('#cancelConfirmedTemplateScan').onclick=cancelScan;
      setSheetCloseAction(cancelScan);
      try{
        for(let index=0;index<plans.length;index++){
          if(!churchSuiteOperationCurrent(operation))return;
          const plan=plans[index];
          if($('#churchSuiteWorkingText'))$('#churchSuiteWorkingText').textContent=`Scanning ${plan.title}…`;
          if($('#churchSuiteWorkingProgress'))$('#churchSuiteWorkingProgress').textContent=`${index} of ${plans.length}`;
          const result=await scanChurchSuitePlan('',plan.id);
          if(!churchSuiteOperationCurrent(operation))return;
          if(result?.plan){
            // Carry the user's confirmed template choice onto every stable key
            // exposed by the detailed scan result.
            const chosen=templateSelectionForPlan(templateSelections,plan);
            if(chosen)setTemplateSelectionForPlan(templateSelections,result.plan,chosen);
            scanned.push(result.plan);
          }
          if($('#churchSuiteWorkingProgress'))$('#churchSuiteWorkingProgress').textContent=`${index+1} of ${plans.length}`;
        }
      }catch(err){
        if(churchSuiteOperationCurrent(operation)){
          finishChurchSuiteOperation(operation);
          await appAlert(err?.message||String(err));
          openChurchSuiteBatchTemplateConfirmation(plans,{syncDaysBack,onBack,plansAreScanned:false,templateSelections});
        }
        return;
      }
      if(!churchSuiteOperationCurrent(operation))return;
      finishChurchSuiteOperation(operation);
      openChurchSuiteBatchPreview(scanned,{importMode:'template',syncDaysBack,templateSelections});
    };
  };
  render();
}

function openChurchSuiteBatchPreview(plans,{importMode='all',selectedTypes=null,syncDaysBack=0,templateId='',templateSelections={}}={}){
  const rows=plans.map(plan=>{
    const existing=state.services.find(s=>Number(s.churchSuitePlanId)===Number(plan.id)||String(s.churchSuitePlanIdentifier||'')===String(plan.identifier||''));
    const resolvedTemplateId=importMode==='template'?(templateSelectionForPlan(templateSelections,plan)||templateId||defaultTemplateIdForService(existing)||defaultTemplateIdForPlanTitle(plan.title)):'';
    const template=resolvedTemplateId?serviceTemplateById(resolvedTemplateId):null;
    const mapped=mapChurchSuiteScanItems(plan.items||[],importMode==='template'?'all':importMode,selectedTypes);
    return {plan,existing,mapped,template,resolvedTemplateId};
  });

  if(importMode==='template'){
    const missing=rows.filter(r=>!r.template);
    if(missing.length){
      // Do not dead-end on a missing default. Return to the explicit template
      // chooser with the scanned plan data and keep any choices already made.
      cancelChurchSuiteOperation();
      openChurchSuiteBatchTemplateConfirmation(plans,{
        syncDaysBack,
        plansAreScanned:true,
        templateSelections,
        onBack:()=>openChurchSuiteAutoSyncPreview(syncDaysBack)
      });
      return;
    }
  }

  openSheet(`<h2>Confirm ChurchSuite import / sync</h2>
    <p class="meta">${rows.length} service${rows.length===1?'':'s'} selected. ${
      importMode==='template'?'Using the confirmed template for each service':importMode==='songs'?'Songs only':importMode==='select'?`Selected Types: ${esc((selectedTypes||[]).join(', ')||'none')}`:'All configured Types'
    }.</p>
    <div class="cs-batch-preview">${rows.map(({plan,existing,mapped,template})=>`
      <div class="cs-batch-row">
        <div><strong>${esc(plan.title)}</strong><small>${esc(plan.dateISO)} · ${plan.items?.length||0} ChurchSuite items · ${mapped.mapped.length} to import${importMode==='template'&&template?` · Theme: ${esc(template.theme||'Default')}`:''}</small></div>
        <span>${existing?'Sync existing':'Add new'}</span>
      </div>`).join('')}</div>
    <p class="meta">Review the selected services above. The change summary and required confirmation stay pinned below.</p>
    <div class="sheet-actions">
      <div class="churchsuite-confirm-footer has-changes">
        <div class="churchsuite-confirm-summary">
          <strong>What will change</strong>
          <p>Existing ChurchSuite-imported items will be replaced for services being synced. Locally-added items are preserved.</p>
          <ul>
            ${rows.map(({plan,existing,mapped})=>`<li><strong>${esc(plan.title)}</strong> — ${existing?'sync existing service':'add new service'}; ${mapped.mapped.length} item${mapped.mapped.length===1?'':'s'} to import.</li>`).join('')}
          </ul>
        </div>
        <label class="churchsuite-confirm-check">
          <input type="checkbox" id="confirmCsBatch">
          <span>I understand and want to process these services.</span>
        </label>
        <div class="churchsuite-confirm-actions">
          <button class="secondary" id="backCsBatch">Back</button>
          <button class="primary" id="runCsBatch" disabled>Import/Sync</button>
        </div>
      </div>
    </div>`);

  const leaveCsBatch=()=>{cancelChurchSuiteOperation();openChurchSuiteAutoSyncPreview(syncDaysBack);};
  $('#backCsBatch').onclick=leaveCsBatch;
  setSheetCloseAction(leaveCsBatch);
  $('#confirmCsBatch').onchange=()=>$('#runCsBatch').disabled=!$('#confirmCsBatch').checked;
  let batchStarted=false;
  $('#runCsBatch').onclick=async()=>{
    if(batchStarted)return;
    batchStarted=true;
    const operation=beginChurchSuiteOperation('Importing ChurchSuite services…');
    if(!operation){batchStarted=false;return;}
    const button=$('#runCsBatch');
    body.querySelectorAll('#sheetFooter button,#sheetFooter input').forEach(el=>el.disabled=true);
    button.disabled=true;button.textContent='Processing…';
    const cancel=document.createElement('button');
    cancel.type='button';
    cancel.className='secondary';
    cancel.id='cancelCsBatchImport';
    cancel.textContent='Cancel';
    $('#sheetFooter').appendChild(cancel);
    cancel.disabled=false;
    cancel.onclick=()=>{
      cancel.disabled=true;
      cancel.textContent='Cancelling…';
      cancelChurchSuiteOperation(operation);
    };
    setSheetCloseAction(()=>{
      if(!cancel.disabled)cancel.click();
    });
    for(let rowIndex=0;rowIndex<rows.length;rowIndex++){
      if(!churchSuiteOperationCurrent(operation))break;
      const {plan,existing,mapped,template,resolvedTemplateId}=rows[rowIndex];
      button.textContent=`Processing ${rowIndex+1} of ${rows.length}…`;
      const now=new Date().toISOString();
      const dateDisplay=formatServiceDate(plan.dateISO);
      const targetServiceId=existing?.id||`service-${plan.dateISO}-${Date.now()}-${plan.id}`;
      if(importMode==='template'&&template)mapped.mapped=await applyTemplateToMappedItems(template,mapped.mapped,targetServiceId,existing?.items||[]);
      if(existing){
        const previousImported=(existing.items||[]).filter(i=>i.churchSuiteSourceId);
        const templateManagedIds=importMode==='template'&&template?templateManagedLocalIds(template,existing.items||[]):new Set();
        const preservedLocal=(existing.items||[]).filter(i=>
          !i.churchSuiteSourceId &&
          !(importMode==='template'&&(i.templateProtected||templateManagedIds.has(String(i.id))))
        );
        const incomingSourceIds=new Set(mapped.mapped.map(i=>String(i.churchSuiteSourceId||'')));
        const preservedNotSynced=importMode==='template'?[]:previousImported
          .filter(i=>!incomingSourceIds.has(String(i.churchSuiteSourceId||'')))
          .map(i=>({...i,churchSuiteExcludedFromLastSync:true}));

        mapped.mapped=mapped.mapped.map(nextItem=>{
          const previous=previousImported.find(old=>String(old.churchSuiteSourceId)===String(nextItem.churchSuiteSourceId));
          if(!previous)return nextItem;
          nextItem.id=previous.id;
          preserveLocalAttachments(previous,nextItem);

          if(previous.retainOnChurchSuiteSync){
            return {...structuredClone(previous),churchSuiteSourceId:nextItem.churchSuiteSourceId,churchSuiteType:nextItem.churchSuiteType,churchSuiteExcludedFromLastSync:false};
          }

          if(nextItem.type==='images'){
            if(Array.isArray(previous.media)&&previous.media.length){
              nextItem.media=previous.media;
              nextItem.ready=true;
              nextItem.projected=previous.projected!==false;
              nextItem.ignoreImages=!!previous.ignoreImages;
              nextItem.autoplay=previous.autoplay||nextItem.autoplay;
              nextItem.interval=previous.interval||nextItem.interval;
              nextItem.detail=previous.ignoreImages
                ?'No attachments'
                :`${previous.media.length} image${previous.media.length===1?'':'s'}${previous.autoplay==='loop'?' · autoplay loop':''}`;
            }else if(previous.ignoreImages){
              nextItem.ignoreImages=true;
              nextItem.projected=false;
              nextItem.ready=true;
              nextItem.detail='No images required';
            }
          }

          if(nextItem.type==='bible'&&previous.ignoreBible){
            nextItem.ignoreBible=true;
            nextItem.projected=false;
            nextItem.ready=true;
            nextItem.detail='Bible projection not required';
          }

          if(nextItem.type==='song'&&(previous.songId||previous.serviceSong)){
            nextItem.songId=previous.songId||null;
            nextItem.serviceSong=previous.serviceSong?structuredClone(previous.serviceSong):null;
            nextItem.title=previous.title;
            nextItem.ready=true;
            nextItem.projected=true;
            nextItem.verse=previous.verse||nextItem.verse||'';
            nextItem.musicNote=previous.musicNote||nextItem.musicNote||'';
            nextItem.detail=previous.serviceSong
              ?'Local copy updated · service only'
              :(previous.churchSuiteWritePending
                ?'Local copy updated · saved to library'
                :(previous.detail||nextItem.detail));
            nextItem.churchSuiteWritePending=!!previous.churchSuiteWritePending;
          }
          return nextItem;
        });

        existing.title=plan.title;
        existing.dateISO=plan.dateISO;
        existing.date=dateDisplay;
        existing.churchSuitePlanId=plan.id;
        existing.churchSuitePlanIdentifier=plan.identifier;
        existing.churchSuitePlanUrl=churchSuitePublicPlanUrl(plan,'')||existing.churchSuitePlanUrl||'';
        existing.churchSuiteLastUpdated=plan.modifiedAt||now;
        existing.churchSuiteLastSynced=now;
        const mappedService=churchSuiteMappedServiceType(plan.title);
        existing.kind=mappedService.kind;
        existing.serviceTypeId=mappedService.serviceTypeId;
        existing.serviceTypeName=mappedService.serviceTypeName;
        // Template-driven sync owns the OpenLP theme. Other sync modes preserve
        // the service's individual theme.
        if(importMode==='template'&&template?.theme)existing.theme=template.theme;
        existing.churchSuiteImportMode=importMode;
        existing.serviceTemplateId=importMode==='template'?resolvedTemplateId:(existing.serviceTemplateId||null);
        clearChurchSuiteOutOfSync(existing);
        existing.churchSuiteSelectedTypes=importMode==='select'?(selectedTypes||[]):[];
        existing.items=[...mapped.mapped,...preservedLocal,...preservedNotSynced];
        existing.lastEditedAt=now;
        existing.lastEditedBy=currentEditor();
        existing.lastEditedAction='synced ChurchSuite plan';
        dedupeChurchSuiteItems(existing);
        await createRemoteService(existing);
      }else{
        const service={
          id:targetServiceId,
          title:plan.title,dateISO:plan.dateISO,date:dateDisplay,
          kind:churchSuiteMappedServiceType(plan.title).kind,
          serviceTypeId:churchSuiteMappedServiceType(plan.title).serviceTypeId,
          serviceTypeName:churchSuiteMappedServiceType(plan.title).serviceTypeName,
          theme:(importMode==='template'&&template?.theme)?template.theme:(churchSuiteMappedServiceType(plan.title).defaultTheme||'Default'),published:false,
          items:mapped.mapped,activity:[[currentEditor(),'imported ChurchSuite service plan','just now']],
          lastEditedAt:now,lastEditedBy:currentEditor(),lastEditedAction:'imported ChurchSuite service plan',
          churchSuitePlanId:plan.id,churchSuitePlanIdentifier:plan.identifier,
          churchSuitePlanUrl:churchSuitePublicPlanUrl(plan,''),churchSuiteLastUpdated:plan.modifiedAt||now,churchSuiteLastSynced:now,
          churchSuiteImportMode:importMode,
          serviceTemplateId:importMode==='template'?resolvedTemplateId:null,
          churchSuiteOutOfSync:false,
          churchSuiteOutOfSyncReason:'',
          churchSuiteSelectedTypes:importMode==='select'?(selectedTypes||[]):[]
        };
        state.services.push(service);
        await createRemoteService(service);
      }
    }
    if(!churchSuiteOperationCurrent(operation)){
      finishChurchSuiteOperation(operation);
      persistPlanner();
      sheet.close();
      renderServicesPage();
      await appAlert('ChurchSuite import was cancelled. Services already completed before cancellation were kept; remaining services were not processed.',{title:'Import cancelled'});
      return;
    }
    finishChurchSuiteOperation(operation);
    persistPlanner();
    sheet.close();
    renderServicesPage();
  };
}
function openServiceSwitcher(){
  openServicesPage();
}

function openNewService(){
  const types=regularServiceTypes();
  const themes=['Default','KSSS (am) white','KSSS (am)',...(state.settings.customThemes||[])];

  openSheet(`<h2>New service or event</h2>
    <div class="field"><label>Date</label><input type="date" id="newServiceDate"></div>

    <div class="field">
      <label>Service type</label>
      <select id="newServicePreset">
        ${types.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}
        <option value="__oneoff__">One-off service</option>
      </select>
    </div>

    <div class="field" id="customServiceNameField" hidden>
      <label>One-off service name</label>
      <input id="newServiceName" placeholder="e.g. Christmas Day">
    </div>

    <div class="new-service-usual-day meta" id="newServiceUsualDay"></div>

    <div class="field"><label>Start from</label>
      <select id="newServiceSource">
        <option value="">Blank service</option>
        ${currentService()?.id?`<option value="${esc(currentService().id)}">Copy current service structure</option>`:''}
      </select>
    </div>

    <div class="field">
      <label>OpenLP theme</label>
      <select id="newServiceTheme">
        ${themes.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}
      </select>
      <p class="meta">The service type's default is selected automatically, but can be changed for this individual service.</p>
    </div>

    <div class="sheet-actions">
      <button class="secondary" id="cancelNewService">Cancel</button>
      <button class="primary" id="createService">Create</button>
    </div>`);

  const preset=$('#newServicePreset');
  const customField=$('#customServiceNameField');
  const customInput=$('#newServiceName');
  const theme=$('#newServiceTheme');
  const usual=$('#newServiceUsualDay');
  const weekdayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const syncPreset=()=>{
    const oneoff=preset.value==='__oneoff__';
    customField.hidden=!oneoff;
    if(oneoff){
      usual.textContent='One-off services can be created on any date.';
      theme.value='Default';
      if(!customField.hidden)setTimeout(()=>customInput.focus(),0);
      return;
    }
    const type=types.find(t=>String(t.id)===String(preset.value));
    usual.textContent=type?`Usual day: ${weekdayNames[Number(type.weekday)||0]}`:'';
    if(type&&[...theme.options].some(o=>o.value===type.defaultTheme))theme.value=type.defaultTheme;
  };
  preset.onchange=syncPreset;
  syncPreset();

  $('#cancelNewService').onclick=openServiceSwitcher;

  $('#createService').onclick=()=>{
    const dateISO=$('#newServiceDate').value;
    if(!dateISO){appAlert('Choose a date.');return;}

    const oneoff=preset.value==='__oneoff__';
    const selectedType=oneoff?null:types.find(t=>String(t.id)===String(preset.value));
    let title=oneoff?customInput.value.trim():String(selectedType?.name||'Regular service');
    if(!title){appAlert('Give the service or event a name.');return;}

    const sourceId=$('#newServiceSource').value;
    const source=state.services.find(s=>s.id===sourceId);
    const id=`svc-${dateISO}-${Date.now()}`;
    const items=source ? source.items.map((x,i)=>({
      ...structuredClone(x),
      id:Date.now()+i,
      ready:x.projected ? (x.type==='song') : true,
      detail:(x.type==='images'||x.type==='sermon-images')?'Waiting for slides':x.type==='video'?'Waiting for video':x.detail,
      changed:'just now',
      by:currentEditor()
    })) : [];

    const service={
      id,
      title,
      dateISO,
      date:formatServiceDate(dateISO),
      theme:theme.value||selectedType?.defaultTheme||'Default',
      published:false,
      kind:oneoff?'event':'regular',
      serviceTypeId:oneoff?null:selectedType?.id||null,
      serviceTypeName:oneoff?'One-off services':selectedType?.name||title,
      items,
      activity:[[currentEditor(),`created ${title}`,'just now']],
      lastEditedAt:new Date().toISOString(),
      lastEditedBy:currentEditor(),
      lastEditedAction:'created service'
    };

    state.services.push(service);
    state.activeServiceId=id;
    persistPlanner();
    createRemoteService(service);
    sheet.close();
    render();
  };
}

function openSqliteImportWarning(file){
  openSheet(`<h2>Import OpenLP song database</h2>
    <div class="warning-card">
      <strong>This can change the shared song library.</strong>
      <p>Importing <strong>${esc(file.name)}</strong> will update or replace song data used by future service plans. Existing service plans will not be deleted, but song titles, lyrics, verse orders and metadata may change in the shared library.</p>
    </div>
    <div class="warning-list">
      <div>• Use a copy of the OpenLP database, not the live database file.</div>
      <div>• Confirm this is the database you intend to make the shared source.</div>
      <div>• Export/backup the current planner library first if you may need to restore it.</div>
    </div>
    <label class="confirm-line"><input type="checkbox" id="sqliteConfirm"> I understand this will update the shared song library.</label>
    <div class="sheet-actions">
      <button class="secondary" id="cancelSqliteImport">Cancel</button>
      <button class="danger" id="confirmSqliteImport" disabled>Import database</button>
    </div>`);

  $('#sqliteConfirm').onchange=()=>$('#confirmSqliteImport').disabled=!$('#sqliteConfirm').checked;
  $('#cancelSqliteImport').onclick=openSettings;
  $('#confirmSqliteImport').onclick=()=>{
    state.settings.libraryFileName=file.name;
    state.settings.libraryImportedAt='just now';
    state.settings.lastLibraryImportWarningAccepted=true;
    persistPlanner();
    openSheet(`<h2>Database selected</h2>
      <p><strong>${esc(file.name)}</strong> is ready to import.</p>
      <p class="meta">This front-end prototype records the confirmed choice only. The production Cloudflare version will parse the SQLite file and show an import summary before committing changes.</p>
      <div class="sheet-actions"><button class="primary" id="sqliteImportDone">Back to settings</button></div>`);
    $('#sqliteImportDone').onclick=openSettings;
  };
}


const CHURCHSUITE_TYPE_IMPORT_OPTIONS=[
  ['ignore','Ignore'],
  ['text','Text'],
  ['bible','Bible'],
  ['sermon','Sermon'],
  ['images','Images'],
  ['video','Video'],
  ['pdf','PDF']
];

const DEFAULT_CHURCHSUITE_TYPES=[
  {name:'Scripture Reading',importAs:'bible'},
  {name:'Announcements',importAs:'text'},
  {name:'Transition',importAs:'text'},
  {name:'Welcome',importAs:'text'}
];

function churchSuiteTypeRows(types){
  return (types||[]).map((row,index)=>`
    <div class="churchsuite-type-row" data-cs-type-row="${index}">
      <input class="cs-type-name" data-cs-type-name="${index}" value="${esc(row.name||'')}" placeholder="ChurchSuite Type name">
      <select class="cs-type-map" data-cs-type-map="${index}">
        ${CHURCHSUITE_TYPE_IMPORT_OPTIONS.map(([value,label])=>`<option value="${value}" ${row.importAs===value?'selected':''}>${label}</option>`).join('')}
      </select>
      <button type="button" class="item-delete cs-type-delete" data-cs-type-delete="${index}" title="Remove type" aria-label="Remove type">
        <svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/></svg>
      </button>
    </div>`).join('');
}

function openProfile(){
  const name=authenticatedUser?.displayName||currentEditor();
  const email=authenticatedUser?.email||'Local development';
  const level=Number(authenticatedUser?.accessLevel||0);
  const levelName=level===3?'Administrator':level===2?'Planner':'ChurchSuite Service list';
  const method=authenticatedUser?.authMethod==='local'?'OpenLP Planner User':
    authenticatedUser?.authMethod==='microsoft'?`@${microsoftAllowedDomain} SSO`:
    authenticatedUser?.authMethod==='churchsuite'?'My ChurchSuite SSO':
    'Local development';
  openSheet(`<h2>Profile</h2><div class="profile-card">
    <div class="profile-avatar">${esc((name||'Me').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'ME')}</div>
    <div class="profile-info"><h2>${esc(name)}</h2><p>${esc(email)}</p><span>${esc(method)} · ${esc(levelName)}</span></div>
  </div><div class="sheet-actions"><button class="secondary" id="profileDone">Done</button>
  <button class="secondary" id="profileLogout">Sign out</button>${level>=3?'<button class="primary" id="profileSettings">Settings</button>':''}</div>`);
  $('#profileDone').onclick=()=>sheet.close();
  $('#profileLogout').onclick=async()=>{
    const button=$('#profileLogout');button.disabled=true;button.textContent='Signing out…';
    try{await fetch('/auth/logout',{method:'POST',credentials:'same-origin',headers:{accept:'text/html'}})}catch(_){}
    try{[STORAGE_KEY,SONGS_KEY,LAST_SCREEN_KEY,editorNameKey,FLOAT_ADD_KEY].forEach(key=>localStorage.removeItem(key))}catch(_){}
    location.replace('/login');
  };
  if($('#profileSettings'))$('#profileSettings').onclick=openSettings;
}

async function openPlannerUserManagement(){
  openSheet(`<h2>Users & access</h2><p class="meta">Loading users…</p>`);
  try{
    const data=await apiFetch('/api/admin/users'),users=data.users||[],serviceListAvailable=!!data.churchSuiteServiceListAvailable;
    const domain=String(data.microsoftAllowedDomain||microsoftAllowedDomain);
    const microsoftEnabled=!!data.microsoftConfigured&&data.microsoftSsoSignInEnabled!==false;
    const autoEnroll=data.microsoftAutoEnrollDomainUsers!==false;
    const myChurchSuiteEnabled=!!data.myChurchSuiteSignInEnabled&&!!data.myChurchSuiteConfigured;
    openSheet(`<h2>Users & access</h2><p class="meta">${microsoftEnabled?(autoEnroll?`Valid @${esc(domain)} Microsoft users may create their lowest-level account on first sign-in.`:`New Microsoft users from @${esc(domain)} must already be present in this user list before first sign-in.`):'Microsoft SSO is currently disabled for this installation.'} ${myChurchSuiteEnabled?'My ChurchSuite members may also create an account on first sign-in; they always start at ChurchSuite Service list access.':'My ChurchSuite SSO is currently disabled for this installation.'} OpenLP Service Planner email/password accounts are administrator-created.</p>
      <button class="secondary full" id="addLocalPlannerUser">＋ OpenLP Service Planner user</button>
      <div class="planner-user-list">${users.map(u=>`<div class="planner-user-row" data-user-row="${esc(u.email)}">
        <button class="planner-user-main" data-manage-user="${esc(u.email)}"><span><strong>${esc(u.displayName||u.email)}</strong><small>${esc(u.email)}</small></span>
        <span class="user-access-chip level-${u.accessLevel}">${u.accessLevel===3?'Administrator':u.accessLevel===2?'Planner':'ChurchSuite Service list'}${u.disabled?' · Disabled':''}</span></button>
        <div class="user-sso-toggles" aria-label="Login methods">
          ${u.localPasswordEnabled?'<span>Planner password</span>':''}
          ${u.microsoftSsoEnabled?`<span>@${esc(domain)} SSO</span>`:''}
          ${u.myChurchSuiteSsoEnabled?'<span>My ChurchSuite SSO</span>':''}
          ${!u.localPasswordEnabled&&!u.microsoftSsoEnabled&&!u.myChurchSuiteSsoEnabled?'<span>No login method</span>':''}
        </div>
      </div>`).join('')}</div><div class="sheet-actions"><button class="primary" id="plannerUsersDone">Done</button></div>`);
    $('#plannerUsersDone').onclick=openSettings;$('#addLocalPlannerUser').onclick=()=>openAddLocalPlannerUser(serviceListAvailable);
    body.querySelectorAll('[data-manage-user]').forEach(btn=>btn.onclick=()=>openManagePlannerUser(users.find(u=>u.email===btn.dataset.manageUser),serviceListAvailable,{microsoftEnabled,myChurchSuiteEnabled,microsoftAutoEnroll:autoEnroll}));
  }catch(err){appAlert(err.message||String(err));openSettings()}
}
function accessLevelOptions(selected,serviceListAvailable=true){
  const rows=[];
  if(serviceListAvailable || Number(selected)===1){
    rows.push(`<option value="1" ${Number(selected)===1?'selected':''} ${!serviceListAvailable?'disabled':''}>ChurchSuite Service list${!serviceListAvailable?' (currently unavailable)':''}</option>`);
  }
  rows.push(`<option value="2" ${Number(selected)===2?'selected':''}>Planner</option>`);
  rows.push(`<option value="3" ${Number(selected)===3?'selected':''}>Administrator</option>`);
  return rows.join('');
}
function openAddLocalPlannerUser(serviceListAvailable=true){
  openSheet(`<h2>Add OpenLP Service Planner user</h2><div class="field"><label>Name</label><input id="newPlannerUserName"></div>
  <div class="field"><label>Email</label><input id="newPlannerUserEmail" type="email"></div>
  <div class="field"><label>Initial password</label><input id="newPlannerUserPassword" type="password" autocomplete="new-password"><p class="meta">Minimum 12 characters.</p></div>
  <div class="field"><label>Access</label><select id="newPlannerUserAccess">${accessLevelOptions(serviceListAvailable?1:2,serviceListAvailable)}</select></div>
  <p class="meta" id="newPlannerUserStatus"></p><div class="sheet-actions"><button class="secondary" id="cancelNewPlannerUser">Back</button>
  <button class="primary" id="saveNewPlannerUser">Create user</button></div>`);
  $('#cancelNewPlannerUser').onclick=openPlannerUserManagement;
  $('#saveNewPlannerUser').onclick=async()=>{
    const btn=$('#saveNewPlannerUser'),status=$('#newPlannerUserStatus');btn.disabled=true;btn.textContent='Creating…';
    try{await apiFetch('/api/admin/users',{method:'POST',body:JSON.stringify({
      displayName:$('#newPlannerUserName').value.trim(),email:$('#newPlannerUserEmail').value.trim(),
      password:$('#newPlannerUserPassword').value,accessLevel:Number($('#newPlannerUserAccess').value)
    })});openPlannerUserManagement()}
    catch(err){status.textContent=err.message||String(err);btn.disabled=false;btn.textContent='Create user'}
  };
}
function openManagePlannerUser(user,serviceListAvailable=true,providerStatus={microsoftEnabled:true,myChurchSuiteEnabled:true,microsoftAutoEnroll:true}){
  if(!user)return;
  openSheet(`<h2>${esc(user.displayName||user.email)}</h2><div class="field"><label>Name</label><input id="manageUserName" value="${esc(user.displayName||'')}"></div>
  <div class="field"><label>Email</label><input value="${esc(user.email)}" disabled></div>
  <div class="field"><label>Login methods</label>${user.localPasswordEnabled?'<div>OpenLP Service Planner password</div>':''}</div>
  <label class="toggle"><span><strong>@${esc(microsoftAllowedDomain)} SSO</strong><small>${providerStatus.microsoftEnabled?`Allow this user to sign in with @${esc(microsoftAllowedDomain)} SSO.`:'Microsoft SSO is disabled for this installation.'}</small></span><input id="manageUserMicrosoftSso" type="checkbox" ${user.microsoftSsoEnabled?'checked':''}></label>
  <label class="toggle"><span><strong>My ChurchSuite SSO</strong><small>${providerStatus.myChurchSuiteEnabled?'Allow this user to sign in with My ChurchSuite.':'My ChurchSuite SSO is disabled for this installation.'}</small></span><input id="manageUserChurchSuiteSso" type="checkbox" ${user.myChurchSuiteSsoEnabled?'checked':''}></label>
  <div class="field"><label>Access</label><select id="manageUserAccess">${accessLevelOptions(user.accessLevel,serviceListAvailable)}</select></div>
  <label class="toggle"><span>Disable this account</span><input id="manageUserDisabled" type="checkbox" ${user.disabled?'checked':''}></label>
  ${user.localPasswordEnabled?'<button class="secondary full" id="resetManagedUserPassword">Reset password</button>':''}
  <p class="meta" id="manageUserStatus"></p>
  <button class="danger-quiet full" id="deleteManagedUser">Delete user…</button>
  <div class="sheet-actions"><button class="secondary" id="manageUserBack">Back</button>
  <button class="primary" id="saveManagedUser">Save changes</button></div>`);
  $('#manageUserBack').onclick=openPlannerUserManagement;
  $('#saveManagedUser').onclick=async()=>{
    const disabled=$('#manageUserDisabled').checked;
    const ms=!!$('#manageUserMicrosoftSso')?.checked;
    const cs=!!$('#manageUserChurchSuiteSso')?.checked;
    const hasUsableMethod=!!user.localPasswordEnabled||(ms&&providerStatus.microsoftEnabled)||(cs&&providerStatus.myChurchSuiteEnabled);
    if(!disabled&&!hasUsableMethod){
      if(!(await appConfirm('This user would have no currently usable sign-in method because the remaining SSO method is disabled for this installation. Disable the account instead?',{title:'No usable sign-in method',confirmLabel:'Disable account',danger:true}))){
        $('#manageUserStatus').textContent='Leave at least one login method enabled, or disable the account.';
        return;
      }
      $('#manageUserDisabled').checked=true;
    }
    try{await apiFetch(`/api/admin/users/${encodeURIComponent(user.email)}`,{method:'PUT',body:JSON.stringify({
      displayName:$('#manageUserName').value.trim(),accessLevel:Number($('#manageUserAccess').value),disabled:$('#manageUserDisabled').checked,
      microsoftSsoEnabled:ms,myChurchSuiteSsoEnabled:cs
    })});openPlannerUserManagement()}catch(err){$('#manageUserStatus').textContent=err.message||String(err)}};
  $('#deleteManagedUser').onclick=()=>{
    const microsoft=!!user.microsoftLinked&&!!providerStatus.microsoftEnabled&&!!providerStatus.microsoftAutoEnroll;
    const churchSuite=!!user.myChurchSuiteLinked&&!!providerStatus.myChurchSuiteEnabled;
    openSheet(`<h2>Delete user</h2>
      <div class="warning-card">
        <strong>Permanently delete ${esc(user.displayName||user.email)}?</strong>
        <p>This removes <strong>${esc(user.email)}</strong> from the Planner and signs out all of their active Planner sessions.</p>
      </div>
      <p class="meta">Historical activity/audit entries are retained.</p>
      ${(microsoft||churchSuite)?`<div class="warning-card subtle-warning">
        <strong>SSO account may be created again</strong>
        <p>${microsoft?`Because @${esc(microsoftAllowedDomain)} automatic first-time SSO access is enabled, this Microsoft account could be created again at the lowest access level after deletion.`:''}${microsoft&&churchSuite?' ':''}${churchSuite?'Because My ChurchSuite member sign-in is enabled, this person could sign in again and receive a new lowest-level account.':''} Use <strong>Disable this account</strong> instead when you want to prevent future access.</p>
      </div>`:''}
      <label class="confirm-line"><input type="checkbox" id="deleteUserConfirmCheck"> I understand this removes the Planner user account.</label>
      <div class="field"><label>Type DELETE to confirm</label><input id="deleteUserConfirmText" autocomplete="off" placeholder="DELETE"></div>
      <p class="meta" id="deleteUserStatus"></p>
      <div class="sheet-actions">
        <button class="secondary" id="cancelDeleteUser">Cancel</button>
        <button class="danger" id="confirmDeleteUser" disabled>Delete user</button>
      </div>`);

    const check=$('#deleteUserConfirmCheck');
    const text=$('#deleteUserConfirmText');
    const confirm=$('#confirmDeleteUser');
    const update=()=>{confirm.disabled=!(check.checked&&text.value==='DELETE')};
    check.onchange=update;
    text.oninput=update;
    $('#cancelDeleteUser').onclick=()=>openManagePlannerUser(user,serviceListAvailable,providerStatus);

    confirm.onclick=async()=>{
      const status=$('#deleteUserStatus');
      confirm.disabled=true;
      confirm.textContent='Deleting…';
      try{
        await apiFetch(`/api/admin/users/${encodeURIComponent(user.email)}`,{method:'DELETE'});
        openPlannerUserManagement();
      }catch(err){
        status.textContent=err.message||String(err);
        confirm.disabled=false;
        confirm.textContent='Delete user';
      }
    };
  };

  if($('#resetManagedUserPassword'))$('#resetManagedUserPassword').onclick=()=>{
    openSheet(`<h2>Reset password</h2><p class="meta">${esc(user.email)}</p><div class="field"><label>New password</label>
    <input id="managedNewPassword" type="password" autocomplete="new-password"><p class="meta">Minimum 12 characters. Existing sessions will be signed out.</p></div>
    <p class="meta" id="managedPasswordStatus"></p><div class="sheet-actions"><button class="secondary" id="managedPasswordBack">Back</button>
    <button class="primary" id="saveManagedPassword">Reset password</button></div>`);
    $('#managedPasswordBack').onclick=()=>openManagePlannerUser(user,serviceListAvailable);
    $('#saveManagedPassword').onclick=async()=>{try{await apiFetch(`/api/admin/users/${encodeURIComponent(user.email)}/password`,{
      method:'POST',body:JSON.stringify({password:$('#managedNewPassword').value})});openManagePlannerUser(user)}
      catch(err){$('#managedPasswordStatus').textContent=err.message||String(err)}};
  };
}


function classificationRuleLabel(rule){
  return rule==='exactly-one'?'Exactly one required':rule==='one-or-more'?'One or more required':'Optional · zero or more';
}
async function openSongClassificationManager(){
  let groups=structuredClone(songClassificationGroups());
  if(remoteAvailable){
    try{
      const data=await apiFetch('/api/admin/song-classifications');
      if(Array.isArray(data.groups))groups=structuredClone(data.groups);
    }catch(err){console.warn(err)}
  }

  const draw=()=>{
    openSheet(`<h2>Song classifications</h2>
      <p class="meta">Groups are independent. A song can have multiple classifications in one group when that group's rule allows it, and classifications from different groups can be combined.</p>
      <div class="classification-admin-list">${groups.map((group,index)=>`
        <button class="classification-admin-row" data-edit-class-group="${index}">
          <span><strong>${esc(group.name)}</strong><small>${esc(classificationRuleLabel(group.rule))}${group.defaultId?` · default ${esc((group.items||[]).find(x=>x.id===group.defaultId)?.name||'')}`:''}</small></span>
          <span>${(group.items||[]).length} ›</span>
        </button>`).join('')}</div>
      <button class="secondary full" id="addClassificationGroup">＋ Classification group</button>
      <div class="sheet-actions"><button class="secondary" id="classificationSettingsBack">Back to Settings</button><button class="primary" id="saveClassificationSettings">Save classifications</button></div>`);
    $('#classificationSettingsBack').onclick=openSettings;
    $('#addClassificationGroup').onclick=()=>{
      groups.push({id:'group-'+Date.now(),name:'New group',rule:'zero-or-more',defaultId:'',items:[{id:'classification-'+Date.now(),name:'New classification'}]});
      editGroup(groups.length-1);
    };
    body.querySelectorAll('[data-edit-class-group]').forEach(button=>button.onclick=()=>editGroup(Number(button.dataset.editClassGroup)));
    $('#saveClassificationSettings').onclick=async()=>{
      const btn=$('#saveClassificationSettings');btn.disabled=true;btn.textContent='Saving…';
      try{
        if(remoteAvailable){
          const data=await apiFetch('/api/admin/song-classifications',{method:'PUT',body:JSON.stringify({groups})});
          groups=data.groups||groups;
          state.settings.songClassificationGroups=structuredClone(groups);
          await loadSongLibrary();
        }else{
          state.settings.songClassificationGroups=structuredClone(groups);
          songs=songs.map(song=>({...song,classifications:normalizeSongClassificationsLocal(song.classifications)}));
          persistSongs();persistPlanner();
        }
        openSettings();
      }catch(err){appAlert(err.message||String(err));btn.disabled=false;btn.textContent='Save classifications'}
    };
  };

  const editGroup=index=>{
    const group=groups[index];if(!group)return;
    openSheet(`<h2>Edit classification group</h2>
      <div class="field"><label>Group name</label><input id="classGroupName" value="${esc(group.name)}"></div>
      <div class="field"><label>Selection rule</label><select id="classGroupRule">
        <option value="exactly-one" ${group.rule==='exactly-one'?'selected':''}>Exactly one required</option>
        <option value="one-or-more" ${group.rule==='one-or-more'?'selected':''}>One or more required</option>
        <option value="zero-or-more" ${group.rule==='zero-or-more'?'selected':''}>Optional · zero or more</option>
      </select></div>
      <div id="classificationItemsEditor" class="classification-item-editor"></div>
      <button class="secondary full" id="addClassificationItem">＋ Classification</button>
      <div class="field" id="classificationDefaultField"><label>Default classification</label><select id="classificationDefault"></select><p class="meta">Required groups use this when no classification is selected.</p></div>
      <button class="danger-quiet full" id="deleteClassificationGroup">Delete this group…</button>
      <div class="sheet-actions"><button class="secondary" id="classGroupBack">Back</button><button class="primary" id="classGroupDone">Done</button></div>`);
    const items=$('#classificationItemsEditor');
    const syncDefault=()=>{
      const rule=$('#classGroupRule').value;
      $('#classificationDefaultField').hidden=rule==='zero-or-more';
      const select=$('#classificationDefault');
      select.innerHTML=(group.items||[]).map(item=>`<option value="${esc(item.id)}" ${group.defaultId===item.id?'selected':''}>${esc(item.name||'Classification')}</option>`).join('');
      if(rule!=='zero-or-more'&&!group.defaultId)group.defaultId=group.items[0]?.id||'';
    };
    const drawItems=()=>{
      items.innerHTML=(group.items||[]).map((item,i)=>`<div class="classification-item-row"><input data-class-item-name="${i}" value="${esc(item.name)}"><button class="media-icon-action danger-quiet" data-delete-class-item="${i}">×</button></div>`).join('');
      items.querySelectorAll('[data-class-item-name]').forEach(input=>input.oninput=()=>{group.items[Number(input.dataset.classItemName)].name=input.value;syncDefault()});
      items.querySelectorAll('[data-delete-class-item]').forEach(button=>button.onclick=()=>{
        if(group.items.length<=1){appAlert('Keep at least one classification in a group.');return}
        const removed=group.items.splice(Number(button.dataset.deleteClassItem),1)[0];
        if(group.defaultId===removed?.id)group.defaultId=group.items[0]?.id||'';
        drawItems();syncDefault();
      });
    };
    drawItems();syncDefault();
    $('#classGroupName').oninput=()=>group.name=$('#classGroupName').value;
    $('#classGroupRule').onchange=()=>{
      group.rule=$('#classGroupRule').value;
      group.defaultId=group.rule==='zero-or-more'?'':(group.defaultId||group.items[0]?.id||'');
      syncDefault();
    };
    $('#classificationDefault').onchange=()=>group.defaultId=$('#classificationDefault').value;
    $('#addClassificationItem').onclick=()=>{
      group.items.push({id:'classification-'+Date.now()+'-'+group.items.length,name:'New classification'});
      drawItems();syncDefault();
    };
    $('#deleteClassificationGroup').onclick=async()=>{
      if(groups.length<=1){appAlert('Keep at least one classification group.');return}
      if(await appConfirm('Delete classification group \"'+group.name+'\"?',{title:'Delete classification group',confirmLabel:'Delete',danger:true})){groups.splice(index,1);draw()}
    };
    $('#classGroupBack').onclick=draw;
    $('#classGroupDone').onclick=()=>{
      group.name=$('#classGroupName').value.trim()||'Classification group';
      group.rule=$('#classGroupRule').value;
      group.defaultId=group.rule==='zero-or-more'?'':($('#classificationDefault').value||group.items[0]?.id||'');
      group.items=group.items.map(item=>({...item,name:String(item.name||'').trim()||'Classification'}));
      draw();
    };
  };
  draw();
}

function microsoftSsoRenewalDueInfo(){
  const raw=String(state.settings.microsoftSsoRenewalDue||'').trim();
  if(!raw)return {due:false,days:null,date:''};
  const due=new Date(`${raw}T23:59:59`);
  if(Number.isNaN(due.getTime()))return {due:false,days:null,date:raw};
  const days=Math.ceil((due.getTime()-Date.now())/86400000);
  return {due:days<=14,days,date:raw};
}

function renderMicrosoftSsoRenewalWarning(){
  document.querySelectorAll('.microsoft-sso-renewal-warning').forEach(x=>x.remove());
  if(Number(authenticatedUser?.accessLevel||0)<3)return;
  const info=microsoftSsoRenewalDueInfo();
  if(!info.due)return;

  const brand=document.querySelector('#appHeader .brand');
  if(!brand)return;

  const bar=document.createElement('button');
  bar.type='button';
  bar.className='microsoft-sso-renewal-warning';
  const timing=info.days<0
    ?`expired ${Math.abs(info.days)}d`
    :info.days===0?'due today'
    :`due in ${info.days}d`;
  bar.innerHTML=`<strong>SSO renewal</strong><span>${timing}</span>`;
  bar.title=`Microsoft SSO client-secret renewal ${timing} (${info.date}). Open Settings.`;
  bar.setAttribute('aria-label',bar.title);
  bar.onclick=e=>{
    e.preventDefault();
    e.stopPropagation();
    openSettings();
  };
  brand.appendChild(bar);
}

function openSettings(){
  if(Number(authenticatedUser?.accessLevel||0)<3){appAlert('Administrator access is required for Settings.');return;}
  const s=state.settings;

  openSheet(`<h2>Settings</h2>
    <nav class="settings-nav" id="settingsNav">
      <button type="button" data-settings-tab="general" class="active">General</button>
      <button type="button" data-settings-tab="services">Services</button>
      <button type="button" data-settings-tab="songs">Song Library</button>
      <button type="button" data-settings-tab="extensions">Extensions</button>
      <button type="button" data-settings-tab="backup">Backup</button>
    </nav>

    <div class="settings-section">
      <h3>OpenLP compatibility</h3>
      <p class="meta"><strong>This Service Planner is built for OpenLP 3.1.7.</strong> We recommend using OpenLP 3.1.7 on the projection computer(s) with this planner. Using a different OpenLP version may cause imported or exported services, songs or media to behave differently.</p>
    </div>

    <div class="settings-section">
      <h3>Editor</h3>
      <div class="field"><label>Your name</label><input id="editorName" value="${esc(currentEditor())}" placeholder="Name shown in activity history"></div>
      <p class="meta">${authenticatedUser?.authenticated
        ? `Signed in as ${esc(authenticatedUser.email)}. The display name is used in activity and last-edited records.`
        : 'Local development identity.'}</p>
    </div>

    <div class="settings-section">
      <div class="settings-subsection-head"><div><h3>Users & access</h3>
      <p class="meta">Microsoft SSO is restricted to <strong>@${esc(microsoftAllowedDomain)}</strong>. OpenLP Service Planner email/password accounts are created by an Administrator.</p></div>
      <button class="secondary compact" id="managePlannerUsers" type="button">Manage users</button></div>
      <label class="toggle">
        <span><strong>Allow Microsoft SSO sign-in</strong><small>Show @${esc(microsoftAllowedDomain)} SSO on the sign-in page and permit Microsoft sign-in for users whose Microsoft SSO checkbox is enabled.</small></span>
        <input id="microsoftSsoSignInEnabled" type="checkbox" ${s.microsoftSsoSignInEnabled!==false?'checked':''}>
      </label>
      <label class="toggle">
        <span><strong>Allow first-time Microsoft users from @${esc(microsoftAllowedDomain)}</strong><small>When enabled, any valid Microsoft account in this domain may sign in and is created with the lowest access level. When disabled, a Microsoft account must already exist in the Planner user list.</small></span>
        <input id="microsoftAutoEnrollDomainUsers" type="checkbox" ${s.microsoftAutoEnrollDomainUsers!==false?'checked':''}>
      </label>
      <label class="toggle">
        <span><strong>Allow My ChurchSuite member sign-in</strong><small>Requires a separately configured ChurchSuite OAuth App. Every first-time My ChurchSuite member is created with ChurchSuite Service list access only. Planner or Administrator access must be granted manually afterwards.</small></span>
        <input id="myChurchSuiteSignInEnabled" type="checkbox" ${s.myChurchSuiteSignInEnabled?'checked':''}>
      </label>
      <details class="settings-help-details">
        <summary>Set up My ChurchSuite sign-in</summary>
        <div class="settings-help-body">
          <p>My ChurchSuite sign-in is separate from the ChurchSuite API credentials used to synchronise service plans.</p>
          <ol>
            <li>Create an OAuth App in ChurchSuite for My ChurchSuite sign-in.</li>
            <li>Register this callback URL: <code>${location.origin}/auth/churchsuite/callback</code>.</li>
            <li>Configure two server secrets/settings: <code>CHURCHSUITE_OIDC_CLIENT_ID</code> and <code>CHURCHSUITE_OIDC_CLIENT_SECRET</code>.</li>
            <li>For Cloudflare, add those under <strong>Workers &amp; Pages → OpenLP Service Planner → Settings → Variables and Secrets</strong>, then deploy.</li>
            <li>For Debian VPS, add those to <code>/etc/openlp-service-planner.env</code> and restart the service.</li>
            <li>Return here, enable <strong>Allow My ChurchSuite member sign-in</strong>, save Settings, and test from a private/incognito browser.</li>
          </ol>
          <p class="meta">The Planner uses ChurchSuite’s published OpenID Connect discovery, authorisation, token, signing-key and UserInfo endpoints internally. Administrators only need the Client ID and Client Secret for their ChurchSuite OAuth App.</p>
        </div>
      </details>
      <div class="permission-levels">
        <div><strong>ChurchSuite Service list</strong><span>ChurchSuite Service list page only</span></div>
        <div><strong>Planner</strong><span>ChurchSuite Service list and OpenLP service planning</span></div>
        <div><strong>Administrator</strong><span>Planner access plus Settings and user administration</span></div>
      </div>

      <div class="admin-resilience-note"><strong>Administrator resilience</strong><p class="meta">Keep at least two enabled Administrator accounts where practical, or make sure another trusted person has administrative access to the hosting platform for emergency recovery.</p></div>
      <div class="microsoft-sso-maintenance">
        <h4>Microsoft SSO credential renewal</h4>
        <div class="field">
          <label>Renewal due</label>
          <input id="microsoftSsoRenewalDue" type="date" value="${esc(s.microsoftSsoRenewalDue||'')}">
        </div>
        <p class="meta">Enter the expiry/renewal date of the Microsoft Entra client secret. Starting 14 days before this date, Administrators see a red warning bar across the top of the Planner after sign-in. The warning continues after the date until this field is updated.</p>

        <details class="settings-help-details">
          <summary>Renew Microsoft SSO using the Cloudflare website</summary>
          <div class="settings-help-body">
            <ol>
              <li>In the Microsoft Entra admin centre, open <strong>App registrations → OpenLP Service Planner → Certificates &amp; secrets → Client secrets</strong>.</li>
              <li>Select <strong>New client secret</strong>, give it a useful description and choose its expiry date.</li>
              <li>Create it and immediately copy the new secret <strong>Value</strong>. Do not copy the Secret ID. Microsoft does not show the Value again after you leave the page.</li>
              <li><strong>Do not delete the old secret yet.</strong></li>
              <li>In the Cloudflare dashboard open <strong>Workers &amp; Pages → OpenLP Service Planner → Settings → Variables and Secrets</strong>.</li>
              <li>Find <code>MICROSOFT_CLIENT_SECRET</code>, edit it, replace its value with the new Entra secret Value, then select <strong>Deploy</strong>.</li>
              <li>Open the Planner in a private/incognito browser and confirm <strong>Sign in with @kpc.org.au SSO</strong> works.</li>
              <li>Only after the new login works, return to Entra and delete the old client secret.</li>
              <li>Back here, change <strong>Renewal due</strong> to the expiry date of the new secret and save Settings.</li>
            </ol>
            <p class="warning-inline"><strong>Important:</strong> never delete the old Entra secret before the replacement has been entered in Cloudflare and Microsoft sign-in has been successfully tested.</p>
          </div>
        </details>

        <details class="settings-help-details">
          <summary>Renew Microsoft SSO on a Debian VPS</summary>
          <div class="settings-help-body">
            <ol>
              <li>Create the replacement client secret in Entra as above and copy its <strong>Value</strong>.</li>
              <li>Leave the old Entra secret in place.</li>
              <li>On the server, replace <code>MICROSOFT_CLIENT_SECRET</code> in <code>/etc/openlp-service-planner.env</code>.</li>
              <li>Restart the Planner with <code>sudo systemctl restart openlp-service-planner</code>.</li>
              <li>Test Microsoft sign-in in a private/incognito browser.</li>
              <li>When it works, remove the old secret from Entra and update the <strong>Renewal due</strong> date here.</li>
            </ol>
          </div>
        </details>
        <details class="settings-help-details"><summary>Administrator recovery</summary><div class="settings-help-body">
          <p>If all Planner Administrators are locked out, the hosting administrator can temporarily enable an emergency recovery page. There is no permanent master password: <code>/admin-recovery</code> returns 404 unless <code>PLANNER_ADMIN_RECOVERY_TOKEN</code> is deliberately set.</p>
          <details class="settings-help-details"><summary>Cloudflare recovery</summary><div class="settings-help-body"><ol>
            <li>Open <strong>Cloudflare → Workers &amp; Pages → OpenLP Service Planner → Settings → Variables and Secrets</strong>.</li>
            <li>Add an encrypted secret named <code>PLANNER_ADMIN_RECOVERY_TOKEN</code> with a long random temporary value and deploy.</li>
            <li>Visit <code>/admin-recovery</code>, enter that token, the locked-out local Administrator email and a new password.</li>
            <li>Recovery signs out all existing sessions for that Administrator.</li>
            <li>Immediately delete <code>PLANNER_ADMIN_RECOVERY_TOKEN</code> in Cloudflare and deploy again.</li>
          </ol></div></details>
          <details class="settings-help-details"><summary>Debian VPS recovery</summary><div class="settings-help-body"><ol>
            <li>SSH to the VPS with <code>sudo</code> access.</li>
            <li>Add <code>PLANNER_ADMIN_RECOVERY_TOKEN=a-long-random-temporary-secret</code> to <code>/etc/openlp-service-planner.env</code>.</li>
            <li>Run <code>sudo systemctl restart openlp-service-planner</code>.</li>
            <li>Visit <code>/admin-recovery</code> and reset the local Administrator password.</li>
            <li>Remove the recovery-token line and restart the service again.</li>
          </ol></div></details>
          <p class="warning-inline"><strong>Important:</strong> protect Cloudflare/VPS administrative access. Someone who can change the Planner's hosting environment can ultimately recover Planner administration.</p>
        </div></details>
      </div>
    </div>

    <div class="settings-section">
      <h3>Local time</h3>
      <div class="field">
        <label>Time zone</label>
        <select id="plannerTimeZone">
          <option value="Australia/Brisbane" ${plannerTimeZone()==='Australia/Brisbane'?'selected':''}>Brisbane (Australia/Brisbane)</option>
          <option value="Australia/Sydney" ${plannerTimeZone()==='Australia/Sydney'?'selected':''}>Sydney / Melbourne / Canberra (Australia/Sydney)</option>
          <option value="Australia/Adelaide" ${plannerTimeZone()==='Australia/Adelaide'?'selected':''}>Adelaide (Australia/Adelaide)</option>
          <option value="Australia/Darwin" ${plannerTimeZone()==='Australia/Darwin'?'selected':''}>Darwin (Australia/Darwin)</option>
          <option value="Australia/Perth" ${plannerTimeZone()==='Australia/Perth'?'selected':''}>Perth (Australia/Perth)</option>
          <option value="Pacific/Auckland" ${plannerTimeZone()==='Pacific/Auckland'?'selected':''}>Auckland (Pacific/Auckland)</option>
        </select>
      </div>
      <p class="meta">Activity timestamps are stored as UTC and displayed in this local time zone. Daylight-saving changes are handled automatically where applicable.</p>
    </div>

    <div class="settings-section">
      <h3>OpenLP song library</h3>
      <div class="library-status">
        <strong>${esc(s.libraryFileName||'No database imported')}</strong>
        <span>${s.librarySongCount||0} songs${s.libraryImportedAt?` · imported ${esc(s.libraryImportedAt)}`:''}</span>
      </div>
      <div class="settings-actions">
        <button class="primary" type="button" id="manageSongClassifications">Manage classifications</button>
        <label class="secondary file-button">Import songs.sqlite<input type="file" id="sqliteImport" accept=".sqlite,.db,application/x-sqlite3"></label>
        <button class="secondary" id="sqliteExport">Export songs.sqlite</button>
        <button class="secondary" id="openLyricsZipExport">Export OpenLyrics ZIP</button>
      </div>
      <p class="meta">In the Cloudflare version, import will replace/update the shared song library and export will generate an OpenLP-compatible SQLite database. This browser prototype records the selected database but does not rewrite SQLite yet.</p>
    </div>

    <div class="settings-section">
      <h3>Song statistics data</h3>
      <p class="meta">Song statistics are recorded when OpenLP services are downloaded or shared. Deleting statistics does not delete songs or service plans, but the deleted usage history cannot be reconstructed automatically.</p>
      <div class="statistics-delete-card">
        <div>
          <strong>Delete a date range</strong>
          <p class="meta">Delete recorded song usage from and including the selected dates.</p>
        </div>
        <div class="statistics-date-range">
          <div class="field"><label>From</label><input id="deleteStatisticsFrom" type="date"></div>
          <div class="field"><label>To</label><input id="deleteStatisticsTo" type="date"></div>
          <button class="secondary" type="button" id="deleteStatisticsRange">Delete date range…</button>
        </div>
      </div>
      <div class="statistics-delete-card danger-zone-card">
        <div>
          <strong>Delete all song statistics</strong>
          <p class="meta">Removes the complete song-usage history while leaving the song library and services unchanged.</p>
        </div>
        <button class="danger" type="button" id="deleteAllStatistics">Delete all statistics…</button>
      </div>
    </div>

    <div class="settings-section">
      <h3>Service plans</h3>
      <div class="field"><label>Past services to retain</label>
        <select id="retainServices">
          ${[4,8,12,26,52,9999].map(n=>`<option value="${n}" ${Number(s.retainPastServices)===n?'selected':''}>${n===9999?'Keep all':n}</option>`).join('')}
        </select>
      </div>
      <p class="meta">Retention applies to used/past service plans. Future services are never removed.</p>
    </div>

    <div class="settings-section">
      <h3>Backup & restore</h3>

      <div class="warning-card subtle-warning backup-security-note"><strong>Keep backup files private</strong><p>Backups contain Planner user records, password hashes, service information and other church data. Full backups also contain uploaded media. Store them as securely as the live Planner.</p></div>

      <div class="backup-kind-card">
        <div>
          <strong>Full backup</strong>
          <p class="meta">Database plus every image, video and PDF file referenced by the planner. This is the backup to use for complete recovery or moving the planner elsewhere.</p>
          <p class="meta">Full restore uploads the ZIP back to the server. Cloudflare Free/Pro accounts currently limit a single request to 100 MB; larger restore files require a hosting plan with a higher request limit or the VPS deployment.</p>
        </div>
        <div class="settings-actions">
          <button class="primary" type="button" id="downloadFullBackup">Download full backup</button>
          <label class="secondary file-button">Restore full backup<input type="file" id="restoreFullBackupFile" accept=".zip,application/zip"></label>
        </div>
      </div>

      <div class="backup-kind-card compact-backup-card">
        <div>
          <strong>Database only</strong>
          <p class="meta">Smaller backup containing services, settings, users, songs, history and media records, but not the uploaded file bytes.</p>
        </div>
        <div class="settings-actions">
          <button class="secondary" type="button" id="downloadDatabaseBackup">Download database backup</button>
          <label class="secondary file-button">Restore database backup<input type="file" id="restoreDatabaseBackupFile" accept=".json,application/json"></label>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>Projector transfer instructions</h3>

      <p class="meta">This text appears in the Export OpenLP dialog. Add local details such as the venue Wi-Fi name/password or preferred transfer method. Formatting: <code>**bold**</code>, <code>*italics*</code>, <code>- bullet</code>, and <code>\*</code> for a literal asterisk.</p>
      <div class="field"><label>Getting the service onto the projector laptop</label><textarea id="exportTransferHelp" placeholder="Formatting help:
**bold**
*italics*
- bullet point
\* prints a literal asterisk">${esc(s.exportTransferHelp||'')}</textarea></div>
      <p class="meta openlp-plugin-note"><strong>Projection laptop note:</strong> PDFs from this planner are exported as image slides and PowerPoint is not currently used. If you do not otherwise use OpenLP presentations, consider disabling the <strong>Presentations</strong> plugin under <strong>Settings → Plugin List</strong>.</p>
    </div>


    <div class="settings-section">
      <div class="settings-subsection-head">
        <div>
          <h3>OpenLP themes/templates</h3>
          <p class="meta">Maintain the OpenLP theme names available to this planner. Names must exactly match the themes installed on the projection laptop(s). <strong>Default</strong> always remains available.</p>
        </div>
        <button class="secondary compact" id="addSettingsTheme" type="button">＋ Theme</button>
      </div>
      <div id="settingsThemesList" class="settings-theme-list"></div>
    </div>

    <div class="settings-section">
      <div class="settings-subsection-head">
        <div>
          <h3>Regular service types</h3>
          <p class="meta">Create as many recurring service types as needed. Each can happen on any day of the week and has its own default OpenLP theme. The theme can still be changed on an individual service.</p>
        </div>
        <button class="secondary compact" id="addRegularServiceType" type="button">＋ Service type</button>
      </div>
      <div id="regularServiceTypesList" class="regular-service-types-list"></div>
      <div class="template-settings-summary"><strong>Service templates</strong><span>${serviceTemplates().length?`${serviceTemplates().length} saved template${serviceTemplates().length===1?'':'s'}`:'No templates saved yet'}</span><button class="secondary compact" type="button" id="manageServiceTemplates">Manage templates</button></div>
      <p class="meta">Services that are not one of these recurring types are treated as <strong>One-off services</strong>.</p>
    </div>

    <div class="settings-section">
      <h3>Extensions</h3>
      <p class="meta">Extension settings are visible to all planner users. Secret values are obscured after entry and are never displayed back in plain text.</p>

      <div class="field">
        <label>ChurchSuite</label>
        <select id="churchSuiteMode">
          <option value="off">Off</option>
          <option value="on">On</option>
        </select>
      </div>
      <div class="field churchsuite-plan-base-field" id="churchSuitePlanBaseField">
        <label>ChurchSuite Plan Page address</label>
        <input id="churchSuitePlanBaseUrl" type="url" placeholder="https://yourchurch.churchsuite.com" value="${esc(s.churchSuitePlanBaseUrl||'')}">
        <p class="meta">Enter this once so the planner can build published Plan Page links automatically. You can still add or edit a ChurchSuite Plan Page URL manually on any individual service.</p>
      </div>

      <p class="meta">When ChurchSuite is On, you can sync published plans in bulk or link an individual service by adding/editing its ChurchSuite Plan Page URL manually.</p>

      <div id="churchSuiteTypesSettings" hidden>
        <div class="settings-subsection-head">
          <div>
            <h4>ChurchSuite service-plan types</h4>
            <p class="meta">Maintain the ChurchSuite Types your church uses and choose what each becomes in the planner. During each single or batch import, the user chooses Songs only, All configured Types, or Select Types. ChurchSuite Songs are handled separately.</p>
          </div>
          <button class="secondary compact" id="addChurchSuiteType" type="button">＋ Add type</button>
        </div>
        <div class="churchsuite-types-list" id="churchSuiteTypesList"></div>
      </div>

      <div id="churchSuiteServiceMappingSettings" class="extension-config" hidden>
        <div class="settings-subsection-head">
          <div>
            <h4>ChurchSuite service mapping</h4>
            <p class="meta">Map ChurchSuite plan names to a regular OpenLP Planner service type, or explicitly to One-off services. If there is no saved mapping, the planner first checks whether the ChurchSuite name starts with a full regular service type name — for example <strong>Morning Church with Communion</strong> → <strong>Morning Church</strong>. You can override any suggestion manually.</p>
          </div>
          <button class="secondary compact" type="button" id="refreshChurchSuiteServiceNames">Refresh from ChurchSuite</button>
        </div>
        <div id="churchSuiteServiceMappingStatus" class="meta"></div>
        <div id="churchSuiteServiceMappingsList" class="churchsuite-service-mappings-list"></div>
      </div>

      <div id="churchSuiteConnectionSettings" class="extension-config" hidden>
        <div class="churchsuite-connection-row">
          <div><strong>ChurchSuite connection</strong><span id="churchSuiteConnectionStatus">Checking…</span></div>
          <button class="secondary compact" type="button" id="testChurchSuiteConnection">Test connection</button>
        </div>
        <p class="meta">The Client Identifier and Client Secret are stored securely as Cloudflare Worker secrets. They are never sent to or displayed in the browser.</p>
      </div>

      <div id="churchSuiteAutoSettings" class="extension-config" hidden>
        <strong>ChurchSuite published plans</strong>
        <p class="meta">Use Services → Sync ChurchSuite to work with upcoming published plans. Individual services can also be linked or re-linked manually by URL.</p>

        <div class="extension-nested-card">
          <label class="toggle"><span>Publish a ChurchSuite service-plan directory</span><input id="churchSuiteDirectoryEnabled" type="checkbox" ${s.churchSuiteDirectoryEnabled?'checked':''}></label>
          <p class="meta">Publishes a clean list of upcoming ChurchSuite service plans only. Past plans are never included.</p>
          <div id="churchSuiteDirectorySettings">
            <div class="field">
              <label>Published directory path</label>
              <div class="path-input-row"><span>/</span><input id="churchSuiteDirectoryPath" value="${esc(String(s.churchSuiteDirectoryPath||'churchsuite-plans').replace(/^\/+/,''))}" placeholder="churchsuite-plans"></div>
              <p class="meta">This is a path on this OpenLP Service Planner site, for example <code>/churchsuite-plans</code>.</p>
            </div>
            <div class="field">
              <label>Show plans this many weeks ahead</label>
              <input id="churchSuiteDirectoryWeeks" type="number" min="1" max="52" step="1" value="${Number(s.churchSuiteDirectoryWeeks||8)}">
              <p class="meta">Only published plans from today through this many weeks ahead are listed, if available.</p>
            </div>
            <div class="published-directory-options">
              <label class="toggle"><span>Show OpenLP Planner status</span><input id="churchSuiteDirectoryShowPlannerStatus" type="checkbox" ${s.churchSuiteDirectoryShowPlannerStatus!==false?'checked':''}></label>
              <p class="meta">Shows Complete, Not complete, Downloaded or Amended after download when a matching OpenLP Planner service exists. Otherwise the status is blank.</p>

              <label class="toggle"><span>Show whether ChurchSuite songs are selected</span><input id="churchSuiteDirectoryShowSongs" type="checkbox" ${s.churchSuiteDirectoryShowSongs!==false?'checked':''}></label>
              <p class="meta">Re-sync checks the ChurchSuite plan items and shows whether songs have actually been selected in each plan.</p>

              <label class="toggle"><span>Show a link to this page on the Services screen</span><input id="churchSuiteDirectoryShowServicesLink" type="checkbox" ${s.churchSuiteDirectoryShowServicesLink?'checked':''}></label>
              <p class="meta">Adds a ChurchSuite Plans link beside Library in the non-scrolling Services header.</p>
            </div>
            <div class="published-directory-preview">
              <span>Published page</span>
              <a id="churchSuiteDirectoryPreview" href="/${esc(String(s.churchSuiteDirectoryPath||'churchsuite-plans').replace(/^\/+/,''))}" target="_blank" rel="noopener">/${esc(String(s.churchSuiteDirectoryPath||'churchsuite-plans').replace(/^\/+/,''))} ↗</a>
            </div>
          </div>
        </div>
      </div>
    </div>


    <div class="sheet-actions"><button class="primary" id="saveSettings">Done</button></div>`);

  const settingsSections=[...body.querySelectorAll(':scope > .settings-section')];
  const settingsPageForHeading=heading=>{
    const value=String(heading||'').trim().toLowerCase();
    if(value==='openlp song library')return 'songs';
    if(value==='backup & restore')return 'backup';
    if(value==='extensions')return 'extensions';
    if(['service plans','projector transfer instructions','openlp themes/templates','regular service types'].includes(value))return 'services';
    return 'general';
  };
  settingsSections.forEach(section=>{
    section.dataset.settingsPage=settingsPageForHeading(section.querySelector('h3')?.textContent||'');
  });
  const showSettingsTab=tab=>{
    settingsSections.forEach(section=>section.hidden=section.dataset.settingsPage!==tab);
    body.querySelectorAll('[data-settings-tab]').forEach(button=>button.classList.toggle('active',button.dataset.settingsTab===tab));
  };
  body.querySelectorAll('[data-settings-tab]').forEach(button=>button.onclick=()=>showSettingsTab(button.dataset.settingsTab));
  showSettingsTab('general');

  $('#editorName').value=currentEditor();
  $('#churchSuiteMode').value=churchSuiteEnabled()?'on':'off';
  const syncChurchSuiteDirectorySettings=()=>{
    const enabled=!!$('#churchSuiteDirectoryEnabled')?.checked;
    if($('#churchSuiteDirectorySettings'))$('#churchSuiteDirectorySettings').hidden=!enabled;
  };
  const updateChurchSuiteDirectoryPreview=()=>{
    const input=$('#churchSuiteDirectoryPath');
    const link=$('#churchSuiteDirectoryPreview');
    if(!input||!link)return;
    const clean=(input.value||'churchsuite-plans').trim().replace(/^\/+|\/+$/g,'').replace(/\s+/g,'-');
    const path=`/${clean||'churchsuite-plans'}`;
    link.href=path;
    link.textContent=`${path} ↗`;
  };
  const updateChurchSuiteBaseVisibility=()=>{
    const field=$('#churchSuitePlanBaseField');
    if(field)field.hidden=$('#churchSuiteMode').value==='off';
  };
  updateChurchSuiteBaseVisibility();
$('#exportTransferHelp').value=s.exportTransferHelp||'';

  let settingsDirty=false;
  let draftChurchSuiteTypes=(s.churchSuiteTypes||DEFAULT_CHURCHSUITE_TYPES).map(x=>({...x}));
  let draftRegularServiceTypes=regularServiceTypes().map(x=>({...x}));
  let draftDefaultTemplateByServiceType={...(s.defaultTemplateByServiceType||{})};
  let draftChurchSuiteServiceMappings=churchSuiteServiceMappings().map(x=>({...x}));
  let discoveredChurchSuiteServiceNames=[...new Set(draftChurchSuiteServiceMappings.map(x=>x.churchSuiteName))].sort((a,b)=>a.localeCompare(b));

  const weekdayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const builtInThemes=['KSSS (am) white','KSSS (am)'];
  let draftCustomThemes=[...new Set((s.customThemes||[]).map(x=>String(x||'').trim()).filter(Boolean))];
  const availableThemes=()=>[...new Set(['Default',...builtInThemes,...draftCustomThemes])];

  const drawSettingsThemes=()=>{
    const list=$('#settingsThemesList');
    if(!list)return;
    const rows=availableThemes();
    list.innerHTML=rows.map(name=>{
      const fixed=name==='Default'||builtInThemes.includes(name);
      return `<div class="settings-theme-row">
        <span>${esc(name)}</span>
        <small>${name==='Default'?'OpenLP default':fixed?'Existing planner theme':'Added theme'}</small>
        ${fixed?'':`<button type="button" class="media-icon-action danger-quiet" data-remove-settings-theme="${esc(name)}" title="Remove theme name" aria-label="Remove ${esc(name)}">×</button>`}
      </div>`;
    }).join('');

    list.querySelectorAll('[data-remove-settings-theme]').forEach(btn=>btn.onclick=()=>{
      const name=String(btn.dataset.removeSettingsTheme||'');
      const usedByType=draftRegularServiceTypes.some(t=>String(t.defaultTheme)===name);
      const usedByService=(state.services||[]).some(service=>String(service.theme)===name);
      if(usedByType||usedByService){
        appAlert('This theme is currently used by a regular service type or service. Change those services to another theme before removing it.');
        return;
      }
      draftCustomThemes=draftCustomThemes.filter(x=>x!==name);
      drawSettingsThemes();
      drawRegularServiceTypes();
      markSettingsDirty();
    });
  };

  const drawRegularServiceTypes=()=>{
    const list=$('#regularServiceTypesList');
    if(!list)return;
    list.innerHTML=draftRegularServiceTypes.length?draftRegularServiceTypes.map((t,i)=>`
      <div class="regular-service-type-row">
        <div class="field"><label>Name</label><input data-rst-name="${i}" value="${esc(t.name)}" placeholder="e.g. Morning Church"></div>
        <div class="field"><label>Usual day</label><select data-rst-day="${i}">
          ${weekdayNames.map((d,n)=>`<option value="${n}" ${Number(t.weekday)===n?'selected':''}>${d}</option>`).join('')}
        </select></div>
        <div class="field"><label>Default OpenLP theme</label><select data-rst-theme="${i}">
          ${availableThemes().map(theme=>`<option value="${esc(theme)}" ${String(t.defaultTheme)===theme?'selected':''}>${esc(theme)}</option>`).join('')}
        </select></div>
        <div class="field"><label>Default template</label><select data-rst-template="${i}"><option value="">None</option>${serviceTemplates().map(tpl=>`<option value="${esc(tpl.id)}" ${String(draftDefaultTemplateByServiceType[String(t.id)]||'')===String(tpl.id)?'selected':''}>${esc(tpl.name)}</option>`).join('')}</select></div>
        <button type="button" class="media-icon-action danger-quiet rst-delete" data-rst-delete="${i}" title="Remove service type" aria-label="Remove ${esc(t.name)}">×</button>
      </div>`).join(''):'<p class="meta">No regular service types. Every service will be treated as a one-off until one is added.</p>';

    list.querySelectorAll('[data-rst-name]').forEach(el=>el.oninput=()=>{
      draftRegularServiceTypes[Number(el.dataset.rstName)].name=el.value;
      drawChurchSuiteServiceMappings();
      markSettingsDirty();
    });
    list.querySelectorAll('[data-rst-day]').forEach(el=>el.onchange=()=>{
      draftRegularServiceTypes[Number(el.dataset.rstDay)].weekday=Number(el.value);
      markSettingsDirty();
    });
    list.querySelectorAll('[data-rst-theme]').forEach(el=>el.onchange=()=>{
      draftRegularServiceTypes[Number(el.dataset.rstTheme)].defaultTheme=el.value;
      markSettingsDirty();
    });
    list.querySelectorAll('[data-rst-template]').forEach(el=>el.onchange=()=>{
      const type=draftRegularServiceTypes[Number(el.dataset.rstTemplate)];
      if(type){
        if(el.value)draftDefaultTemplateByServiceType[String(type.id)]=el.value;
        else delete draftDefaultTemplateByServiceType[String(type.id)];
        markSettingsDirty();
      }
    });
    list.querySelectorAll('[data-rst-delete]').forEach(btn=>btn.onclick=()=>{
      const idx=Number(btn.dataset.rstDelete);
      const t=draftRegularServiceTypes[idx];
      const used=(state.services||[]).some(s=>String(s.serviceTypeId||'')===String(t?.id||''));
      if(used){
        appAlert('This service type is already used by one or more services. Change those services to another type before removing it.');
        return;
      }
      draftRegularServiceTypes.splice(idx,1);
      drawRegularServiceTypes();
      drawChurchSuiteServiceMappings();
      markSettingsDirty();
    });
  };

  const drawChurchSuiteServiceMappings=()=>{
    const list=$('#churchSuiteServiceMappingsList');
    if(!list)return;

    const typeOptions=[
      {id:'one-off',name:'One-off services'},
      ...draftRegularServiceTypes.map(t=>({id:String(t.id),name:String(t.name||'Regular service')}))
    ];
    const names=[...new Set([
      ...discoveredChurchSuiteServiceNames,
      ...draftChurchSuiteServiceMappings.map(x=>x.churchSuiteName)
    ].filter(Boolean))].sort((a,b)=>a.localeCompare(b));

    if(!names.length){
      list.innerHTML='<p class="meta">No ChurchSuite plan names discovered yet. Use Refresh from ChurchSuite after the connection is enabled.</p>';
      return;
    }

    list.innerHTML=names.map(name=>{
      const existing=draftChurchSuiteServiceMappings.find(x=>x.churchSuiteName===name);
      const inferred=inferChurchSuitePlannerTypeId(name);
      const selected=existing?.plannerTypeId||inferred;
      return `<div class="churchsuite-service-mapping-row">
        <div><strong>${esc(name)}</strong><small>${existing?'Manual mapping':inferred!=='one-off'?'Suggested from service-name prefix':'Unmapped · defaults to one-off'}</small></div>
        <span class="mapping-arrow">→</span>
        <select data-cs-service-map="${esc(name)}">
          ${typeOptions.map(t=>`<option value="${esc(t.id)}" ${String(selected)===String(t.id)?'selected':''}>${esc(t.name)}</option>`).join('')}
        </select>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-cs-service-map]').forEach(select=>{
      select.addEventListener('change',()=>{
        const name=String(select.dataset.csServiceMap||'');
        const idx=draftChurchSuiteServiceMappings.findIndex(x=>x.churchSuiteName===name);
        const row={churchSuiteName:name,plannerTypeId:select.value};
        if(idx>=0)draftChurchSuiteServiceMappings[idx]=row;
        else draftChurchSuiteServiceMappings.push(row);
        markSettingsDirty();
      });
    });
  };

  const saveButtons=()=>[$('#saveSettingsTop'),$('#saveSettings')].filter(Boolean);

  const markSettingsDirty=()=>{
    settingsDirty=true;
    saveButtons().forEach(btn=>{
      btn.textContent='Save Changes';
      btn.dataset.dirty='1';
    });
  };

  const syncChurchSuiteVisibility=()=>{
    const mode=$('#churchSuiteMode').value;
    $('#churchSuiteTypesSettings').hidden=mode==='off';
    $('#churchSuiteServiceMappingSettings').hidden=mode==='off';
    $('#churchSuiteConnectionSettings').hidden=mode==='off';
    $('#churchSuiteAutoSettings').hidden=mode==='off';
    if($('#churchSuitePlanBaseField'))$('#churchSuitePlanBaseField').hidden=mode==='off';
    syncChurchSuiteDirectorySettings();
  };

  const drawChurchSuiteTypes=()=>{
    const list=$('#churchSuiteTypesList');
    if(!list)return;

    list.innerHTML=churchSuiteTypeRows(draftChurchSuiteTypes);

    list.querySelectorAll('[data-cs-type-name]').forEach(input=>{
      input.addEventListener('input',()=>{
        draftChurchSuiteTypes[Number(input.dataset.csTypeName)].name=input.value;
        markSettingsDirty();
      });
    });

    list.querySelectorAll('[data-cs-type-map]').forEach(select=>{
      select.addEventListener('change',()=>{
        draftChurchSuiteTypes[Number(select.dataset.csTypeMap)].importAs=select.value;
        markSettingsDirty();
      });
    });

    list.querySelectorAll('[data-cs-type-delete]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        draftChurchSuiteTypes.splice(Number(btn.dataset.csTypeDelete),1);
        drawChurchSuiteTypes();
        markSettingsDirty();
      });
    });
  };

  $('#churchSuiteMode').addEventListener('change',()=>{
    syncChurchSuiteVisibility();
    markSettingsDirty();
  });

  $('#refreshChurchSuiteServiceNames')?.addEventListener('click',async()=>{
    const btn=$('#refreshChurchSuiteServiceNames');
    const status=$('#churchSuiteServiceMappingStatus');
    btn.disabled=true;
    btn.textContent='Refreshing…';
    if(status)status.textContent='Reading published ChurchSuite plan names…';
    try{
      const result=await apiFetch('/api/churchsuite/service-names');
      discoveredChurchSuiteServiceNames=(result.names||[]).map(String).filter(Boolean);
      if(status)status.textContent=`Found ${discoveredChurchSuiteServiceNames.length} ChurchSuite service name${discoveredChurchSuiteServiceNames.length===1?'':'s'}.`;
      drawChurchSuiteServiceMappings();
    }catch(err){
      if(status)status.textContent=err?.message||'Could not read ChurchSuite service names.';
    }finally{
      btn.disabled=false;
      btn.textContent='Refresh from ChurchSuite';
    }
  });

  $('#churchSuiteDirectoryEnabled')?.addEventListener('change',()=>{
    syncChurchSuiteDirectorySettings();
    markSettingsDirty();
  });
  $('#churchSuiteDirectoryPath')?.addEventListener('input',()=>{
    updateChurchSuiteDirectoryPreview();
    markSettingsDirty();
  });
  $('#churchSuiteDirectoryWeeks')?.addEventListener('input',markSettingsDirty);
  updateChurchSuiteDirectoryPreview();

  $('#addSettingsTheme')?.addEventListener('click',()=>{
    openSheet(`<h2>Add OpenLP theme/template</h2>
      <div class="warning-card">
        <strong>The name must match OpenLP exactly.</strong>
        <p>This adds the name to the planner only. It does not install the theme on a projection laptop.</p>
      </div>
      <div class="field"><label>Exact OpenLP theme name</label><input id="settingsNewThemeName" placeholder="e.g. Sermon - Dark"></div>
      <label class="confirm-line"><input type="checkbox" id="settingsThemeConfirm"> I have checked this exact name exists in OpenLP on the projection laptop(s).</label>
      <div class="sheet-actions">
        <button class="secondary" id="cancelSettingsThemeAdd">Cancel</button>
        <button class="primary" id="confirmSettingsThemeAdd" disabled>Add theme</button>
      </div>`);

    const input=$('#settingsNewThemeName');
    const check=$('#settingsThemeConfirm');
    const add=$('#confirmSettingsThemeAdd');
    const update=()=>add.disabled=!(check.checked&&input.value.trim());
    input.oninput=update;
    check.onchange=update;
    $('#cancelSettingsThemeAdd').onclick=openSettings;
    add.onclick=()=>{
      const name=input.value.trim();
      if(!name)return;
      if(!['Default',...builtInThemes,...draftCustomThemes].some(x=>x.toLowerCase()===name.toLowerCase())){
        draftCustomThemes.push(name);
      }
      // Persist immediately so returning to Settings does not lose the new name.
      s.customThemes=[...draftCustomThemes];
      persistPlanner();
      openSettings();
    };
  });

  $('#addRegularServiceType')?.addEventListener('click',()=>{
    const base='Regular service';
    let id=slugServiceType(base);
    let n=2;
    const ids=new Set(draftRegularServiceTypes.map(t=>String(t.id)));
    while(ids.has(id))id=`regular-service-${n++}`;
    draftRegularServiceTypes.push({id,name:'',weekday:0,defaultTheme:'Default'});
    drawRegularServiceTypes();
    drawChurchSuiteServiceMappings();
    markSettingsDirty();
    requestAnimationFrame(()=>{
      const inputs=$('#regularServiceTypesList')?.querySelectorAll('[data-rst-name]');
      inputs?.[inputs.length-1]?.focus();
    });
  });

  $('#addChurchSuiteType').addEventListener('click',()=>{
    draftChurchSuiteTypes.push({name:'',importAs:'text'});
    drawChurchSuiteTypes();
    markSettingsDirty();
    setTimeout(()=>{
      const inputs=document.querySelectorAll('#churchSuiteTypesList .cs-type-name');
      inputs[inputs.length-1]?.focus();
    },0);
  });

  syncChurchSuiteVisibility();
  drawChurchSuiteTypes();
  drawSettingsThemes();
  drawRegularServiceTypes();
  drawChurchSuiteServiceMappings();

  // Static Settings controls all use the same dirty tracker. Dynamic editors
  // (service types, ChurchSuite mappings/types and theme rows) keep their own
  // handlers because they update draft arrays as they change.
  const settingsDirtyControlIds=[
    'editorName',
    'microsoftSsoSignInEnabled',
    'microsoftAutoEnrollDomainUsers',
    'myChurchSuiteSignInEnabled',
    'microsoftSsoRenewalDue',
    'plannerTimeZone',
    'retainServices',
    'exportTransferHelp',
    'churchSuitePlanBaseUrl',
    'churchSuiteDirectoryPath',
    'churchSuiteDirectoryWeeks',
    'churchSuiteDirectoryShowPlannerStatus',
    'churchSuiteDirectoryShowSongs',
    'churchSuiteDirectoryShowServicesLink'
  ];
  settingsDirtyControlIds.forEach(id=>{
    const el=$('#'+id);
    if(!el)return;
    el.addEventListener('input',markSettingsDirty);
    el.addEventListener('change',markSettingsDirty);
  });

  const refreshChurchSuiteConnection=async()=>{
    const status=$('#churchSuiteConnectionStatus');
    if(!status||$('#churchSuiteMode').value==='off')return;
    status.textContent='Checking…';
    try{
      const result=await apiFetch('/api/churchsuite/status');
      status.textContent=result.connected?'Connected ✓':(result.message||'Not connected');
      status.classList.toggle('connection-ok',!!result.connected);
      status.classList.toggle('connection-error',!result.connected);
    }catch(err){
      status.textContent=err?.message||'Not connected';
      status.classList.add('connection-error');
    }
  };
  $('#testChurchSuiteConnection').onclick=refreshChurchSuiteConnection;
  if($('#churchSuiteMode').value!=='off')refreshChurchSuiteConnection();

  const downloadCurrentFullBackup=async(button=null)=>{
    if(!remoteAvailable)throw new Error('Full backup is available when the planner is running through its server.');
    const old=button?.textContent;
    if(button){button.disabled=true;button.textContent='Preparing full backup…'}
    try{
      const response=await fetch('/api/full-backup',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok)throw new Error(await response.text());
      const blob=await response.blob();
      const disposition=response.headers.get('content-disposition')||'';
      const match=disposition.match(/filename="([^"]+)"/);
      downloadBlob(blob,match?.[1]||`openlp-service-planner-full-${new Date().toISOString().slice(0,10)}.zip`);
    }finally{if(button){button.disabled=false;button.textContent=old}}
  };

  $('#downloadFullBackup')?.addEventListener('click',async()=>{
    const btn=$('#downloadFullBackup');
    try{await downloadCurrentFullBackup(btn)}
    catch(err){appAlert(`Full backup failed.\n\n${err.message||String(err)}`)}
  });

  $('#restoreFullBackupFile')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];
    e.target.value='';
    if(!file)return;

    openSheet(`<h2>Restore full backup</h2><p class="meta">Checking backup…</p>`);
    let preview;
    try{
      const response=await fetch('/api/full-restore-preview',{method:'POST',body:file,credentials:'same-origin',headers:{'content-type':'application/zip'}});
      preview=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(preview.error||`Backup check failed (${response.status})`);
    }catch(err){
      openSheet(`<h2>Restore full backup</h2><div class="warning-card"><strong>This backup could not be validated.</strong><p>${esc(err.message||String(err))}</p></div><div class="sheet-actions"><button class="primary" id="restorePreviewBack">Back</button></div>`);
      $('#restorePreviewBack').onclick=openSettings;return;
    }
    const backupCreated=preview.createdAt?formatActivityTime(preview.createdAt):'Unknown date';
    const summary=preview.summary||{};

    openSheet(`<h2>Restore full backup</h2>
      <div class="warning-card">
        <strong>This replaces the planner database and its managed media files.</strong>
        <p>The current services, settings, song history and media records will be replaced by <strong>${esc(file.name)}</strong>. Media files referenced by the current database but absent from the backup will be removed after a successful restore.</p>
      </div>
      <div class="backup-restore-summary">
        <span>Backup created</span><strong>${esc(backupCreated)}</strong>
        <span>Planner version</span><strong>${esc(preview.appVersion||'Unknown')}</strong>
        <span>Services</span><strong>${Number(summary.services||0)}</strong>
        <span>Songs</span><strong>${Number(summary.songs||0)}</strong>
        <span>Users</span><strong>${Number(summary.users||0)}</strong>
        <span>Media</span><strong>${Number(preview.mediaCount||summary.mediaFiles||0)} files · ${formatBytes(Number(preview.mediaBytes||0))}</strong>
        <span>Backup file</span><strong>${esc(file.name)} · ${formatBytes(file.size)}</strong>
      </div>
      <p class="meta">Only media managed by this planner is affected. The restore validates the archive, stages restored media under new storage keys, then switches the database to the restored data only after the staged media is complete.</p><div class="warning-card subtle-warning"><strong>Back up the current Planner first</strong><p>Before restoring, download a current Full backup so you can return to the present state if you selected the wrong backup.</p><button class="secondary" type="button" id="downloadCurrentBeforeRestore">Download current full backup</button></div>
      <label class="confirm-line"><input type="checkbox" id="restoreFullBackupCheck"> I have downloaded a current Full backup, or I accept that I may not be able to return to the present state.</label>
      <label class="confirm-line"><input type="checkbox" id="restoreFullConfirmCheck"> I understand this will replace the current planner data and managed media.</label>
      <div class="field"><label>Type RESTORE to confirm</label><input id="restoreFullConfirmText" autocomplete="off" placeholder="RESTORE"></div>
      <p class="meta" id="restoreFullStatus"></p>
      <div class="sheet-actions">
        <button class="secondary" id="cancelFullRestore">Cancel</button>
        <button class="danger" id="confirmFullRestore" disabled>Restore full backup</button>
      </div>`);

    const updateReady=()=>{
      $('#confirmFullRestore').disabled=!($('#restoreFullBackupCheck').checked&&$('#restoreFullConfirmCheck').checked&&$('#restoreFullConfirmText').value==='RESTORE');
    };
    $('#restoreFullBackupCheck').onchange=updateReady;
    $('#restoreFullConfirmCheck').onchange=updateReady;
    $('#restoreFullConfirmText').oninput=updateReady;
    $('#cancelFullRestore').onclick=openSettings;
    $('#downloadCurrentBeforeRestore')?.addEventListener('click',async e=>{const b=e.currentTarget;try{await downloadCurrentFullBackup(b)}catch(err){appAlert(`Full backup failed.\n\n${err.message||String(err)}`)}});

    $('#confirmFullRestore').onclick=async()=>{
      const btn=$('#confirmFullRestore');
      const status=$('#restoreFullStatus');
      btn.disabled=true;
      btn.textContent='Restoring…';
      status.textContent='Uploading and validating backup…';

      try{
        const response=await fetch('/api/full-restore',{
          method:'POST',
          body:file,
          credentials:'same-origin',
          headers:{'content-type':'application/zip','x-planner-restore-confirmation':'RESTORE'}
        });
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.error||`Restore failed (${response.status})`);

        status.textContent=`Restored ${Number(result.mediaRestored||0)} media file${Number(result.mediaRestored||0)===1?'':'s'} ✓ Reloading…`;
        localStorage.removeItem(STORAGE_KEY);
        setTimeout(()=>location.replace('/login'),700);
      }catch(err){
        status.textContent=`Restore failed: ${err.message||String(err)}`;
        btn.disabled=false;
        btn.textContent='Restore full backup';
      }
    };
  });

  $('#downloadDatabaseBackup')?.addEventListener('click',async()=>{
    const btn=$('#downloadDatabaseBackup');
    if(!remoteAvailable){
      appAlert('Database backup is available when the planner is running through its server.');
      return;
    }
    btn.disabled=true;
    const old=btn.textContent;
    btn.textContent='Preparing backup…';
    try{
      const response=await fetch('/api/database-backup',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok)throw new Error(await response.text());
      const blob=await response.blob();
      const disposition=response.headers.get('content-disposition')||'';
      const match=disposition.match(/filename="([^"]+)"/);
      downloadBlob(blob,match?.[1]||`openlp-service-planner-db-${new Date().toISOString().slice(0,10)}.json`);
    }catch(err){
      appAlert(`Database backup failed.\n\n${err.message||String(err)}`);
    }finally{
      btn.disabled=false;
      btn.textContent=old;
    }
  });

  $('#restoreDatabaseBackupFile')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];
    e.target.value='';
    if(!file)return;

    let backup;
    try{
      backup=JSON.parse(await file.text());
    }catch(_){
      appAlert('That file is not valid JSON.');
      return;
    }

    if(backup?.format!=='openlp-service-planner-database-backup'){
      appAlert('That is not an OpenLP Service Planner database backup.');
      return;
    }

    const created=backup.createdAt?formatActivityTime(backup.createdAt):'Unknown date';
    const tableCount=backup.tables&&typeof backup.tables==='object'?Object.keys(backup.tables).length:0;
    openSheet(`<h2>Restore database backup</h2>
      <div class="warning-card">
        <strong>This replaces the current planner database.</strong>
        <p>The current database contents will be removed and replaced by <strong>${esc(file.name)}</strong>.</p>
      </div>
      <div class="backup-restore-summary">
        <span>Backup created</span><strong>${esc(created)}</strong>
        <span>Tables in backup</span><strong>${tableCount}</strong>
        <span>Backup format</span><strong>Version ${Number(backup.formatVersion||0)}</strong>
      </div>
      <p class="meta">Uploaded media file bytes are not contained in a database backup. Existing stored media remains in file storage; restored database media records will refer to those existing files.</p><div class="warning-card subtle-warning"><strong>Back up the current Planner first</strong><p>Download a current Full backup before replacing the database.</p><button class="secondary" type="button" id="downloadCurrentBeforeDatabaseRestore">Download current full backup</button></div>
      <label class="confirm-line"><input type="checkbox" id="restoreDatabaseBackupCheck"> I have downloaded a current Full backup, or I accept that I may not be able to return to the present state.</label>
      <label class="confirm-line"><input type="checkbox" id="restoreDatabaseConfirmCheck"> I understand this will replace the current database.</label>
      <div class="field"><label>Type RESTORE to confirm</label><input id="restoreDatabaseConfirmText" autocomplete="off" placeholder="RESTORE"></div>
      <p class="meta" id="restoreDatabaseStatus"></p>
      <div class="sheet-actions">
        <button class="secondary" id="cancelDatabaseRestore">Cancel</button>
        <button class="danger" id="confirmDatabaseRestore" disabled>Restore database</button>
      </div>`);

    const updateRestoreReady=()=>{
      $('#confirmDatabaseRestore').disabled=!($('#restoreDatabaseBackupCheck').checked&&$('#restoreDatabaseConfirmCheck').checked&&$('#restoreDatabaseConfirmText').value==='RESTORE');
    };
    $('#restoreDatabaseBackupCheck').onchange=updateRestoreReady;
    $('#restoreDatabaseConfirmCheck').onchange=updateRestoreReady;
    $('#restoreDatabaseConfirmText').oninput=updateRestoreReady;
    $('#cancelDatabaseRestore').onclick=openSettings;
    $('#downloadCurrentBeforeDatabaseRestore')?.addEventListener('click',async e=>{const b=e.currentTarget;try{await downloadCurrentFullBackup(b)}catch(err){appAlert(`Full backup failed.\n\n${err.message||String(err)}`)}});

    $('#confirmDatabaseRestore').onclick=async()=>{
      const btn=$('#confirmDatabaseRestore');
      const status=$('#restoreDatabaseStatus');
      btn.disabled=true;
      btn.textContent='Restoring…';
      status.textContent='Replacing database contents. Do not close this window…';
      try{
        const result=await apiFetch('/api/database-restore',{
          method:'POST',
          body:JSON.stringify({confirmation:'RESTORE',backup})
        });
        status.textContent='Database restored ✓ Reloading…';
        localStorage.removeItem(STORAGE_KEY);
        setTimeout(()=>location.replace('/login'),600);
      }catch(err){
        status.textContent=`Restore failed: ${err.message||String(err)}`;
        btn.disabled=false;
        btn.textContent='Restore database';
      }
    };
  });

  $('#managePlannerUsers')?.addEventListener('click',openPlannerUserManagement);
  $('#manageSongClassifications')?.addEventListener('click',openSongClassificationManager);

  const deleteSongStatistics=async({from='',to='',all=false}={})=>{
    if(!remoteAvailable){
      await appAlert('Statistics deletion is only available when connected to the Planner server.',{title:'Server connection required'});
      return;
    }
    if(!all){
      if(!from||!to){
        await appAlert('Choose both a From and To date.',{title:'Choose a date range'});
        return;
      }
      if(from>to){
        await appAlert('The From date must be on or before the To date.',{title:'Check the date range'});
        return;
      }
    }

    const stats=await loadSongStatistics(all?{}:{from,to});
    const count=Number(stats.totalUsages||0);
    if(!count){
      await appAlert(all?'There are no song statistics to delete.':`There are no song statistics recorded from ${from} to ${to}.`,{title:'Nothing to delete'});
      return;
    }

    const firstMessage=all
      ?`This will permanently delete all ${count} recorded song usage entr${count===1?'y':'ies'}. Songs and service plans will not be deleted.`
      :`This will permanently delete ${count} recorded song usage entr${count===1?'y':'ies'} from ${from} through ${to}, inclusive. Songs and service plans will not be deleted.`;
    const proceed=await appConfirm(firstMessage,{
      title:all?'Delete all song statistics?':'Delete song statistics for this date range?',
      confirmLabel:'Continue',
      danger:true
    });
    if(!proceed)return;

    const finalMessage=all
      ?'This cannot be undone. Delete the complete song-statistics history now?'
      :`This cannot be undone. Delete song statistics from ${from} through ${to} now?`;
    const confirmed=await appConfirm(finalMessage,{
      title:'Final confirmation',
      confirmLabel:all?'Delete all statistics':'Delete date range',
      danger:true
    });
    if(!confirmed)return;

    const result=await apiFetch('/api/admin/song-usage',{method:'DELETE',body:JSON.stringify(all?{all:true}:{from,to})});
    await appAlert(`${Number(result.deleted||0)} song usage entr${Number(result.deleted||0)===1?'y':'ies'} deleted.`,{title:'Statistics deleted'});
    openSettings();
  };

  if($('#deleteStatisticsRange'))$('#deleteStatisticsRange').onclick=()=>deleteSongStatistics({
    from:$('#deleteStatisticsFrom')?.value||'',
    to:$('#deleteStatisticsTo')?.value||''
  });
  if($('#deleteAllStatistics'))$('#deleteAllStatistics').onclick=()=>deleteSongStatistics({all:true});

  if($('#manageServiceTemplates'))$('#manageServiceTemplates').onclick=()=>openServiceTemplateManager('settings');

  $('#sqliteImport').onchange=e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    openSqliteImportWarning(file);
  };

  $('#openLyricsZipExport').onclick=()=>{
    if(!songs.length){appAlert('There are no songs to export.');return;}
    exportSongsZip(songs,'openlp-song-library-openlyrics.zip');
  };

  $('#sqliteExport').onclick=()=>{
    openSheet(`<h2>Export song database</h2>
      <p>The production Cloudflare build will generate an OpenLP-compatible <strong>songs.sqlite</strong> from the shared library.</p>
      <p class="meta">The exporter is deliberately not faked in this front-end prototype.</p>
      <div class="sheet-actions"><button class="primary" id="backSettings">Back</button></div>`);
    $('#backSettings').onclick=openSettings;
  };

  const saveSettingsChanges=async()=>{
    if(!settingsDirty){
      sheet.close();
      return;
    }

    const previousMicrosoftSso=s.microsoftSsoSignInEnabled!==false;
    const previousChurchSuiteSso=!!s.myChurchSuiteSignInEnabled;
    const nextMicrosoftSso=!!$('#microsoftSsoSignInEnabled')?.checked;
    const nextChurchSuiteSso=!!$('#myChurchSuiteSignInEnabled')?.checked;
    if(remoteAvailable&&((previousMicrosoftSso&&!nextMicrosoftSso)||(previousChurchSuiteSso&&!nextChurchSuiteSso))){
      try{
        const data=await apiFetch('/api/admin/users');
        const affected=(data.users||[]).filter(u=>{
          if(u.disabled)return false;
          const local=!!u.localPasswordEnabled;
          const microsoft=!!u.microsoftSsoEnabled&&nextMicrosoftSso&&!!data.microsoftConfigured;
          const churchSuite=!!u.myChurchSuiteSsoEnabled&&nextChurchSuiteSso&&!!data.myChurchSuiteConfigured;
          return !local&&!microsoft&&!churchSuite;
        });
        if(affected.length){
          const names=affected.slice(0,5).map(u=>u.displayName||u.email).join(', ');
          const more=affected.length>5?` and ${affected.length-5} more`:'';
          const proceed=await appConfirm(
            `Disabling this sign-in method will leave ${affected.length} enabled user${affected.length===1?'':'s'} with no currently usable login method: ${names}${more}. You can continue, but those accounts will not be able to sign in until another method is enabled or configured.`,
            {title:'Users will lose sign-in access',confirmLabel:'Disable sign-in method',danger:true}
          );
          if(!proceed)return;
        }
      }catch(err){
        await appAlert(`The Planner could not check which users depend on this sign-in method. Settings were not changed.

${err.message||String(err)}`,{title:'Could not verify user access'});
        return;
      }
    }

    s.churchSuiteMode=$('#churchSuiteMode').value==='on'?'on':'off';
    const planBaseRaw=$('#churchSuitePlanBaseUrl')?.value.trim()||'';
    if(planBaseRaw){
      try{
        const u=new URL(planBaseRaw);
        s.churchSuitePlanBaseUrl=`${u.protocol}//${u.hostname}`;
      }catch(_){
        s.churchSuitePlanBaseUrl=planBaseRaw.replace(/\/$/,'');
      }
    }else{
      s.churchSuitePlanBaseUrl='';
    }
    s.customThemes=[...draftCustomThemes];
    s.churchSuiteTypes=draftChurchSuiteTypes
      .map(x=>({name:String(x.name||'').trim(),importAs:x.importAs||'text'}))
      .filter(x=>x.name);
    s.churchSuiteServiceMappings=draftChurchSuiteServiceMappings
      .map(x=>({
        churchSuiteName:String(x.churchSuiteName||'').trim(),
        plannerTypeId:String(x.plannerTypeId||'one-off')
      }))
      .filter(x=>x.churchSuiteName);
    s.defaultTemplateByServiceType={...draftDefaultTemplateByServiceType};

    s.churchSuiteDirectoryEnabled=!!$('#churchSuiteDirectoryEnabled')?.checked;
    const directoryPath=($('#churchSuiteDirectoryPath')?.value||'churchsuite-plans')
      .trim().replace(/^\/+|\/+$/g,'').replace(/\s+/g,'-');
    s.churchSuiteDirectoryPath=directoryPath||'churchsuite-plans';
    s.churchSuiteDirectoryWeeks=Math.min(52,Math.max(1,Number($('#churchSuiteDirectoryWeeks')?.value||8)));
    s.churchSuiteDirectoryShowPlannerStatus=!!$('#churchSuiteDirectoryShowPlannerStatus')?.checked;
    s.churchSuiteDirectoryShowSongs=!!$('#churchSuiteDirectoryShowSongs')?.checked;
    s.churchSuiteDirectoryShowServicesLink=!!$('#churchSuiteDirectoryShowServicesLink')?.checked;


    const editorDisplayName=$('#editorName').value.trim()||'Steve';
    setCurrentEditor(editorDisplayName);
    saveAuthenticatedDisplayName(editorDisplayName);

    const cleanedRegularTypes=draftRegularServiceTypes.map((t,i)=>({
      id:String(t.id||slugServiceType(t.name||`regular-service-${i+1}`)),
      name:String(t.name||'').trim(),
      weekday:Number(t.weekday),
      defaultTheme:String(t.defaultTheme||'Default')
    })).filter(t=>t.name);
    const duplicateNames=cleanedRegularTypes.some((t,i,a)=>a.findIndex(x=>x.name.toLowerCase()===t.name.toLowerCase())!==i);
    if(duplicateNames){appAlert('Regular service type names must be unique.');return;}
    s.regularServiceTypes=cleanedRegularTypes;
    for(const service of state.services||[]){
      if(service.kind!=='regular'||!service.serviceTypeId)continue;
      const t=cleanedRegularTypes.find(x=>String(x.id)===String(service.serviceTypeId));
      if(t)service.serviceTypeName=t.name;
    }

    s.microsoftSsoSignInEnabled=nextMicrosoftSso;
    s.microsoftAutoEnrollDomainUsers=!!$('#microsoftAutoEnrollDomainUsers')?.checked;
    s.myChurchSuiteSignInEnabled=nextChurchSuiteSso;
    s.microsoftSsoRenewalDue=String($('#microsoftSsoRenewalDue')?.value||'').trim();

    s.timeZone=$('#plannerTimeZone')?.value||'Australia/Brisbane';
    s.retainPastServices=Number($('#retainServices').value);
    s.exportTransferHelp=$('#exportTransferHelp').value.trim();

    applyRetention();
    persistPlanner();

    if(remoteAvailable){
      try{
        await apiFetch('/api/settings',{
          method:'PUT',
          body:JSON.stringify({settings:state.settings})
        });
      }catch(err){
        await appAlert(`Settings were not saved on the server. The Planner will reload the last saved settings.\n\n${err.message||String(err)}`,{title:'Settings not saved'});
        location.reload();
        return;
      }
    }

    sheet.close();
    render();

    if(churchSuiteEnabled()){
      openServicesPage();
    }
  };

  $('#saveSettings').onclick=saveSettingsChanges;
  if($('#saveSettingsTop'))$('#saveSettingsTop').onclick=saveSettingsChanges;
}

$('#themeBtn').onclick=()=>openThemeEditor();
body.addEventListener('click',e=>{if(e.target.id==='themeSave'){state.theme=$('#themeSelect').value;$('#themeBtn').textContent=state.theme;persistPlanner();sheet.close()}});

function openThemeEditor(){
  const themes=['Default','KSSS (am) white','KSSS (am)',...(state.settings.customThemes||[])];
  openSheet(`<h2>Service theme</h2>
    <div class="field">
      <label>OpenLP theme</label>
      <select id="themeSelect">
        ${themes.map(t=>`<option ${state.theme===t?'selected':''}>${esc(t)}</option>`).join('')}
      </select>
    </div>
    <p class="meta"><strong>Default</strong> tells OpenLP to use its own default theme. Any named theme must exist on the projection laptop with exactly the same name.</p>
    <button class="secondary full" id="addThemeBtn">Add theme name</button>
    <div class="sheet-actions"><button class="primary" id="themeSave">Done</button></div>`);

  $('#addThemeBtn').onclick=()=>openAddThemeWarning();

  $('#themeSave').onclick=()=>{
    state.theme=$('#themeSelect').value;
    $('#themeBtn').textContent=state.theme;
    persistPlanner();
    saveServiceMeta();
    markServiceEdited('changed theme');
    appendAudit('changed theme',state.theme);
    sheet.close();
  };
}

function openAddThemeWarning(){
  openSheet(`<h2>Add OpenLP theme</h2>
    <div class="warning-card">
      <strong>Theme names must match OpenLP exactly.</strong>
      <p>This planner does not install themes on projection laptops. If you add a theme name here, that same theme must already exist on each laptop that may open the exported service.</p>
    </div>
    <div class="field"><label>Exact OpenLP theme name</label><input id="newThemeName" placeholder="e.g. KSSS (am) white"></div>
    <label class="confirm-line"><input type="checkbox" id="themeConfirm"> I have checked this exact theme name exists in OpenLP on the projection laptop(s).</label>
    <div class="sheet-actions">
      <button class="secondary" id="cancelThemeAdd">Cancel</button>
      <button class="primary" id="confirmThemeAdd" disabled>Add theme</button>
    </div>`);

  $('#themeConfirm').onchange=()=>$('#confirmThemeAdd').disabled=!$('#themeConfirm').checked;
  $('#cancelThemeAdd').onclick=openThemeEditor;
  $('#confirmThemeAdd').onclick=()=>{
    const name=$('#newThemeName').value.trim();
    if(!name){appAlert('Enter the exact OpenLP theme name.');return;}
    // Prototype stores ad-hoc theme names in settings.
    state.settings.customThemes=state.settings.customThemes||[];
    if(!state.settings.customThemes.includes(name)) state.settings.customThemes.push(name);
    persistPlanner();
    state.theme=name;
    render();
    openThemeEditor();
  };
}

$('#activityBtn').onclick=()=>openActivity();

function openActivity(){
  const canClearActivity=Number(authenticatedUser?.accessLevel||0)>=3;
  openSheet(`<div class="sheet-title-row">
      <h2>Activity</h2>
      ${canClearActivity?`<button class="secondary compact" id="clearActivityBtn" ${state.activity.length?'':'disabled'}>Clear activity</button>`:''}
    </div>
    <div class="activity-list">
      ${state.activity.length
        ? state.activity.map(a=>`<div class="activity-row">
            <strong>${esc(a[0]||'')}</strong>
            <span>${esc(a[1]||'')}</span>
            <small>${esc(formatActivityTime(a[2]||''))}</small>
          </div>`).join('')
        : '<p class="meta">No activity recorded for this service.</p>'}
    </div>`);

  const clear=$('#clearActivityBtn');
  if(clear){
    clear.onclick=()=>{
      openSheet(`<h2>Clear activity?</h2>
        <div class="warning-card">
          <strong>Delete the activity report for this service?</strong>
          <p>This permanently clears the visible activity history for the current service.</p>
        </div>
        <div class="sheet-actions">
          <button class="secondary" id="cancelClearActivity">Cancel</button>
          <button class="danger solid-danger" id="confirmClearActivity">Clear activity</button>
        </div>`);

      $('#cancelClearActivity').onclick=openActivity;
      setSheetCloseAction(openActivity);
      $('#confirmClearActivity').onclick=async()=>{
        const btn=$('#confirmClearActivity');
        btn.disabled=true;
        btn.textContent='Clearing…';

        state.activity=[];
        persistPlanner();

        if(remoteAvailable){
          try{
            await apiFetch(`/api/services/${encodeURIComponent(currentService().id)}/audit`,{
              method:'DELETE'
            });
          }catch(err){
            console.warn(err);
          }
        }

        openActivity();
      };
    };
  }
}

function downloadUrl(url,filename){
  const a=document.createElement('a');
  a.href=url;
  a.download=filename||'';
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>a.remove(),1000);
}

function safeExportFilename(service){
  const base=`${service.dateISO||'service'}-${service.title||'service'}`
    .replace(/[^a-zA-Z0-9._-]+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'');
  return `${base||'openlp-service'}.osz`;
}

$('#exportBtn').onclick=()=>openExportOpenLP();

$('#clearProjectorMarkBtn').onclick=()=>{
  const s=currentService();
  if(!s)return;
  delete s.downloadedForDeviceAt;
  delete s.downloadedSnapshot;
  persistPlanner();
  saveServiceMeta();
  markServiceEdited('cleared projector copy mark');
  appendAudit('cleared projector copy mark');
  render();
};

async function openExportOpenLP(){
  const s=currentService();
  const status=projectorState(s);

  let check={errors:[],warnings:[]};
  if(remoteAvailable){
    try{
      check=await apiFetch(`/api/services/${encodeURIComponent(s.id)}/export-check`);
    }catch(err){
      check={errors:[err.message],warnings:[]};
    }
  }else{
    check.warnings.push('Cloudflare export endpoint is not available in static/local-file mode.');
  }

  openSheet(`<h2>Export OpenLP service</h2>

    ${status==='stale'
      ? `<div class="projector-state stale"><strong>Existing projector copy is out of date</strong><span>The service has changed since it was last downloaded for projection.</span></div>`
      : status==='downloaded'
        ? `<div class="projector-state ready"><strong>Current projector copy is marked</strong><span>You can still download another copy without changing that mark.</span></div>`
        : ''}

    ${check.errors?.length?`<div class="warning-card"><strong>Not ready for a complete export</strong>${check.errors.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}
    ${check.warnings?.length?`<div class="export-warnings">${check.warnings.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`:''}

    <div class="transfer-card">
      <strong>Getting the service onto the projector laptop</strong>
      <p class="transfer-help-text">${renderHelpMarkdown(state.settings.exportTransferHelp||'')}</p>
      <a class="text-action" href="https://localsend.org" target="_blank" rel="noopener">Open LocalSend ↗</a>
    </div>

    <div class="sheet-actions export-actions export-footer-controls">
      <div class="export-footer-note">
        <label class="export-footer-checkbox">
          <input type="checkbox" id="markDownloadedOnExport" checked>
          <span>Mark service as downloaded</span>
        </label>
        ${check.errors?.length
          ? `<small>Incomplete export omits the listed missing/unsupported projected items and leaves the rest of the service intact.</small>`
          : ''}
      </div>
      <div class="export-footer-buttons">
        <button class="primary" id="exportProjectorBtn" ${check.errors?.length?'disabled':''}>Download</button>
        <button class="secondary" id="shareProjectorBtn" ${check.errors?.length?'disabled':''}>Share / Send</button>
        ${check.errors?.length && check.canExportIncomplete ? `
          <button class="primary" id="exportIncompleteProjectorBtn">Download Unfinished Service</button>
          <button class="secondary" id="shareIncompleteProjectorBtn">Share / Send Unfinished</button>` : ''}
      </div>
    </div>`);



  async function performExport(markProjector,allowIncomplete=false,mode='download'){
    if(!remoteAvailable){
      appAlert('The real .osz exporter is available when this project is running through the Cloudflare Worker.');
      return;
    }

    const filename=safeExportFilename(s);
    const params=new URLSearchParams();
    if(markProjector) params.set('markProjector','1');
    if(allowIncomplete) params.set('allowIncomplete','1');
    const url=`/api/services/${encodeURIComponent(s.id)}/export.osz${params.toString()?`?${params}`:''}`;

    const recordExport=()=>{
      if(markProjector){
        s.downloadedForDeviceAt='just now by Steve';
        s.downloadedSnapshot=projectorSnapshot(s);
        state.activity.unshift([currentEditor(),'exported OpenLP service for projector','just now']);
      }else{
        state.activity.unshift([currentEditor(),'exported OpenLP service','just now']);
      }
      persistPlanner();
    };

    if(mode==='share'){
      const button=allowIncomplete?$('#shareIncompleteProjectorBtn'):$('#shareProjectorBtn');
      const original=button?.textContent||'Share / Send';
      if(button){button.disabled=true;button.textContent='Preparing…';}
      try{
        // Fetch only after the explicit button gesture, then hand the completed
        // OpenLP service file to the operating system's native Share Sheet.
        const response=await fetch(url,{credentials:'same-origin',cache:'no-store'});
        if(!response.ok){
          const message=await response.text().catch(()=>'');
          throw new Error(message||`Export failed (${response.status})`);
        }
        const blob=await response.blob();
        // Use opaque binary: .osz is ZIP-structured internally, but telling iOS
        // it is application/zip encourages Files/share targets to treat it as
        // a generic archive.
        const file=new File([blob],filename,{type:'application/octet-stream'});
        const shareData={files:[file]};
        const canShareFiles=typeof navigator.share==='function'
          && typeof navigator.canShare==='function'
          && navigator.canShare(shareData);

        if(!canShareFiles){
          // Graceful fallback on browsers that cannot share arbitrary files.
          downloadUrl(url,filename);
          recordExport();
          sheet.close();
          render();
          appAlert('This browser cannot share the OpenLP file directly, so it has been downloaded instead.');
          return;
        }

        await navigator.share(shareData);
        recordExport();
        sheet.close();
        render();
      }catch(err){
        // Cancelling the iOS Share Sheet is not an export and should not mark
        // the service as downloaded.
        if(err?.name==='AbortError'){
          if(button){button.disabled=false;button.textContent=original;}
          return;
        }
        if(button){button.disabled=false;button.textContent=original;}
        appAlert(`Could not share the OpenLP service.\n\n${err.message||String(err)}`);
      }
      return;
    }

    recordExport();
    downloadUrl(url,filename);
    sheet.close();
    render();
  }

  $('#exportProjectorBtn').onclick=()=>performExport(!!$('#markDownloadedOnExport')?.checked,false,'download');
  $('#shareProjectorBtn').onclick=()=>performExport(!!$('#markDownloadedOnExport')?.checked,false,'share');
  if($('#exportIncompleteProjectorBtn')) $('#exportIncompleteProjectorBtn').onclick=()=>performExport(!!$('#markDownloadedOnExport')?.checked,true,'download');
  if($('#shareIncompleteProjectorBtn')) $('#shareIncompleteProjectorBtn').onclick=()=>performExport(!!$('#markDownloadedOnExport')?.checked,true,'share');
}

$('#servicesBtn').onclick=()=>openServiceSwitcher();
$('#servicesAddBtn').onclick=openAddServiceFromServicesPage;
$('#servicesDeleteSelectedBtn').onclick=confirmDeleteSelectedServices;
$('#servicesCloseBtn').onclick=closeServicesPage;
$('#servicesSyncChurchSuiteBtn').onclick=openChurchSuiteAutoSyncPreview;
$('#libraryBtn').onclick=()=>openLibraryHub();

function libraryMediaEntries(type){
  // Kept for lightweight hub counts before the remote library has loaded.
  return (state.services||[]).flatMap(service=>(service.items||[])
    .filter(item=>item.type===type)
    .flatMap(item=>item.media||[]));
}


async function loadSongStatistics({from='',to='',serviceTypes=[]}={}){
  const qs=new URLSearchParams();
  if(from)qs.set('from',from);
  if(to)qs.set('to',to);
  for(const key of serviceTypes||[])qs.append('serviceType',String(key));
  return apiFetch(`/api/song-usage/stats${qs.toString()?`?${qs}`:''}`);
}
function csvCell(v){return `"${String(v??'').replace(/"/g,'""')}"`}
async function openSongStatistics(initial={mode:'all',from:'',to:'',serviceTypes:[]}){
  openSheet(`<h2>Song statistics</h2><p class="meta">Loading usage history…</p>`);

  const fetchAndDraw=async(mode=initial.mode||'all',from=initial.from||'',to=initial.to||'',selectedTypes=initial.serviceTypes||[])=>{
    const filters={serviceTypes:selectedTypes};
    if(mode==='range'){filters.from=from;filters.to=to;}
    const data=await loadSongStatistics(filters);
    const rows=data.songs||[];
    const availableTypes=data.serviceTypes||[];
    const selectedSet=new Set((selectedTypes||[]).map(String));

    openSheet(`<h2>Song statistics</h2>
      <p class="meta">Usage is recorded when a service is downloaded/shared. Re-exporting the same service on the same service date replaces that service's earlier snapshot.</p>

      <div class="song-stats-filter">
        <div class="song-stats-filter-section">
          <strong>Date</strong>
          <label class="choice-inline"><input type="radio" name="songStatsRangeMode" value="all" ${mode!=='range'?'checked':''}><span>All time</span></label>
          <label class="choice-inline"><input type="radio" name="songStatsRangeMode" value="range" ${mode==='range'?'checked':''}><span>Date range</span></label>
          <div class="song-stats-date-range" id="songStatsDateRange" ${mode==='range'?'':'hidden'}>
            <div class="field"><label>From</label><input id="songStatsFrom" type="date" value="${esc(from)}"></div>
            <div class="field"><label>To</label><input id="songStatsTo" type="date" value="${esc(to)}"></div>
          </div>
        </div>

        <div class="song-stats-filter-section">
          <div class="song-stats-service-filter-head">
            <strong>Service types</strong>
            <span class="meta" id="songStatsServiceSummary">${selectedSet.size?`${selectedSet.size} selected`:'All service types'}</span>
          </div>
          <details class="song-stats-service-picker">
            <summary>${selectedSet.size?`${selectedSet.size} service type${selectedSet.size===1?'':'s'} selected`:'All service types'}</summary>
            <div class="song-stats-service-actions">
              <button class="text-action" type="button" id="songStatsAllServices">All</button>
              <button class="text-action" type="button" id="songStatsClearServices">Clear selection</button>
            </div>
            <div class="song-stats-service-list">
              ${availableTypes.length?availableTypes.map(t=>`
                <label class="song-stats-service-row">
                  <input type="checkbox" data-song-stats-service-type="${esc(t.key)}" ${selectedSet.has(String(t.key))?'checked':''}>
                  <span><strong>${esc(t.name)}</strong><small>${t.serviceDays} recorded service-day${Number(t.serviceDays)===1?'':'s'}</small></span>
                </label>`).join(''):'<p class="meta">No service types have recorded song usage yet.</p>'}
            </div>
          </details>
          <p class="meta">All one-off services are grouped together as <strong>One-off services</strong>.</p>
        </div>

        <button class="secondary compact song-stats-apply" id="applySongStatsFilters">Apply filters</button>
      </div>

      <div class="song-stats-summary">
        <strong>${data.totalUsages||0}</strong><span>song uses</span>
        <strong>${rows.length}</strong><span>songs used</span>
        <strong>${data.serviceDays||0}</strong><span>service-days</span>
      </div>

      <p class="meta song-stats-period">${mode==='range'
        ?`Showing ${esc(from||'earliest')} to ${esc(to||'latest')}`
        :data.firstDay?`All-time history: ${esc(data.firstDay)} to ${esc(data.lastDay||data.firstDay)}`:'All-time history'}
        · ${selectedSet.size?`${selectedSet.size} selected service type${selectedSet.size===1?'':'s'}`:'all service types'}</p>

      <div class="song-stats-actions">
        <button class="secondary compact" id="songStatsRecent">Last used</button>
        <button class="secondary compact" id="songStatsPopular">Most popular</button>
        <button class="secondary compact" id="songStatsSelectVisible">Select visible</button>
        <button class="secondary compact" id="songStatsClassifySelected" disabled>Classify selected</button>
        <button class="primary compact" id="songStatsCsv">Export CSV</button>
      </div>
      <div id="songStatsRows" class="song-stats-list"></div>
      <div class="sheet-actions"><button class="secondary" id="songStatsBack">Back</button></div>`);

    const target=$('#songStatsRows');
    let sortMode='popular';
    const selectedSongIds=new Set();

    const updateSongStatsSelectionState=()=>{
      const button=$('#songStatsClassifySelected');
      if(!button)return;
      const count=selectedSongIds.size;
      button.disabled=count===0;
      button.textContent=count?`Classify selected (${count})`:'Classify selected';
    };

    const statsLibrarySongIds=()=>rows
      .map(r=>songs.find(s=>String(s.id)===String(r.songId)))
      .filter(Boolean)
      .map(s=>String(s.id));

    const renderStats=()=>{
      const sorted=[...rows].sort(sortMode==='recent'
        ?(a,b)=>String(b.lastUsed||'').localeCompare(String(a.lastUsed||''))
        :(a,b)=>(b.uses-a.uses)||String(a.title).localeCompare(String(b.title)));
      target.innerHTML=sorted.length
        ?sorted.map((r,i)=>{
          const librarySong=songs.find(s=>String(s.id)===String(r.songId));
          return `<div class="song-stat-row">
            ${librarySong
              ?`<input class="song-stat-check" type="checkbox" data-select-stat-song="${esc(librarySong.id)}" ${selectedSongIds.has(String(librarySong.id))?'checked':''} aria-label="Select ${esc(r.title)}">`
              :`<span class="song-stat-check-placeholder" aria-hidden="true"></span>`}
            <span class="song-stat-rank">${i+1}</span>
            <div class="song-stat-main">
              <strong>${esc(r.title)}</strong>
              <small>${r.uses} use${r.uses===1?'':'s'} · last used ${esc(formatActivityTime(r.lastUsed))}</small>
              ${librarySong?`<span class="song-classification-chips">${classificationNames(librarySong).map(name=>`<span>${esc(name)}</span>`).join('')}</span>`:''}
            </div>
            ${librarySong?`<button class="secondary compact song-classify-action" type="button" data-classify-stat-song="${esc(r.songId)}">Classify</button>`:''}
          </div>`;
        }).join('')
        :'<p class="meta">No song usage has been recorded for this selection.</p>';

      target.querySelectorAll('[data-select-stat-song]').forEach(box=>box.onchange=()=>{
        const id=String(box.dataset.selectStatSong);
        if(box.checked)selectedSongIds.add(id);
        else selectedSongIds.delete(id);
        updateSongStatsSelectionState();
      });

      target.querySelectorAll('[data-classify-stat-song]').forEach(btn=>btn.onclick=()=>{
        openQuickSongClassification(btn.dataset.classifyStatSong,()=>openSongStatistics({
          mode,from,to,serviceTypes:[...selectedSet]
        }));
      });

      updateSongStatsSelectionState();
    };
    renderStats();

    body.querySelectorAll('input[name="songStatsRangeMode"]').forEach(r=>r.onchange=()=>{
      $('#songStatsDateRange').hidden=!(r.value==='range'&&r.checked);
    });

    const typeChecks=()=>[...body.querySelectorAll('[data-song-stats-service-type]')];
    const refreshTypeSummary=()=>{
      const checked=typeChecks().filter(x=>x.checked).length;
      const summary=$('#songStatsServiceSummary');
      const details=body.querySelector('.song-stats-service-picker summary');
      if(summary)summary.textContent=checked?`${checked} selected`:'All service types';
      if(details)details.textContent=checked?`${checked} service type${checked===1?'':'s'} selected`:'All service types';
    };
    typeChecks().forEach(cb=>cb.onchange=refreshTypeSummary);
    $('#songStatsAllServices').onclick=()=>{typeChecks().forEach(cb=>cb.checked=false);refreshTypeSummary()};
    $('#songStatsClearServices').onclick=()=>{typeChecks().forEach(cb=>cb.checked=false);refreshTypeSummary()};

    $('#applySongStatsFilters').onclick=()=>{
      const selectedMode=body.querySelector('input[name="songStatsRangeMode"]:checked')?.value||'all';
      const f=$('#songStatsFrom')?.value||'';
      const t=$('#songStatsTo')?.value||'';
      if(selectedMode==='range'&&f&&t&&f>t){appAlert('The From date must be before the To date.');return;}
      const checked=typeChecks().filter(x=>x.checked).map(x=>x.dataset.songStatsServiceType);
      fetchAndDraw(selectedMode,f,t,checked);
    };

    $('#songStatsRecent').onclick=()=>{sortMode='recent';renderStats()};
    $('#songStatsPopular').onclick=()=>{sortMode='popular';renderStats()};

    $('#songStatsSelectVisible').onclick=()=>{
      const ids=statsLibrarySongIds();
      const allSelected=ids.length>0 && ids.every(id=>selectedSongIds.has(id));
      for(const id of ids){
        if(allSelected)selectedSongIds.delete(id);
        else selectedSongIds.add(id);
      }
      renderStats();
    };

    $('#songStatsClassifySelected').onclick=()=>{
      if(!selectedSongIds.size)return;
      openBulkSongClassification(
        new Set(selectedSongIds),
        ()=>openSongStatistics({
          mode,
          from,
          to,
          serviceTypes:[...selectedSet]
        })
      );
    };

    $('#songStatsCsv').onclick=()=>{
      const period=mode==='range'?`${from||'start'}-to-${to||'end'}`:'all-time';
      const typeLabel=selectedSet.size?`${selectedSet.size}-service-types`:'all-service-types';
      const lines=[
        ['Song','Uses','Last used','Period from','Period to','Service type selection'].map(csvCell).join(','),
        ...rows.map(r=>[
          r.title,r.uses,r.lastUsed,
          mode==='range'?from:'',
          mode==='range'?to:'',
          selectedSet.size?[...selectedSet].join('|'):'All service types'
        ].map(csvCell).join(','))
      ];
      downloadBlob(new Blob([lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),`openlp-song-usage-${period}-${typeLabel}.csv`);
    };

    $('#songStatsBack').onclick=openLibraryHub;
  };

  try{
    await fetchAndDraw(initial.mode||'all',initial.from||'',initial.to||'',initial.serviceTypes||[]);
  }catch(err){
    openSheet(`<h2>Song statistics</h2><p class="warning-card">${esc(err.message||String(err))}</p><div class="sheet-actions"><button class="secondary" id="songStatsBack">Back</button></div>`);
    $('#songStatsBack').onclick=openLibraryHub;
  }
}

function openLibraryHub(){
  openSheet(`<h2>Library</h2>
    <div class="library-hub-grid">
      <button class="library-card" id="librarySongs"><strong>Song library</strong><span>${songs.length} shared songs</span></button>
      <button class="library-card" id="libraryVideos"><strong>Video library</strong><span>Stored + service-specific files</span></button>
      <button class="library-card" id="libraryImages"><strong>Image library</strong><span>Stored + service-specific files</span></button>
      <button class="library-card" id="libraryPdfs"><strong>PDF library</strong><span>Stored + service-specific presentations</span></button>
      <button class="library-card" id="libraryTemplates"><strong>Service Templates</strong><span>${serviceTemplates().length} saved template${serviceTemplates().length===1?'':'s'} · edit order and sync behaviour</span></button>
      <button class="library-card" id="librarySongStats"><strong>Song statistics</strong><span>Usage recorded when a service is downloaded or shared</span></button>
    </div>
    <p class="meta">Files stored in the OpenLP Planner library survive service deletion. Service-specific files belong only to their service.</p>`);
  setSheetCloseAction(closeSheetSafely);
  $('#librarySongs').onclick=openSongLibrary;
  $('#libraryVideos').onclick=()=>openMediaLibrary('video');
  $('#libraryImages').onclick=()=>openMediaLibrary('images');
  $('#libraryPdfs').onclick=()=>openMediaLibrary('pdf');
  $('#libraryTemplates').onclick=()=>openServiceTemplateManager('library');
  $('#librarySongStats').onclick=openSongStatistics;
}

function retainedMediaGroups(type,assets){
  if(type!=='pdf')return assets.map(a=>({key:a.id,title:a.originalName,assets:[a],usages:a.usages||[]}));
  const map=new Map();
  for(const a of assets){
    const key=a.libraryGroupId||a.id;
    if(!map.has(key))map.set(key,{key,title:String(a.originalName||'PDF').replace(/-page-\d+\.jpg$/i,''),assets:[],usages:[]});
    const g=map.get(key);g.assets.push(a);
    for(const u of a.usages||[])if(!g.usages.some(x=>x.serviceId===u.serviceId))g.usages.push(u);
  }
  return [...map.values()];
}

function serviceMediaFolders(rows){
  const services=new Map();

  for(const row of rows){
    const serviceId=String(row.serviceId||'unknown');
    if(!services.has(serviceId)){
      services.set(serviceId,{
        serviceId,
        title:row.serviceTitle||'Unknown service',
        date:row.serviceDate||'',
        assets:[],
        items:new Map()
      });
    }

    const service=services.get(serviceId);
    service.assets.push(row);

    const itemId=String(row.itemId||'unassigned');
    if(!service.items.has(itemId)){
      service.items.set(itemId,{
        itemId,
        title:String(row.itemTitle||'Untitled item'),
        itemType:String(row.itemType||''),
        assets:[]
      });
    }
    service.items.get(itemId).assets.push(row);
  }

  return [...services.values()]
    .map(service=>({
      ...service,
      items:[...service.items.values()].sort((a,b)=>String(a.title).localeCompare(String(b.title)))
    }))
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}


async function openDirectMediaLibraryUpload(type,onBack,{lockedFolderId='',lockedFolderName=''}={}){
  const label=mediaTypeLabel(type);
  const folders=await loadPlannerMediaFolders(type).catch(()=>[]);
  openSheet(`<h2>Add to ${label} library</h2>
    <p class="meta">These files are stored directly in the OpenLP Planner library and are not tied to a service.</p>
    <div class="field">
      <label>${type==='images'?'Images':type==='video'?'Video':'PDF'}</label>
      <input id="directLibraryFiles" type="file"
        accept="${type==='images'?'image/jpeg,image/png':type==='video'?'video/*':'application/pdf'}"
        ${type==='images'?'multiple':''}>
      ${type==='images'?'<p class="meta">Images are added in filename order by default.</p>':''}
    </div>
    ${lockedFolderId?`
      <div class="field"><label>Folder</label><div class="locked-library-folder">▰ ${esc(lockedFolderName||'Selected folder')}</div></div>
    `:`
      <div class="field">
        <label>Folder</label>
        <select id="directLibraryFolder">
          <option value="">Unfiled</option>
          ${folders.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}
        </select>
      </div>
      <div class="direct-library-new-folder">
        <button class="secondary compact" id="directCreateFolder" type="button">＋ New folder</button>
      </div>`}
    <p class="meta" id="directLibraryUploadStatus"></p>
    <div class="sheet-actions">
      <button class="secondary" id="cancelDirectLibraryUpload">Back</button>
      <button class="primary" id="confirmDirectLibraryUpload">Add to library</button>
    </div>`);

  $('#cancelDirectLibraryUpload').onclick=()=>onBack?onBack():openMediaLibrary(type);

  if($('#directCreateFolder'))$('#directCreateFolder').onclick=async()=>{
    const name=await appPrompt('Folder name','',{title:'New folder',confirmLabel:'Create folder'});
    if(!name?.trim())return;
    createPlannerMediaFolder(type,name.trim()).then(({folder})=>{
      openDirectMediaLibraryUpload(type,onBack);
    }).catch(err=>appAlert(err.message||String(err)));
  };

  $('#confirmDirectLibraryUpload').onclick=async()=>{
    const rawFiles=[...($('#directLibraryFiles')?.files||[])];
    const files=type==='images'?sortFilesByName(rawFiles):rawFiles;
    if(!files.length)return;
    const btn=$('#confirmDirectLibraryUpload');
    const status=$('#directLibraryUploadStatus');
    const folderId=lockedFolderId||$('#directLibraryFolder')?.value||'';
    btn.disabled=true;
    btn.textContent='Uploading…';

    try{
      if(type==='pdf'){
        status.textContent='Converting PDF to image slides…';
        const groupId=crypto.randomUUID();
        const pages=await convertPdfToImageFiles(files[0],(page,total)=>{
          status.textContent=`Converting PDF… ${page}/${total}`;
        });
        let done=0;
        for(const pageFile of pages){
          done++;
          status.textContent=`Uploading PDF pages… ${done}/${pages.length}`;
          await uploadDirectLibraryMedia(pageFile,'pdf',{libraryGroupId:groupId,libraryFolderId:folderId});
        }
      }else{
        let done=0;
        for(const file of files){
          done++;
          status.textContent=`Uploading ${done}/${files.length}…`;
          await uploadDirectLibraryMedia(file,type,{libraryFolderId:folderId});
        }
      }
      status.textContent='Added to library ✓';
      setTimeout(()=>openMediaLibrary(type),450);
    }catch(err){
      status.textContent=`Upload failed: ${err.message||String(err)}`;
      status.classList.add('save-error');
      btn.disabled=false;
      btn.textContent='Add to library';
    }
  };
}


const mediaLibraryViewState=new Map();
function captureMediaLibraryView(type){
  const openFolders=[...body.querySelectorAll('details[data-library-folder-key][open]')]
    .map(el=>String(el.dataset.libraryFolderKey||''));
  mediaLibraryViewState.set(String(type),{
    openFolders,
    scrollTop:body.scrollTop||0
  });
}
function mediaLibraryFolderOpen(type,key,defaultOpen=false){
  const view=mediaLibraryViewState.get(String(type));
  if(!view)return defaultOpen;
  return view.openFolders.includes(String(key));
}
function refreshMediaLibrary(type){
  captureMediaLibraryView(type);
  return openMediaLibrary(type,{preserveView:true});
}

async function openMediaLibrary(type,{preserveView=false}={}){
  const label=mediaTypeLabel(type);
  if(!preserveView)mediaLibraryViewState.delete(String(type));
  openSheet(`<h2>${label} library</h2><p class="meta">Loading OpenLP Planner library…</p>`);
  try{
    const [data,folderRows]=await Promise.all([
      loadPlannerMediaLibrary(type),
      loadPlannerMediaFolders(type)
    ]);
    const retained=retainedMediaGroups(type,data.retained||[]);
    const serviceFolders=serviceMediaFolders(data.serviceSpecific||[]);

    const folderMap=new Map(folderRows.map(f=>[String(f.id),{...f,entries:[]}]));
    const unfiled={id:'',name:'Unfiled',mediaType:type,entries:[]};

    for(const entry of retained){
      const folderId=String(entry.assets[0]?.libraryFolderId||'');
      const target=folderId&&folderMap.has(folderId)?folderMap.get(folderId):unfiled;
      target.entries.push(entry);
    }

    const libraryFolders=[...folderMap.values()];
    if(unfiled.entries.length)libraryFolders.push(unfiled);
    const selectedEntries=new Set();

    const renderEntry=(entry,index,folderId)=>{
      const first=entry.assets[0];
      const preview=type==='video'
        ?`<button class="library-preview-button video-preview-button" type="button" data-view-library-entry="${index}" title="Preview ${esc(entry.title)}" aria-label="Preview ${esc(entry.title)}"><span class="media-library-icon">▶</span></button>`
        :`<button class="library-preview-button" type="button" data-view-library-entry="${index}" title="View larger" aria-label="View ${esc(entry.title)}"><img class="media-library-thumb" src="/api/media/${encodeURIComponent(first.id)}" alt=""></button>`;
      const used=entry.usages||[];
      return `<div class="media-library-row folder-media-row" draggable="true" data-drag-library-entry="${index}">
        <input class="media-select-check" type="checkbox" data-select-library-entry="${index}" aria-label="Select ${esc(entry.title)}">
        ${preview}
        <div class="media-library-info">
          <strong>${esc(entry.title)}</strong>
          <small>${entry.assets.length>1?`${entry.assets.length} pages · `:''}${used.length?`Used in: ${esc(used.map(u=>u.title).join(', '))}`:'Not used in any service'}</small>
        </div>
        <div class="folder-media-actions media-quiet-actions">
          ${(type==='images'||type==='video')?`<button class="media-icon-action" data-download-library-entry="${index}" title="Download" aria-label="Download ${esc(entry.title)}">⇩</button>
          <button class="media-icon-action" data-rename-library-entry="${index}" title="Rename" aria-label="Rename ${esc(entry.title)}">✎</button>`:''}
          <button class="media-icon-action" data-move-library-entry="${index}" data-current-folder="${esc(folderId)}" title="Move" aria-label="Move ${esc(entry.title)}">↗</button>
          <button class="media-icon-action danger-quiet" data-retained-delete="${index}" ${used.length?'disabled':''}
            title="${used.length?'Still used by a service':'Delete unused library file'}" aria-label="Delete ${esc(entry.title)}">×</button>
        </div>
      </div>`;
    };

    // Give every retained entry a stable view index for move/delete actions.
    const allEntries=[];
    for(const folder of libraryFolders){
      for(const entry of folder.entries){
        entry.__viewIndex=allEntries.length;
        allEntries.push(entry);
      }
    }

    openSheet(`<h2>${label} library</h2>
      <section class="media-library-section">
        <div class="media-library-section-title">
          <div><h3>OpenLP Planner library</h3><span>Retained for future services</span></div>
          <div class="media-library-head-actions">
            <button class="primary compact" id="addDirectLibraryMedia">＋ Add to library</button>
            <button class="secondary compact" id="moveSelectedLibraryMedia" disabled>Move selected</button>
            <button class="secondary compact" id="createMediaFolder">＋ Folder</button>
          </div>
        </div>

        <div class="planner-folder-list">
          ${libraryFolders.length?libraryFolders.map(folder=>`
            <details class="planner-library-folder" data-drop-folder="${esc(folder.id)}" data-library-folder-key="retained:${esc(folder.id||'unfiled')}" ${mediaLibraryFolderOpen(type,`retained:${folder.id||'unfiled'}`,!folder.id)?'open':''}>
              <summary>
                <span class="planner-folder-name"><span class="folder-icon">▰</span><strong>${esc(folder.name)}</strong><small>${folder.entries.length} item${folder.entries.length===1?'':'s'}</small></span>
                <span class="planner-folder-actions">
                  <button class="text-action" type="button" data-add-to-folder="${esc(folder.id)}" data-folder-name="${esc(folder.name)}">＋ Add</button>
                  ${folder.id?`<button class="text-action" type="button" data-rename-folder="${esc(folder.id)}" data-folder-name="${esc(folder.name)}">Rename</button>
                  <button class="text-action" type="button" data-delete-folder="${esc(folder.id)}" ${folder.entries.length?'disabled':''}>Delete folder</button>`:''}
                </span>
              </summary>
              <div class="media-library-list">
                ${folder.entries.length
                  ?folder.entries.map(entry=>renderEntry(entry,entry.__viewIndex,folder.id)).join('')
                  :'<p class="meta empty-folder-note">This folder is empty.</p>'}
              </div>
            </details>`).join('')
          :'<p class="meta">No retained files or folders yet.</p>'}
        </div>
      </section>

      <section class="media-library-section">
        <div class="media-library-section-title"><h3>Service specific</h3><span>Removed when that service is deleted</span></div>
        <div class="service-media-folders">
          ${serviceFolders.length?serviceFolders.map((folder)=>`<details class="service-media-folder planner-library-folder" data-library-folder-key="service:${esc(folder.serviceId)}" ${mediaLibraryFolderOpen(type,`service:${folder.serviceId}`,false)?'open':''}>
            <summary>
              <span class="planner-folder-name">
                <span class="folder-icon">▰</span>
                <strong>${esc(folder.title)}</strong>
                <small>${folder.assets.length} file${folder.assets.length===1?'':'s'} · ${folder.items.length} item folder${folder.items.length===1?'':'s'}</small>
              </span>
              <span class="service-folder-date">${esc(folder.date||'')}</span>
            </summary>

            <div class="service-item-media-folders">
              ${folder.items.map(item=>`
                <details class="service-item-media-folder" data-library-folder-key="service-item:${esc(folder.serviceId)}:${esc(item.itemId)}" ${mediaLibraryFolderOpen(type,`service-item:${folder.serviceId}:${item.itemId}`,false)?'open':''}>
                  <summary>
                    <span class="planner-folder-name">
                      <span class="folder-icon">▰</span>
                      <strong>${esc(item.title)}</strong>
                      <small>${item.assets.length} file${item.assets.length===1?'':'s'}</small>
                    </span>
                  </summary>
                  <div class="media-library-list">
                    ${item.assets.map(a=>`<div class="media-library-row">
                      ${type==='video'
                        ?`<button class="library-preview-button video-preview-button" type="button" data-view-service-media="${esc(a.id)}" data-view-service-name="${esc(a.originalName)}" title="Preview ${esc(a.originalName)}"><span class="media-library-icon">▶</span></button>`
                        :`<button class="library-preview-button" type="button" data-view-service-media="${esc(a.id)}" data-view-service-name="${esc(a.originalName)}" title="View larger"><img class="media-library-thumb" src="/api/media/${encodeURIComponent(a.id)}" alt=""></button>`}
                      <div class="media-library-info">
                        <strong>${esc(a.originalName)}</strong>
                        <small>${a.sourceLibraryId?'Already stored in OpenLP Planner library':'Service specific only'}</small>
                      </div>
                      <div class="folder-media-actions media-quiet-actions">
                        ${(type==='images'||type==='video')?`<button class="media-icon-action" data-download-service-media="${esc(a.id)}" title="Download" aria-label="Download ${esc(a.originalName)}">⇩</button>
                        <button class="media-icon-action" data-rename-service-media="${esc(a.id)}" data-service-media-name="${esc(a.originalName)}" title="Rename" aria-label="Rename ${esc(a.originalName)}">✎</button>`:''}
                        ${a.sourceLibraryId
                          ?'<span class="library-stored-chip">Stored</span>'
                          :`<button class="media-icon-action store-action" data-retain-service="${esc(a.id)}" data-service-item="${esc(a.itemId||'')}" title="Store in OpenLP Planner library" aria-label="Store in library">＋</button>`}
                      </div>
                    </div>`).join('')}
                  </div>
                </details>`).join('')}
            </div>
          </details>`).join('')
          :`<p class="meta">No service-specific ${label.toLowerCase()} files.</p>`}
        </div>
      </section>
      <div class="sheet-actions"><button class="secondary" id="backLibraryHub">Back</button></div>`);

    const savedView=mediaLibraryViewState.get(String(type));
    if(savedView)requestAnimationFrame(()=>{body.scrollTop=savedView.scrollTop||0});
    body.querySelectorAll('details[data-library-folder-key]').forEach(el=>el.addEventListener('toggle',()=>captureMediaLibraryView(type)));

    $('#backLibraryHub').onclick=openLibraryHub;
    setSheetCloseAction(openLibraryHub);
    $('#addDirectLibraryMedia').onclick=()=>{captureMediaLibraryView(type);openDirectMediaLibraryUpload(type,()=>refreshMediaLibrary(type));};

    const updateBulkMove=()=>{
      const btn=$('#moveSelectedLibraryMedia');
      if(!btn)return;
      btn.disabled=!selectedEntries.size;
      btn.textContent=selectedEntries.size?`Move selected (${selectedEntries.size})`:'Move selected';
    };

    body.querySelectorAll('[data-select-library-entry]').forEach(cb=>cb.onchange=()=>{
      const idx=Number(cb.dataset.selectLibraryEntry);
      if(cb.checked)selectedEntries.add(idx);else selectedEntries.delete(idx);
      updateBulkMove();
    });

    const moveEntriesToFolder=async(indexes,folderId)=>{
      const ids=[...indexes].flatMap(i=>allEntries[Number(i)]?.assets?.map(a=>a.id)||[]);
      if(!ids.length)return;
      await movePlannerLibraryAssets(ids,folderId);
      refreshMediaLibrary(type);
    };

    $('#moveSelectedLibraryMedia').onclick=()=>{
      if(!selectedEntries.size)return;
      openSheet(`<h2>Move selected files</h2>
        <p class="meta">${selectedEntries.size} selected item${selectedEntries.size===1?'':'s'}.</p>
        <div class="field"><label>Destination folder</label><select id="bulkMoveMediaFolder">
          <option value="">Unfiled</option>
          ${folderRows.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}
        </select></div>
        <div class="sheet-actions"><button class="secondary" id="cancelBulkMoveMedia">Cancel</button><button class="primary" id="confirmBulkMoveMedia">Move selected</button></div>`);
      $('#cancelBulkMoveMedia').onclick=()=>refreshMediaLibrary(type);
      $('#confirmBulkMoveMedia').onclick=async()=>{
        const btn=$('#confirmBulkMoveMedia');
        btn.disabled=true;btn.textContent='Moving…';
        try{await moveEntriesToFolder(selectedEntries,$('#bulkMoveMediaFolder').value||'')}
        catch(err){appAlert(err.message||String(err));refreshMediaLibrary(type)}
      };
    };

    body.querySelectorAll('[data-add-to-folder]').forEach(btn=>btn.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      const folderId=btn.dataset.addToFolder||'';
      const folderName=btn.dataset.folderName||'Unfiled';
      btn.disabled=true;
      const old=btn.textContent;
      btn.textContent='Loading…';
      setTimeout(()=>openDirectMediaLibraryUpload(type,()=>refreshMediaLibrary(type),{lockedFolderId:folderId,lockedFolderName:folderName}),60);
    });

    // Desktop drag/drop: dragging one unselected row moves just it; dragging a
    // selected row moves the whole current selection.
    body.querySelectorAll('[data-drag-library-entry]').forEach(row=>{
      row.addEventListener('dragstart',e=>{
        const idx=Number(row.dataset.dragLibraryEntry);
        const dragIndexes=selectedEntries.has(idx)?[...selectedEntries]:[idx];
        e.dataTransfer.setData('application/x-openlp-library-entries',JSON.stringify(dragIndexes));
        e.dataTransfer.effectAllowed='move';
        row.classList.add('dragging-media');
      });
      row.addEventListener('dragend',()=>row.classList.remove('dragging-media'));
    });
    body.querySelectorAll('[data-drop-folder]').forEach(folder=>{
      folder.addEventListener('dragover',e=>{
        if(e.dataTransfer.types.includes('application/x-openlp-library-entries')){
          e.preventDefault();e.dataTransfer.dropEffect='move';folder.classList.add('media-drop-target');
        }
      });
      folder.addEventListener('dragleave',()=>folder.classList.remove('media-drop-target'));
      folder.addEventListener('drop',async e=>{
        e.preventDefault();folder.classList.remove('media-drop-target');
        try{
          const indexes=JSON.parse(e.dataTransfer.getData('application/x-openlp-library-entries')||'[]');
          await moveEntriesToFolder(indexes,folder.dataset.dropFolder||'');
        }catch(err){appAlert(err.message||String(err))}
      });
    });

    body.querySelectorAll('[data-view-library-entry]').forEach(btn=>btn.onclick=()=>{
      const entry=allEntries[Number(btn.dataset.viewLibraryEntry)];
      if(entry){captureMediaLibraryView(type);openMediaFullPreview(type,entry.title,entry.assets,()=>refreshMediaLibrary(type));}
    });

    body.querySelectorAll('[data-view-service-media]').forEach(btn=>btn.onclick=()=>{
      const asset=(data.serviceSpecific||[]).find(a=>String(a.id)===String(btn.dataset.viewServiceMedia));
      if(asset){captureMediaLibraryView(type);openMediaFullPreview(type,btn.dataset.viewServiceName||asset.originalName,[asset],()=>refreshMediaLibrary(type));}
    });

    body.querySelectorAll('[data-download-library-entry]').forEach(btn=>btn.onclick=()=>{
      const entry=allEntries[Number(btn.dataset.downloadLibraryEntry)];
      if(entry)entry.assets.forEach(a=>downloadPlannerMediaAsset(a.id));
    });
    body.querySelectorAll('[data-download-service-media]').forEach(btn=>btn.onclick=()=>downloadPlannerMediaAsset(btn.dataset.downloadServiceMedia));

    body.querySelectorAll('[data-rename-library-entry]').forEach(btn=>btn.onclick=()=>{
      const entry=allEntries[Number(btn.dataset.renameLibraryEntry)];
      if(!entry)return;
      const current=entry.title||entry.assets[0]?.originalName||'File';
      openSheet(`<h2>Rename file</h2><div class="field"><label>File name</label><input id="renameLibraryFileName" value="${esc(current)}"></div>
        <p class="meta" id="renameLibraryStatus"></p>
        <div class="sheet-actions"><button class="secondary" id="cancelRenameLibraryFile">Back</button><button class="secondary" id="saveRenameLibraryFile">Save</button><button class="primary" id="confirmRenameLibraryFile">Done</button></div>`);
      $('#cancelRenameLibraryFile').onclick=()=>refreshMediaLibrary(type);
      const doRename=async(stay)=>{
        const name=$('#renameLibraryFileName').value.trim();
        if(!name)return;
        const status=$('#renameLibraryStatus');
        try{
          await renamePlannerMediaAsset(entry.assets[0].id,name);
          entry.title=name;
          if(entry.assets[0])entry.assets[0].originalName=name;
          if(stay){status.textContent='Saved ✓';$('#renameLibraryFileName').focus();}
          else refreshMediaLibrary(type);
        }catch(err){status.textContent=`Not saved: ${err.message||String(err)}`}
      };
      $('#saveRenameLibraryFile').onclick=()=>doRename(true);
      $('#confirmRenameLibraryFile').onclick=()=>doRename(false);
    });

    body.querySelectorAll('[data-rename-service-media]').forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.renameServiceMedia;
      const current=btn.dataset.serviceMediaName||'File';
      openSheet(`<h2>Rename file</h2><div class="field"><label>File name</label><input id="renameServiceMediaName" value="${esc(current)}"></div>
        <p class="meta" id="renameServiceMediaStatus"></p>
        <div class="sheet-actions"><button class="secondary" id="cancelRenameServiceMedia">Back</button><button class="secondary" id="saveRenameServiceMedia">Save</button><button class="primary" id="confirmRenameServiceMedia">Done</button></div>`);
      $('#cancelRenameServiceMedia').onclick=()=>refreshMediaLibrary(type);
      const doServiceRename=async(stay)=>{
        const name=$('#renameServiceMediaName').value.trim();
        if(!name)return;
        const status=$('#renameServiceMediaStatus');
        try{
          await renamePlannerMediaAsset(id,name);
          if(stay){status.textContent='Saved ✓';$('#renameServiceMediaName').focus();}
          else refreshMediaLibrary(type);
        }catch(err){status.textContent=`Not saved: ${err.message||String(err)}`}
      };
      $('#saveRenameServiceMedia').onclick=()=>doServiceRename(true);
      $('#confirmRenameServiceMedia').onclick=()=>doServiceRename(false);
    });

    $('#createMediaFolder').onclick=()=>{
      openSheet(`<h2>Create ${label.toLowerCase()} folder</h2>
        <div class="field"><label>Folder name</label><input id="newMediaFolderName" placeholder="e.g. Notices"></div>
        <div class="sheet-actions"><button class="secondary" id="cancelCreateMediaFolder">Cancel</button><button class="primary" id="confirmCreateMediaFolder">Create folder</button></div>`);
      $('#cancelCreateMediaFolder').onclick=()=>refreshMediaLibrary(type);
      $('#confirmCreateMediaFolder').onclick=async()=>{
        const name=$('#newMediaFolderName').value.trim();
        if(!name)return;
        try{
          await createPlannerMediaFolder(type,name);
          refreshMediaLibrary(type);
        }catch(err){appAlert(err.message||String(err))}
      };
    };

    body.querySelectorAll('[data-rename-folder]').forEach(btn=>btn.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      const id=btn.dataset.renameFolder;
      const oldName=btn.dataset.folderName||'Folder';
      openSheet(`<h2>Rename folder</h2>
        <div class="field"><label>Folder name</label><input id="renameMediaFolderName" value="${esc(oldName)}"></div>
        <p class="meta" id="renameMediaFolderStatus"></p>
        <div class="sheet-actions"><button class="secondary" id="cancelRenameMediaFolder">Back</button><button class="secondary" id="saveRenameMediaFolder">Save</button><button class="primary" id="confirmRenameMediaFolder">Done</button></div>`);
      $('#cancelRenameMediaFolder').onclick=()=>refreshMediaLibrary(type);
      const doFolderRename=async(stay)=>{
        const name=$('#renameMediaFolderName').value.trim();
        if(!name)return;
        const status=$('#renameMediaFolderStatus');
        try{
          await renamePlannerMediaFolder(id,name);
          if(stay){status.textContent='Saved ✓';$('#renameMediaFolderName').focus();}
          else refreshMediaLibrary(type);
        }catch(err){status.textContent=`Not saved: ${err.message||String(err)}`}
      };
      $('#saveRenameMediaFolder').onclick=()=>doFolderRename(true);
      $('#confirmRenameMediaFolder').onclick=()=>doFolderRename(false);
    });

    body.querySelectorAll('[data-delete-folder]').forEach(btn=>btn.onclick=async e=>{
      e.preventDefault();e.stopPropagation();
      if(btn.disabled)return;
      if(!(await appConfirm('Delete this empty folder?',{title:'Delete folder',confirmLabel:'Delete',danger:true})))return;
      try{await deletePlannerMediaFolder(btn.dataset.deleteFolder);refreshMediaLibrary(type)}
      catch(err){appAlert(err.message||String(err))}
    });

    body.querySelectorAll('[data-move-library-entry]').forEach(btn=>btn.onclick=()=>{
      const entry=allEntries[Number(btn.dataset.moveLibraryEntry)];
      if(!entry)return;
      const current=btn.dataset.currentFolder||'';
      openSheet(`<h2>Move ${esc(entry.title)}</h2>
        <div class="field"><label>Destination folder</label>
          <select id="moveMediaFolder">
            <option value="">Unfiled</option>
            ${folderRows.map(f=>`<option value="${esc(f.id)}" ${String(f.id)===String(current)?'selected':''}>${esc(f.name)}</option>`).join('')}
          </select>
        </div>
        <div class="sheet-actions"><button class="secondary" id="cancelMoveMedia">Cancel</button><button class="primary" id="confirmMoveMedia">Move</button></div>`);
      $('#cancelMoveMedia').onclick=()=>refreshMediaLibrary(type);
      $('#confirmMoveMedia').onclick=async()=>{
        const folderId=$('#moveMediaFolder').value;
        try{
          await movePlannerLibraryAssets(entry.assets.map(a=>a.id),folderId);
          refreshMediaLibrary(type);
        }catch(err){appAlert(err.message||String(err))}
      };
    });

    body.querySelectorAll('[data-retain-service]').forEach(btn=>btn.onclick=async()=>{
      btn.disabled=true;btn.textContent='Storing…';
      try{
        const assetId=btn.dataset.retainService;
        const asset=(data.serviceSpecific||[]).find(a=>String(a.id)===String(assetId));
        const service=(state.services||[]).find(s=>String(s.id)===String(asset?.serviceId));
        const item=service?.items?.find(i=>String(i.id)===String(asset?.itemId));
        const baseName=item?.title||'Stored media';
        const folder=await ensurePlannerMediaFolder(type,baseName,service?.dateISO||asset?.serviceDate||'');
        await retainServiceMedia(assetId,type,'',folder?.id||'');
        refreshMediaLibrary(type);
      }catch(err){
        appAlert(err.message||String(err));btn.disabled=false;btn.textContent='Store in library'
      }
    });

    body.querySelectorAll('[data-retained-delete]').forEach(btn=>btn.onclick=async()=>{
      if(btn.disabled)return;
      const entry=allEntries[Number(btn.dataset.retainedDelete)];
      if(!entry)return;
      btn.disabled=true;
      try{
        for(const a of entry.assets)await deleteMediaAsset(a.id);
        refreshMediaLibrary(type);
      }catch(err){appAlert(err.message||String(err));btn.disabled=false}
    });
  }catch(err){
    openSheet(`<h2>${label} library</h2><div class="warning-card"><strong>Library could not be loaded.</strong><p>${esc(err.message||String(err))}</p></div><div class="sheet-actions"><button class="secondary" id="backLibraryHub">Back</button></div>`);
    $('#backLibraryHub').onclick=openLibraryHub;
  }
}


$('#runSheetBtn').onclick=()=>{
  const run=$('#runSheet');
  $('#runBody').innerHTML=`<div class="run-title"><h2>${esc(state.service.title)}</h2><p>${esc(state.service.date)}</p></div>
  ${state.items.map((x,i)=>`<div class="run-row">
    <div class="run-num">${i+1}</div>
    <div class="run-item"><strong>${esc(x.title)}</strong>
      ${x.type==='song'&&x.musicNote?`<div class="run-music-note">♪ ${esc(x.musicNote)}</div>`:''}
      ${x.notes?`<div class="run-note">${esc(x.notes)}</div>`:''}
      ${x.type==='bible'&&x.passage?`<div class="run-note">${esc(x.passage)}</div>`:''}
    </div>
    <div class="run-person">${esc(x.person||'')}</div>
  </div>`).join('')}`;
  run.showModal();
};
$('#runClose').onclick=()=>$('#runSheet').close();
$('#runPrint').onclick=()=>window.print();
setCurrentEditor(currentEditor());
render();
initFloatingAdd();
bootstrapRemote();

setTimeout(()=>{
  if(!currentService() || lastScreen()==='services'){
    openServicesPage();
  }else{
    rememberLastScreen('planner');
  }
},180);
