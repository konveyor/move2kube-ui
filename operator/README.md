[![Docker Repository on Quay](https://quay.io/repository/konveyor/move2kube-operator/status "Docker Repository on Quay")](https://quay.io/repository/konveyor/move2kube-operator)
[![License](https://img.shields.io/:license-apache-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0.html)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/konveyor/move2kube-ui/pulls)
[<img src="https://img.shields.io/badge/slack-konveyor/move2kube-green.svg?logo=slack">](https://kubernetes.slack.com/archives/CR85S82A2)

# Move2Kube-Operator

Operator to orchestrate [Move2Kube UI](https://github.com/konveyor/move2kube-ui) and [API](https://github.com/konveyor/move2kube-api).  

## Prerequisites

- Kubectl
- Helm 3
- A Kubernetes cluster

## Usage

> A new Golang based operator is in the works

The instructions below are for installing the current Helm based operator:

1. Deploy the operator either using the OLM tool or directly:  
    https://sdk.operatorframework.io/docs/building-operators/helm/quickstart/#olm-deployment  
    https://sdk.operatorframework.io/docs/building-operators/helm/quickstart/#direct-deployment

1. Then we can apply the CR. Make sure to edit the CR yaml with the proper values before applying.
    ```console
    $ kubectl apply -f config/samples/demo_v1alpha1_nginx.yaml
    ```
    For more details check https://github.com/konveyor/move2kube-ui/blob/main/helm-charts/move2kube/README.md

## Discussion

* For any questions reach out to us on any of the communication channels given on our website https://move2kube.konveyor.io/.
