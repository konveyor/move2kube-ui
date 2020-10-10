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

FROM node:12.19.0-alpine3.10 AS builder

USER root

# Create workdir 
RUN mkdir /app

# Workdir app
WORKDIR /app

# Copy File on Container
COPY . /app/

# Install & build app nodejs
RUN npm install && \
npm run build 


FROM node:12.19.0-alpine3.10

ENV MOVE2KUBEAPI 'http://move2kubeapi:8080'

USER node

# Workdir app
WORKDIR /app

# Copy File from AS builder 
COPY --from=builder /app /app

EXPOSE 8080

CMD ["npm","run","start"]