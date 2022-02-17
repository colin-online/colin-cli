'use strict';

const axios = require('axios');

const BASE_URL = process.env.COLIN_CLI_BASE_URL ? process.env.COLIN_CLI_BASE_URL : 'http://colin-online.local:7001';

const service = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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
    return Promise.reject(error);
  },
);

module.exports = service;
