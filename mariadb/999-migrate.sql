#!/bin/bash
USE {DB_NAME}
update users set refreshToken="{}" where refreshToken not like '{%';
alter table users change column refreshToken refreshToken json not null default '{}';
create table if not exists tasks (uuid varchar(255) not null, config json not null default '{}', unique (uuid));
alter table tasks add column if not exists done boolean not null default false;