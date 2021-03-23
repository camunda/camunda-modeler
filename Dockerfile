FROM node:15.6.0-alpine3.10 as builder
COPY . /tmp
WORKDIR /tmp

ENV USE_SYSTEM_7ZA true

RUN apk add --update --no-cache p7zip

RUN npm install -g --silent lerna npm-run-all webpack webpack-cli cpx cross-env del-cli electron-builder

RUN npm install --silent && npm run build

FROM ubuntu:20.04
LABEL maintainer = "Benjamin Weder <benjamin.weder@iaas.uni-stuttgart.de>"

ENV PORT 8888
ENV HEADLESS true

COPY --from=builder /tmp/dist/linux-unpacked /quantme

WORKDIR /quantme

# install xvfb to run in headless mode
RUN apt-get update && \
    apt-get install -qqy libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb

# install shared libraries required by the modeler
RUN apt-get update && apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

EXPOSE 8888

CMD Xvfb -ac -screen scrn 1280x2000x24 :9.0 & export DISPLAY=:9.0 && ./quantme-modeler --no-sandbox
