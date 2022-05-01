const dotenv = require("dotenv");
dotenv.config();
const mysql = require("mysql2");

const coffeePool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.ROOT_USER,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = coffeePool.promise();

const sql = {
  insertCoffeeData: async (v) => {
    try {
      const isExists = await promisePool.query(`
        select * from collections where title = '${v.title}' and provider = '${v.provider}' limit 1;
      `);

      console.log("IS EXISTS OBJECT : ", isExists[0]);
      console.log("IS EXISTS LENGTH : ", isExists[0].length);
      if (isExists[0].length === 0) {
        const response = await promisePool.query(
          `
          insert into collections (title, provider, country, price, variety, processing, description ,direct_url, sold_out)
          values('${v.title}','${v.provider}', '${v.country}', ${v.price},
          ${v.variety ? `'${v.variety}'` : null},
          ${v.processing ? `'${v.processing}'` : null},
          ${v.description ? `'${v.description}'` : null},
          '${v.directURL}',
          ${v.soldOut})
          `
        );
        console.log("INSERT : ", response);
        return "\n\nInsert collection\n\n";
      } else {
        await promisePool.query(
          `
          update collections
          set title = '${v.title}', provider = '${v.provider}', country =  '${v.country}', 
          price ='${v.price}', variety = ${v.variety ? `'${v.variety}'` : null}, 
          processing = ${v.processing ? `'${v.processing}'` : null},
          description =${v.description ? `'${v.description}'` : null},
          direct_url = '${v.directURL}',
          sold_out = ${v.soldOut} where title = '${v.title}' and provider = '${v.provider}'
          `
        );
        console.log("UPDATE : ", response);
        return "\n\nUpdate collection!\n\n";
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  },
};

module.exports = sql;

// * legarcy query 1
// `
// insert into collections (title, provider, country, price, variety, processing, description ,direct_url, sold_out)
// values('${v.title}','${v.provider}', '${v.country}', ${v.price},
// ${v.variety ? "'" + v.variety + "'" : null},
// '${v.processing ? v.processing : null}',
// '${v.description ? "'" + v.description + "'" : null}',
// '${v.directURL}',
// ${v.soldOut})
// `
// * legarcy query 2
// ` insert into collections (title, country, provider, price, variety, processing, description, direct_url, sold_out)
// select * from (select '${v.title}', '${v.country}', '${v.provider}', '${v.price}',
//   ${v.variety ? `'${v.variety}'` : null},
//   ${v.processing ? `'${v.processing}'` : null},
//   ${v.description ? `'${v.description}'` : null}, '${v.directURL}', ${v.soldOut}) as tmp
//   where not exists (
//     select title from collections where title = '${v.title}'
//   ) limit 1;

// `
