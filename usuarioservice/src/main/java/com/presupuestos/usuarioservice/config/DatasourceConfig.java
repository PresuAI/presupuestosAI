package com.presupuestos.usuarioservice.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

@Configuration
@Profile("!test")
public class DatasourceConfig {

    @Bean
    public DataSource dataSource(Dotenv dotenv) {
        HikariConfig config = new HikariConfig();

        config.setJdbcUrl("jdbc:postgresql://" +
                dotenv.get("DB_HOST") + ":" +
                dotenv.get("DB_PORT") + "/" +
                dotenv.get("DB_NAME"));
        config.setUsername(dotenv.get("DB_USER"));
        config.setPassword(dotenv.get("DB_PASS"));

        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setPoolName("UsuariosHikariPool");

        return new HikariDataSource(config);
    }
}
