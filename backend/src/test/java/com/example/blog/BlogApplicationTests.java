package com.example.blog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestApplicationProperties.class)
class BlogApplicationTests {

  @Test
  void contextLoads() {
  }
}
