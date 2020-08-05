/*
 * @Author: changluo
 * @Description:
 */

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser"); // 解析生成ast
const traverse = require("@babel/traverse").default; //(递归遍历ast收集依赖)
const { transformFromAstSync } = require("@babel/core"); //babel核心解析库

class Webpack {
  constructor(options) {
    // 入口信息
    const { entry, output } = options;
    this.entry = entry;
    this.output = output;
    this.modules = [];
  }
  getAst(path) {
    // 读取入口文件
    const content = fs.readFileSync(path, "utf-8");
    // 将文件内容转化为 抽象语法树ast
    const ast = parser.parse(content, { sourceType: "module" }); // 解析的是ES模块
    return ast;
  }
  getDependency(ast, filename) {
    // 找出文件的依赖
    const dependency = {};
    traverse(ast, {
      ImportDeclaration({ node }) {
        const filePath =
          "./" + path.join(path.dirname(filename), node.source.value);
        dependency[node.source.value] = filePath;
      },
    });
    return dependency;
  }
  getCode(ast) {
    // 拿到ast的code
    const { code } = transformFromAstSync(ast, null, {
      presets: ["@babel/preset-env"],
    });
    return code;
  }
  // 构建启动
  run() {
    const info = this.build(this.entry);
    this.modules.push(info);
    // 从入口文件开始深度递归解析所有依赖
    for (let i = 0; i < this.modules.length; i++) {
      const item = this.modules[i];
      const { dependencies } = item;
      if (dependencies) {
        for (let j in dependencies) {
          this.modules.push(this.build(dependencies[j]));
        }
      }
    }
    // 生成依赖关系图
    const dependencyGraph = this.modules.reduce((accu, current) => {
      return {
        ...accu,
        // 使用文件路径作为每个模块的唯一标识符,保存对应模块的依赖对象和文件内容
        [current.filename]: {
          dependencies: current.dependencies,
          code: current.code,
        },
      };
    }, {});
    // console.log("dependencyGraph", dependencyGraph);
    this.generate(dependencyGraph);
  }
  build(filename) {
    // 读取入口文件
    const ast = this.getAst(filename);
    // 遍历ast,找到入口文件所有的 依赖dependency
    const dependencies = this.getDependency(ast, filename);
    console.log("dependencies", dependencies);
    const code = this.getCode(ast);
    return {
      // 文件路径,可以作为每个模块的唯一标识符
      filename,
      // 依赖对象,保存着依赖模块路径
      dependencies,
      // 文件内容
      code,
    };
  }
  // 重写require,输出bundle.js
  generate(graph) {
    const { path: filePath, filename } = this.output;
    const newGraph = JSON.stringify(graph);

    // 输出文件的绝对路径
    const bundleFilePath = path.join(filePath, filename);
    console.log("bundleFilePath", bundleFilePath);
    const bundle = `(function(newGraph){
        function require(module){
            function localRequire(relativePath){
                return require(newGraph[module].dependencies[relativePath]);
            }
            let exports={};
            (function(require,exports,code){
                eval(code);
            })(localRequire,exports,newGraph[module].code);
            return exports;
        }
        require('${this.entry}');
    })(${newGraph})`;
    fs.writeFileSync(bundleFilePath, bundle, "utf-8");
  }
}
module.exports = Webpack;
