// const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = {
  entry: {
    // add a key and path when you make .js file public folder
    // output is created automatically
    gscCralwer: "./src/service/gsc-crawler.js",
  },
  // plugins: [
  //   new MiniCssExtractPlugin({
  //     filename: "styles.css",
  //   }),
  // ],
  output: {
    filename: "js/[name].js",
    path: path.resolve(__dirname, "assets"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
          },
        },
      },
      // {
      //   test: /\.scss$/,
      //   use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      // },
    ],
  },
};
