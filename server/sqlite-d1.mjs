import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

function sqliteValue(value){
  if(value===undefined)return null;
  if(typeof value==="boolean")return value?1:0;
  if(value instanceof ArrayBuffer)return new Uint8Array(value);
  return value;
}

export class SqliteD1Statement {
  constructor(database,sql,params=[]){
    this.database=database;
    this.sql=sql;
    this.params=params;
  }
  bind(...params){
    return new SqliteD1Statement(this.database,this.sql,params.map(sqliteValue));
  }
  _stmt(){ return this.database.sqlite.prepare(this.sql); }
  _run(){
    const result=this._stmt().run(...this.params);
    return {
      success:true,
      meta:{
        changes:Number(result.changes||0),
        last_row_id:
          typeof result.lastInsertRowid==="bigint"
            ?Number(result.lastInsertRowid)
            :Number(result.lastInsertRowid||0)
      }
    };
  }
  async run(){ return this._run(); }
  async first(column){
    const row=this._stmt().get(...this.params) ?? null;
    if(row===null)return null;
    if(column!==undefined)return row[column] ?? null;
    return row;
  }
  async all(){
    return {success:true,results:this._stmt().all(...this.params)};
  }
  async raw(){
    const rows=this._stmt().all(...this.params);
    return rows.map(row=>Object.values(row));
  }
}

export class SqliteD1Database {
  constructor(filename){
    fs.mkdirSync(path.dirname(filename),{recursive:true});
    this.filename=filename;
    this.sqlite=new DatabaseSync(filename);
    this.sqlite.exec("PRAGMA journal_mode=WAL;");
    this.sqlite.exec("PRAGMA foreign_keys=ON;");
    this.sqlite.exec("PRAGMA busy_timeout=5000;");
  }
  prepare(sql){ return new SqliteD1Statement(this,sql); }
  async batch(statements){
    this.sqlite.exec("BEGIN IMMEDIATE;");
    try{
      const results=statements.map(statement=>statement._run());
      this.sqlite.exec("COMMIT;");
      return results;
    }catch(error){
      try{this.sqlite.exec("ROLLBACK;")}catch(_){}
      throw error;
    }
  }
  close(){ this.sqlite.close(); }
}

export function applySqlMigrations(database,migrationsDir){
  database.sqlite.exec(`
    CREATE TABLE IF NOT EXISTS _planner_migrations(
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied=new Set(
    database.sqlite.prepare(
      "SELECT name FROM _planner_migrations ORDER BY name"
    ).all().map(row=>String(row.name))
  );

  const files=fs.readdirSync(migrationsDir)
    .filter(name=>/^\d+.*\.sql$/i.test(name))
    .sort((a,b)=>a.localeCompare(b));

  const newlyApplied=[];
  for(const name of files){
    if(applied.has(name))continue;
    const sql=fs.readFileSync(path.join(migrationsDir,name),"utf8");
    database.sqlite.exec("BEGIN IMMEDIATE;");
    try{
      database.sqlite.exec(sql);
      database.sqlite.prepare(
        "INSERT INTO _planner_migrations(name) VALUES(?)"
      ).run(name);
      database.sqlite.exec("COMMIT;");
      newlyApplied.push(name);
    }catch(error){
      try{database.sqlite.exec("ROLLBACK;")}catch(_){}
      throw new Error(`Migration ${name} failed: ${error?.message||error}`);
    }
  }
  return newlyApplied;
}
