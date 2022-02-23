'use strict';

const axios = require('axios');
const semver = require('semver');
const urlJoin = require('url-join');

// 获取默认源地址
function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}

// 获取Npm信息
function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null;
  }
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  return axios.get(npmInfoUrl).then((res) => {
    if (res.status === 200) {
      return res.data
    } else {
      return null
    }
  }).catch((err) => {
    // console.log('e', err.message);
    return null
  })
}

// 获取Npm版本
async function getNpmVersions(npmName, registry) {
  const result = await getNpmInfo(npmName, registry);
  if (result) {
    return Object.keys(result.versions);
  } else {
    return [];
  }
}

// 获取所有满足条件版本号
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter(version => semver.satisfies(version, `>${baseVersion}`))
    .sort((a, b) => semver.gt(b, a) ? 1 : -1);
}

// 获取过滤后版本号
async function getNpmSemverVersion(npmName, baseVersion, registry) {
  const versions = await getNpmVersions(npmName, registry);
  const newVersions = getSemverVersions(baseVersion, versions);
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  }
  return null;
}

// 获取最新版本号
async function getNpmLatestVersion(npmName, registry) {
  let result = await getNpmInfo(npmName, registry);
  const { latest } = result['dist-tags'] || {};
  if (latest) {
    return latest;
  }
  return null;
}

module.exports = {
  getDefaultRegistry,
  getNpmSemverVersion,
  getNpmLatestVersion
};