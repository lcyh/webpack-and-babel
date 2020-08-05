/*
 * @Author: changluo
 * @Description:删除注释loader  //  /**
 */

// 可以通过loader-utils这个包获取该loader的配置项options
const loaderUtils = require("loader-utils");

// 导出一个函数，source为webpack传递给loader的文件源内容
module.exports = function (source) {
  // 获取该loader的配置项
  const options = loaderUtils.getOptions(this);
  console.log("options", options);
  // 匹配js中的注释内容
  const reg = new RegExp(/(\/\/.*)|(\/\*[\s\S]*?\*\/)/g);
  // 一些转换处理，最终返回处理后的结果
  // 删除注释
  return source.replace(reg, "");
};
