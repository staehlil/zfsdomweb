create database if not exists {DB_NAME};
create user {DB_USER}@'{DB_NETWORK}' identified by '{DB_PASS}';
grant all privileges on {DB_NAME}.* to {DB_USER}@'{DB_NETWORK}';
