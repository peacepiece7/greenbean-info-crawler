const puppeteer = require("puppeteer");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");
const path = require("path");

// Create siteName_location.csv
const parseRoyalcoffeeURL = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "royalcoffee");
    fs.readFile(`${basePath}/royalcoffee_location.csv`, (err) => {
      if (err) {
        fs.writeFileSync(`${basePath}/royalcoffee_parse_location.csv`, "");
      }
    });
    fs.readFile(`${basePath}/royalcoffee_parse_result.csv`, (err) => {
      if (err) {
        fs.writeFileSync(`${basePath}/royalcoffee_parse_result.csv`, "");
      }
    });

    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    let input = fs.readFileSync(`${basePath}/royalcoffee_location.csv`).toString("utf-8");
    let records = parse(input);

    await page.goto(records[0][1], {
      waitUntil: "networkidle0",
    });

    let counter = 2;
    let check = true;

    while (check) {
      const currentUrl = records[0][1].replace("?", `?page=${counter}`);
      await page.goto(currentUrl);
      await page.waitForTimeout(1000);
      const pageIndex = await page.evaluate(() => {
        return document.querySelector("td[align=center] td[align=center] td[align=center] b").textContent;
      });
      if (pageIndex == 1) {
        check = false;
      } else {
        counter++;
        records.push(["royal coffee", currentUrl]);
      }
    }

    console.log("\n\n     ╰(*°▽°*)╯ royal coffee url parser done!\n\n");

    let str = stringify(records);
    fs.writeFileSync(`${basePath}/royalcoffee_parse_location.csv`, str);
    await page.close();
    await browser.close();
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

parseRoyalcoffeeURL();
