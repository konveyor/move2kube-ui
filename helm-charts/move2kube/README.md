# Move2Kube Helm Chart

Move2Kube helps speed up the journey to Kubernetes.

## Prerequisites

- Kubectl
- Helm 3
- A Kubernetes cluster

## Usage

### Helm chart

1. Configure kubectl to contact the K8s API server for your cluster.
2. Create a namespace and configure kubectl to use it:
   ```
   kubectl create namespace my-namespace
   kubectl config set-context --current --namespace my-namespace
   ```
3. Add this helm repo:
   ```
   helm repo add move2kube https://move2kube.konveyor.io
   helm repo update
   ```
4. To install without authentication and authorization run:
   ```
   helm install --set ingress.host='my.k8s.cluster.domain.com' my-move2kube move2kube/move2kube
   ```
   Replace `my.k8s.cluster.domain.com` with the domain where you K8s cluster is deployed.  

   If you need authentication and authorization then put the required details in a JSON file and run:
   ```
   helm install \
      --set ingress.host='my.k8s.cluster.domain.com' \
      --set ingress.tlsSecretName='my-tls-secret' \
      --set deployment.authServer.enable=true \
      --set deployment.database.enable=true \
      --set secret.api.enable=true \
      --set-file 'secret.api.configYAML=path/to/my/config.yaml' \
      --set-file 'secret.authServer.realmJSON=path/to/my/realm.json' \
      --set-file 'secret.authServer.standaloneHAXML=path/to/my/standalone-ha.xml' \
      my-move2kube move2kube/move2kube
   ```
   Replace `my-tls-secret` with the name of the K8s secret that contains the certificate and private key required for TLS.  
   Replace `path/to/my/config.yaml` with the path of a YAML file containing the config for the API server.  
   Replace `path/to/my/realm.json` with the path of a JSON file containing the config for the Authorization server.  
   Replace `path/to/my/standalone-ha.xml` with the path of an XML file containing the config for the Authorization server.  

5. The helm chart will output the URL where you can access Move2Kube.  
   You can also do `kubectl get ingress` to get find the url.  
   Example: `https://my.k8s.cluster.domain.com`

## Discussion

* For any questions reach out to us on any of the communication channels given on our website https://move2kube.konveyor.io/.
