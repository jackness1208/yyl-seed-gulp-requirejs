'use strict';
const expect = require('chai').expect;
const path = require('path');
const http = require('http');
const fs = require('fs');
const frp = require('yyl-file-replacer');
const util = require('yyl-util');
const opzer = require('../index.js');

const FRAG_PATH = path.join(__dirname, '__frag');
const fn = {
  hideUrlTail: function(url) {
    return url
      .replace(/\?.*?$/g, '')
      .replace(/#.*?$/g, '');
  },
  frag: {
    clearDest(config) {
      return new Promise((next) => {
        if (fs.existsSync(config.destRoot)) {
          util.removeFiles(config.destRoot);
        }

        setTimeout(() => {
          next();
        }, 100);
      });
    },
    build() {
      return new Promise((next) => {
        if (fs.existsSync(FRAG_PATH)) {
          util.removeFiles(FRAG_PATH);
        } else {
          util.mkdirSync(FRAG_PATH);
        }
        setTimeout(() => {
          next();
        }, 100);
      });
    },
    destroy() {
      return new Promise((next) => {
        try {
          if (fs.existsSync(FRAG_PATH)) {
            util.removeFiles(FRAG_PATH, true);
          }

          setTimeout(() => {
            next();
          }, 100);
        } catch (er) {
          next();
        }
      });
    }
  }
};

// + main
const linkCheck = function (config, next) {
  const htmlArr = util.readFilesSync(config.alias.destRoot, /\.html$/);
  const cssArr = util.readFilesSync(config.alias.destRoot, /\.css$/);
  const jsArr = util.readFilesSync(config.alias.destRoot, /\.js$/);

  const destRoot = config.alias.destRoot;
  const LOCAL_SOURCE_REG = new RegExp(`^(${config.commit.hostname})`);
  const REMOTE_SOURCE_REG = /^(http[s]?:|\/\/\w)/;
  const ABSOLUTE_SOURCE_REG = /^\/(\w)/;
  const RELATIVE_SOURCE_REG = /^\./;
  const NO_PROTOCOL = /^\/\/(\w)/;

  const localSource = [];
  const remoteSource = [];
  const notMatchLocalSource = [];

  const sourcePickup = function (iPath, dir) {
    if (iPath.match(LOCAL_SOURCE_REG)) {
      localSource.push(
        fn.hideUrlTail(
          util.path.join(destRoot, iPath.replace(LOCAL_SOURCE_REG, ''))
        )
      );
    } else if (iPath.match(ABSOLUTE_SOURCE_REG)) {
      localSource.push(
        fn.hideUrlTail(
          util.path.join(destRoot, iPath.replace(LOCAL_SOURCE_REG, '$1'))
        )
      );
    } else if (iPath.match(REMOTE_SOURCE_REG)) {
      remoteSource.push(iPath);
    } else if (iPath.match(RELATIVE_SOURCE_REG)) {
      localSource.push(
        fn.hideUrlTail(
          util.path.join(dir, iPath)
        )
      );
    }
  };

  htmlArr.forEach((iPath) => {
    frp.htmlPathMatch(fs.readFileSync(iPath).toString(), (mPath) => {
      sourcePickup(mPath, path.dirname(iPath));
      return mPath;
    });
  });

  cssArr.forEach((iPath) => {
    frp.cssPathMatch(fs.readFileSync(iPath).toString(), (mPath) => {
      sourcePickup(mPath, path.dirname(iPath));
      return mPath;
    });
  });

  jsArr.forEach((iPath) => {
    frp.jsPathMatch(fs.readFileSync(iPath).toString(), (mPath) => {
      sourcePickup(mPath, path.dirname(iPath));
      return mPath;
    });
  });

  localSource.forEach((iPath) => {
    if (!fs.existsSync(iPath)) {
      notMatchLocalSource.push(iPath);
    }
  });

  let padding = remoteSource.length +  notMatchLocalSource.length;
  const paddingCheck = function () {
    if (!padding) {
      next();
    }
  };

  remoteSource.forEach((iPath) => {
    var rPath = iPath;
    if (rPath.match(NO_PROTOCOL)) {
      rPath = rPath.replace(NO_PROTOCOL, 'http://$1');
    }


    http.get(rPath, (res) => {
      expect([rPath, res.statusCode]).to.deep.equal([rPath, 200]);
      padding--;
      paddingCheck();
    });
  });

  notMatchLocalSource.forEach((iPath) => {
    var rPath = util.path.join(
      config.commit.hostname,
      util.path.relative(config.alias.destRoot, iPath)
    );
    if (rPath.match(NO_PROTOCOL)) {
      rPath = rPath.replace(NO_PROTOCOL, 'http://$1');
    }

    http.get(rPath, (res) => {
      expect([iPath, rPath, res.statusCode]).to.deep.equal([iPath, rPath, 200]);
      padding--;
      paddingCheck();
    });
  });
  paddingCheck();
};

describe('optimize test', () => {
  const CONFIG_PATH = path.join(FRAG_PATH, 'main/config.js');
  const TEST_PATH = path.join(__dirname, 'demo');
  const CONFIG_DIR = path.dirname(CONFIG_PATH);

  let config = null;
  let iOpzer = null;

  it ('build frag & copy', function (done) {
    this.timeout(0);
    fn.frag.build().then(() => {
      util.copyFiles(
        TEST_PATH,
        FRAG_PATH,
        () => {
          done();
        }
      );
    });
  });

  // + config iOpzer init
  it ('config init', function (done) {
    this.timeout(0);
    config = util.requireJs(CONFIG_PATH);
    Object.keys(config.alias).forEach((key) => {
      config.alias[key] = util.path.join(CONFIG_DIR, config.alias[key]);
    });
    iOpzer = opzer.optimize(config, CONFIG_DIR);
    done();
  });
  // - config iOpzer init



  it ('all test', function (done) {
    this.timeout(0);
    iOpzer.response.off();
    iOpzer.response.on('finished', () => {
      linkCheck(config, () => {
        done();
      });
    });
    fn.frag.clearDest(config).then(() => {
      iOpzer.all();
    });
  });

  it ('all --remote test', function (done) {
    this.timeout(0);
    iOpzer.response.off();
    iOpzer.response.on('finished', () => {
      linkCheck(config, () => {
        done();
      });
    });
    fn.frag.clearDest(config).then(() => {
      iOpzer.all({
        remote: true
      });
    });
  });

  it ('all --isCommit test', function (done) {
    this.timeout(0);
    iOpzer.response.off();
    iOpzer.response.on('finished', () => {
      linkCheck(config, () => {
        done();
      });
    });
    fn.frag.clearDest(config).then(() => {
      iOpzer.all({
        isCommit: true
      });
    });
  });

  it ('watch test', function (done) {
    this.timeout(0);
    iOpzer.response.off();
    // TODO
    done();
  });
  // - main

  it ('destroy frag', function (done) {
    this.timeout(0);
    fn.frag.destroy().then(() => {
      done();
    });
  });
});
