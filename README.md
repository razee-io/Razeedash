# Razeedash

[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=razee-io/Razeedash)](https://dependabot.com)

![Travis Build Status](https://api.travis-ci.com/razee-io/Razeedash.svg?branch=master)
<https://travis-ci.com/razee-io/razeedash>

Razeedash is an app to manage deployments on Kubernetes

## Requirements

- Kubernetes CLI Tools
- Kubernetes Cluster
- [razeedash-api](https://github.com/razee-io/razeedash-api)
- MongoDB
- Register GitHub Application

## Environment Varibles

When deploying RazeeDash these variables can be set by adding them to the `razeedash-config` ConfigMap.

| Name             | Required | Value                    | Description |
| ----             | -------- | -----                    | ----------- |
| MONGO_URL        | Required | -                        | URL to your mongo instance |
| MONGO_OPTIONS    | Optional | -                        | Set additional mongo connection string options |
| OAUTH_SECRET_KEY | Optional | -                        | GitHub OAuth Secret Key |
| BITBUCKET_URL    | Optional | <https://bitbucket.org/>     | Required when using Bitbucket Enterprise authentication |
| BITBUCKET_API    | Optional | <https://api.bitbucket.org/2.0/> | Required when using Bitbucket Enterprise authentication |
| BUILD_ID         | Optional | Travis build ID          | Travis Build ID |
| LAST_COMMIT_ID   | Optional | GitHub commit hashcode   | `git log --pretty=format:'%h' -n 1` |

### Mongo connection options

You can optionally define a MONGO_OPTIONS environment variable to set mongo connection string settings. For example,
to ensure that meteor connects using `ssl=true` you could use

```shell
export MONGO_OPTIONS='{"ssl": true}'
```

### Register GitHub application

To use OAUTH authentication to GitHub you need to [Register a new Github OAuth App](https://github.com/settings/applications/new)
Example registration for running locally.

| Field | Value |
| ----- | ----- |
| Name | Local Razeedash Development |
| Description | Local development |
| Homepage URL | <http://localhost:3000> |
| User authorization callback URL | <http://localhost:3000/_oauth/github> |

### Using Bitbucket Enterprise authentication

Add `bitbucket_url` and `bitbucket_api` to the `razeedash-config` ConfigMap. For example:

```yaml
    apiVersion: v1
    kind: ConfigMap
    data:
        bitbucket_url: https://bitbucket.your_company.org/
        bitbucket_api: https://api.bitbucket.your_company.org/2.0/
```

### Deploy components

Follow [razeedash-api](https://github.com/razee-io/razeedash-api) instructions
to setup razeedash-api and MongoDB.

```bash
# Get latest release of razeedash and deploy
kubectl apply -f "https://github.com/razee-io/Razeedash/releases/latest/download/resource.yaml"
```

Check logs across pods using `kc_logs.sh` script from
[kube-cloud-scripts](https://github.com/razee-io/kube-cloud-scripts)

```bash
kc_logs.sh razee razeedash 1m
```

## Local Development

Requirements:

- [Meteor](https://www.meteor.com/install)
- [Node](https://nodejs.org/en/)

### Install Packages

```bash
npm install
```

### Local development with Minikube

[local dev with minikube](https://github.com/razee-io/Razeedash/blob/master/MINIKUBE.md)

### NPM Commands

| Name                          | Description |
| ----                          | ----------- |
| npm install                   | Install packages |
| `npm start`                   | Run app |
| `npm run lint`                | Run lint ES6, yaml, json, docker and markdown|
| `npm run eslint`              | Fix common ES6 lint issues |
| `npm run jsonlint`            | Lint JSON files |
| `npm run dockerlint`          | Lint Dockerfile |
| `npm run shlint`              | Lint shell scripts |
| `npm run markdownlint`        | Lint markdown files |
| `npm test`                    | Run unit tests |
| `npm run test:local`          | Run tests and watch for changes |
| `npm run test:local:coverage` | Run tests, generate coverage and watch |
| `npm run test:unit`           | Run tests |
| `npm run test:unit:coverage`  | Run tests and generate coverage |
