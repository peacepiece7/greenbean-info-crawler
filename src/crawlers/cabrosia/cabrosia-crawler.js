import puppeteer from "puppeteer";
import fs, { readFileSync } from "fs";
import parse from "csv-parse/lib/sync";
import stringify from "csv-stringify/lib/sync";
import CoffeeUploader from "../../firebase/firebase-uploader.js";

const uploader = new CoffeeUploader();

const cabrosiaCrawler = async (siteName, parsingStart) => {
  fs.readFile(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`cofee_assets/tmp/parse_location/${siteName}_parse_location.csv`, "");
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
    const browser = await puppeteer.launch({ headless: true, args: ["--window-size:1400,1400"] });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36"
    );
    const parseResult = [];
    const page = await browser.newPage();
    for (let i = 0; i < records.length; i++) {
      await page.goto(records[i][1]);
      await page.waitForSelector(".item-detail");
      await page.waitForTimeout(1000);
      const evaluateResult = await page.evaluate((siteName) => {
        const links = [];
        Array.from(document.querySelectorAll(".item-detail .item-summary-link")).map((element) => {
          links.push([siteName, element.href]);
        });
        return links;
      }, siteName);
      evaluateResult.map((val) => {
        parseResult.push(val);
      });
    }

    const str = stringify(parseResult);
    fs.writeFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, str);

    parsingStart(siteName);
  } catch (err) {
    console.log(err);
  }
};

const parser = async (siteName) => {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--window-size:1400,1400"] });
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

      // prettier-ignore
      const title = await page.$eval(".view_tit", (el) => {
        return el.textContent.replace(/\*?^\(.{1,6}\)/g, "").split("\t")[0].trim()
      })
      const price = await page.evaluate(() => {
        const prices = Array.from(document.querySelectorAll(".dropdown-item")).map((val, idx) => {
          if (idx === 1) {
            const text = val.textContent.match(/[0-9]+\,[0-9]+원/);

            return text && text;
          } else {
            return null;
          }
        });
        let price;
        prices.forEach((val) => {
          if (val) {
            price = val[0];
          }
        });
        if (price) {
          price = price.split(",").join("").trim();
          return price;
        } else {
          price = "Promotion item";
        }
        return price;
      });

      const directUrl = await page.evaluate(() => {
        return document.location.href;
      });

      await page.waitForTimeout(1000);
      const country = title.split(" ")[0];
      console.log([title.trim(), price, country, "CABROSIA", directUrl]);
      parsingResult.push([title.trim(), price, country, "CABROSIA", directUrl]);
    }
    const str = stringify(parsingResult);
    fs.writeFileSync(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, str);

    // Upload coffee data
    parsingResult.map((val) => {
      uploader.createCoffeeData(val);
    });
    await page.close();
    await browser.close();
  } catch (e) {
    console.log(e);
  }
};

cabrosiaCrawler("cabrosia", parser);

// parser("cabrosia");
