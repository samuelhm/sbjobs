FROM postgres:16-alpine

COPY conf/postgresql.conf /etc/postgresql/postgresql.conf
COPY tools/entrypoint.sh /docker-entrypoint-initdb.d/10-init-app-user.sh

RUN chmod 755 /docker-entrypoint-initdb.d/10-init-app-user.sh

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
