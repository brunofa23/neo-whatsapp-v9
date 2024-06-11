#!/bin/bash

    # Configurações
    USER="root"
    PASSWORD="Cartorio@12345"
    DATABASE="easytalk"
    BACKUP_DIR="/home/bruno/projetos/easytalk/neo-whatsapp-v9/backups"
    DATE=$(date +\%Y-\%m-\%d)

    # Criar diretório de backup se não existir
    mkdir -p ${BACKUP_DIR}

    # Comando de backup
    mysqldump -u ${USER} -p${PASSWORD} ${DATABASE} > ${BACKUP_DIR}/${DATABASE}_${DATE}.sql

    # Comando de backup dentro do contêiner Docker
    docker exec digi3Web mysqldump -u ${USER} -p${PASSWORD} ${DATABASE} > ${BACKUP_DIR}/${DATABASE}_${DATE}.sql


    # Verificação do sucesso do backup
    if [ $? -eq 0 ]; then
      echo "Backup do banco de dados '${DATABASE}' realizado com sucesso em ${BACKUP_DIR}/${DATABASE}_${DATE}.sql"
    else
      echo "Erro ao realizar o backup do banco de dados '${DATABASE}'"
    fi

