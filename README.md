[![Build](https://github.com/konveyor/move2kube-ui/workflows/Build/badge.svg "Github Actions")](https://github.com/konveyor/move2kube-ui/actions?query=workflow%3ABuild)
[![Docker Repository on Quay](https://quay.io/repository/konveyor/move2kube-ui/status "Docker Repository on Quay")](https://quay.io/repository/konveyor/move2kube-ui)
[![License](https://img.shields.io/:license-apache-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0.html)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/move2kube-ui/pulls)
[<img src="https://img.shields.io/badge/slack-konveyor/move2kube-green.svg?logo=slack">](https://kubernetes.slack.com/archives/CR85S82A2)

# Move2Kube-UI

An UI for interacting with [Move2Kube API](https://github.com/konveyor/move2kube-api).

## Bringing up Move2Kube all-in-one container

1. Change directory to an empty directory using say, `mkdir -p workspace && cd workspace`
1. Run `docker run -p 8080:8080 -v $PWD:/workspace -v /var/run/docker.sock:/var/run/docker.sock -it quay.io/konveyor/move2kube-aio:latest`
1. Access the UI in `http://localhost:8080/`.

## Bringing up Move2Kube UI and API as separate containers

1. Run `docker-compose up`
1. Access the UI in `http://localhost:8080/`.

For Helm chart and Operator checkout [Move2Kube Operator](https://github.com/konveyor/move2kube-operator).

## Starting UI

### Production

1. Run `make install`
1. Run `make build`
1. Run `make start`

### Development

1. Run `make install`
1. Run `make startdev`

## Discussion

* For any questions reach out to us on any of the communication channels given on our website https://move2kube.konveyor.io/.
