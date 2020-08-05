## webpack 打包原理和 babel 抽象语法树(ast)

#### 什么是 webpack

- 概念：本质上，webpack 是一个现代 JavaScript 应用程序的`静态模块打包器`(module bundler)。当 webpack 处理应用程序时，它会`递归`地构建一个依赖关系图(dependency graph)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个 bundle。

#### 安装

- 全局安装(不推荐) ：npm i webpack webpack-cli -g

  ```
  问题：当多个项目webpack版本不一致时，会出现版本错乱，进而启动出现问题等
  ```

- 项目安装(推荐) ：npm i webpack webpack-cli -D

| 包          | 作用                                         |
| ----------- | -------------------------------------------- |
| webpack     | 打包,依赖安装 webpack-cli                    |
| webpack-cli | 依赖安装 webpack,在命令行中注册`webpack命令` |

```
在 npm version >= 5.2.0 开始，自动安装了npx。
npx是什么呢？ npx 会帮你执行依赖包里的二进制文件,当前项目里./node_modules/.bin/webpack。
注意：不使用npx而直接运行webpack -v时会发现不识别webpack，是由于直接运行webpack，会去全局目录中查找，而由于此时webpack是项目内安装的而非全局安装，所以找不到。
```

举个栗子：

> npm i webpack -D //非全局安装
>
> //如果要执行 webpack 的命令,需要运行下面的命令
>
> ./node_modules/.bin/webpack -v

有了 npx 之后

> npm i webpack -D //非全局安装
>
> npx webpack -v

#### 打包

- 指定入口文件 index.js

  > npx webpack ./index.js

- 使用`默认配置`进行打包（不推荐，不创建自定义配置文件）

  > npx webpack

  ```
  1.在根目录下不管存不存在webpack.config.js文件，npx webpack等同于npx webpack --config webpack.config.js
  2.如果项目根目录下存在webpack.config.js文件，会默认以此文件为配置文件进行打包
  3.如果没有，此时会使用webpack默认的配置文件进行打包，并且默认是以src/index.js文件为打包入口
  ```

- 默认配置文件(自带)

  ```
  webpack.config.js

  const path=require('path');
  module.exports={
      entry:'./src/index.js',
      output:{
          path:path.resolve(__dirname,'./dist'),
          filename:'main.js'
      }
  }
  ```

- 使用`自定义`配置文件

  > npx webpack --config webpack.config.js
  >
  > 或
  >
  > npx webpack

- 使用自定义 npm script 运行 webpack

  - 如果嫌以上麻烦，可以在`package.json`中配置 script 脚本，如下

    ```
    {
      "name": "webpack",
      "version": "1.0.0",
      "description": "",
      "main": "index.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "dev":"node ./src/index.js",
        "build":"webpack --config webpack.config.js"
      },
      "keywords": [],
      "author": "",
      "license": "ISC",
      "dependencies": {
        "webpack": "^4.43.0",
        "webpack-cli": "^3.3.12"
      }
    }

    ```

  - 配置好后，执行`npm run webpack`即可`映射`到命令”`webpack --config webpack.config.js`“

  - 并且`npm run build`会首先到项目 node_modules 中寻找再到全局 node_modules 中去寻找，和 npx 功能差不多

- NPM 原理

  - 原理：每当执行`npm run`，就会自动新建一个 Shell，在这个 Shell 里面执行指定的脚本命令。因此，只要是 Shell 可以运行的命令，就可以写在 npm 脚本里面

    > 1.比较特别的是，`npm run`新建的这个 Shell，会将当前目录的`node_modules/.bin`子目录加入`PATH`变量，执行结束后，再将`PATH`变量恢复原样。
    >
    > 2.这意味着，当前目录的`node_modules/.bin`子目录里面的所有脚本，都可以直接用脚本名调用，而不必加上路径。比如，当前项目的依赖里面有 webpack，只要直接写`webpack`就可以了。

    ```
    在./node_modules/.bin 路径里直接运行：  ./webpack --config webpack.config.js
    ```

  - npm 允许在`package.json`文件里面，使用`scripts`字段定义脚本命令，这些定义在`package.json`里面的脚本，就称为 npm 脚本

  - npm 脚本有`pre`和`post`两个钩子。举例来说，`build`脚本命令的钩子就是`prebuild`和`postbuild`。

    ```
    "prebuild": "echo I run before the build script",
    "build": "cross-env NODE_ENV=production webpack",
    "postbuild": "echo I run after the build script"
    ```

    用户执行`npm run build`的时候，会自动按照下面的顺序执行。

    ```
    npm run prebuild && npm run build && npm run postbuild
    ```

    因此，可以在这两个钩子里面，完成一些准备工作和清理工作。下面是一个例子。

    ```
    "clean": "rimraf ./dist && mkdir dist",
    "prebuild": "npm run clean",
    "build": "cross-env NODE_ENV=production webpack"
    ```

    示例(自媒体后台)：

    ```
       "scripts": {
            "start": "react-app-rewired start",
            "build": "react-app-rewired build && rimraf dist && mv build dist && npm run version",
            "test": "react-app-rewired test",
            "eject": "react-scripts eject",
            "preview": "serve -s dist",
            "version": "node ./script/build-version"
        },
    ```

    ```
      "scripts": {
            "start": "react-app-rewired start",
            "build": "react-app-rewired build",
            "postbuild":"rimraf dist && mv build dist && npm run version",
            "test": "react-app-rewired test",
            "eject": "react-scripts eject",
            "preview": "serve -s dist",
            "version": "node ./script/build-version"
        },
    ```

