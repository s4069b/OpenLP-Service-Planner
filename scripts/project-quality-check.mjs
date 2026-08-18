import fs from 'node:fs/promises';

const read=path=>fs.readFile(path,'utf8');
const fail=message=>{throw new Error(message)};

const [app,index,worker,auth,pkg,envBridge,requestBridge,debianEnvExample]=await Promise.all([
  read('public/app.js'),
  read('public/index.html'),
  read('src/worker.ts'),
  read('src/auth.ts'),
  read('package.json'),
  read('server/environment.mjs'),
  read('server/request-bridge.mjs'),
  read('deploy/debian/openlp-service-planner.env.example')
]);

const nativeDialog=/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/;
if(nativeDialog.test(app))fail('Native browser alert/confirm/prompt detected in public/app.js. Use the Planner-themed dialog helpers instead.');
if(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist|unpkg\.com\/pdfjs-dist/.test(app))fail('PDF.js must be loaded from the local /vendor/pdfjs path, not a runtime CDN.');
if(!app.includes("import('/vendor/pdfjs/pdf.min.mjs')"))fail('Local PDF.js import is missing from public/app.js.');

const packageJson=JSON.parse(pkg);
const version=String(packageJson.version||'');
const majorMinor=version.split('.').slice(0,2).join('.');
if(majorMinor!=='1.76')fail(`package.json version must be 1.76.x for this release, found ${version||'(missing)'}.`);
if(!index.includes('app.css?v=17632')||!index.includes('app.js?v=17632'))fail('index.html asset cache-busting must be v=17622.');
if(!worker.includes('appVersion:"1.76"'))fail('Full-backup manifest appVersion must be 1.76.');

for(const key of ['CHURCHSUITE_OIDC_CLIENT_ID','CHURCHSUITE_OIDC_CLIENT_SECRET','PLANNER_SETUP_TOKEN','PLANNER_ADMIN_RECOVERY_TOKEN']){
  if(!envBridge.includes(key))fail(`Debian environment bridge is missing ${key}.`);
}

if(/script-src[^;]*unsafe-inline/.test(worker))fail("Content Security Policy must not permit 'unsafe-inline' scripts.");

if(!app.includes("setSheetCloseAction(closeSheetSafely);"))fail('openSheet must reset the sheet × close handler on every dialog render.');
if(!app.includes("function plannerThemeNames()"))fail('Shared Planner theme helper is missing.');
if(!app.includes("const planUrl=churchSuiteEnabled()?actualChurchSuitePlanUrl(s):'';"))fail('ChurchSuite View Plan link must be hidden when the extension is Off.');
if(!app.includes("const directoryEnabled=churchSuiteEnabled()&&!!state.settings?.churchSuiteDirectoryEnabled;"))fail('Published ChurchSuite services link must be hidden when extension is Off.');
if(!app.includes("function serviceItemDetailForDisplay(item)"))fail('Service item detail display normalizer is missing.');
if(!app.includes("return 'Empty Song position';"))fail('ChurchSuite-Off Song placeholder detail must be generic.');
if(!app.includes("id=\"deleteStatisticsRange\"")||!app.includes("id=\"deleteAllStatistics\""))fail('Settings song-statistics deletion controls are missing.');
if(!worker.includes('path === "/api/admin/song-usage" && request.method === "DELETE"'))fail('Administrator song-statistics deletion API is missing.');
if(!worker.includes('async function churchSuitePlanningExtensionEnabled'))fail('Published ChurchSuite directory must use the shared current-mode helper.');
if(!worker.includes('return !!enabled && await churchSuitePlanningExtensionEnabled(env);'))fail('ChurchSuite service-list availability must use the current-mode helper.');
if(!app.includes("churchSuiteEnabled()?'Awaiting ChurchSuite song':'Empty Song position'"))fail('Template Song placeholder must use generic wording when ChurchSuite is Off.');
if(!app.includes("const show=!!(churchSuiteEnabled()&&s.churchSuiteOutOfSync"))fail('ChurchSuite out-of-sync note must be hidden when extension is Off.');
if(!app.includes("if(!churchSuiteEnabled()){\n    closeSheetSafely();\n    return;\n  }"))fail('ChurchSuite entry screens must safely no-op when the extension is Off.');
if(!app.includes("Templates define reusable service order, OpenLP theme and local service items."))fail('Template Library needs ChurchSuite-free wording when the extension is Off.');
if(app.includes('<option value="manual">ChurchSuite manual</option>')||app.includes('<option value="auto">ChurchSuite automatic</option>'))fail('Legacy ChurchSuite Manual/Automatic mode options must not appear in Settings.');
if(!app.includes('<option value="on">On</option>'))fail('ChurchSuite Settings must expose a single On state.');
if(!app.includes("function churchSuiteEnabled(){ return ['on','manual','auto'].includes(state.settings?.churchSuiteMode); }"))fail('Legacy ChurchSuite mode migration compatibility is missing.');
if(!app.includes("const linked=churchSuiteEnabled()&&hasChurchSuitePlanReference(s);"))fail('Single-service delete must hide ChurchSuite wording when extension is Off.');
if(!app.includes("const linkedCount=churchSuiteEnabled()?services.filter(hasChurchSuitePlanReference).length:0;"))fail('Bulk delete must hide ChurchSuite wording when extension is Off.');
const templateSection=app.slice(app.indexOf('async function saveServiceAsTemplate'),app.indexOf('function openServiceTemplateOverride'));
if(templateSection.includes('availableThemes()'))fail('Template UI must not call the Settings-scoped availableThemes helper.');
if(!templateSection.includes('data-template-add-song'))fail('Template editor must expose Song as a first-class Add item choice.');
if(templateSection.includes('<option value="song">Song — next ChurchSuite song in order</option>'))fail('Song must not appear in the generic ChurchSuite item picker.');

