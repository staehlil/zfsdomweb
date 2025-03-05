# zfsdomweb

## What is this?

`zfsdomweb` is a webinterface for [zfsdom](https://github.com/staehlil/zfsdom). 

## Configure
<a name="config-env" id="config-env"></a>.env
```
ALLOW_REGISTRATION=0
SSL=0
HTTP_PORT=8765
FEDERATION=localhost
DB_HOST=mariadb
DB_NAME=zfsdomweb
DB_USER=zfsdomweb
DB_NETWORK=%.%.%.%
DB_PASS=quahs4Eithaeveed
SETTINGS_ENCRYPTION_KEY=c9YCDzJMxUhZZtS5uIces88zhMNfFN5eMNMYkcUWwPVgBS0qywuyM7XB6qEeVgv+hmbgNsit8zdAIhs0Q0q3Ig==
JWT_TOKEN_SECRET=xfDUweTEDPny4xOYgR3CxkGRl4IH3OX+nUKTCQ380dKYdAjU5DMCXIPUocTNUn+Jh+TsVUWRaXR7PCReDSR+kIiJqjZirthji+mrNvfWbm7IoB2SbT33k8PAXB1UIXqdz5YlMGsIJ1IfI7nG5QZfqbWhXmNiNf4XJUkXfIgK1TyG9oO4IdRsPv1ZBN/cFTqxIzgEI5MkzcRJyAc2GdiAf8MfTLX9Tu4BJOFdVmB8SAwMOtBl29zWi9EAa50jAekFLVE/n/aaBpcgGi1S8x0pAUymUg0XS9RuFYJ1isvlmlvs/QxQ0CqSIBUOPLF85soifNybem+uh8GVaxmLWclSlw==
JWT_REFRESH_SECRET=6plaOMfFguQz2LXbSRRzMD/K6mWpNRaekE6Nlw5c/qNs5yRFmwYyD6nCYs2EcLfVrNGBJ2cNNSXB2znp0iFleYiUqGT6JBPRcDiDjIjOuqQH7eGSKbwHVrNpufYDco70cjjXbKnPxahDNPmyn/VD35m57oVQLpJVrYCd/W99GF/lmCxoUYg18EHaEfaFZZajedj2hxgjgK7F2zhqyUmqd7xQHftNJnfTeEHU0pwSCBa53Xc9Yf+k0AQlGXrZutUH++ZX768he1//86WVlg8b2GQliYvr8mkEKh/2P7npxtItLSjgREBi2wABdn3UxqiyEq4RgR7kPNPcIpm9mv6i+g==
MYSQL_ROOT_PASSWORD=seec8aitaiHanief
PORT_SERVER=3005
PORT_CLIENT=3006
#OIDC_ISSUER=https://auth.myhost.com/realms/myrealm
#OIDC_CLIENT_ID=zfsdomweb
#OIDC_CLIENT_SECRET=the_client_secret
#OID_REDIRECT_URI=http://localhost:8765/api/auth/oidc-callback
#TRAEFIK_HOSTNAME=myhost.com
#TRAEFIK_CERTRESOLVER=myresolver
```

<a name="config-json" id="config-json"></a>${CONFIG_DIR}/settings.json (mounted from the host)
```
{
  "hosts": {
    "machine01": {
      "external": "machine01.myhosts.net:2331",
      "internal": "192.168.19.1"
    },
    "machine02": {
      "external": "machine02.myhosts.net:2332",
      "internal": "192.168.19.2"
    },
    "machine03": {
      "external": "machine03.myhosts.net:2336",
      "internal": "192.168.19.3"
    }
  }
}
```

to reload the json config run
```
docker restart zfsdomweb-server-1
```

### Run
```
docker compose -f docker-compose.yml up -d
```