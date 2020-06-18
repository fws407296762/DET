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
    contents:[],
    year:""
  }
  let testParperTitle = await page.$eval(".kao_h3",(ele)=>{
    return ele.textContent
  });
  testParper.title = testParperTitle;
  let yearIndex = testParperTitle.search(/\d*/g);
  testParper.year = testParperTitle.match(/\d*/g)[yearIndex]
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

  function getformatterTopic(data,year){
    let topicNumReg = /^[1-9][0-9]*/,
      topicOptionsReg = /^[A-Z]\.\s*/,
      topicPartReg = /^(Part)\s*[I,II,III,IV,V]\s*/,
      topicDirectionsReg = /^(Directions)\s*\:\s*/,
      topicAnswerReg = /^(【答案】)\s*/,
      topicAnalyzeReg = /^(【解析】)\s*/,
      topicPassageReg = /^(Passage)\s*/;
    let formatterTopic = [];
    let topic = {
      title:"",
      options:[],
      answer:"",
      analyze:"",
      passage:"",
      passagenum:"",
      testpaperyear:"",
      num:""
    }
    let optionsMap = {
      "A":0,
      "B":1,
      "C":2,
      "D":3
    }
    for(let i = 0;i<data.length;i++){
      let item = data[i];
      if(topicNumReg.test(item)){
        let options = item.split(/[A-D]\.\s*/g);
        options = options.splice(1);
        let num = item.match(topicNumReg);
        item = item.replace(topicNumReg,"");
        topic.num = parseInt(num[0]);
        if(options.length){
          topic.title = "Please select the correct one"
          topic.options = topic.options.concat(options);
        }else{
          topic.title = item;
        }
      }else if(topicOptionsReg.test(item)){
        let options = item.split(/[A-D]\.\s*/g);
        options = options.splice(1);
        topic.options = topic.options.concat(options);
      }else if(topicPartReg.test(item)){
        continue;
      }else if(topicDirectionsReg.test(item)){
        continue;
      }else if(topicAnswerReg.test(item)){
        item = item.replace(topicAnswerReg,"");
        topic.answer = optionsMap[item]
      }else if(topicAnalyzeReg.test(item)){
        topic.analyze = item.replace(topicAnalyzeReg,"")
        formatterTopic.push(topic);
        topic = {
          title:"",
          options:[],
          answer:"",
          analyze:"",
          passage:"",
          passagenum:"",
          num:""
        }
      }else if(topicPassageReg.test(item)){
        topic.passage = item;
      }else{
        topic.title += "\n" + item;
        topic.passage += "\n" + item;
      }
    }
    return formatterTopic;
  }
  let formatterTopic = getformatterTopic(testParper.contents)
  let topicIndex = 0;
 function inserttopicandanswer(topicIndex){
   if(topicIndex === formatterTopic.length){
     return false;
   }
   let topic = formatterTopic[topicIndex];
   db.sql(
     "insert into testpaper_topic(topic_content,topic_type,testpaper_year,testpaper_title,topic_options,topic_answer,topic_analyze,topic_num) values (?,?,?,?,?,?,?,?)",[topic.title,1,testParper.year,testParper.title,topic.options.join("[---]"),topic.answer,topic.analyze,topic.num],"all").then((row)=>{
     topicIndex++;
     inserttopicandanswer(topicIndex);
   })
 }

  inserttopicandanswer(topicIndex)



  await browser.close();
})()

