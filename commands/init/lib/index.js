'use strict';

const Command = require('@colin-cli/command');
const log = require('@colin-cli/log');

class InitCommand extends Command {
  // 初始化
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('projectName', this.projectName);
    log.verbose('force', this.force);
  }

  // 执行init业务逻辑
  exec() {
    console.log('执行init业务逻辑')
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init;

module.exports.InitCommand = InitCommand;