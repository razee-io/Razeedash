###############################################################################
# Copyright 2019 IBM Corp. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
################################################################################
#######################################
# Build the preliminary image
#######################################
FROM node:12-alpine as buildImg

RUN apk update
RUN apk add python3 make g++


USER node
WORKDIR /home/node

COPY --chown=node .build/bundle /home/node/app

RUN cd app/programs/server/ && npm install

#######################################
# Build the production image
#######################################
FROM node:12-alpine
LABEL maintainer="Michael McKay <mckaymic@us.ibm.com>"

USER node
WORKDIR /home/node

ARG BUILD_ID
ARG LAST_COMMIT_ID
ENV BUILD_ID="${BUILD_ID}"
ENV LAST_COMMIT_ID="${LAST_COMMIT_ID}"
ENV PORT="${PORT:-3000}"
ENV NODE_ENV="production"

RUN mkdir -p /home/node/app
COPY --chown=node --from=buildImg /home/node /home/node

EXPOSE "${PORT}"
CMD ["node", "/home/node/app/main.js"]
