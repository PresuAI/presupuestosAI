# Usa una imagen base de Java
FROM openjdk:21-jdk-slim

# Crea un directorio para la app
WORKDIR /app

# Copia el JAR compilado al contenedor
COPY target/negocioservice-0.0.1-SNAPSHOT.jar app.jar

# Expone el puerto de la API
EXPOSE 8081

# Comando para ejecutar la app
ENTRYPOINT ["java", "-jar", "app.jar"]
