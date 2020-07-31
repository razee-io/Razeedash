FROM node:12-alpine

LABEL maintainer="Michael McKay <mckaymic@us.ibm.com>"

ARG BUILD_ID
ARG LAST_COMMIT_ID

ENV METEORD_DIR="/opt/meteord" BUILD_PACKAGES="python3 make g++"

WORKDIR /root

COPY ./private/scripts $METEORD_DIR
COPY .build/bundle /app

RUN apk update \
	&& apk add ${BUILD_PACKAGES} \
	&& mkdir -p /root \
	&& mkdir -p /app \
    && $METEORD_DIR/build_app.sh \
	&& apk del --purge ${BUILD_PACKAGES} \
    && $METEORD_DIR/clean-final.sh

EXPOSE 3000
ENV BUILD_ID=${BUILD_ID}
ENV LAST_COMMIT_ID=${LAST_COMMIT_ID}
ENTRYPOINT sh $METEORD_DIR/run_app.sh
