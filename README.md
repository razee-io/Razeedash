# Razeedash

[![Greenkeeper badge](https://badges.greenkeeper.io/razee-io/Razeedash.svg)](https://greenkeeper.io/)

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

| Name             | Required | Value                    | Description |
| ----             | -------- | -----                    | ----------- |
| MONGO_URL        | Required | -                        | URL to your mongo instance |
| OAUTH_SECRET_KEY | Optional | -                        | GitHub OAuth Secret Key |
| GITHUB_URL       | Optional | <https://github.com>     | GitHub URL. Required if `LOGIN_TYPE=ghe` |
| GITHUB_API       | Optional | <https://api.github.com> | GitHub API URL. Required if `LOGIN_TYPE=ghe` |
| BUILD_ID         | Optional | Travis build ID          | Travis Build ID |
| LAST_COMMIT_ID   | Optional | GitHub commit hashcode   | `git log --pretty=format:'%h' -n 1` |
| LOGIN_TYPE |   Optional    | github | Use `local` to enable local id/password logins. Use `ghe` for github enterprise instead of GitHub authentication |

### Register GitHub application

To use OAUTH authentication to GitHub you need to [Register a new Github OAuth App](https://github.com/settings/applications/new)
Example registration for running locally.

| Field | Value |
| ----- | ----- |
| Name | Local Razeedash Development |
| Description | Local development |
| Homepage URL | <http://localhost:3000> |
| User authorization callback URL | <http://localhost:3000/_oauth/github> |

### Using GitHub enterprise for authentication
- create the `LOGIN_TYPE` environment variable and set it to `ghe`. ex: `LOGIN_TYPE="ghe"`
- create the `GITHUB_URL` environment variable and point it to your enterprise github url. `ex: GITHUB_URL="github.your_company.com"`
- create the `GITHUB_API` environment variable and point it to your enterprise github url. `ex: GITHUB_API="github.your_company.com/api/v3"`


### Enable email/password authentication

To use email/password authentication instead of GitHub authentication you need to create the `LOGIN_TYPE` environment variable and set it to `local`. If the environment variable is not set then you will only see the `Sign in with GitHub` option.

### Deploy components

Follow [razeedash-api](https://github.com/razee-io/razeedash-api) instructions
to setup razeedash-api and MongoDB.

```bash
# Get latest release of razeedash and deploy
kubectl apply -f "https://github.com/razee-io/razeedash/releases/release/download/resource.yaml"
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
