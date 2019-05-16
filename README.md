# Razeedash

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
| OAUTH_SECRET_KEY | Required | -                        | GitHub OAuth Secret Key |
| GITHUB_URL       | Optional | <https://github.com>     | GitHub URL |
| GITHUB_API       | Optional | <https://api.github.com> | GitHub API URL |
| BUILD_ID         | Optional | Travis build ID          | Travis Build ID |
| LAST_COMMIT_ID   | Optional | GitHub commit hashcode   | `git log --pretty=format:'%h' -n 1` |

### Register GitHub application

To use OAUTH authentication to GitHub you need to [Register a new GitHub App](https://github.com/settings/apps/new)
Example registration for running locally.

| Field | Value |
| ----- | ----- |
| Name | Local Razeedash Development |
| Description | Local development |
| Homepage URL | <http://localhost:3000> |
| User authorization callback URL | <http://localhost:3000/_oauth/github> |

### Create secrets and deploy

Generate a base64 encoding for the `oauth_secret_key` to be used in the
razeedash-secret.

Replace OAUTH_SECRET_KEY with the value from the registration of the GitHub application step.

<!--Markdownlint-disable MD013-->

```bash
echo -n "OAUTH_SECRET_KEY" | base64
```

<!--Markdownlint-enable MD013-->

Create file razeedash-secret.yaml using the generated string provided from the
previous command.

File: secret.yaml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: razeedash-secret
type: Opaque
data:
  oauth_secret_key: "output of base64 command above"
```

```bash
# Add razeedash secret for oauth_secret_key
kubectl apply -f secret.yaml
```

### Deploy components

Follow [razeedash-api](https://github.com/razee.io/razeedash-api) instructions
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
