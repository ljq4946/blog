package com.example.blog.auth;

import com.example.blog.config.AdminProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminBootstrapTest {

  @Test
  void updatesExistingAdminFromConfiguredCredentials() {
    UserRepository users = mock(UserRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    AdminProperties adminProperties = new AdminProperties();
    adminProperties.setUsername("4946");
    adminProperties.setPassword("541312");
    User existing = new User("admin", "old-hash", UserRole.ADMIN);
    AdminBootstrap bootstrap = new AdminBootstrap(users, passwordEncoder, adminProperties);

    when(users.findFirstByRole(UserRole.ADMIN)).thenReturn(Optional.of(existing));
    when(passwordEncoder.matches("541312", "old-hash")).thenReturn(false);
    when(passwordEncoder.encode("541312")).thenReturn("new-hash");

    bootstrap.run(mock(ApplicationArguments.class));

    assertThat(existing.getUsername()).isEqualTo("4946");
    assertThat(existing.getPasswordHash()).isEqualTo("new-hash");
    verify(users).save(existing);
  }
}
