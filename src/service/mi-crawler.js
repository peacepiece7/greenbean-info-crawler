import puppeteer from "puppeteer";
import fs from "fs";
import parse from "csv-parse/lib/sync";
import stringify from "csv-stringify/lib/sync";
import CoffeeUploader from "../firebase/firebase-uploader.js";

const uploader = new CoffeeUploader();

// Create siteName_location.csv
const miCrawler = async (siteName, parsingStart) => {
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
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36",
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const input = fs.readFileSync(`coffee_assets/tmp/default_location/${siteName}_location.csv`).toString("utf-8");
    const records = parse(input);
    const newRecords = [];

    for (let i = 0; i < records.length; i++) {
      let counter = 1;
      let itemIsExist = true;

      while (itemIsExist) {
        const currentUrl = records[i][1].replace("?", `?page=${counter}&`);
        await page.goto(currentUrl);
        await page.waitForSelector("body");
        await page.waitForTimeout(2000);

        const pageCheck = await page.evaluate(() => {
          const itemTit = document.querySelector(".item_tit_box .item_name");
          return itemTit ? true : false;
        });

        if (pageCheck) {
          counter++;
          newRecords.push([siteName, currentUrl]);
        } else {
          itemIsExist = false;
        }
      }
    }
    console.log(newRecords);
    const str = stringify(newRecords);
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
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36",
    );
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 1280,
    });

    const input = fs.readFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`).toString("utf-8");
    const records = parse(input);

    const parsingResult = [];
    for (let i = 0; i < records.length; i++) {
      await page.goto(records[i][1]);
      await page.waitForSelector(".item_tit_box .item_name");
      await page.waitForTimeout(1000);

      const evaluateResult = await page.evaluate(() => {
        const snippet = [];
        Array.from(document.querySelectorAll(".item_info_cont")).map((val) => {
          const title = val
            .querySelector(".item_name")
            .textContent.replace(/^\[.+\]/g, "")
            .trim();
          const price = val.querySelector(".item_price span").textContent.split(",").join("").trim();
          const country = title.split(" ")[0].trim();
          const directUrl = val.querySelector(".item_tit_box a").href;
          snippet.push([title, price, country, "MI Coffee", directUrl]);
        });
        return snippet;
      });
      evaluateResult.map((value) => {
        parsingResult.push(value);
      });
    }

    const str = stringify(parsingResult);
    fs.writeFileSync(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, str);

    // Upload coffee data
    parsingResult.map((val) => {
      uploader.createCoffeeData(val);
    });
  } catch (e) {
    console.log(e);
  }
};

miCrawler("micoffee", parser);
