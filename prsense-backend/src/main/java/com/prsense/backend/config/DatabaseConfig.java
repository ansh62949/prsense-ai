package com.prsense.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.beans.factory.annotation.Value;
import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Bean
    public DataSource dataSource() {
        String url = dbUrl == null ? "" : dbUrl.trim();
        String username = dbUsername;
        String password = dbPassword;

        // Prefer the Spring-specific setting when both variables are present.
        String envDatabaseUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (envDatabaseUrl == null || envDatabaseUrl.trim().isEmpty()) {
            envDatabaseUrl = System.getenv("DATABASE_URL");
        }

        if (envDatabaseUrl != null && !envDatabaseUrl.trim().isEmpty()) {
            url = envDatabaseUrl.trim();
        }

        if (url != null && !url.trim().isEmpty()) {
            DatabaseConnection connection = normalizeConnection(url, username, password);
            url = connection.url();
            username = connection.username();
            password = connection.password();
        }

        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .build();
    }

    private static DatabaseConnection normalizeConnection(
            String rawUrl,
            String username,
            String password) {
        String url = rawUrl.trim();
        if (url.startsWith("jdbc:")) {
            return new DatabaseConnection(url, username, password);
        }

        if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
            return new DatabaseConnection("jdbc:postgresql://" + url, username, password);
        }

        try {
            URI uri = new URI(url);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("PostgreSQL URL does not contain a host");
            }

            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String path = uri.getRawPath() == null ? "" : uri.getRawPath();
            String query = uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery();
            String userInfo = uri.getUserInfo();

            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                username = parts[0];
                password = parts[1];
            }

            return new DatabaseConnection(
                    "jdbc:postgresql://" + host + ":" + port + path + query,
                    username,
                    password);
        } catch (URISyntaxException | IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid PostgreSQL database URL", exception);
        }
    }

    private record DatabaseConnection(String url, String username, String password) {
    }
}
