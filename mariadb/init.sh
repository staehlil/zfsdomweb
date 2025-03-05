#!/bin/bash
TARGET_PATH="/docker-entrypoint-initdb.d/00-init.sql"
DUMP_PATH="/docker-entrypoint-initdb.d/01-dump.sql"
DB_PASS_ESCAPED=$(echo $DB_PASS | sed -E 's/\//\\\//g')
sed -i "s/{DB_NAME}/$DB_NAME/g" $TARGET_PATH
sed -i "s/{DB_USER}/$DB_USER/g" $TARGET_PATH
sed -i "s/{DB_NETWORK}/$DB_NETWORK/g" $TARGET_PATH
sed -i "s/{DB_PASS}/$DB_PASS_ESCAPED/g" $TARGET_PATH
sed -i "s/{DB_NAME}/$DB_NAME/g" $DUMP_PATH

MIGRATE_PATH="/docker-entrypoint-initdb.d/999-migrate.sql"
sed -i "s/{DB_NAME}/$DB_NAME/g" $MIGRATE_PATH