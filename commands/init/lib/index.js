'use strict';

const fs = require('fs');
const semver = require('semver');
const fsExtra = require('fs-extra');
const inquirer = require('inquirer');
const userHome = require('user-home');

const Command = require('@colin-cli/command');
const Package = require('@colin-cli/package');
const log = require('@colin-cli/log');
const { spinner, sleep, execAsync } = require('@colin-cli/utils');

const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

class InitCommand extends Command {
  // 初始化
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('projectName', this.projectName);
    log.verbose('force', this.force);
  }

  // 执行init业务逻辑
  async exec() {
    try {
      // 1) 准备阶段
      const projectInfo = await this.prepare();
      if (projectInfo) {
        // 2) 下载模版
        log.verbose('projectInfo', projectInfo);
        this.projectInfo = projectInfo;
        await this.downloadTemplate();
        // 3) 安装模版
      }
    } catch (e) {
      log.error(e.message);
    }
  }

  // 准备阶段
  async prepare() {
    // 1) 判断项目模版是否存在
    let templateList = await getProjectTemplate();
    if (!templateList || templateList.length === 0) {
      throw new Error('获取项目模板列表失败！');
    }
    this.templateList = templateList;
    // 2) 判断当前目录是否为空
    const localPath = process.cwd(); // 获取当前目录路径
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      if (!this.force) {
        // 询问是否继续创建
        ifContinue = (await inquirer.prompt([
          {
            type: 'confirm',
            name: 'ifContinue',
            default: false,
            message: '当前文件夹不为空，是否继续创建项目？'
          }
        ])).ifContinue;
        if (!ifContinue) {
          return;
        }
      }
      // 3) 是否启动强制更新
      if (ifContinue || this.force) {
        // 提供二次确认
        const { confirmDelete } = await inquirer.prompt([
          {
            type: 'list',
            name: 'confirmDelete',
            default: 0,
            message: '是否确认清空当前目录下的文件？',
            choices: [
              { name: 'no', value: 0 },
              { name: 'yes', value: 1 }
            ]
          }
        ]);
        if (confirmDelete) {
          // 清空当前目录
          fsExtra.emptyDirSync(localPath);
        }
      }
    }
    // 获取项目基本信息
    return this.getProjectInfo();
  }

  // 获取项目基本信息
  async getProjectInfo() {
    function isValidName(v) {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v);
    }
    let projectInfo = {}; // 项目信息
    let isProjectNameValid = false; // 是否已存在项目名称
    // 校验项目名称
    if (isValidName(this.projectName)) {
      isProjectNameValid = true;
      projectInfo.projectName = this.projectName;
    }
    // 1) 选择创建项目/组件
    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        default: TYPE_PROJECT,
        message: '请选择初始化类型',
        choices: [
          { name: '项目', value: TYPE_PROJECT },
          { name: '组件', value: TYPE_COMPONENT }
        ]
      }
    ]);
    log.verbose('type', type);

    // 2) 获取基本信息
    const title = type === TYPE_PROJECT ? '项目' : '组件';
    const projectNamePrompt = {
      type: 'input',
      name: 'projectName',
      message: `请输入${title}名称`,
      default: '',
      validate: function (v) {
        const done = this.async();
        setTimeout(function () {
          // 1.首字符必须为英文字符
          // 2.尾字符必须为英文或数字，不能为字符
          // 3.字符仅允许"-_"
          if (!isValidName(v)) {
            done(`请输入合法的${title}名称`);
            return;
          }
          done(null, true);
        }, 0);
      },
      filter: function (v) {
        return v;
      },
    };
    const projectPrompt = [];
    if (!isProjectNameValid) {
      projectPrompt.push(projectNamePrompt);
    }
    projectPrompt.push({
      type: 'input',
      name: 'projectVersion',
      message: `请输入${title}版本号`,
      default: '1.0.0',
      validate: function (v) {
        const done = this.async();
        setTimeout(function () {
          if (!(!!semver.valid(v))) {
            done('请输入合法的版本号');
            return;
          }
          done(null, true);
        }, 0);
      },
      filter: function (v) {
        if (!!semver.valid(v)) {
          return semver.valid(v);
        } else {
          return v;
        }
      },
    },
    {
      type: 'list',
      name: 'projectTemplate',
      message: `请选择${title}模板`,
      choices: this.createTemplateChoice(this.templateList),
    });

    if (type === TYPE_PROJECT) {
      // 获取项目的基本信息
      const project = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...project,
      };
    } else if (type === TYPE_COMPONENT) {
      // 获取组件的基本信息
      const descriptionPrompt = {
        type: 'input',
        name: 'componentDescription',
        message: '请输入组件描述信息',
        default: '',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!v) {
              done('请输入组件描述信息');
              return;
            }
            done(null, true);
          }, 0);
        },
      };
      projectPrompt.push(descriptionPrompt);
      const component = await inquirer.prompt(projectPrompt);
      projectInfo = {
        ...projectInfo,
        type,
        ...component,
      };
    }
    // 项目基本信息
    return projectInfo;
  }

  // 下载模版
  async downloadTemplate() {
    // 1) 前置：通过项目模版API获取项目模版信息
    // 1.1) 通过egg.js搭建后端系统
    // 1.2) 通过npm存储项目模版
    // 1.3) 将项目模版信息存储到mongodb数据库中
    // 1.4) 通过egg.js获取mongodb中的数据并且通过API返回
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.templateList.find(item => item.npmName === projectTemplate);
    const targetPath = path.resolve(userHome, '.colin-cli', 'templates');
    const storeDir = path.resolve(userHome, '.colin-cli', 'templates', 'node_modules');
    const { npmName, version } = templateInfo;
    this.templateInfo = templateInfo;
    const templatePkg = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });
    if (!await templatePkg.exists()) {
      const spinnerStart = spinner('正在下载模板...');
      await sleep(1000);
      try {
        await templatePkg.install();
      } catch (e) {
        throw e;
      } finally {
        spinnerStart.stop(true);
        if (await templatePkg.exists()) {
          log.success('下载模板成功');
          this.templatePkg = templatePkg;
        }
      }
    } else {
      const spinnerStart = spinner('正在更新模板...');
      await sleep(1000);
      try {
        await templatePkg.update();
      } catch (e) {
        throw e;
      } finally {
        spinnerStart.stop(true);
        if (await templatePkg.exists()) {
          log.success('更新模板成功');
          this.templatePkg = templatePkg;
        }
      }
    }
  }

  // 判断文件是否为空
  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath); // 读取当前目录下文件
    fileList = fileList.filter((file) => (!file.startsWith('.') && ['node_modules'].indexOf(file) <= 0));// 文件过滤逻辑
    return !fileList || fileList.length <= 0;
  }

  // 创建模版选择列表
  createTemplateChoice(list) {
    return list.map(item => ({
      value: item.npmName,
      name: item.name,
    }));
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init;

module.exports.InitCommand = InitCommand;