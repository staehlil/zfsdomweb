FROM node:18 as build
RUN mkdir /server
WORKDIR /server
COPY ./ .
RUN npm install
RUN npm run build --omit=dev

FROM node:18
RUN apt update && apt install -y zip
COPY _docker/entrypoint.sh /
COPY _docker/zfsdom /usr/bin
RUN mkdir /server
COPY --from=build /server /server
ENTRYPOINT ["/entrypoint.sh"]