#!/bin/bash
echo "" > /var/www/html/index.html
cd /etc/apache2/sites-available/ || exit

cp proxy.conf.template proxy.conf
cp proxy-ssl.conf.template proxy-ssl.conf
sed -i "s/{FEDERATION}/$FEDERATION/g" proxy*.conf
sed -i "s/{PORT_SERVER}/$PORT_SERVER/g" proxy*.conf
sed -i "s/{PORT_CLIENT}/$PORT_CLIENT/g" proxy*.conf
sed -i "s/{CLIENT_HOSTNAME}/$CLIENT_HOSTNAME/g" proxy*.conf

if ! [ "$SSL" -eq "0" ]; then
  a2ensite proxy-ssl
  certbot certonly --non-interactive -d $FEDERATION --dns-route53 -m $LETSENCRYPT_EMAIL --agree-tos --server https://acme-v02.api.letsencrypt.org/directory
else
  a2ensite proxy
fi

service apache2 start
tail -f /dev/null