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

const fs = require('fs');
const path = require('path');
const indexPath = path.resolve(__dirname, 'dist/index.html');
const targetFilePath = path.resolve(__dirname, 'dist/200.html');
// ensure we have bookmarkable url's when publishing to surge
// https://surge.sh/help/adding-a-200-page-for-client-side-routing
fs.createReadStream(indexPath).pipe(fs.createWriteStream(targetFilePath));
