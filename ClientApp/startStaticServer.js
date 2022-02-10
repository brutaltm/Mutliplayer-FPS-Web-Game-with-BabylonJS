'use strict';
const express = require('express');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';
const decoder = new TextDecoder('utf-8');

const server = express()
  .use(express.static(__dirname + ''))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));