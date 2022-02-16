'use strict';

const semver = require('semver');
const colors = require('colors/safe');

const log = require('@colin-cli/log');
const { LOWEST_NODE_VERSION } = require('./constants');

class Command {
  constructor(argv) {
    // console.log('command constructor', argv);
    if(!argv){
      throw new Error('Command类的options参数不能为空！');
    }
    if(!Array.isArray(argv)){
      throw new Error('Command类的options参数必须为数组！');
    }
    if(argv.length < 1){
      throw new Error('Command类的options参数列表不得为空！');
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion()); // 检查Node版本号
      chain = chain.then(() => this.initArgs()); // 初始化参数
      chain = chain.then(() => this.init()); // 初始化
      chain = chain.then(() => this.exec()); // 执行init业务逻辑
      chain.catch(err => log.error(err.message)); // chain单独提供错误兜底
    })
  }

  // 检查Node版本号
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`colin-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`))
    }
  }

  // 初始化参数
  initArgs(){
    this._argv = this._argv.slice(0, this._argv.length - 1);
    this._cmd = this._argv[this._argv.length - 1];
  }

  // 初始化
  init() {
    throw new Error('init必须实现');
  }

  // 执行init业务逻辑
  exec() {
    throw new Error('exec必须实现');
  }
}

module.exports = Command;