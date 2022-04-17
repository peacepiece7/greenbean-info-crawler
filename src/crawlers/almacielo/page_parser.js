const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");

const parseCoffeeList = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "almacielo");
    fs.readFile(`${basePath}/almacielo_page_location.csv`, (err) => {
      if (err) {
        fs.writeFileSync(`${basePath}/almacielo_page_location.csv`, "");
      }
    });

    const records = parse(fs.readFileSync(`${basePath}/almacielo_parse_location.csv`, "utf-8"));

    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 970 });

    for (let record of records) {
      console.log("record", record);
      await page.goto(record[1], {
        waitUntil: "networkidle0",
      });

      const urls = await page.evaluate(() => {
        if (document.querySelector(".soldout")) {
          return Array.from(document.querySelectorAll(".soldout")).map((v) => {
            return [v.onclick.toString().split("href=")[1].split("'")[1]];
          });
        } else {
          return null;
        }
      });

      if (urls) {
        fs.readFile(`${basePath}/almacielo_page_location.csv`, (error, data) => {
          if (error) {
            fs.writeFileSync(`${basePath}/almacielo_page_location.csv`, stringify(urls));
          } else {
            const curURLs = parse(data);
            urls.map((v) => {
              curURLs.push(v);
            });

            console.log(curURLs);
            fs.writeFileSync(`${basePath}/almacielo_page_location.csv`, stringify(curURLs));
          }
        });
      }
      !urls && console.log("해당 url에 데이터가 존재하지 않습니다.");
    }

    console.log("\n\n     ╰(*°▽°*)╯ Almacielo page parser done!\n\n");

    await page.close();
    await browser.close();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

parseCoffeeList();
module.exports = parseCoffeeList;
