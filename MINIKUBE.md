# local development with minikube

1. clone and run [razeedash](https://github.com/razee-io/Razeedash.git)

    ```bash
    git clone https://github.com/razee-io/Razeedash.git
    cd razeedash
    meteor npm install
    meteor
    ```

1. clone and run [razeedash-api](https://github.com/razee-io/Razeedash-api.git)

    ```bash
    git clone https://github.com/razee-io/Razeedash-api.git
    cd razeedash-api
    npm install
    npm start
    ```

1. edit your hosts file (/etc/hosts on mac and linux) and add:

    ```bash
    192.168.99.1 minikube-host
    ```

1. [Install minikube on your laptop](https://kubernetes.io/docs/tasks/tools/install-minikube/)

    For macs:

    ```bash
    brew cask install virtualbox
    brew cask install minikube
    minikube start
    😄  minikube v1.1.0 on darwin (amd64)
    💡  Tip: Use 'minikube start -p <name>' to create a new cluster, or 'minikube delete' to delete this one.
    🔄  Restarting existing virtualbox VM for "minikube" ...
    ⌛  Waiting for SSH access ...
    🐳  Configuring environment for Kubernetes v1.14.2 on Docker 18.09.6
    🔄  Relaunching Kubernetes v1.14.2 using kubeadm ...
    ⌛  Verifying: apiserver proxy etcd scheduler controller dns
    🏄  Done! kubectl is now configured to use "minikube"
    ```

1. Configure minikube

    - Make sure your KUBECONFIG is pointing to your minikube cluster
    - `kubectl create namespace razee`
    - kubectl apply this yaml:

    ```yaml
    kind: Service
    apiVersion: v1
    metadata:
        name: minikube-host
        namespace: razee
    spec:
        type: ExternalName
        externalName: minikube-host
    ```

1. Access the [welcome screen](http://localhost:3000) of your RazeeDash instance.

1. Register RazeeDash as an `OAuth` application in GitHub.

    1. From the RazeeDash welcome screen, click **Sign in**.
    2. Click **Configure GitHub Login**. A pop-up window opens.
    3. Follow the [link](https://github.com/settings/applications/new) in the pop-up window to register a new `OAuth` application in GitHub. Enter a name for your GitHub application, a description, and the **Homepage URL** and **Authorization callback URL** that are displayed in the pop-up window.
    4. Click **Register application**.
    5. Copy the **Client ID** and the **Client Secret** and add these values to the pop-up window.
    6. Click **Save configuration**.

1. Grant RazeeDash access to your organization in GitHub.

    1. If you do not own a GitHub organization, [create one](https://help.github.com/en/articles/creating-a-new-organization-from-scratch).
    2. From the RazeeDash welcome screen, click **Sign in with GitHub**. A pop-up window opens.
    3. In the **Organization access** section, find your organization and click **Grant**.
    4. Click **Authorize github_user_name**. The RazeeDash console opens and shows the name of the organization that you granted access to.

1. Install Watch Keeper in your cluster.

    1. From the RazeeDash console, click the **Register** button that you can find next to your GitHub organization.
    2. Click the **Manage** button.
    3. In a new terminal session connect to your cluster and copy the **Install Razee Agent** `kubectl` command.
    4. run the command in your cluster to create the Watch Keeper component. change the port from 3000 to 3333 and then use the orgApiKey that was generated for you

       for example:

       ```bash
       kubectl apply -f "http://localhost:3333/api/install/razeedeploy-job?orgKey=<use_the_value_shown_in_razeedash>"
       ```

       Example output:

       ```bash
       configmap/watch-keeper-config created
       secret/watch-keeper-secret created
       clusterrole.rbac.authorization.k8s.io/cluster-reader created
       serviceaccount/watch-keeper-sa created
       clusterrolebinding.rbac.authorization.k8s.io/watch-keeper-rb created
       networkpolicy.networking.k8s.io/watch-keeper-deny-ingress created
       deployment.apps/watch-keeper created
       Error from server (AlreadyExists): namespaces "razee" already exists
       ```

    5. Wait for Watch Keeper to finish.

       ```bash
       kubectl get deployment -n razee | grep watch-keeper
       ```

       Example output:

       ```bash
       watch-keeper                  1/1     1            1           2m5s
       ```

1. update the watch-keeper-config to point to your local razeedash api (change the value of `RAZEEDASH_URL`):

    `kubectl edit -n razee cm/watch-keeper-config`

    ```yaml
    apiVersion: v1
    data:
        RAZEEDASH_URL: http://minikube-host:3333/api/v2
        START_DELAY_MAX: "0"
    kind: ConfigMap
    metadata:
        creationTimestamp: "2019-06-05T15:55:39Z"
        name: watch-keeper-config
        namespace: razee
        resourceVersion: "4564"
        selfLink: /api/v1/namespaces/razee/configmaps/watch-keeper-config
        uid: 5d447e9c-87aa-11e9-a98b-6ae9411411a9
    ```

1. restart watch-keeper so the config-map changes will be put in place

    ```bash
    kubectl delete pod -n razee $(k get pods -n razee | grep watch-keeper | awk '{ print $1}')
    ```

1. From the RazeeDash console click the `RazeeDash` link in the header to open the RazeeDash details page and verify that you can see deployment information for your Watch Keeper pod.

## Useful tools

- [Robo 3T](https://robomongo.org/download)
- install bunyan to get better looking meteor logs by starting razeedash with `meteor --raw-logs | bunyan`
- To have multiple clusters reporting to your razeedash use the `profile` option of minikube to setup multiple minikube clusters on your development machine.  For example:

    ```bash
    $> minikube start -p test2
    😄  minikube v1.1.0 on darwin (amd64)
    🔥  Creating virtualbox VM (CPUs=2, Memory=2048MB, Disk=20000MB) ...
    🐳  Configuring environment for Kubernetes v1.14.2 on Docker 18.09.6
    🚜  Pulling images ...
    🚀  Launching Kubernetes ...
    ⌛  Verifying: apiserver proxy etcd scheduler controller dns
    🏄  Done! kubectl is now configured to use "test2"

    $> kubectl config use-context minikube (to switch back to your first cluster)
    ```

## Troubleshooting

- If you ever find yourself on localhost and are not able to authenticate with github then you may need to delete the document from the `meteor_accounts_loginServiceConfiguration` collection.  Deleting this document will force RazeeDash to show you the `Configure GitHub Login` screen again.  At this point you would need to enter your GitHub OAuth apps `Client ID` and `Client Secret` again.

## Removing Razee components from a cluster

- remove all of the CRDs from the razee namespace
