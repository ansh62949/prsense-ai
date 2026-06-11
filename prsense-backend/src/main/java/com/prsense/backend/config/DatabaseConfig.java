package com.prsense.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.beans.factory.annotation.Value;
import javax.sql.DataSource;
import java.net.URI;

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
        String url = dbUrl;
        String username = dbUsername;
        String password = dbPassword;

        // Overwrite URL from the environment variable if DATABASE_URL is set
        String envDatabaseUrl = System.getenv("DATABASE_URL");
        if (envDatabaseUrl == null || envDatabaseUrl.trim().isEmpty()) {
            envDatabaseUrl = System.getenv("SPRING_DATASOURCE_URL");
        }

        if (envDatabaseUrl != null && !envDatabaseUrl.trim().isEmpty()) {
            url = envDatabaseUrl;
        }

        if (url != null && !url.trim().isEmpty()) {
            // Check if it's in postgres:// or postgresql:// format
            if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
                try {
                    URI uri = new URI(url);
                    String host = uri.getHost();
                    int port = uri.getPort();
                    if (port == -1) {
                        port = 5432;
                    }
                    String path = uri.getPath();
                    String userInfo = uri.getUserInfo();

                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                    
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        username = parts[0];
                        password = parts[1];
                    }
                    url = jdbcUrl;
                } catch (Exception e) {
                    // Failover to string replacement if URI parsing fails
                    url = url.replace("postgresql://", "jdbc:postgresql://").replace("postgres://", "jdbc:postgresql://");
                }
            } else if (!url.startsWith("jdbc:")) {
                url = "jdbc:postgresql://" + url;
            }
        }

        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .build();
    }
}
