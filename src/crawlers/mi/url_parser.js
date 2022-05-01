const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");

// Create siteName_location.csv
const parser = async () => {
  const basePath = path.join(__dirname, "..", "..", "..", "assets", "mi");
  fs.readFile(`${basePath}/mi_location.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`${basePath}/mi_parse_location.csv`, "");
    }
  });

  fs.readFile(`${basePath}/mi_parse_result.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`${basePath}/mi_parse_result.csv`, "");
    }
  });

  try {
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const input = fs.readFileSync(`${basePath}/mi_location.csv`).toString("utf-8");
    const records = parse(input);
    const newRecords = [];

    for (let i = 0; i < records.length; i++) {
      let counter = 1;
      let itemIsExist = true;

      while (itemIsExist) {
        const currentUrl = records[i][1].replace("?", `?page=${counter}&`);
        await page.goto(currentUrl);
        await page.waitForSelector("body");
        await page.waitForTimeout(2000);

        const pageCheck = await page.evaluate(() => {
          const itemTit = document.querySelector(".item_tit_box .item_name");
          return itemTit ? true : false;
        });

        if (pageCheck) {
          counter++;
          newRecords.push(["mi", currentUrl]);
        } else {
          itemIsExist = false;
        }
      }
    }
    console.log(newRecords);
    const str = stringify(newRecords);
    fs.writeFileSync(`${basePath}/mi_parse_location.csv`, str);
    await page.close();
    await browser.close();

    console.log("╰(*°▽°*)╯ url parsing is Done!  ╰(*°▽°*)╯");
    process.exit();
  } catch (err) {
    console.log("Error occured!");
    console.log(err);
    process.exit();
  }
};

parser();
