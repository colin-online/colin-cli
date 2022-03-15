const request = require('@colin-cli/request');

module.exports = function () {
  return request({
    url: '/colin-cli-server/projects/templateList',
  })
}