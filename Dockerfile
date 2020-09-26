#   Copyright IBM Corporation 2020
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

FROM registry.access.redhat.com/ubi8/nodejs-12:latest

ENV MOVE2KUBEAPI 'http://move2kubeapi:8080'

USER 0
COPY package.json .
RUN npm install
COPY . .
RUN npm run build 
USER 1001
EXPOSE 8080
CMD ["npm","run","start"]


#FROM nginx
#COPY --from=builder /app/dist /usr/share/nginx/html
#EXPOSE 9000


#FROM node:alpine
#WORKDIR '/app'
#COPY --from=builder /app/dist /app/dist
#COPY --from=builder /app/package.json /app/package.json
#COPY --from=builder /app/server.js /app/server.js
