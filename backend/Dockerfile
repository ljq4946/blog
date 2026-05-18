FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY .mvn ./.mvn
COPY src ./src
RUN mvn --settings .mvn/settings.xml -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV UPLOAD_DIR=/app/uploads
COPY --from=build /workspace/target/blog-0.1.0-SNAPSHOT.jar /app/blog.jar
RUN mkdir -p /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/blog.jar"]
