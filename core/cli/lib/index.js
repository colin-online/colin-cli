'use strict';

const path = require('path');
const semver = require('semver');
const userHome = require('user-home');
const colors = require('colors/safe');
const pathExists = require('path-exists');
const { program } = require('commander');

const log = require('@colin-cli/log');
const exec = require('@colin-cli/exec');

const pkg = require('../package.json');
const { DEFAULT_CLI_HOME } = require('./constants');

// 检查版本号
function checkPkgVersion() {
  log.info(`v${pkg.version}`, '世界，非你所见！');
}

// 检查root账户
function checkRootAccount() {
  const rootCheck = require('root-check');
  rootCheck();
}

// 检查用户主目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在！'))
  }
}

// 创建默认配置
function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome, DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

// 检查环境变量
function checkEnvVariable() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  // 校验环境变量是否存在
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    });
  }
  createDefaultConfig(); // 创建默认配置
}

// 检查是否全局更新
async function checkGlobalUpdate() {
  // 获取当前版本号和模块名称
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  // 调用npm API，获取所有版本号
  const { getNpmSemverVersion } = require('@colin-cli/get');
  // 提取所有版本号，比对哪些版本号是大于当前版本号
  const lastVersion = await getNpmSemverVersion(npmName, currentVersion);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    // 获取最新的版本号，提示用户更新到该版本
    log.warn('更新提示', colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本${lastVersion}`))
    log.warn('更新提示', colors.yellow(`更新命令：npm install -g ${npmName}`))

  }
}

// 启动阶段
async function prepare() {
  checkPkgVersion(); // 检查当前版本号
  checkRootAccount(); // 检查root账户
  checkUserHome(); // 检查用户主目录
  checkEnvVariable(); // 检查环境变量
  await checkGlobalUpdate(); // 检查是否全局更新
}

// 注册命令
function registerCommand() {
  program.name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

  program
    .command('init [name]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);

  // 开启debug模式
  program.on('option:debug', function () {
    const options = program.opts();
    if (options.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
  });

  // 指定targetPath
  program.on('option:targetPath', function (path) {
    process.env.CLI_TARGET_PATH = path;
  });

  // 监听未知命令
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    console.log(colors.red('未知的命令：' + obj[0]));

    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令：' + availableCommands.join(',')));
    }
  });
  program.parse(process.argv);

  // 兜底友情提示
  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  };
}

async function core() {
  try {
    await prepare(); // 启动阶段
    registerCommand(); // 注册命令
  } catch (e) {
    log.error(e.message)
    if (process.env.LOG_LEVEL === 'verbose') {
      console.log(e)
    }
  }
}

module.exports = core;