#!/usr/bin/env bash
PATH_SELF=$(realpath "$(dirname "${BASH_SOURCE[0]}")")
CONTAINER_PREFIX=$(realpath $PATH_SELF/../ | sed 's/^.*\///g')
ARG_NO_DATA=""
while [[ "$#" -gt 0 ]]; do case $1 in
  --no-data) export ARG_NO_DATA="--no-data"; shift;;
  *) echo "Unknown parameter passed: $1"; exit 1;;
esac; shift; done
source "$PATH_SELF/../.env"
docker exec -i ${CONTAINER_PREFIX}-mariadb-1 sh -c "exec mysqldump --user root ${ARG_NO_DATA} -p\$MYSQL_ROOT_PASSWORD $DB_NAME"
