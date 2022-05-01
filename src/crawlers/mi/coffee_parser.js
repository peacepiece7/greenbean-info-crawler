const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const sql = require("../../sqls/sql");

const parser = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "mi");
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const input = fs.readFileSync(`${basePath}/mi_parse_location.csv`).toString("utf-8");
    const records = parse(input);

    for (let i = 0; i < records.length; i++) {
      await page.goto(records[i][1]);
      await page.waitForSelector(".item_tit_box .item_name");
      await page.waitForTimeout(1000);

      // [...document.querySelectorAll(".item_gallery_type li")].map((v) => v.querySelector(".item_price").textContent.trim())

      // [...document.querySelectorAll(".item_gallery_type li")].map((v) => v.querySelector(".item_name").textContent.trim())

      const coffeeList = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".item_gallery_type li")).map((li) => {
          const info = li.querySelector(".item_name").textContent;
          let title = info.trim();
          if (title.includes("]")) title = title.split("]")[1];
          const country = title.split(" ")[0];
          const provider = "micoffee";
          const price = parseInt(li.querySelector(".item_price").textContent.trim().replace(",", "").replace("원", ""));
          const variety = null,
            processing = null,
            description = null;

          const directURL = li.querySelector(".item_photo_box a").href.trim();
          let soldOut = false;
          if (info.includes("품절") || price == 0) soldOut = true;

          return {
            title,
            country,
            provider,
            price,
            variety,
            processing,
            description,
            directURL,
            soldOut,
          };
        });
      });
      for (let v of coffeeList) {
        console.log(v);
        const response = await sql.insertCoffeeData(v);
        console.log(response);
      }
    }
    await page.close();
    await browser.close();
    console.log("\n\n\n (*°▽°*)╯  mi coffee list parsing done! (*°▽°*)╯  \n\n\n");
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

parser();
