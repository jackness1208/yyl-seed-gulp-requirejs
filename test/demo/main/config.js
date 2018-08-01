'use strict';
var
    //+ yyl init 自动 匹配内容
    commonPath = '../commons',
    projectName = 'gulp-requirejs',
    version = '2.15.32',
    //- yyl init 自动 匹配内容

    path = require('path'),
    setting = {
        localserver: { // 本地服务器配置
            root: './dist', // 服务器输出地址
            port: 5000 // 服务器 port
        },
        dest: {
            basePath: '/pc',
            jsPath: 'js/test',
            jslibPath: 'js/lib/test',
            cssPath: 'css/test',
            htmlPath: 'html/test',
            imagesPath: 'images/test',
            fontPath: 'font/test',
            tplPath: 'tpl/test',
            revPath: 'assets/test'
        }
    };

var
    config = {
        workflow: 'gulp-requirejs',
        name: projectName,
        version: version,
        dest: setting.dest,

        // +此部分 yyl server 端config 会进行替换
        localserver: setting.localserver,
        resource: { // 自定义项目中其他需打包的文件夹
            'src/font': path.join(setting.localserver.root, setting.dest.basePath, setting.dest.fontPath)
        },
        alias: { // yyl server 路径替换地方
            // 公用组件地址
            commons: commonPath,

            // 公用 components 目录
            globalcomponents: path.join(commonPath, 'components'),
            globallib: path.join(commonPath, 'lib'),


            // 输出目录中 到 html, js, css, image 层 的路径
            root: path.join(setting.localserver.root, setting.dest.basePath),

            // rev 输出内容的相对地址
            revRoot: path.join(setting.localserver.root, setting.dest.basePath),

            // dest 地址
            destRoot: setting.localserver.root,

            // src 地址
            srcRoot: './src',

            // 项目根目录
            dirname: './',

            // js 输出地址
            jsDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.jsPath),
            // js lib 输出地址
            jslibDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.jslibPath),
            // html 输出地址
            htmlDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.htmlPath),
            // css 输出地址
            cssDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.cssPath),
            // images 输出地址
            imagesDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.imagesPath),
            // assets 输出地址
            revDest: path.join(setting.localserver.root, setting.dest.basePath, setting.dest.revPath),
        }
        // -此部分 yyl server 端config 会进行替换
    };

module.exports = config;
