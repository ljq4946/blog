package com.example.blog.db;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.flyway.FlywayDataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
class FlywayMigrationTest {

  @Container
  static MySQLContainer mysql = new MySQLContainer("mysql:8.0");

  @Test
  void migrationCreatesExpectedTablesInMySql() {
    new ApplicationContextRunner()
        .withBean(DataSource.class, () -> dataSource())
        .withBean("flywayDataSource", DataSource.class, () -> dataSource())
        .withPropertyValues("spring.flyway.enabled=true")
        .withUserConfiguration(org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
        .run(context -> {
          Set<String> tables;
          try (Connection connection = dataSource().getConnection();
               ResultSet rs = connection.getMetaData().getTables(null, null, "%", new String[]{"TABLE"})) {
            tables = new java.util.ArrayList<String>() {{
              while (rs.next()) {
                add(rs.getString("TABLE_NAME").toLowerCase());
              }
            }}.stream().collect(Collectors.toSet());
          }

          assertThat(tables).contains(
              "users", "posts", "categories", "tags", "post_tags", "media_assets", "site_pages",
              "topics", "post_topics", "series", "post_revisions", "operation_logs");
        });
  }

  @FlywayDataSource
  static DataSource dataSource() {
    return DataSourceBuilder.create()
        .url(mysql.getJdbcUrl())
        .username(mysql.getUsername())
        .password(mysql.getPassword())
        .driverClassName(mysql.getDriverClassName())
        .build();
  }
}
