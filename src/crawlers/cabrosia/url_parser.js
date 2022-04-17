const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");

const parseCabrosiaURL = async () => {
  const basePath = path.join(__dirname, "..", "..", "..", "assets", "cabrosia");
  fs.readFile(`${basePath}/cabrosia_parse_location.csv`, (error) => {
    if (error) {
      fs.writeFileSync(`${basePath}/cabrosia_parse_location.csv`, "");
    }
  });

  const input = fs.readFileSync(`${basePath}/cabrosia_location.csv`).toString("utf-8");
  const records = parse(input);
  try {
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const parseResult = [];
    const page = await browser.newPage();
    for (let i = 0; i < records.length; i++) {
      await page.goto(records[i][1]);
      await page.waitForSelector(".item-detail");
      await page.waitForTimeout(1000);
      const evaluateResult = await page.evaluate(() => {
        const links = [];
        Array.from(document.querySelectorAll(".item-detail .item-summary-link")).map((element) => {
          links.push(["cabrosia", element.href]);
        });
        return links;
      });
      evaluateResult.map((val) => {
        parseResult.push(val);
      });
    }

    console.log("parseResult", parseResult);
    const str = stringify(parseResult);
    fs.writeFileSync(`${basePath}/cabrosia_parse_location.csv`, str);
  } catch (error) {
    console.log(error);
  }
};

parseCabrosiaURL();
