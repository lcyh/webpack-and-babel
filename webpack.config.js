/*
 * @Author: changluo
 * @Description:
 */

const path = require("path");
const HelloWorldPlugin = require("./lib/HelloWorldPlugin");
const HtmlWebpackPlugin = require("./lib/HtmlWebpackPlugin");
const RemoveCommentLoader = require("./lib/RemoveCommentLoader");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "main.js",
  },

  plugins: [
    new HelloWorldPlugin({
      name: "hello webpack",
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./public/index.html"),
      filename: "index.html",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "RemoveCommentLoader", // 当匹配到js文件时，使用我们编写的remove-comment-loader
            options: {
              name: "RemoveCommentLoader",
              size: 12,
            },
          },
        ],
      },
    ],
  },
  resolveLoader: {
    modules: ["node_modules", "./lib/"], // 配置加载本地loader
  },
};
