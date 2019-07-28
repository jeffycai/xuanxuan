# API 概览

## 源码结构

喧喧客户端源码全部在 [`xxc/app/`](https://github.com/easysoft/xuanxuan/tree/master/xxc/app) 文件夹下。


### 源码模块结构

* `components/`：包含喧喧用到的通用 React 组件；
* `config/`：包含运行时配置项；
* `core/`：喧喧核心功能模块，包含事件机制、界面管理、网络、用户资料、数据库、聊天功能等子模块；
* `lang/`：管理界面上的语言文本；
* `exts/`：实现扩展机制模块；
* `utils/`：工具模块；
* `platform/`：平台相关模块，目前包含浏览器平台和 Electron 平台；
* `views/`：界面模块，大部分为 React 组件形式。

### 入口文件包括

* `main.development.js`：Electron 主进程入口文件；
* `index.html`：Electron 渲染进程加载的 HTML 文件；
* `index.js`：Electron 渲染进程窗口在 `index.html` 文件中加载 JS 文件；
* `package.json`：Electron 加载的 package.json 文件。

### 其他资源文件

* `assets/`：包含界面上用到的静态第三方资源；
* `build-in/`：内置的扩展配置和扩展包；
* `meida/`：界面上使用到的媒体资源，包括图片、音频和表情资源；
* `style/`：界面上用到的 CSS 样式，大部分为 Less 格式。

## API 文档

### 介绍

API 文档使用 [esdoc](https://esdoc.org/) 工具根据源码内的 [jsdoc 格式注释](http://usejsdoc.org/) 自动生成。最终文档为一组基于 HTML 文件的静态站点。通常需要一个静态 Web 服务器来访问文档目录下的 `index.html` 文件，也使用浏览器在本地打开 `index.html` 来浏览文档。

文档包含源码目录内的所有类、公共变量、公共函数，并提供全局 API 搜索功能。

### 文档生成

进入 `xxc/` 目录执行：

```bash
$ npm run docs
```

静待几分钟，等待命令执行完成之后就可以在 `docs/client/api/` 文件夹下找到文档相关文件。

### 文档修改

直接修改对应 JS 文件内的 [jsdoc 格式注释](http://usejsdoc.org/)，然后使用上述方法重新生成文档即可。

## 参考

* [React 中文网址](https://react.docschina.org/)
* [Electron 官方网址](https://electronjs.org/)