#### webpack 工作原理

- 基本概念

  在了解 Webpack 原理前，需要掌握以下几个核心概念，以方便后面的理解：

  - Entry：入口，Webpack 执行构建的第一步将从 Entry 开始，可抽象成输入。

  - Module：模块，在 Webpack 里一切皆模块，一个模块对应着一个文件。Webpack 会从配置的 Entry 开始`递归`找出所有依赖的模块。

  - Chunk：代码块，一个 Chunk 由多个模块组合而成，用于代码合并与分割。

  - Loader：模块转换器，用于把模块原内容按照需求转换成新内容,单一职责。

  - Plugin：扩展插件，在 Webpack 构建流程中的特定时机会`广播`出对应的事件，插件可以监听这些事件的发生，在特定时机做对应的事情。

* 流程概括

  Webpack 的运行流程是一个串行的过程，从启动到结束会依次执行以下流程：

  - `初始化参数`：从配置文件和 Shell 语句中读取与合并参数，得出最终的参数；

  - `开始编译`：用上一步得到的参数初始化 Compiler 对象，加载所有配置的**plugin** 插件，执行对象的 run 方法开始执行编译；

  - `确定入口`：根据配置中的 entry 找出所有的入口文件；

  - `编译模块`：从入口文件出发，调用所有配置的**loader**对模块进行翻译，再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理；

  - `完成模块编译`：在经过第 4 步使用 Loader 翻译完所有模块后，得到了每个模块被翻译后的最终内容以及它们之间的依赖关系；

  - `输出资源`：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk，再把每个 Chunk 转换成一个单独的文件加入到输出列表，这步是可以修改输出内容的最后机会；

  - `输出完成`：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统。

* 流程细节

  Webpack 的构建流程可以分为以下三大阶段

  - 初始化：启动构建，读取与合并配置参数，加载 Plugin，实例化 Compiler。

  - 编译：从 Entry 发出，针对每个 Module 串行调用对应的 Loader 去翻译文件内容，再找到该 Module 依赖的 Module，递归地进行编译处理。

  - 输出：对编译后的 Module 组合成 Chunk，把 Chunk 转换成文件，输出到文件系统。

  <img src="https://image-c.weimobwmc.com/wrz/8c4074672ff344a78bfa1960d83d8032.png" alt="1" style="zoom:55%;" />

* Compile 和 Compilation

  在开发 Plugin 时最常用的两个对象就是 Compiler 和 Compilation，它们是 Plugin 和 Webpack 之间的桥梁。 Compiler 和 Compilation 的含义如下：

  - Compiler 对象包含了 Webpack 环境所有的的配置信息，包含 `options`，`loaders`，`plugins` 这些信息，这个对象在 Webpack 启动时候被实例化，它是全局唯一的，可以简单地把它理解为 Webpack 实例；
  - Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。当 Webpack 以开发模式运行时，每当检测到一个文件变化，一次新的 Compilation 将被创建。Compilation 对象也提供了很多事件回调供插件做扩展。通过 Compilation 也能读取到 Compiler 对象。

  > Compiler 和 Compilation 的区别在于：
  >
  > Compiler 代表了整个 Webpack 从启动到关闭的生命周期，表示不变的 webpack 环境，是针对 webpack 的;
  >
  > Compilation 只是代表了一次新的编译,compilation 对象针对的是随时可变的项目文件，只要文件有改动，compilation 就会被重新创建;

* 自定义插件 Plugin

栗子：插件 Plugin 执行时机 ，一个最基础的 Plugin 的代码是这样的：

