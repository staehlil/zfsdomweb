#!/bin/bash
cd /server || exit

cp -r /home/node/.ssh /root
chmod -R 700 /root/.ssh
chown root:root /root/.ssh -R

if [ "$PRODUCTION" == "1" ]; then
  [ ! -d dist ] && /build.sh
  node dist/main.js
else
  npm install
  npm run start:dev
fi
