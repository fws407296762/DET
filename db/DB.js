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
  sql(sql, param, mode) {
    let _self = this;
    mode = mode == 'all' ? 'all' : mode == 'get' ? 'get' : 'run';
    return new Promise((resolve, reject) => {
      let fn = function (err, data) {    // data: Array, Object
        if (err) {
          reject(new Error(err));
        } else {
          if (data) {
            resolve(data);    // 返回数据查询成功的结果
          } else {
            resolve('success');    // 提示 增 删 改 操作成功
          };
        };
      }
      if(!param){
        param = fn;
        _self.db[mode](sql, fn);
      }else{
        _self.db[mode](sql, param, fn);
      }

    });
  }
};

module.exports = DB;