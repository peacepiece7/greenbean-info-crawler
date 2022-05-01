const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const sql = require("../../sqls/sql");

const parser = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "rehm");
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const input = fs.readFileSync(`${basePath}/rehm_parse_location.csv`).toString("utf-8");
    const records = parse(input);

    const parsingResult = [];
    for (let i = 0; i < records.length; i++) {
      await page.goto(records[i][1]);
      await page.waitForSelector("body");
      await page.waitForTimeout(1000);

      const evaluateResult = await page.evaluate(() => {
        const snippet = Array.from(document.querySelectorAll("ul.prdList.column4 > li")).map((v) => {
          // prettier-ignore
          const tit = v.textContent
              .trim()
              .split("\n")[0]
              .split(":")[1]
              .match(/[ㄱ-힣].+/g)[0]
              .replaceAll("\'", "").replaceAll("\"", "").trim()

          let country = tit;

          if (country.split(" ")[0] === "디카페인") {
            country = country.split(" ")[1];
          } else {
            country = country.split(" ")[0];
          }
          const price = v.querySelector("li > span").textContent.replace(",", "").replace("원", "").trim();
          const directUrl = v.querySelector("a").href;
          const variety = null;
          const processing = null;
          const description = null;
          const soldOut = v.querySelector(".icon .icon_img") ? true : false;

          // Seq : title price country provider url
          return {
            title: tit,
            country,
            provider: "rehmcoffee",
            price,
            variety,
            processing,
            description,
            directUrl,
            soldOut,
          };
        });
        return snippet;
      });

      // "디카페인"일경우 [1]가 country

      for (let v of evaluateResult) {
        const response = await sql.insertCoffeeData(v);
        console.log(response);
      }
      // waitForFunction으로 변경 할 것
      await page.waitForTimeout(2000);
    }

    console.log("\n\n ╰(*°▽°*)╯ coffee data parsing is done ╰(*°▽°*)╯\n\n");
    await page.close();
    await browser.close();
  } catch (e) {
    console.log(e);
  }
};
parser();
