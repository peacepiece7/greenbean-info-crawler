import puppeteer from "puppeteer";
import fs from "fs";
import parse from "csv-parse/lib/sync";
import stringify from "csv-stringify/lib/sync";
import CoffeeUploader from "../../firebase/firebase-uploader.js";

const uploader = new CoffeeUploader();

// Create siteName_location.csv
const royalCrawler = async (siteName, parsingStart) => {
  // default_location file에 ${sileNmae}_location.csv 파일을 만들고, 기본 주소를 입력해주세요!
  fs.readFile(`coffee_assets/tmp/parse_location/${siteName}_location.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, "");
    }
  });

  fs.readFile(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, "");
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

    let input = fs.readFileSync(`coffee_assets/tmp/default_location/${siteName}_location.csv`).toString("utf-8");
    let records = parse(input);

    await page.goto(records[0][1]);
    await page.waitForTimeout(5000);
    let counter = 2;
    let check = true;

    while (check) {
      const currentUrl = records[0][1].replace("?", `?page=${counter}`);
      await page.goto(currentUrl);
      await page.waitForTimeout(1000);
      const pageIndex = await page.evaluate(() => {
        return document.querySelector("td[align=center] td[align=center] td[align=center] b").textContent;
      });
      if (pageIndex == 1) {
        check = false;
      } else {
        counter++;
        records.push([siteName, currentUrl]);
      }
    }

    let str = stringify(records);
    fs.writeFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, str);
    await page.close();
    await browser.close();
    parsingStart(siteName);
  } catch (err) {
    console.log(err);
  }
};

const parser = async (siteName) => {
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

    const input = fs.readFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`).toString("utf-8");
    const records = parse(input);
    // 데이터가 없을 떄 까지 각 페이지를 반복
    // 한 페이지 안의 모든 데이터를 evaluate, 이를 페이지 데이터라 함
    // 페이지 데이터를 모두 모아서 db에 업로드

    const parsingResult = [];
    for (let i = 0; i < records.length; i++) {
      await page.goto(records[i][1]);
      await page.waitForSelector("#prd_gallery");
      await page.waitForTimeout(1000);

      const evaluateResult = await page.evaluate(() => {
        const snippet = [];
        Array.from(document.querySelectorAll("ul#prd_gallery li")).map((val) => {
          let title = val.children[0].textContent.replace(/[^ㄱ-힣]+/, "").split("\n")[0];
          let price = val.textContent.match(/[0-9]+.[0-9]+원/g);
          if (price) {
            price = price[0].split(",").join("");
          }
          let country = title.split(" ")[0];
          if (country === "에디오피아") {
            country = "에티오피아";
          }
          const directUrl = val.parentNode.href;
          snippet.push([title.trim(), price ? price : "0원", country, "Royal Coffee", directUrl]);
        });
        return snippet;
      });
      evaluateResult.map((value) => {
        parsingResult.push(value);
      });
    }
    console.log(parsingResult);
    const str = stringify(parsingResult);
    fs.writeFileSync(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, str);

    // Upload coffee data
    parsingResult.map((val, idx) => {
      uploader.createCoffeeData(val);
    });
  } catch (e) {
    console.log(e);
  }
};

royalCrawler("royalcoffee", parser);
