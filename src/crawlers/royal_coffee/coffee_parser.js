const puppeteer = require("puppeteer");
const fs = require("fs");
const parse = require("csv-parse/lib/sync");
const path = require("path");
const sql = require("../../sqls/sql");

const parseRoyalcoffeeList = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "royalcoffee");
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const records = parse(fs.readFileSync(`${basePath}/royalcoffee_parse_location.csv`, "utf-8"));

    for (let record of records) {
      await page.goto(record[1]);
      await page.waitForTimeout(5000);

      const coffeeList = await page.evaluate(() => {
        const snippet = [];
        Array.from(document.querySelectorAll("ul#prd_gallery li")).map((val) => {
          let title = val.children[0].textContent.replace(/[^ㄱ-힣]+/, "").split("\n")[0];
          let price = val.textContent.match(/[0-9]+.[0-9]+원/g);
          if (price) {
            price = price[0].replace(",", "").replace("원", "");
          }
          let country = title.split(" ")[0];
          if (country === "에디오피아") {
            country = "에티오피아";
          } else if (country === "인디아") {
            country = "인도";
          }
          const directUrl = val.parentNode.href;
          snippet.push([title.trim(), price ? price : "0원", country, "Royal Coffee", directUrl]);
        });
        return snippet;
      });

      console.log("coffeeList", coffeeList);

      for (let arr of coffeeList) {
        const coffeeData = {
          title: arr[0],
          price: arr[1],
          country: arr[2],
          provider: arr[3],
          directURL: arr[4],
          soldOut: false,
        };

        const result = await sql.insertCoffeeData(coffeeData);
        console.log(result);
      }
    }
    console.log("\n\n     ╰(*°▽°*)╯ royal coffee data parser done!\n\n");
    await page.close();
    await browser.close();
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

parseRoyalcoffeeList();
