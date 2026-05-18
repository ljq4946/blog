package com.example.blog.auth;

import com.example.blog.config.AdminProperties;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrap implements ApplicationRunner {

  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final AdminProperties adminProperties;

  public AdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder, AdminProperties adminProperties) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.adminProperties = adminProperties;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    users.findFirstByRole(UserRole.ADMIN).ifPresentOrElse(
        this::syncExistingAdmin,
        () -> users.save(new User(
            adminProperties.getUsername(),
            passwordEncoder.encode(adminProperties.getPassword()),
            UserRole.ADMIN)));
  }

  private void syncExistingAdmin(User admin) {
    boolean changed = false;
    if (!adminProperties.getUsername().equals(admin.getUsername())) {
      admin.setUsername(adminProperties.getUsername());
      changed = true;
    }
    if (!passwordEncoder.matches(adminProperties.getPassword(), admin.getPasswordHash())) {
      admin.setPasswordHash(passwordEncoder.encode(adminProperties.getPassword()));
      changed = true;
    }
    if (changed) {
      users.save(admin);
    }
  }
}
