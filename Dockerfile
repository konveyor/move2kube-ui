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

ARG VERSION=latest

### Builder Image ###
FROM registry.access.redhat.com/ubi8/nodejs-14-minimal:1-11 as build_base
USER root:root
WORKDIR /app
# install yarn
RUN npm install -g yarn
ENV PATH="${PATH}:${HOME}/.npm-global/bin/"
# install dependencies
COPY .yarn/ .yarn/
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install
# copy sources and build the project
COPY . .
RUN yarn run build

### Runner Image ###
FROM quay.io/konveyor/move2kube-api:${VERSION}
ARG VERSION=latest
ARG MOVE2KUBE_UI_VERSION
ARG MOVE2KUBE_UI_GIT_COMMIT_HASH
ARG MOVE2KUBE_UI_GIT_TREE_STATUS
ENV MOVE2KUBE_UI_VERSION="${VERSION}"
ENV MOVE2KUBE_UI_GIT_COMMIT_HASH="${MOVE2KUBE_UI_GIT_COMMIT_HASH}"
ENV MOVE2KUBE_UI_GIT_TREE_STATUS="${MOVE2KUBE_UI_GIT_TREE_STATUS}"

# copy build output
COPY --from=build_base /app/dist ./dist
CMD ["move2kube-api", "--port", "8080", "--log-level", "info", "--static-files-dir", "dist"]
