import fs from 'node:fs/promises';

const read=path=>fs.readFile(path,'utf8');
const fail=message=>{throw new Error(message)};

const [app,index,worker,pkg,envBridge]=await Promise.all([
  read('public/app.js'),
  read('public/index.html'),
  read('src/worker.ts'),
  read('package.json'),
  read('server/environment.mjs')
]);

const nativeDialog=/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/;
if(nativeDialog.test(app))fail('Native browser alert/confirm/prompt detected in public/app.js. Use the Planner-themed dialog helpers instead.');
if(/cdn\.jsdelivr\.net\/npm\/pdfjs-dist|unpkg\.com\/pdfjs-dist/.test(app))fail('PDF.js must be loaded from the local /vendor/pdfjs path, not a runtime CDN.');
if(!app.includes("import('/vendor/pdfjs/pdf.min.mjs')"))fail('Local PDF.js import is missing from public/app.js.');

const packageJson=JSON.parse(pkg);
const version=String(packageJson.version||'');
const majorMinor=version.split('.').slice(0,2).join('.');
if(majorMinor!=='1.74')fail(`package.json version must be 1.74.x for this release, found ${version||'(missing)'}.`);
if(!index.includes('app.css?v=174')||!index.includes('app.js?v=174'))fail('index.html asset cache-busting must be v=174.');
if(!worker.includes('appVersion:"1.74"'))fail('Full-backup manifest appVersion must be 1.74.');

for(const key of ['CHURCHSUITE_OIDC_CLIENT_ID','CHURCHSUITE_OIDC_CLIENT_SECRET','PLANNER_SETUP_TOKEN','PLANNER_ADMIN_RECOVERY_TOKEN']){
  if(!envBridge.includes(key))fail(`Debian environment bridge is missing ${key}.`);
}

if(/script-src[^;]*unsafe-inline/.test(worker))fail("Content Security Policy must not permit 'unsafe-inline' scripts.");

console.log('Project quality checks passed.');
console.log('Native browser dialogs: none');
console.log('PDF.js runtime source: local');
console.log('Release/cache metadata: v1.74');
console.log('Debian auth/recovery environment parity: PASS');
console.log('CSP inline scripts: blocked');
