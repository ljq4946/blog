package com.example.blog.operation;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.example.blog.operation.OperationLogService.OperationLogResponse;

@RestController
public class OperationLogController {

  private final OperationLogService logs;

  public OperationLogController(OperationLogService logs) {
    this.logs = logs;
  }

  @GetMapping("/api/v1/admin/operation-logs")
  public List<OperationLogResponse> recent() {
    return logs.recent();
  }
}
