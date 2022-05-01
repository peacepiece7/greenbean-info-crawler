const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const sql = require("../../sqls/sql");

const parseCabrosiaCoffeeList = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "cabrosia");
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const records = parse(fs.readFileSync(`${basePath}/cabrosia_parse_location.csv`, "utf-8"));

    for (let record of records) {
      await page.goto(record[1], {
        waitUntil: "networkidle0",
      });
      const title = await page.$eval(".view_tit", (el) => {
        return el.textContent
          .replace(/\*?^\(.{1,6}\)/g, "")
          .split("\t")[0]
          .trim();
      });
      const price = await page.evaluate(() => {
        const prices = Array.from(document.querySelectorAll(".dropdown-item")).map((val, idx) => {
          if (idx === 1) {
            const text = val.textContent.match(/[0-9]+\,[0-9]+원/);

            return text && text;
          } else {
            return null;
          }
        });
        let price;
        prices.forEach((val) => {
          if (val) {
            price = val[0];
          }
        });
        if (price) {
          price = price.replace(",", "").replace("원", "").trim();
          return price;
        } else {
          price = 0;
        }
        return price;
      });
      const directURL = await page.evaluate(() => {
        return document.location.href;
      });
      await page.waitForTimeout(1000);
      const country = title.split(" ")[0];

      const soldOut = await page.evaluate(() => {
        if (document.querySelector(".btn-soldout")) return true;
        return false;
      });

      const coffeeData = {
        title: title.trim(),
        price,
        country,
        provider: "cabrosia",
        directURL,
        soldOut,
      };

      console.log("coffeeData :", coffeeData);

      const result = await sql.insertCoffeeData(coffeeData);
      console.log(result);
    }

    console.log("\n\n     ╰(*°▽°*)╯ Cabrosia coffee list parser done!\n\n");

    await page.close();
    await browser.close();
    process.exit();
  } catch (e) {
    console.log(e);
    process.exit();
  }
};

parseCabrosiaCoffeeList();
