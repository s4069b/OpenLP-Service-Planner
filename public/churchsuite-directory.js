(()=>{
  const button=document.getElementById('directoryResync');
  const status=document.getElementById('syncStatus');
  const cooldownNote=document.getElementById('syncCooldownNote');
  if(!button||!status)return;

  const syncUrl=button.dataset.syncUrl||location.pathname;
  let nextAllowedAt=Number(button.dataset.nextAllowedAt||0);

  const show=(text,kind)=>{
    status.hidden=false;
    status.className='sync-status'+(kind?' '+kind:'');
    status.textContent=text;
  };

  const updateCooldown=()=>{
    if(!nextAllowedAt){
      button.disabled=false;
      if(cooldownNote)cooldownNote.hidden=true;
      return;
    }
    const remaining=nextAllowedAt-Date.now();
    if(remaining<=0){
      nextAllowedAt=0;
      button.disabled=false;
      if(cooldownNote)cooldownNote.hidden=true;
      return;
    }
    button.disabled=true;
    const totalSeconds=Math.ceil(remaining/1000);
    const mins=Math.floor(totalSeconds/60);
    const secs=totalSeconds%60;
    if(cooldownNote){
      cooldownNote.hidden=false;
      cooldownNote.textContent='Re-sync available in '+(mins?mins+'m ':'')+secs+'s';
    }
  };

  updateCooldown();
  setInterval(updateCooldown,1000);

  button.addEventListener('click',async()=>{
    if(button.disabled)return;
    button.disabled=true;
    button.textContent='Syncing…';
    show('Syncing with ChurchSuite…','sync-working');
    try{
      const response=await fetch(syncUrl,{method:'POST',headers:{accept:'application/json'},credentials:'same-origin',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(response.status===429){
        const retrySeconds=Math.max(1,Number(data.retrySeconds||300));
        nextAllowedAt=data.nextAllowedAt?new Date(data.nextAllowedAt).getTime():Date.now()+(retrySeconds*1000);
        updateCooldown();
        show('ChurchSuite was synced recently. Re-sync is locked for 5 minutes after each successful sync.');
        return;
      }
      if(response.status===409){show('A ChurchSuite sync is already running. Please wait for it to finish.');button.disabled=false;return}
      if(!response.ok||!data.ok){show(data.error||'ChurchSuite sync failed.','error');button.disabled=false;return}
      nextAllowedAt=Date.now()+(5*60*1000);
      updateCooldown();
      show('Sync complete. Refreshing list…');
      location.reload();
    }catch(_){show('ChurchSuite sync failed. Please try again.','error');button.disabled=false}
    finally{button.textContent='↻ Re-sync'}
  });
})();
