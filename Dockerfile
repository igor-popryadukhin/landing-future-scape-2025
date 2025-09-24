# syntax=docker/dockerfile:1
FROM nginx:1.25-alpine AS runtime

# Copy static site assets into nginx html directory
WORKDIR /usr/share/nginx/html
COPY index.html ./
COPY styles.css ./
COPY scripts ./scripts

# Expose port 80 (default for nginx)
EXPOSE 80

# Use the default nginx command
CMD ["nginx", "-g", "daemon off;"]
