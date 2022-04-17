const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");
const stringify = require("csv-stringify/lib/sync");

const parsePageURL = async () => {
  const basePath = path.join(__dirname, "..", "..", "..", "assets", "almacielo");
  // default_location file에 ${sileNmae}_location.csv 파일을 만들고, 그 안에 parsing할 URL을 입력해주세요!
  fs.readFile(`${basePath}/almacielo_location.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`${basePath}/almacielo_parse_location.csv`, "");
    }
  });

  fs.readFile(`${basePath}/almacielo_parse_result.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`${basePath}/almacielo_parse_result.csv`, "");
    }
  });

  fs.readFile(`${basePath}/almacielo_page_location.csv`, (err) => {
    if (err) {
      fs.writeFileSync(`${basePath}/almacielo_page_location.csv`, "");
    }
  });

  let input = fs.readFileSync(`${basePath}/almacielo_location.csv`).toString("utf-8");
  let records = parse(input);
  try {
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
        await page.waitForTimeout(500);
        check = await page.evaluate(() => {
          // ** 이 코드는 사이트마다 계속해서 변경해 줘야 합니다! **
          const contEl = document.querySelectorAll(".box .img .prdimg");
          if (contEl.length) {
            return true;
          } else {
            return false;
          }
        });

        pageIdx++;
        // 이 부분은 regex로 변경해야 crawler("site name")로 모든 사이트 동작 가능
        // ** 이 코드는 사이트마다 계속해서 변경해 줘야 합나디! **
        const pageLocation = r[1].replace("php?", `php?page=${pageIdx}&`);
        await page.goto(pageLocation);
        check && newUrlList.push(["almacielo", pageLocation]);
      } while (check);
    }

    // 기존 default url을 새로 parsing한 url list에 추가
    records.map((val) => {
      newUrlList.push(val);
    });

    // newUrlList를 almacielo_parse_location.csv에 저장
    let csvFormatData = stringify(newUrlList);
    fs.writeFileSync(`${basePath}/almacielo_parse_location.csv`, csvFormatData);

    await page.close();
    await browser.close();
  } catch (err) {
    console.log(err);
  }
};

parsePageURL();

module.exports = parsePageURL;
