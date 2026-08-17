import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteD1Database, applySqlMigrations } from './sqlite-d1.mjs';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'openlp-planner-migrations-'));
const dbFile=path.join(dir,'planner.sqlite');
const db=new SqliteD1Database(dbFile);
try{
  const applied=applySqlMigrations(db,path.resolve('migrations'));
  const fk=db.sqlite.prepare('PRAGMA foreign_key_check').all();
  const integrity=db.sqlite.prepare('PRAGMA integrity_check').get();
  if(fk.length)throw new Error(`Foreign-key check failed: ${JSON.stringify(fk.slice(0,5))}`);
  if(String(integrity?.integrity_check||'').toLowerCase()!=='ok')throw new Error(`Integrity check failed: ${JSON.stringify(integrity)}`);
  console.log(`Migration test passed (${applied.length} migrations).`);
}finally{
  db.close();
  fs.rmSync(dir,{recursive:true,force:true});
}
