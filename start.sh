#!/bin/bash

# Inicia o serviço Docker
sudo service docker start

# Inicia o container digi3Web
docker start digi3Web

#sudo visudo
#root ALL=NOPASSWD: /usr/sbin/service docker start
