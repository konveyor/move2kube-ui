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

BINNAME     ?= move2kube-ui
REGISTRYNS  := quay.io/konveyor

ifdef VERSION
	BINARY_VERSION = $(VERSION)
endif
BINARY_VERSION ?= ${GIT_TAG}
ifneq ($(BINARY_VERSION),)
	VERSION ?= $(BINARY_VERSION)
endif

VERSION ?= latest

# HELP
# This will output the help for each task
.PHONY: help
help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[0-9a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: install
install: ## Install dependencies
	@npm install

.PHONY: build
build: ## Build application
	@npm run build

.PHONY: startdev
startdev: install ## Start Dev server
	@npm run start:dev 

.PHONY: start
start: install build ## Start server
	@npm run start 

# -- Docker --

.PHONY: cbuild
cbuild: ## Build docker image
	@docker build -t ${REGISTRYNS}/${BINNAME}:${VERSION} -t ${REGISTRYNS}/${BINNAME}:latest --build-arg VERSION=${VERSION} .

.PHONY: cpush
cpush: ## Push docker image
	@docker push ${REGISTRYNS}/${BINNAME}:latest
	@docker push ${REGISTRYNS}/${BINNAME}:${VERSION}

.PHONY: crun
crun: ## Run using docker compose
	docker-compose up -d
