// "11111";
// 为什么要分析依赖，因为我们需要拿到路径
import { add } from "./a.js";
import { test } from "./b.js";
console.log(add(1, 2));
test("webpack");
console.log("asdfasd");

// 异步加载
import(/*webpackChunkName:"async"*/ "./async.js").then((res) => {
  // 执行 show 函数
  res.show("webpackJsonp");
});
