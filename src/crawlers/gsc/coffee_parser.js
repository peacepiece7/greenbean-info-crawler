const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const sql = require("../../sqls/sql");

// Create siteName_location.csv
const gscCralwer = async () => {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "gsc");
    // 모든 사이트 돌아다니면서 파싱 시작
    let input = fs.readFileSync(`${basePath}/gsc_parse_location.csv`).toString("utf-8");
    let records = parse(input);
    let browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size:1280,1280"],
      defaultViewport: { width: 900, height: 1080 },
    });
    let page = await browser.newPage();

    for (const [i, r] of Object.entries(records)) {
      await page.goto(r[1]);
      const evaluateResult = await page.evaluate(() => {
        // const soldOutEl = document.querySelectorAll(".item_photo_box .item_soldout_bg")
        const titles = Array.from(document.querySelectorAll(".item_tit_box .item_name")).map((element) => {
          return element.textContent;
        });

        const countries = titles.map((val) => {
          const country = val.replace(/].+/, "").split("[").join("");
          if (country === "파푸아 뉴기니") {
            return "파푸아뉴기니";
          } else {
            return country;
          }
        });

        const directUrl = Array.from(document.querySelectorAll(".item_cont .item_photo_box a")).map(
          (value) => value.href
        );

        // parse price
        const prices = Array.from(document.querySelectorAll(".item_money_box .item_price span")).map((element) => {
          return element.textContent;
        });

        const soldOut = Array.flrom(document.querySelectorAll(".item_gallery_type .grid4 li")).map((v) => {
          if (v.className.includes("item_soldout")) return true;
          return false;
        });
        let tagParsingResult = [];
        for (let i = 0; i < titles.length; i++) {
          tagParsingResult.push({
            title: titles[i].trim(),
            country: countries[i].trim(),
            provider: "GSC",
            price: parseInt(prices[i].replace(",", "").replace("원", "").trim()),
            variety: null,
            processing: null,
            description: null,
            directURL: directUrl[i].trim(),
            soldOut,
          });
        }
        return tagParsingResult;
      });

      console.log(evaluateResult);
    }

    await page.close();
    await browser.close();
    process.exit();
  } catch (error) {
    console.log("Error oucurred plz check log");
    console.error(error);
    process.exit();
  }
};

gscCralwer();

// SOCKS5 = Deep web browser header
// HIA = High Annonimity
// NOA = Not of Annonimity

// https://spys.one/en/free-proxy-list/
// postman으로 보냈을 떄, 페이지 정보가 잘 나오면 크롤링하기 쉬운 사이트
