# local development with minikube

1. Open a terminal and start redis. For example,

    ```bash
    docker run -d -p 6379:6379 redis
    ```

1. clone and run [razeedash](https://github.com/razee-io/Razeedash.git)

    ```bash
    git clone https://github.com/razee-io/Razeedash.git
    cd razeedash
    meteor npm install
    meteor
    ```

1. In a separate terminal window or tab, clone and run [razeedash-api](https://github.com/razee-io/Razeedash-api.git)

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

1. Install the RazeeDeploy components in your cluster.

    1. From the RazeeDash console, click the **Register** button that you can find next to your GitHub organization.
    2. Click the **Manage** button.
    3. Click the **Register cluster** button, give your cluster a name and click the **Register** button
    4. Copy the kubectl apply command to your clipboard
    5. In a new terminal session make sure your kube context is set to your minikube cluster. Paste the `kubectl apply` command from your clipboard into your terminal.

       for example:

       ```bash
       kubectl apply -f "http://localhost:3333/api/install/razeedeploy-job?orgKey=orgApiKey-abc123-abc12-aaaa-aaaa-a34de71952b7&clusterId=abcdefg-bbbb-4940-946d-33911220ceb0"
       ```

       Example output:

       ```bash
       namespace/razeedeploy created
       serviceaccount/razeedeploy-sa created
       clusterrole.rbac.authorization.k8s.io/razeedeploy-admin-cr created
       clusterrolebinding.rbac.authorization.k8s.io/razeedeploy-rb created
       job.batch/razeedeploy-job created
       ```

    6. Wait for the deployments to finish.

       ```bash
       kubectl get pods -n razeedeploy
       ```

       Example output:

       ```bash
       NAME                                                  READY   STATUS      RESTARTS   AGE
        clustersubscription-b4fb68b57-7btzr                   1/1     Running     0          79s
        encryptedresource-controller-b47bd9c47-8bd25          1/1     Running     0          74s
        featureflagsetld-controller-5d6f6dc848-4w5zv          1/1     Running     0          74s
        managedset-controller-866dd854f6-nvszf                1/1     Running     0          73s
        mustachetemplate-controller-5575b8688c-vdghw          1/1     Running     0          75s
        razeedeploy-job-hgqmn                                 0/1     Completed   0          89s
        remoteresource-controller-5546b89ff-nr7bs             1/1     Running     0          78s
        remoteresources3-controller-7559b4c648-9cqql          1/1     Running     0          78s
        remoteresources3decrypt-controller-579b65c97c-xtb79   1/1     Running     0          76s
        watch-keeper-586cdc58cd-vt7nr                         1/1     Running     0          79s
       ```

1. Configure minikube

    - Make sure your KUBECONFIG is pointing to your minikube cluster
    - kubectl apply this yaml:

    ```yaml
    kind: Service
    apiVersion: v1
    metadata:
        name: minikube-host
        namespace: razeedeploy
    spec:
        type: ExternalName
        externalName: minikube-host
    ```

1. update the watch-keeper-config to point to your local razeedash api (change the value of `RAZEEDASH_URL`):

    `kubectl edit -n razeedeploy cm/watch-keeper-config`

    ```yaml
    apiVersion: v1
    data:
        RAZEEDASH_URL: http://minikube-host:3333/api/v2
        START_DELAY_MAX: "0"
    kind: ConfigMap
    metadata:
        creationTimestamp: "2019-06-05T15:55:39Z"
        name: watch-keeper-config
        namespace: razeedeploy
        resourceVersion: "4564"
        selfLink: /api/v1/namespaces/razee/configmaps/watch-keeper-config
        uid: 5d447e9c-87aa-11e9-a98b-6ae9411411a9
    ```

1. restart watch-keeper so the config-map changes will be put in place

    ```bash
    kubectl delete pod -n razeedeploy $(k get pods -n razeedeploy | grep watch-keeper | awk '{ print $1}')
    ```

1. From your RazeeDash UI click the `Clusters` link in the header to and search for the cluster name that you previously created

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
