#!/bin/sh

# Default port to 8080 if not specified by environment
PORT_VAL=${PORT:-8080}

echo "Configuring Nginx to listen on port ${PORT_VAL}"
sed -i "s/LISTEN_PORT/${PORT_VAL}/g" /etc/nginx/conf.d/default.conf

# Start Nginx
exec nginx -g "daemon off;"
