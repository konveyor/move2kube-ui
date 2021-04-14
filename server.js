/* eslint-disable @typescript-eslint/no-var-requires */
/*
Copyright IBM Corporation 2020

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = 8080;

const api_url = process.env['MOVE2KUBEAPI'] || 'http://move2kubeapi:8080';
app.use('/api', createProxyMiddleware({ target: api_url, changeOrigin: true }));

app.use(express.static(path.join(__dirname, '/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname + '/dist/index.html')));
app.listen(port, () => console.log(`Listening on port ${port}`));
