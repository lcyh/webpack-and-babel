/*
 * @Author: changluo
 * @Description:自定义插件
 */
// 1. 一个JavaScript命名函数
// 2. 在插件函数的 prototype 上定义一个apply方法
class HelloWordPlugin {
  // 3. apply 中有一个 compiler 形参
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    // console.log("插件执行了", this.options);
    // 4.通过compiler对象可以注册对应的事件，全部的钩子都可以使用
    compiler.hooks.emit.tap("HelloWordPlugin", (compilation) => {
      console.log("触发emit方法");
    });
    // 5.注册一个编译完成的钩子， 一般需要将插件名作为事件名即可
    compiler.hooks.done.tap("HelloWordPlugin", (stats) => {
      console.log("整个webpack打包结束了");
    });
  }
}

module.exports = HelloWordPlugin;
