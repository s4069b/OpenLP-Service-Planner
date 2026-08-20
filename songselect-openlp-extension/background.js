const DEFAULT_PLANNER_URL='';
const PENDING_KEY='pendingOpenLPSongSelectSong';
const PLANNER_URL_KEY='plannerUrl';

async function configuredPlannerBaseUrl(){
  const stored=await chrome.storage.sync.get(PLANNER_URL_KEY);
  const raw=String(stored?.[PLANNER_URL_KEY]||DEFAULT_PLANNER_URL).trim();
  if(!raw)throw new Error('Planner URL is not configured. Open the extension Options page and save your Planner address first.');
  const url=new URL(raw);
  if(!/^https?:$/.test(url.protocol))throw new Error('Planner URL must use http or https.');
  url.search='';
  url.hash='';
  return url;
}

function plannerPattern(plannerBase){
  return `${plannerBase.origin}/*`;
}

async function ensurePlannerPermission(plannerBase){
  const origins=[plannerPattern(plannerBase)];
  const has=await chrome.permissions.contains({origins});
  if(!has){
    throw new Error('The extension does not yet have permission to access the Planner site. Open the extension Options page, save the Planner URL, and grant access.');
  }
}

async function readSongFromPage(tabId){
  const results=await chrome.scripting.executeScript({
    target:{tabId},
    world:'MAIN',
    func:async()=>{
      const match=location.pathname.match(/\/songs\/(\d+)\/([^/]+)/i);
      if(!match)throw new Error('Open a SongSelect song first.');
      if(!/\/viewlyrics(?:\/|$)/i.test(location.pathname))throw new Error('Open the Lyrics page first.');

      const downloadButton=document.getElementById('lyricsDownloadButton');
      if(!downloadButton)throw new Error('SongSelect lyrics Download button was not found.');

      downloadButton.click();

      const response=await fetch(
        `/api/GetSongDetails?songNumber=${encodeURIComponent(match[1])}&slug=${encodeURIComponent(match[2])}`,
        {credentials:'include'}
      );
      if(!response.ok)throw new Error(`SongSelect returned HTTP ${response.status}.`);
      const json=await response.json();
      const song=json?.payload;
      const lyricsProduct=song?.products?.lyrics;
      if(!lyricsProduct?.authorized)throw new Error(lyricsProduct?.noAuthReason||'Lyrics are not authorised for this SongSelect account.');
      if(!Array.isArray(song?.lyrics)||!song.lyrics.length)throw new Error('SongSelect returned no lyrics.');
      return song;
    }
  });

  const result=results?.[0];
  if(!result)throw new Error('SongSelect did not return a song.');
  if(result.error)throw new Error(result.error.message||'SongSelect page script failed.');
  return result.result;
}

async function deliverToPlannerTab(tabId){
  const results=await chrome.scripting.executeScript({
    target:{tabId},
    world:'ISOLATED',
    func:async pendingKey=>{
      const stored=await chrome.storage.local.get(pendingKey);
      const pending=stored?.[pendingKey];
      if(!pending?.song)throw new Error('No pending SongSelect song was found.');

      if(Date.now()-Number(pending.createdAt||0)>5*60*1000){
        await chrome.storage.local.remove(pendingKey);
        throw new Error('The pending SongSelect transfer expired.');
      }

      window.postMessage({
        type:'openlp-songselect-extension-song',
        version:1,
        song:pending.song
      },location.origin);

      return true;
    },
    args:[PENDING_KEY]
  });

  const result=results?.[0];
  if(result?.error)throw new Error(result.error.message||'Could not deliver song to Planner.');
  await chrome.storage.local.remove(PENDING_KEY);
}

async function tabIsConfiguredPlanner(tabId,plannerBase){
  if(!tabId)return false;
  try{
    const tab=await chrome.tabs.get(tabId);
    if(!tab?.url)return false;
    const url=new URL(tab.url);
    return url.origin===plannerBase.origin;
  }catch(_){
    return false;
  }
}

async function findExistingPlannerTab(plannerBase,preferredTabId){
  if(await tabIsConfiguredPlanner(preferredTabId,plannerBase)){
    return await chrome.tabs.get(preferredTabId);
  }

  const tabs=await chrome.tabs.query({});
  const matches=tabs.filter(tab=>{
    try{
      if(!tab?.url)return false;
      return new URL(tab.url).origin===plannerBase.origin;
    }catch(_){
      return false;
    }
  });

  if(!matches.length)return null;

  // Prefer the active Planner tab, then one in the current window, then any match.
  return matches.find(tab=>tab.active)
    || matches.find(tab=>tab.windowId!==undefined)
    || matches[0];
}

async function focusTab(tab){
  if(!tab?.id)return;
  await chrome.tabs.update(tab.id,{active:true});
  if(tab.windowId!==undefined){
    try{await chrome.windows.update(tab.windowId,{focused:true});}catch(_){}
  }
}

async function sendSongToPlanner(song,senderTab){
  const plannerBase=await configuredPlannerBaseUrl();
  await ensurePlannerPermission(plannerBase);
  await chrome.storage.local.set({[PENDING_KEY]:{song,createdAt:Date.now()}});

  const existing=await findExistingPlannerTab(plannerBase,senderTab?.openerTabId);
  if(existing?.id){
    await focusTab(existing);
    await deliverToPlannerTab(existing.id);
    return {reused:true};
  }

  const target=new URL(plannerBase.href);
  target.searchParams.set('songselect','extension');
  const tab=await chrome.tabs.create({url:target.href,active:true});

  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Planner opened but did not finish loading.'));
    },15000);

    const listener=async(changedTabId,info)=>{
      if(changedTabId!==tab.id||info.status!=='complete')return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      try{
        await deliverToPlannerTab(tab.id);
        resolve();
      }catch(error){
        reject(error);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

  return {reused:false};
}

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message?.type!=='openlp-send-songselect')return;

  (async()=>{
    try{
      const tabId=sender?.tab?.id;
      if(!tabId)throw new Error('SongSelect tab could not be identified.');
      const song=await readSongFromPage(tabId);
      const delivery=await sendSongToPlanner(song,sender.tab);
      sendResponse({ok:true,reused:delivery.reused});
    }catch(error){
      sendResponse({ok:false,error:error?.message||String(error)});
    }
  })();

  return true;
});
