# Etapa de construcción
FROM node:16 as build

WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Instalar Tailwind CSS y sus dependencias
RUN npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

# Instalar dependencias adicionales
RUN npm install react-i18next i18next lucide-react

# Inicializar Tailwind CSS
RUN npx tailwindcss init -p

# Copiar el resto de los archivos del proyecto
COPY . .

# Instalar todas las dependencias
RUN npm install

# Crear manualmente el archivo components.json
RUN echo '{ "style": "default", "rsc": true, "tailwind": { "config": "tailwind.config.js", "css": "app/globals.css", "baseColor": "slate", "cssVariables": true }, "aliases": { "components": "@/components", "utils": "@/lib/utils" } }' > components.json

# Inicializar shadcn-ui y agregar componentes
RUN npx shadcn-ui@latest init -y
RUN npx shadcn-ui@latest add button --yes
RUN npx shadcn-ui@latest add dropdown-menu --yes

# Instalar shadcn-ui y sus dependencias
RUN npm install @radix-ui/react-dropdown-menu class-variance-authority clsx tailwind-merge

# Instalar craco
RUN npm install @craco/craco

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
