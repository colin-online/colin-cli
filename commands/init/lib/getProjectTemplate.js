const request = require('@colin-cli/request');

module.exports = function () {
  return request({
    url: '/projects/template',
  })
}