```
class BasicPlugin{
  // 在构造函数中获取用户给该插件传入的配置
  constructor(options){
  }
  // Webpack 会调用 BasicPlugin 实例的 apply 方法给插件实例传入 compiler 对象
  // 当执行compilation(编译)事件时触发，这里compilation是compile的事件名称
  apply(compiler){
    compiler.plugin('compilation',function(compilation) {
    })
  }
}
// 导出 Plugin
module.exports = BasicPlugin;
```

在使用这个 Plugin 时，相关配置代码如下：

```
const BasicPlugin = require('./BasicPlugin.js');
module.export = {
  plugins:[
    new BasicPlugin(options),
  ]
}
```

> Webpack 启动后，在读取配置的过程中会先执行 `new BasicPlugin(options)` 初始化一个 `BasicPlugin` 获得其实例。 在初始化 `compiler` 对象后，再调用 `basicPlugin.apply(compiler)` 给插件实例传入 `compiler` 对象。 插件实例在获取到 `compiler` 对象后，就可以通过 `compiler.plugin(事件名称, 回调函数)` 监听到 Webpack 广播出来的事件。 并且可以通过 `compiler` 对象去操作 Webpack。

- HtmlWebpackPlugin

  模仿实现 HtmlWebpackPlugin 插件的功能

  > html-webpack-plugin 可以将制定的 html 模板复制一份输出到 dist 目录下，自动引入 bundle.js

  - 实现步骤
    - 编写一个自定义插件，注册 afterEmit 钩子
    - 根据创建对象时传入的 template 属性来读取 html 模板
    - 使用工具分析 HTML，推荐使用 cheerio，此时可以直接使用 jQuery API
    - 循环遍历 webpack 打包的资源文件列表，如果有多个 bundle 就都打包进去
    - 输出新生成的 HTML 字符串到 dist 目录中

- 编写自定义 Loader(打包后，删除注释)

  引用自定义的 loader 的方式：

  - 1.ResolveLoader 用于配置 Webpack 如何寻找 Loader。 默认情况下只会去 `node_modules` 目录下寻找，为了让 Webpack 加载放在本地项目中的 Loader 需要修改 `resolveLoader.modules`
  - 2.Npm link
    - 在`remove-comment-loader`文件夹的根目录，npm link,链接到全局环境中；
    - 在我们的 web 项目中链接`remove-comment-loader`,npm link remove-comment-loader ,这时候就相当于把全局环境中的`remove-comment-loader` 指向本项目下的`node_modules`文件夹下；

  ```
  RemoveCommentLoader.js
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
  ```

  ```
   webpack.config.js
   module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: "RemoveCommentLoader", // 当匹配到js文件时，使用我们编写的remove-comment-loader
              options: {
                name: "RemoveCommentLoader",
              },
            },
          ],
        },
      ],
    },
    resolveLoader: {
      modules: ["node_modules", "./lib/"], // 配置加载本地loader
    },
  ```

  #### webpack 打包流程--简单梳理

  1.初始化阶段

  | 事件名            | 解释                                                                                                                                                      |
  | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | 初始化参数        | 从配置文件和 Shell 语句中读取与合并参数，得出最终的参数。 这个过程中还会执行配置文件中的插件实例化语句 `new Plugin()`。                                   |
  | 实例化 `Compiler` | 用上一步得到的参数初始化 `Compiler` 实例，`Compiler` 负责文件监听和启动编译。`Compiler` 实例中包含了完整的 `Webpack` 配置，全局只有一个 `Compiler` 实例。 |
  | 加载插件          | 依次调用插件的 `apply` 方法，让插件可以监听后续的所有事件节点。同时给插件传入 `compiler` 实例的引用，以方便插件通过 `compiler` 调用 Webpack 提供的 API。  |
  | entry-option      | 读取配置的 `Entrys`，为每个 `Entry` 实例化一个对应的 `EntryPlugin`，为后面该 `Entry` 的递归解析工作做准备。                                               |
  |                   |                                                                                                                                                           |

  2.编译阶段

  | 事件名        | 解释                                                                                                                                                                                                    |
  | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | run           | 启动一次新的编译。                                                                                                                                                                                      |
  | watch-run     | 和 `run` 类似，区别在于它是在监听模式下启动的编译，在这个事件中可以获取到是哪些文件发生了变化导致重新启动一次新的编译。                                                                                 |
  | compile       | 该事件是为了告诉插件一次新的编译将要启动，同时会给插件带上 `compiler` 对象。                                                                                                                            |
  | compilation   | 当 `Webpack` 运行时，每当检测到文件变化，一次新的 `Compilation` 将被创建。一个 `Compilation` 对象包含了当前的模块资源、编译生成资源、变化的文件等。`Compilation` 对象也提供了很多事件回调供插件做扩展。 |
  | make          | 一个新的 `Compilation` 创建完毕，即将从 `Entry` 开始读取文件，根据文件类型和配置的 `Loader` 对文件进行编译，编译完后再找出该文件依赖的文件，递归的编译和解析。                                          |
  | after-compile | 一次 `Compilation` 执行完成。                                                                                                                                                                           |
  | invalid       | 当遇到文件不存在、文件编译错误等异常时会触发该事件，该事件不会导致 Webpack 退出。                                                                                                                       |

  注意：在编译阶段中，最重要的要数 `compilation` 事件了，因为在 `compilation` 阶段调用了 Loader 完成了每个模块的转换操作，在 `compilation` 阶段又包括很多小的事件，它们分别是：

  | 事件名               | 解释                                                                                                                                                                                                                                                                                               |     |
  | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
  | build-module         | 使用对应的 Loader 去转换一个模块。                                                                                                                                                                                                                                                                 |     |
  | normal-module-loader | 1.在用 Loader 对一个模块转换完后，使用 `acorn` 解析转换后的内容，输出对应的抽象语法树（`AST`），以方便 Webpack 后面对代码的分析。2.从配置的入口模块开始，分析其 AST，当遇到 require 等导入其它模块语句时，便将其加入到依赖的模块列表，同时对新找出的依赖模块递归分析，最终搞清所有模块的依赖关系。 |     |
  | seal                 | 所有模块及其依赖的模块都通过 Loader 转换完成后，根据依赖关系开始生成 bundle.js(chunk)。                                                                                                                                                                                                            |     |

  3.生成输出阶段

  | 事件名     | 解释                                                                                                              |
  | ---------- | ----------------------------------------------------------------------------------------------------------------- |
  | emit       | 确定好要输出哪些文件后，执行文件输出，可以在这里获取和修改输出内容。                                              |
  | after-emit | 文件输出完毕。                                                                                                    |
  | done       | 成功完成一次完整的编译和输出流程。                                                                                |
  | failed     | 如果在编译和输出流程中遇到异常导致 Webpack 退出时，就会直接跳转到本步骤，插件可以在本事件中获取到具体的错误原因。 |

  在输出阶段已经得到了各个模块经过转换后的结果和其依赖关系，并且把相关模块组合在一起形成一个个 Chunk。 在输出阶段会根据 Chunk 的类型，使用对应的模版生成最终要要输出的文件内容

