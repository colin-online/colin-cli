'use strict';

const axios = require('axios');

const BASE_URL = 'http://124.222.52.186:7001';

const service = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

service.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 兜底
    return [
      {
        name: 'React官方模版',
        npmName: '@colin-cli/react-official-template',
        version: '1.0.0',
        type: 'normal',
        installCommand: 'npm install',
        startCommand: 'npm start',
        buildPath: 'dist',
        tags: ['project'],
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.vscode/**',
          '**/.DS_Store',
          '**/public/**'
        ]
      },
    ]
    return Promise.reject(error);
  },
);

module.exports = service;
