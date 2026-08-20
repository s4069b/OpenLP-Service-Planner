const BUTTON_ID='openlp-songselect-send-button';

function isLyricsPage(){
  return /\/songs\/\d+\/[^/]+\/viewlyrics(?:\/|$)/i.test(location.pathname);
}

function ensureButton(){
  const existing=document.getElementById(BUTTON_ID);
  if(!isLyricsPage()){
    existing?.remove();
    return;
  }
  if(existing)return;

  const button=document.createElement('button');
  button.id=BUTTON_ID;
  button.type='button';
  button.textContent='Send to OpenLP';
  button.title='Send this authorised SongSelect song to OpenLP Service Planner';
  button.addEventListener('click',async()=>{
    button.disabled=true;
    button.textContent='Sending…';
    try{
      const result=await chrome.runtime.sendMessage({type:'openlp-send-songselect'});
      if(!result?.ok)throw new Error(result?.error||'Import failed.');
      button.textContent=result?.reused?'Returned to OpenLP ✓':'Opened OpenLP ✓';
      setTimeout(()=>{button.disabled=false;button.textContent='Send to OpenLP';},1800);
    }catch(error){
      button.disabled=false;
      button.textContent='Try again';
      const message=document.createElement('div');
      message.className='openlp-songselect-error';
      message.textContent=error?.message||String(error);
      button.insertAdjacentElement('afterend',message);
      setTimeout(()=>message.remove(),9000);
    }
  });

  document.body.appendChild(button);
}

let lastPath=location.pathname;
ensureButton();
const observer=new MutationObserver(()=>{
  if(location.pathname!==lastPath){
    lastPath=location.pathname;
    ensureButton();
  }
});
observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(ensureButton,1500);
