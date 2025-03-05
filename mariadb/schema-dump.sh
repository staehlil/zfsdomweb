#!/usr/bin/env bash
PATH_SELF=$(realpath "$(dirname "${BASH_SOURCE[0]}")")
source "$PATH_SELF/../../.env"
echo "USE $DB_NAME" > $PATH_SELF/01-dump.sql
$PATH_SELF/exportdb.sh --no-data >> $PATH_SELF/01-dump.sql