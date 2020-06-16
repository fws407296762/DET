const puppeteer = require("puppeteer");
const parse5 = require("parse5");
const util = require("./util");
const fs = require("fs");
const path = require("path");
let path_testparper = path.resolve(__dirname,"./testparper")
let DB = require("../db/DB");
let db = new DB({
  dbfile:path.join(__dirname,"../db/testpaper.db")
})
if(!util.isexits(path_testparper)){
  let createpath = fs.mkdirSync(path_testparper,{
    recursive:true
  });
}

(async function load(){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://www.studyez.com/xueweiyingyu/lnst/all/201805/2714590.htm");
  let testParper = {
    title:"",
    contents:[]
  }
  let testParperTitle = await page.$eval(".kao_h3",(ele)=>{
    return ele.textContent
  });
  testParper.title = testParperTitle;
  let testParperFilePath = path.resolve(path_testparper,"./"+testParper.title+".json")
  if(util.isexits(testParperFilePath)){
    testParper.contents = require(testParperFilePath);
  }else{
    let testParperContent = await page.$$eval(".kao_text>p",(eles)=>{
      for(let i = 0;i<eles.length;i++){
        let ele = eles[i],
          ihtml = ele.innerHTML;
        ihtml = ihtml.replace(/^\n/g,"");
        if(ihtml){
          return ihtml.replace(/\s*\t\s*|\s*\n\s*/g,"")
        }
      }
    });
    let testParperLins = testParperContent.split("<br>");
    testParper.contents = testParperLins;
    fs.writeFileSync(testParperFilePath,JSON.stringify(testParper.contents,null,2))
  }
  console.log(testParper.contents);
  let topics = [];
  let topicIndex = 0;
  for(let i = 0;i < testParper.contents.length;i++){
    let info = {
      title:"",
      options:[]
    };
    let item = testParper.contents[i];
    if(/^[1-9]\./.test(item)){
      topicIndex = i;
      info.title = item;
    }else if(/^[A-Z]\./.test(item)){
      info.options.push(item);
    }
  }
  // db.insert("insert into testpaper_topic(topic_content,topic_type) value (?,?)",[])
  await browser.close();
})()

