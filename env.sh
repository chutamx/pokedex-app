#!/bin/sh

# Reemplazar las variables de entorno en el archivo de configuración de la aplicación
envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js