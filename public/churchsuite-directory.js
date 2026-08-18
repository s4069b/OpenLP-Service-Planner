(()=>{
  const button=document.getElementById('directoryResync');
  const status=document.getElementById('syncStatus');
  const cooldownNote=document.getElementById('syncCooldownNote');
  if(!status)return;

  const syncUrl=status.dataset.syncUrl||button?.dataset.syncUrl||location.pathname;
  let nextAllowedAt=Number(button?.dataset.nextAllowedAt||0);
  let syncing=false;

  const show=(text,kind)=>{
    status.hidden=false;
    status.className='sync-status'+(kind?' '+kind:'');
    status.textContent=text;
  };

  const hide=()=>{
    status.hidden=true;
    status.className='sync-status';
    status.textContent='';
  };

  const updateCooldown=()=>{
    if(!button)return;
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

  if(button){
    updateCooldown();
    setInterval(updateCooldown,1000);
  }

  const runSync=async({automatic=false}={})=>{
    if(syncing)return;
    syncing=true;
    if(button){
      button.disabled=true;
      if(!automatic)button.textContent='Syncing…';
    }

    show(
      automatic
        ?'Syncing ChurchSuite… The current list remains available while this finishes.'
        :'Syncing with ChurchSuite…',
      'sync-working'
    );

    try{
      const target=syncUrl+(syncUrl.includes('?')?'&':'?')+(automatic?'automatic=1':'manual=1');
      const response=await fetch(target,{
        method:'POST',
        headers:{accept:'application/json'},
        credentials:'same-origin',
        cache:'no-store'
      });
      const data=await response.json().catch(()=>({}));

      if(response.status===429){
        const retrySeconds=Math.max(1,Number(data.retrySeconds||300));
        nextAllowedAt=data.nextAllowedAt?new Date(data.nextAllowedAt).getTime():Date.now()+(retrySeconds*1000);
        updateCooldown();
        show(
          automatic
            ?'ChurchSuite was refreshed recently. Using the current list.'
            :'ChurchSuite was synced recently. Re-sync is locked for 5 minutes after each successful sync.'
        );
        if(automatic)setTimeout(hide,2500);
        return;
      }

      if(response.status===409){
        show('ChurchSuite is already syncing… This page will check again shortly.','sync-working');
        setTimeout(()=>location.reload(),4000);
        return;
      }

      if(!response.ok||!data.ok){
        show(data.error||'ChurchSuite sync failed.','error');
        if(button)button.disabled=false;
        return;
      }

      if(data.skipped){
        hide();
        updateCooldown();
        return;
      }

      nextAllowedAt=Date.now()+(5*60*1000);
      updateCooldown();
      show('ChurchSuite sync complete. Refreshing the service list…','sync-working');
      location.reload();
    }catch(_){
      show('ChurchSuite sync failed. The existing service list is still available.','error');
      if(button)button.disabled=false;
    }finally{
      syncing=false;
      if(button&&!automatic)button.textContent='↻ Re-sync';
    }
  };

  if(button){
    button.addEventListener('click',()=>{
      if(button.disabled)return;
      runSync({automatic:false});
    });
  }

  if(status.dataset.autoSync==='1'){
    runSync({automatic:true});
  }
})();
