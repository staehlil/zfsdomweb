FROM node:18.15.0 as build
RUN mkdir /client
WORKDIR /client
COPY ./ .
RUN npm install
RUN npm run build --omit=dev

FROM node:18.15.0
COPY _docker/entrypoint.sh /
RUN mkdir /client
RUN npm install -g serve
COPY --from=build /client/dist /client/dist
ENTRYPOINT ["/entrypoint.sh"]