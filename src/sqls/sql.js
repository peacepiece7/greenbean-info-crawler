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
      let result;
      if (!v.description) {
        result = await promisePool.query(
          `
          insert into collections (title, provider, country, price, variety, processing, direct_url, sold_out)
          values('${v.title}', '${v.provider}', '${v.country}', ${v.price}, '${v.variety}', '${v.processing}', '${v.directURL}', ${v.soldOut})
          `
        );
      } else {
        result = await promisePool.query(
          `
          insert into collections (title, provider, country, price, variety, processing, description ,direct_url, sold_out)
          values('${v.title}', '${v.provider}', '${v.country}', ${v.price}, '${v.variety}', '${v.processing}', '${v.description}','${v.directURL}', ${v.soldOut})
          `
        );
      }
      return [result[0]];
    } catch (error) {
      console.log(error);
      return error;
    }
  },
};

module.exports = sql;
