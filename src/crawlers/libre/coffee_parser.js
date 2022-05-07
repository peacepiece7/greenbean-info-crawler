const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const sql = require("../../sqls/sql");

async function parser() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
    });
    browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36"
    );
    let page = await browser.newPage();
    await page.goto("https://coffeelibre.kr/category/%EC%83%9D%EB%91%90%EC%86%8C%EB%B6%84/57/", {
      waitUntil: "networkidle0",
    });
    const urls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".prdImg p a")).map((v) => {
        if (v.href) return v.href;
        else return null;
      });
    });

    console.log(urls);
    await page.close();
    await page.waitForTimeout(1000);
    page = await browser.newPage();
    for (let url of urls) {
      page.goto(url, {
        waitUntil: "networkidle0",
      });
      await page.waitForTimeout(1000);
      const coffeeData = await page.evaluate(
        (directURL) => {
          const title = document.querySelector(".infoArea .name").textContent.trim();
          const country = document
            .querySelector(".infoArea .name")
            .textContent.split("]")[1]
            .trim()
            .split(" ")[0]
            .trim();
          const provider = "Coffee Libre";
          const price = parseInt(
            document.querySelector(".infoArea .price").textContent.split(",").join("").split("원").join("")
          );
          let variety = null;
          let processing = null;
          Array.from(document.querySelectorAll("#prdDetail .cont p")).map((v, i) => {
            if (v.textContent.split(" ")[0].includes("품종")) variety = v.textContent.split("/")[1].trim();
            if (v.textContent.split(" ")[0].includes("가공방식")) processing = v.textContent.split("/")[1].trim();
          });

          if (variety === null && processing === null) {
            Array.from(document.querySelectorAll("#prdDetail .cont > div div")).map((v, i) => {
              if (v.textContent.split(" ")[0].includes("품종")) variety = v.textContent.split("/")[1].trim();
              if (v.textContent.split(" ")[0].includes("가공방식")) processing = v.textContent.split("/")[1].trim();
            });
          }

          const soldOut = document.querySelector("#totalProducts").style["0"] ? true : false;

          return {
            title,
            country,
            provider,
            price,
            variety,
            processing,
            soldOut,
            directURL: directURL[0],
          };
        },
        [url]
      );

      console.log(coffeeData);

      await sql.insertCoffeeData(coffeeData);

      await page.waitForTimeout(5000);
    }

    console.log("\n\n\n ╰(*°▽°*)╯ lebre coffee parser is done!  ╰(*°▽°*)╯\n\n\n");

    await page.close();
    await browser.close();
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit();
  }
}

parser();