<img src="https://image-c.weimobwmc.com/wrz/ee8687c583a648e4ad9927dfa2c22f19.png">

> IIFE(immediately invoked function expression):
>
> ​ 1.自执行函数,在 es6 提出块作用域之前，js 只有全局作用域 global scope 和函数作用域,IIFE 的目的是为了隔离作 用域，防止污染全局命名空间;
>
> splitChunks 代码分割常见方式：
>
> ​ 1.动态导入：通过模块的内联函数调用来分离代码，将使用 `import()` ,`require.ensure()`加载的模块 分离成独立的包；
>
> ​ 2.防止重复：splitChunks 代码拆分，使用 `splitChunks` 去重和分离 chunk，配置分离规则，然后 `webpack` 自动将满足规则的 `chunk` 分离。一切都是自动完成的；
>
> 分割代码时的输出:1.重新构建后会输出两个文件，分别是执行入口文件 main`.js` 和 异步加载文件 `0.main.js`；
>
> ​ 2.webpackJsonp 函数原理，如果加载过该异步文件则从缓存中取，否则,通过 DOM 操作，动态创建 script 标签往 HTML head 中插入一个 script 标签去异步加载 Chunk 对应的 JavaScript 文件；
>
> <img src="https://image-c.weimobwmc.com/wrz/f1d58ad35bcf41b4b9a0a7533c5b3d66.png" alt="异步加载模块" style="zoom:50%;" />

#### 手写 simple-webpack 加深理解 webpack 打包原理

- 准备工作：

  - 新建一个项目,执行 npm init -y 初始化一个 package.json 文件
  - 新建 src 下 index.js,作为入口文件(webpack4.0 默认入口文件路径)
  - 新建 bundle.js,执行打包文件
  - 新建 webpack.config.js
  - 新建 lib 文件夹，webpack.js,简版的 webpack

