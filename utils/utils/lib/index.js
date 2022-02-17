'use strict';

const spinner = require('./spinner');

// 类型判断
function isObject(o){
    return Object.prototype.toString.call(o) === '[object Object]';
}

// 延迟加载
function sleep(timeout) {
  return new Promise((resolve => {
    setTimeout(resolve, timeout);
  }));
}

// 根据环境，返回执行子进程方法
function exec(command, args, options) {
  const win32 = process.platform === 'win32';

  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

// 子进程同步方法
function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options);
    p.on('error', e => {
      reject(e);
    });
    p.on('exit', c => {
      resolve(c);
    });
  });
}

module.exports = {
    isObject,
    sleep,
    spinner,
    exec,
    execAsync,
};