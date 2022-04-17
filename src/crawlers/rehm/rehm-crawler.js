// document.querySelectorAll("div.xans-product-listmain-2 ul.prdList.column4 > li")

import puppeteer from "puppeteer";
import fs, { readFileSync } from "fs";
import parse from "csv-parse/lib/sync";
import stringify from "csv-stringify/lib/sync";
import CoffeeUploader from "../../firebase/firebase-uploader.js";

const uploader = new CoffeeUploader();

const rehmCrawler = async (siteName, parsingStart) => {
  fs.readFile(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, "");
    }
  });
  fs.readFile(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, "");
    }
  });

  const input = readFileSync(`coffee_assets/tmp/default_location/${siteName}_location.csv`).toString("utf-8");
  const records = parse(input);
  try {
    const browser = await puppeteer.launch({ headless: false, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const parseResult = [];
    const page = await browser.newPage();
    for (let i = 0; i < records.length; i++) {
      let index = 1;
      let isExist = true;
      while (isExist) {
        const url = records[i][1].replace(/\?/g, `?page=${index}&`);
        await page.goto(url);
        await page.waitForSelector("body");
        await page.waitForTimeout(1000);
        const link = await page.evaluate(() => {
          if (document.querySelector("ul.prdList.column4 > li")) {
            return window.location.href;
          } else {
            return null;
          }
        });
        // waitForFunction으로 link를 받아오는 시간을 정확히 표기
        await page.waitForTimeout(1000);
        console.log("link", link);
        if (link) {
          parseResult.push([siteName, link]);
          index++;
        } else {
          isExist = false;
        }
      }
      await page.waitForTimeout(Math.floor(Math.random() * 1000) + 1000);
    }

    console.log("URL parsing done");

    const str = stringify(parseResult);
    fs.writeFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, str);

    parsingStart(siteName);
  } catch (err) {
    console.log(err);
  }
};

const parser = async (siteName) => {
  console.log("Data parser start");
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
          const price = v.querySelector("li > span").textContent.split(",").join("").trim();
          const directUrl = v.querySelector("a").href;

          // Seq : title price country provider url
          return [tit, price, country, "Rehm Coffee", directUrl];
        });
        return snippet;
      });

      // "디카페인"일경우 [1]가 country

      // waitForFunction으로 변경 할 것
      await page.waitForTimeout(2000);

      evaluateResult.map((val) => {
        parsingResult.push(val);
      });
    }

    const str = stringify(parsingResult);
    fs.writeFileSync(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, str);

    // Upload coffee data
    parsingResult.map((val) => {
      uploader.createCoffeeData(val);
    });

    console.log("Data parsing is done");
    await page.close();
    await browser.close();
  } catch (e) {
    console.log(e);
  }
};
// rehmCrawler("rehm");

rehmCrawler("rehm", parser);
