const puppeteer = require("puppeteer");
const parse5 = require("parse5");
const util = require("./util");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");

let path_testparper = path.resolve(__dirname,"./testparper")

if(!util.isexits(path_testparper)){
  let createpath = fs.mkdirSync(path_testparper,{
    recursive:true
  });
}

(async function load(){
  const db = await sqlite.open({
    filename:path.join(__dirname,"../db/testpaper.db"),
    driver:sqlite3.Database
  })
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
  testParper.year = testParperTitle.match(/\d*/g)[yearIndex];
  let testpaperResult = await db.run("insert into testpaper(testpaper_subject,testpaper_time) values (:subject,:year)",{
    ":subject":testParper.title,
    ":year":testParper.year
  });
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

  async function getformatterTopic(data,year){
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
      testpaperyear:testpaperResult.lastID,
      num:"",
      readingid:""
    }
    let optionsMap = {
      "A":0,
      "B":1,
      "C":2,
      "D":3
    };
    let ennumMap = {
      "one":1,
      "two":2,
      "three":3,
      "four":4,
      "five":5
    }
    let di = 0;
    await (async function mapData(i){
      if(i === data.length)return false;
      let item = data[i];
      let passageResult;
      if(topicNumReg.test(item)){
        if(topic.passage){
          let ennum = topic.passage.match(/^(Passage)\s*(\w*)/)[2];
          ennum = ennum.toLowerCase();
          passageResult = await db.run("insert into topic_reading(reading_num,reading_content,testpaper_id) values (:num,:content,:id)",{
            ":num":ennumMap[ennum],
            ":content":topic.passage,
            ":id":testpaperResult.lastID
          });
          topic.readingid = passageResult.lastID
        }
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
        i++;
        mapData(i);
      }else if(topicDirectionsReg.test(item)){
        i++;
        mapData(i);
      }else if(topicAnswerReg.test(item)){
        item = item.replace(topicAnswerReg,"");
        topic.answer = optionsMap[item]
      }else if(topicAnalyzeReg.test(item)){
        topic.analyze = item.replace(topicAnalyzeReg,"")
        formatterTopic.push(topic);
        let newTopic = {
          title:"",
          options:[],
          answer:"",
          analyze:"",
          testpaperyear:testpaperResult.lastID,
          num:""
        }
        topic = newTopic
      }else if(topicPassageReg.test(item)){
        topic.passage = item;
      }else{
        topic.title += "\n" + item;
        if(topic.passage){
          topic.passage += "\n" + item;
        }
      }
      i++;
      mapData(i);
    })(di)
    return formatterTopic;
  }
  let formatterTopic = await getformatterTopic(testParper.contents);
  console.log(formatterTopic);
  let topicIndex = 0;
  async function inserttopicandanswer(topicIndex){
    if(topicIndex === formatterTopic.length){
      return false;
    }
    let topic = formatterTopic[topicIndex];
    let reading_id;

    await db.run("insert into topic(topic_content,topic_type,topic_options,topic_answer,topic_analyze,topic_num,reading_id) values (?,?,?,?,?,?,?,?)",[topic.title,1,testParper.year,testParper.title,topic.options.join("[---]"),topic.answer,topic.analyze,topic.num,reading_id])
    // topicIndex++;
    //   inserttopicandanswer(topicIndex);
  }



  // let lastTestpaper = await db.run("insert into testpaper(testpaper_subject,testpaper_time) values (:subject,:time)",{
  //   ":subject":testParper.title,
  //   ":time":testParper.year
  // })


  // await inserttopicandanswer(topicIndex)
  await browser.close();
})()

