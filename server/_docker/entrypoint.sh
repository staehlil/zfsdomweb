#!/bin/bash
cd /server || exit
cp -r /home/node/.ssh /root
chmod -R 700 /root/.ssh
chown root:root /root/.ssh -R
node dist/main.js