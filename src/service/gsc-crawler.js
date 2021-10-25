import puppeteer from "puppeteer";
import fs from "fs";
import parse from "csv-parse/lib/sync";
import stringify from "csv-stringify/lib/sync";
import CoffeeUploader from "../firebase/firebase-uploader.js";

const uploader = new CoffeeUploader();

// Create siteName_location.csv
export const gscCralwer = async (siteName) => {
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

  let input = fs.readFileSync(`coffee_assets/tmp/default_location/${siteName}_location.csv`).toString("utf-8");
  let records = parse(input);
  try {
    let browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size:1280,1280"],
      defaultViewport: { width: 900, height: 1080 },
    });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36",
    );
    const newUrlList = [];
    let page = await browser.newPage();
    for (const [i, r] of Object.entries(records)) {
      await page.goto(r[1]);
      let pageIdx = 1;
      let check = true;
      do {
        await page.waitForSelector("body");
        await page.waitForTimeout(1000);
        check = await page.evaluate(() => {
          const contEl = document.querySelectorAll(".item_cont .item_photo_box");
          if (contEl.length) {
            return true;
          } else {
            return false;
          }
        });

        pageIdx++;
        // 이 부분은 regex로 변경해야 crawler("site name")로 모든 사이트 동작 가능
        const pageLocation = r[1].replace("php?", `php?page=${pageIdx}&`);
        await page.goto(pageLocation);
        check && newUrlList.push([siteName, pageLocation]);
      } while (check);
    }

    // 기존 default url을 새로 parsing한 url list에 추가
    records.map((val) => {
      newUrlList.push(val);
    });

    // newUrlList를 siteName_parse_location.csv에 저장
    let csvFormatData = stringify(newUrlList);
    fs.writeFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`, csvFormatData);

    // 모든 사이트 돌아다니면서 파싱 시작
    input = fs.readFileSync(`coffee_assets/tmp/parse_location/${siteName}_parse_location.csv`).toString("utf-8");
    records = parse(input);
    page = await browser.newPage();
    const parsingResult = [];

    for (const [i, r] of Object.entries(records)) {
      await page.goto(r[1]);
      const evaluateResult = await page.evaluate(() => {
        const tagParsingResult = [];
        //? if sold out
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

        const directUrl = Array.from(document.querySelectorAll(".item_cont .item_photo_box a")).map((value) => value.href);

        // parse price
        const prices = Array.from(document.querySelectorAll(".item_money_box .item_price span")).map((element) => {
          return element.textContent;
        });
        for (let i = 0; i < titles.length; i++) {
          tagParsingResult.push([titles[i].trim(), prices[i].replace(",", "").trim(), countries[i].trim(), "GSC", directUrl[i].trim()]);
        }
        return tagParsingResult;
      });
      evaluateResult[0] &&
        evaluateResult.map((value) => {
          parsingResult.push(value);
        });
    }
    csvFormatData = stringify(parsingResult);
    fs.writeFileSync(`coffee_assets/tmp/parse_result/${siteName}_parse_result.csv`, csvFormatData);

    // Upload coffee data
    parsingResult.map((val) => {
      setTimeout(() => {
        console.log("각각의 입력 값", val);
        uploader.createCoffeeData(val);
      }, 500);
    });
    await page.close();
    await browser.close();
  } catch (err) {
    console.log(err);
  }
};

gscCralwer("gsc");

// SOCKS5 = Deep web browser header
// HIA = High Annonimity
// NOA = Not of Annonimity

// https://spys.one/en/free-proxy-list/
// postman으로 보냈을 떄, 페이지 정보가 잘 나오면 크롤링하기 쉬운 사이트
