const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");
const sql = require("../../sqls/sql");

const parser = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "coffeeplant");
    const browser = await puppeteer.launch({ headless: true, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const records = parse(fs.readFileSync(`${basePath}/coffeeplant_location.csv`).toString("utf-8"));

    for (let record of records) {
      await page.goto(record[i][0], {
        waitUntil: "networkidle0",
      });

      // &page=1로 page 이동, 데이터가 없을 경우 다음 url이동
    }
    await page.waitForTimeout(2000);

    await page.close();
    await browser.close();
  } catch (e) {
    console.log(e);
  }
};

parser();
