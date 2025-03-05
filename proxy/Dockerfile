FROM ubuntu:22.04
ENV TZ=Europe/Zurich
RUN sed -i 's|http://archive.ubuntu.com|http://mirror.init7.net/ubuntu|g' /etc/apt/sources.list
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && apt-get update \
    && apt-get install -y curl apache2 locales \
    && apt-get -y install python3-certbot-apache python3-pip awscli
RUN pip3 install certbot-dns-route53==$(certbot --version | grep -o "[0-9.]*")
RUN locale-gen de_CH.UTF-8
RUN a2enmod ssl actions http2 rewrite proxy_http request headers
RUN a2dissite default-ssl 000-default
COPY apache2.conf /etc/apache2/conf-available
RUN a2enconf apache2
COPY proxy.conf /etc/apache2/sites-available/proxy.conf.template
COPY proxy-ssl.conf /etc/apache2/sites-available/proxy-ssl.conf.template
COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]