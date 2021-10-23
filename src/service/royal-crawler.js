import puppeteer from "puppeteer";
import fs from "fs";
import parse from "csv-parse/lib/sync";
import stringify from "csv-stringify/lib/sync";
import CoffeeUploader from "../firebase/firebase-uploader.js";

const uploader = new CoffeeUploader();

// Create siteName_location.csv
const royalCrawler = async (siteName) => {
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

  //  input = fs.readFileSync(`coffee_assets/tmp/default_location/${siteName}_location.csv`).toString("utf-8");
  //  records = parse(input);

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

    let input = fs.readFileSync(`coffee_assets/tmp/default_location/${siteName}_location.csv`).toString("utf-8");
    let records = stringify(input);

    for (let i = 0; i <= records.length; i++) {
      await page.waitForNavigation();
      await page.evaluate(() => {
        // 만약 아래 코드의 textContent가 1일경우 (redirect되었을 경우)
        // url을 저장하지 않고, 다음 record의 주소로 이동
        document.querySelector("td[align=center] td[align=center]");
      });
    }
    // 데이터가 없을 떄 까지 각 페이지를 반복
    // 한 페이지 안의 모든 데이터를 evaluate, 이를 페이지 데이터라 함
    // 페이지 데이터를 모두 모아서 db에 업로드

    for (let i = 0; i <= urls.length; i++) {
      await page.goto(urls[i][1]);
      await page.waitForSelector("#prd_gallery");
      await page.waitForTimeout(2000);

      const pageData = await page.evaluate(() => {
        const data = Array.from(document.querySelectorAll("ul#prd_gallery li")).map((val, idx) => {
          let title = val.children[0].textContent.replace(/[^ㄱ-힣]+/, "");
          if (title.includes("\n")) {
            title = title.split("\n")[0];
          }

          // const title = val.split("\n")[1].replace(/[^ㄱ-힣]+/g, "");
          // const country = title.split(" ")[0];
          // const directUrl = val.parentNode.href;
          // const price = val.split("\n")[2].split(" ")[0];
          // return { title, price, country, directUrl };
          return title;
        });
        return data;
      });
      console.log(pageData);
      await page.waitForTimeout(20000);
    }
  } catch (err) {
    console.log(err);
  }
};

royalCrawler("royalcoffee");
