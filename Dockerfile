FROM node AS builder

WORKDIR /app
COPY . .

RUN yarn install
RUN node ./maze.js
RUN node ./shell.js

FROM ubuntu:22.04

RUN apt update && apt install -y nginx
RUN rm /etc/nginx/sites-enabled/default

COPY --from=builder /app/outdir /usr/share/nginx/html
ADD pre-launch.htpasswd /etc/nginx/pre-launch.htpasswd

ADD mapmaker.conf /tmp/mapmaker.conf
ADD mapmaker-auth.conf /tmp/mapmaker-auth.conf

ARG RELEASE
RUN if [ "$RELEASE" == "true" ]; then \
        cp /tmp/mapmaker.conf /etc/nginx/sites-enabled/default; \
    else \
        cp /tmp/mapmaker-auth.conf /etc/nginx/sites-enabled/default; \
    fi

CMD ["nginx", "-g", "daemon off;"]