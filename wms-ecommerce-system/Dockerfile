# ==============================================================================
# Dockerfile dùng chung cho mọi microservice Spring Boot trong wms-ecommerce-system.
# Chọn service bằng build arg SERVICE, VD:
#   docker build --build-arg SERVICE=order-service -t ctut/order-service .
# ==============================================================================

# ---------- Giai đoạn 1: build file JAR ----------
FROM maven:3.9.9-eclipse-temurin-21 AS build
ARG SERVICE
WORKDIR /build

# Tải dependency trước để tận dụng cache của Docker khi chỉ sửa mã nguồn
COPY ${SERVICE}/pom.xml ./pom.xml
RUN mvn -q -B dependency:go-offline || true

COPY ${SERVICE}/src ./src
RUN mvn -q -B -DskipTests package \
 && cp "$(ls target/*.jar | grep -v '\.original$' | head -n 1)" /build/app.jar

# ---------- Giai đoạn 2: image chạy gọn nhẹ ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 appuser
COPY --from=build /build/app.jar /app/app.jar
USER appuser
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
