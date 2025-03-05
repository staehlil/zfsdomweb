FROM mariadb:10.11
ARG DB_NAME
ARG DB_USER
ARG DB_NETWORK
ARG DB_PASS
ENV DB_NAME $DB_NAME
ENV DB_USER $DB_USER
ENV DB_NETWORK $DB_NETWORK
ENV DB_PASS $DB_PASS
COPY 99-mode.cnf /etc/mysql/conf.d/
COPY *.sql /docker-entrypoint-initdb.d/
COPY init.sh /
COPY docker-entrypoint.sh /usr/local/bin/
RUN /init.sh