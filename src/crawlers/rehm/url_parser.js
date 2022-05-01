const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");
const sql = require("../../sqls/sql");

const urlParser = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "rehm");

    fs.readFile(`${basePath}/rehm_parse_location.csv`, (err) => {
      if (err) {
        fs.writeFileSync(`${basePath}/rehm_parse_location.csv`, "");
      }
    });
    fs.readFile(`${basePath}/rehm_parse_result.csv`, (err) => {
      if (err) {
        fs.writeFileSync(`${basePath}/rehm_parse_result.csv`, "");
      }
    });

    const input = fs.readFileSync(`${basePath}/rehm_location.csv`).toString("utf-8");
    const records = parse(input);
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const parseResult = [];
    const page = await browser.newPage();
    for (let i = 0; i < records.length; i++) {
      let index = 1;
      let isExist = true;
      while (isExist) {
        const url = records[i][1].replace(/\?/g, `?page=${index}&`);
        await page.goto(url);
        await page.waitForSelector("body");
        await page.waitForTimeout(1000);
        const link = await page.evaluate(() => {
          if (document.querySelector("ul.prdList.column4 > li")) {
            return window.location.href;
          } else {
            return null;
          }
        });
        // waitForFunction으로 link를 받아오는 시간을 정확히 표기
        await page.waitForTimeout(1000);
        console.log("link", link);
        if (link) {
          parseResult.push(["rehmcoffee", link]);
          index++;
        } else {
          isExist = false;
        }
      }
      await page.waitForTimeout(Math.floor(Math.random() * 1000) + 1000);
    }

    console.log("\n\n  ╰(*°▽°*)╯ URL parsing done ╰(*°▽°*)╯ \n\n");

    const str = stringify(parseResult);
    fs.writeFileSync(`${basePath}/rehm_parse_location.csv`, str);
    await page.close();
    await browser.close();
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit();
  }
};

urlParser();
