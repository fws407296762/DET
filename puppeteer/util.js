const puppeteer = require("puppeteer");
const fs = require("fs");

// 启动浏览器
async function lanuch(url,fn){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  fn && fn(browser,page);
  await browser.close();
}

function isexits(path){
  try{
    fs.statSync(path);
    return true;
  }catch (e) {
    return false;
  }
}

module.exports = {
  lanuch,
  isexits
}