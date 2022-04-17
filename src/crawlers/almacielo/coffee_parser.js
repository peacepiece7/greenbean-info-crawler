const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");
const sql = require("../../sqls/sql");

const parseAlmacieloCoffeeList = async () => {
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
          let price = 0,
            country = "",
            variety = "",
            processing = "";

          const title = document.querySelector(".info h3.name").textContent.trim();

          Array.from(document.querySelectorAll(".list tbody tr")).map((tr, i) => {
            if (tr.querySelector("th") && tr.querySelector("td")) {
              const headers = tr.querySelector("th").textContent.trim();
              if (headers === "나의 단가" || headers === "나의단가") {
                price = tr.querySelector("td").textContent.replace(",", "").replace("원", "");
              } else if (headers === "국가") {
                country = tr.querySelector("td").textContent.trim();
              } else if (headers === "품종") {
                variety = tr.querySelector("td").textContent.trim();
              } else if (headers === "가공방식") {
                processing = tr.querySelector("td").textContent.trim();
              }
            }
          });

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

      console.log(coffeeData);
      const response = await sql.insertCoffeeData(coffeeData);
      if (response) {
        console.log(`\n\n${response}\n\n`);
      } else {
        console.log(`\n\n 해당 데이터를 확인해주세요,{ coffeeData : ${coffeeData} } \n\n`);
      }
    }

    console.log("\n\n     ╰(*°▽°*)╯ Almacielo coffee list parser done!\n\n");

    await page.close();
    await browser.close();
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit();
  }
};

parseAlmacieloCoffeeList();
module.exports = parseAlmacieloCoffeeList;
