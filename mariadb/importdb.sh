#!/usr/bin/env bash
PATH_SELF=$(realpath "$(dirname "${BASH_SOURCE[0]}")")
CONTAINER_PREFIX=$(realpath $PATH_SELF/../../ | sed 's/^.*\///g')
source "$PATH_SELF/../../.env"
DUMPFILE=$1
! [ -z $DUMPFILE ] && docker exec -i ${CONTAINER_PREFIX}-mariadb-1 sh -c "exec mysql --user root --database $DB_NAME -p\$MYSQL_ROOT_PASSWORD " < $DUMPFILE || echo "please specify file to import"

