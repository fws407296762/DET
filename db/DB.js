const sqlite3 = require("sqlite3").verbose();

class DB{
  constructor(options){
    this.dbfile = options.dbfile;
    this.db = null;
    this.connection();
  }
  connection(){
    let _self = this;
    return new Promise((resolve,reject)=>{
      _self.db = new sqlite3.Database(this.dbfile,function(err){
        if(err){
          reject(new Error(err))
        }
        resolve("数据库连接成功")
      })
    })
  }
  insert(sql,objects){
    let _self = this;
    return new Promise((resolve,reject)=>{
      console.log(_self.db)
      _self.db.serialize(function(){
        let stmt = _self.db.prepare(sql);
        for(let i = 0;i<objects.length;i++){
          stmt.run(objects[i])
        }
        stmt.finalize();
        resolve();
      })
    })
  }
};

module.exports = DB;