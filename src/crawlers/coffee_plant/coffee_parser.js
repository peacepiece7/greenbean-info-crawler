// document.querySelectorAll("div.xans-product-listmain-2 ul.prdList.column4 > li")

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");

const crawler = async (siteName, parsingStart) => {
  const basePath = path(__dirname, "..", "..", "..", "assets", "coffeeplant");
  fs.readFile(`${basePath}/coffeeplant_parse_location.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`${basePath}/coffeeplant_parse_location.csv`, "");
    }
  });
  fs.readFile(`${basePath}/coffeeplant_parse_result.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`${basePath}/coffeeplant_parse_result.csv`, "");
    }
  });

  const input = fs.readFileSync(`${basePath}/coffeeplant_location.csv`).toString("utf-8");
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    fs.writeFileSync(`${basePath}/coffeeplant_parse_location.csv`, str);

    // parsingStart(siteName);
  } catch (err) {
    console.log(err);
  }
};

crawler();

// coffeePlantCrawler("rehm", parser);

// parser("coffee_plant");
