/*
 * @Author: changluo
 * @Description: visitor 操作抽象语法树
 */

const babel = require("@babel/core"); //babel核心解析库
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("babel-types"); //babel类型转化库

const OriginCode = `(n)=> {
  return n * n;
}`;

//visitor 访问者对象 可以对特定节点进行处理
let visitor = {
  ArrowFunctionExpression(path) {
    //定义需要转换的节点,这里拦截箭头函数
    let params = path.node.params;
    let body = path.node.body;
    //使用babel-types的functionExpression方法生成新节点
    let func = types.functionExpression(null, params, body, false, false);
    //替换节点
    path.replaceWith(func);
  },
  Identifier({ node }) {
    if (node.name === "n") {
      node.name = "m";
    }
  },
};

const ast = parser.parse(OriginCode, {
  sourceType: "module",
});

// 方式一 通过traverse递归遍历ast的方式，对ast增删改查
traverse(ast, {
  ArrowFunctionExpression(path) {
    console.log(path.node.body);
    let node = path.node;
    // console.log("node", node);
    let body = node.body;
    // console.log("body", body);
    let params = node.params;
    // node.params[0].name = "m";
    // body.body[0].argument.left.name = "m";
    // body.body[0].argument.right.name = "m";
    let r = types.functionExpression(null, params, body, false, false);
    path.replaceWith(r);
  },
  Identifier: {
    enter({ node }) {
      if (node.name === "n") {
        node.name = "m";
      }
    },
    exit({ node }) {
      //   console.log("exit-Identifier", node);
    },
  },
});

// 方式二 在生成代码时，通过visitor访问者模式对ast增删改查
let { code } = babel.transformFromAstSync(ast, null, {
  plugins: [{ visitor }],
});
console.log("转换后的code", code);