- npm run build 和 npm run dev 做了什么

  ```
   "scripts": {
      "build": "webpack --config=webpack/webpack.config.prod.js",
      "dev": "cross-env API_ENV=dev webpack-dev-server --config=webpack/webpack.config.dev.js",
    },
  ```

  - npm run build

    - webpack --config=webpack/webpack.config.prod.js,--config 后面的是文件路径，会执行 webpack/webpack.config.prod.js，并将返回结果传入 webpack(options)中，即开始初始化配置参数，编译，解析，打包；

  - npm run dev

    注意点：打包文件了吗？打包的静态文件怎么在浏览器实时更新的？

    - webpack-dev-server --config=webpack/webpack.config.dev.js,会执行 webpack/webpack.config.dev.js，并将返回结果传入到 webpack(options)中,webpack-dev-server 启动了一个使用 express 的 Http 服务器，这个服务器与客户端采用`websocket建立长连接`，当原始文件发生改变，webpack-dev-server 会实时编译；
    - 使用了 webpack-dev-middleware 中间件，调用 webpack 的 api 对文件系统 watch，当文件发生改变后，webpack 重新对文件进行`编译打包`，然后保存到内存中。 打包到了内存中，不生成文件的原因就在于访问内存中的代码比访问文件系统中的文件更快，而且也减少了代码写入文件的开销

#### Babel 抽象语法树(abstrasct syntax tree )

- 简介 :Babel 是一个 JavaScript 编译器, 是一个工具链，主要用于将 ECMAScript 2015+ 版本的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。

  下面列出的是 Babel 能为你做的事情：

  - 语法转换(babel-loader)
  - 通过 Polyfill 方式在目标环境中添加缺失的特性 (通过 [@babel/polyfill](https://www.babeljs.cn/docs/babel-polyfill) 模块)
  - 源码转换

- babel 运行原理

  Babel 的三个主要处理步骤分别是：

  解析（parse），转换（transform），生成（generate）

  <img src="https://image-c.weimobwmc.com/wrz/cb202cd24b4a4bfe98810a83910b358c.png">

  - 解析

    > 1.解析步骤接收代码并输出 AST，这个步骤分为两个阶段：词法解析和语法解析；
    >
    > - 词法分析阶段，把字符串形式的代码转换为 **令牌（tokens）** 流，可以把令牌看作是一个扁平的语法片段数组；
    > - 语法分析阶段，会把一个令牌流转换成 AST 的形式。 这个阶段会使用令牌中的信息把它们转换成一个 AST 的表述结构，这样更易于后续的操作。
    >
    >   2.使用 babylon 或者 babel(@babel/parser) 解析器对输入的源代码字符串进行解析并生成初始 抽象语法树 AST；
    >
    >   3.利用 babel-traverse 这个独立的包对 AST 进行遍历，并解析出整个树的 path，通过挂载的 Visitor 访问者模式，读取对应的元信息，这一步叫 set AST 过程；

  - 转换

    > 1.transform 过程：遍历 AST 树并应用各 transform（plugin） 生成变换后的 AST 树;
    >
    > 2.babel 中最核心的是 babel-core，它向外暴露出 babel. transformFromAstSync 接口,生成新的 ast;

  - 生成

    > 利用 babel-generator 将 AST 树输出为转码后的代码字符串

- 解析后的 Ast Tree

<img src="https://image-c.weimobwmc.com/wrz/4b539e045cfe4936b3b513f2ca36ee00.png" alt="抽象语法树" style="zoom:50%;" />

栗子：

```
const fn = a => a;
```

<img src="https://image-c.weimobwmc.com/wrz/e1e159652527425b94c73fb88a912747.png" alt="ast" style="zoom:50%;" />

​

- Webpack 输出

Bundle.js

<img src="https://image-c.weimobwmc.com/wrz/41b4c98190754e78b23a556c29c694a2.jpg" alt="打包文件分析" style="zoom:200%;" />

​

参考文档：[从 Webpack 源码探究打包流程](https://juejin.im/post/5c0206626fb9a049bc4c6540#heading-23)

​ [babel 插件入门-AST 抽象语法树](https://juejin.im/post/5ab9f2f3f265da239b4174f0)

​ [webpack 原理](https://segmentfault.com/a/1190000015088834)

​ [webpack 命令配置](<[https://www.webpackjs.com/api/cli/#%E4%BD%BF%E7%94%A8%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E7%9A%84%E7%94%A8%E6%B3%95](https://www.webpackjs.com/api/cli/#使用配置文件的用法)>)

​ [ast-explorer 生成器](https://astexplorer.net/#/Z1exs6BWMq)

​ [ast 语法解释](https://juejin.im/post/5e0a245df265da33cf1aea91)

​ [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-babel-types)

​ [cheerio 类似 Jquery]('https://github.com/cheeriojs/cheerio/wiki/Chinese-README')

​
