FROM ubuntu as uBuildImg

# Install prerequisites
ENV DEBIAN_FRONTEND="noninteractive"
RUN apt-get -qq update
RUN apt-get -qq install curl vim

# Install nodejs v12
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get -qq install nodejs
RUN node --version

RUN npm install -g node-gyp

# Install meteor
RUN curl --silent https://install.meteor.com | /bin/sh

WORKDIR /home/node

ENV NODE_ENV=production
ENV METEOR_ALLOW_SUPERUSER=true
RUN meteor --version

COPY . .
RUN meteor npm install
RUN meteor build --directory /home/node/.build/ --architecture=os.linux.x86_64 --server-only
RUN mkdir -p /home/node/app
RUN ls -la /home/node/.build/bundle
RUN cp -r /home/node/.build/bundle/* /home/node/app/
# RUN node-gyp install
# RUN /home/node/private/scripts/build_app.sh

RUN ls -la

#######################################
#Build an intermediate image
FROM node:12-alpine as buildImg

USER node
WORKDIR /home/node
ENV NODE_ENV=production

RUN mkdir -p /home/node/app
RUN mkdir -p /home/node/node_modules

# COPY --chown=node --from=uBuildImg /home/node/private/scripts/rebuild_npm_modules.sh /tmp/rebuild_npm_modules.sh
COPY --chown=node --from=uBuildImg /home/node/.build/bundle /home/node/app
COPY --chown=node --from=uBuildImg /home/node/node_modules/ /home/node/node_modules/

RUN ls -la

RUN ls -la /home/node/app/

# RUN /tmp/rebuild_npm_modules.sh

RUN ls -l

#######################################
# Build the production image
FROM node:12-alpine
LABEL maintainer="Michael McKay <mckaymic@us.ibm.com>"
ENV NODE_ENV=production

WORKDIR /home/node
USER node
COPY --chown=node --from=buildImg /home/node/ /home/node/
RUN find .

EXPOSE 3000
CMD ["node", "app/server/main.js"]
