const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");
const sql = require("../../sqls/sql");

async function parser() {
  try {
    const basePath = path.join(__dirname, "..", "..", "..", "assets", "gsc");
    // default_location file에 ${sileNmae}_location.csv 파일을 만들고, 기본 주소를 입력해주세요!
    fs.readFile(`${basePath}/gsc_location.csv`, (err) => {
      if (err) {
        fs.writeFileSync(`${basePath}/gsc_parse_location.csv`, "");
      }
    });

    fs.readFile(`${basePath}/gsc_parse_result.csv`, (err) => {
      if (err) {
        fs.writeFileSync(`${basePath}/gsc_parse_result.csv`, "");
      }
    });

    let input = fs.readFileSync(`${basePath}/gsc_location.csv`).toString("utf-8");
    let records = parse(input);
    let browser = await puppeteer.launch({
      headless: false,
      args: ["--window-size:1280,1280"],
      defaultViewport: { width: 900, height: 1080 },
    });
    await browser.userAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36"
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
        check && newUrlList.push(["gsc", pageLocation]);
      } while (check);
    }

    // 기존 default url을 새로 parsing한 url list에 추가
    records.map((val) => {
      newUrlList.push(val);
    });

    // newUrlList를 siteName_parse_location.csv에 저장
    let csvFormatData = stringify(newUrlList);
    fs.writeFileSync(`${basePath}/gsc_parse_location.csv`, csvFormatData);

    console.log("\n\n\n url parser is done! \n\n\n");
  } catch (error) {
    console.log("Error ocurred! plz check the log");
    console.error(error);
    process.exit();
  }
}

parser();
