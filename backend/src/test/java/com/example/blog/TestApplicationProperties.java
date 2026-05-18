package com.example.blog;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;

@TestConfiguration(proxyBeanMethods = false)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:blog;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=validate",
    "app.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "app.admin.username=4946",
    "app.admin.password=541312",
    "app.upload.dir=${java.io.tmpdir}/blog-test-uploads"
})
public class TestApplicationProperties {
}
