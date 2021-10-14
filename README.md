[![Build](https://github.com/konveyor/move2kube-ui/workflows/Build/badge.svg 'Github Actions')](https://github.com/konveyor/move2kube-ui/actions?query=workflow%3ABuild)
[![Docker Repository on Quay](https://quay.io/repository/konveyor/move2kube-ui/status 'Docker Repository on Quay')](https://quay.io/repository/konveyor/move2kube-ui)
[![License](https://img.shields.io/:license-apache-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0.html)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/move2kube-ui/pulls)
[<img src="https://img.shields.io/badge/slack-konveyor/move2kube-green.svg?logo=slack">](https://kubernetes.slack.com/archives/CR85S82A2)

# Move2Kube-UI

An UI for interacting with [Move2Kube API](https://github.com/konveyor/move2kube-api).

## Starting the UI

1. Build the UI image: `make cbuild`
2. Create a data folder to persist information: `mkdir -p data`
3. This uses `docker` or `podman` and runs everything inside a single container using the UI image: `make crun`
4. Access the UI at http://localhost:8080

For Helm chart and Operator checkout [Move2Kube Operator](https://github.com/konveyor/move2kube-operator).

There is other alternative using `docker-compose`:

```shell
$ docker-compose up
```

or `podman-compose`:

```shell
$ podman-compose -f podman-compose.yml up
```

## Discussion

- For any questions reach out to us on any of the communication channels given on our website https://move2kube.konveyor.io/.
