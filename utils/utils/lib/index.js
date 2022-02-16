'use strict';

// 类型判断
function isObject(o){
    return Object.prototype.toString.call(o) === '[object Object]';
}

// 根据环境，返回执行子进程方法
function exec(command, args, options) {
  const win32 = process.platform === 'win32';

  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return require('child_process').spawn(cmd, cmdArgs, options || {});
}


module.exports = {
    isObject,
    exec
};