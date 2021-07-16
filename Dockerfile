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

### Builder Image ###
FROM registry.access.redhat.com/ubi8/nodejs-14-minimal:1-11 as build_base
USER root:root
WORKDIR /app
# install yarn
RUN npm install -g yarn
ENV PATH="${PATH}:${HOME}/.npm-global/bin/"
# copy sources
COPY . .
# install dependencies and build the project
RUN yarn install && yarn run build
# prune dev dependencies for production https://yarnpkg.com/getting-started/migration#renamed
RUN yarn workspaces focus --all --production

### Runner Image ###
FROM registry.access.redhat.com/ubi8/nodejs-14-minimal:1-11
USER root:root
# reads from environment variable first, otherwise fall back to move2kubeapi value
ARG MOVE2KUBEAPI
ENV MOVE2KUBEAPI=${MOVE2KUBEAPI:-http://move2kubeapi:8080}
ENV MOVE2KUBE_PLATFORM="${MOVE2KUBE_PLATFORM}:ui-dockerfile"
ENV NODE_ENV=production
# copy build output
WORKDIR /app
COPY --from=build_base /app/dist /app/dist
COPY --from=build_base /app/server.js /app/server.js
COPY --from=build_base /app/package.json /app/package.json
COPY --from=build_base /app/node_modules /app/node_modules
# run the app
EXPOSE 8080
CMD ["node", "server.js"]
