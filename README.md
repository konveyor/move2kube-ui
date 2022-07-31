[![Build](https://github.com/konveyor/move2kube-ui/workflows/Build/badge.svg 'Github Actions')](https://github.com/konveyor/move2kube-ui/actions?query=workflow%3ABuild)
[![Docker Repository on Quay](https://quay.io/repository/konveyor/move2kube-ui/status 'Docker Repository on Quay')](https://quay.io/repository/konveyor/move2kube-ui)
[![License](https://img.shields.io/:license-apache-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0.html)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/move2kube-ui/pulls)
[<img src="https://img.shields.io/badge/slack-konveyor/move2kube-green.svg?logo=slack">](https://kubernetes.slack.com/archives/CR85S82A2)

# Move2Kube-UI

An UI for interacting with [Move2Kube API](https://github.com/konveyor/move2kube-api).

## Starting the UI

### As a container

```shell
$ docker run --rm -it -p 8080:8080 move2kube-ui
```

### As a compose app

Using `docker`:

```shell
$ docker-compose up
```

or using `podman`:

```shell
$ podman-compose -f podman-compose.yml up
```

### As a helm chart

Make sure you are logged into a Kubernetes/Openshift cluster

```shell
$ cd helm-charts
$ helm install my-m2k-instance ./move2kube/
```

For more information and configuration options, see [Move2Kube UI Helm chart](https://github.com/konveyor/move2kube-ui/blob/main/helm-charts/move2kube/README.md)

### As an operator

For deploying the UI as a Kubernetes Operator, see [Move2Kube Operator](https://github.com/konveyor/move2kube-operator)

## Development

### Running without a container

This requires Golang 1.18 and NodeJS 16 and above.

1. Install the Move2Kube CLI tool https://github.com/konveyor/move2kube
1. Install the Move2Kube API server https://github.com/konveyor/move2kube-api
1. `make install`
1. `make build`
1. `pnpm run start`

### Building the container image from source

1. Build the UI image: `make cbuild`
1. Create a data folder to persist information: `mkdir -p data`
1. This uses `docker` or `podman` and runs everything inside a single container using the UI image: `make crun`
1. Access the UI at http://localhost:8080

## Discussion

For any questions reach out to us on any of the communication channels given on our website https://move2kube.konveyor.io/
