const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");
const sql = require("../../sqls/sql");

const parseCoffeeList = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "almacielo");
    const records = parse(fs.readFileSync(`${basePath}/almacielo_page_location.csv`, "utf-8"));

    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 970 });

    for (let record of records) {
      await page.goto(record[0], {
        waitUntil: "networkidle0",
      });

      console.log("해당 url pasing을 시작합니다.", record[0]);

      // form : [title, price, counry, provider, variety, process, siteUrl, soldOut]
      const coffeeData = await page.evaluate(
        (directURL) => {
          const title = document.querySelector(".info h3.name").textContent.trim();
          const price = document
            .querySelector(".list tbody tr:first-child td")
            .textContent.replace(",", "")
            .replace("원", "");

          const country = document.querySelector(".list tbody tr:nth-child(4) td").textContent.trim();

          const variety = document.querySelector(".list tbody tr:nth-child(5) td").textContent.trim();
          const processing = document.querySelector(".list tbody tr:nth-child(7) td").textContent.trim();

          const soldOut =
            document.querySelector(".box_btn.huge.buy.orange").textContent.trim() === "바로구매" ? false : true;

          return {
            title,
            price,
            country,
            provider: "almacielo",
            variety,
            processing,
            directURL,
            soldOut,
          };
        },
        [record]
      );
      const response = await sql.insertCoffeeData(coffeeData);
      if (response) {
        console.log(`\n\n${response}\n\n`);
      } else {
        console.log(`\n\n 해당 데이터를 확인해주세요,{ coffeeData : ${coffeeData} } \n\n`);
      }
    }

    await page.close();
    await browser.close();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

parseCoffeeList();
module.exports = parseCoffeeList;