if(!auth.includes('const serviceListAvailable=directoryEnabled && ["on","manual","auto"].includes(churchSuiteMode);'))fail('Level-1 login destination must accept current ChurchSuite On mode.');
if(!worker.includes('async function churchSuitePlanningExtensionEnabled'))fail('Server-side ChurchSuite extension gate is missing.');
if(!worker.includes('ChurchSuite extension is disabled.'))fail('ChurchSuite Planner APIs must reject use while the extension is Off.');
if(!worker.includes('const clearingAudit=request.method==="DELETE"'))fail('Activity-log deletion must be Administrator-only.');
if(!app.includes('const canClearActivity=Number(authenticatedUser?.accessLevel||0)>=3;'))fail('Clear Activity UI must be Administrator-only.');
if(!worker.includes('ChurchSuite service plans are not enabled.'))fail('Disabled ChurchSuite Plans route must not fall through to static assets.');


if(!auth.includes('const passwordTooLong=password.length>1024;'))fail('Local login must cap pathological password input length.');
if(!requestBridge.includes('PLANNER_MAX_REQUEST_MB')||!debianEnvExample.includes('PLANNER_MAX_REQUEST_MB=10'))fail('Debian VPS must cap ordinary request bodies separately from large uploads.');
if(!worker.includes('const safeInline=/^(?:image'))fail('Media responses must restrict inline rendering to passive supported content types.');

if(!worker.includes('if(!automatic&&!canResync)return json({error:"Planner access is required to manually re-sync ChurchSuite."}'))fail('ChurchSuite Service-list-only users must not be able to manually force a directory re-sync.');
if(!worker.includes('const automaticRefreshMs=15*60*1000;'))fail('Published ChurchSuite list must refresh automatically when its cache is stale.');
if(!worker.includes('const automatic=url.searchParams.get("automatic")==="1";'))fail('Automatic ChurchSuite refresh must be distinct from manual re-sync permission.');
if(!worker.includes('data-auto-sync="${automaticRefreshDue?\'1\':\'0\'}"'))fail('Published ChurchSuite page must expose automatic-refresh state to the browser.');
if(!worker.includes('<script src="/churchsuite-directory.js"></script>'))fail('Published ChurchSuite page must load syncing UI for all permitted viewers.');
if(!app.includes('function redirectForExpiredPlannerSession(response)'))fail('Expired Planner sessions must redirect cleanly back through sign-in.');
if(!app.includes("error=${encodeURIComponent('Your Planner session has expired. Please sign in again.')}"))fail('Expired-session redirect must explain why sign-in is required.');
console.log('Project quality checks passed.');
console.log('Native browser dialogs: none');
console.log('PDF.js runtime source: local');
console.log('Release/cache metadata: v1.76');
console.log('Debian auth/recovery environment parity: PASS');
console.log('CSP inline scripts: blocked');


