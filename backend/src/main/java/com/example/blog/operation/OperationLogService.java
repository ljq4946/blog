package com.example.blog.operation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class OperationLogService {

  private final OperationLogRepository logs;

  public OperationLogService(OperationLogRepository logs) {
    this.logs = logs;
  }

  @Transactional
  public void record(String action, String targetType, Long targetId, String message) {
    logs.save(new OperationLog(action, targetType, targetId, message));
  }

  @Transactional(readOnly = true)
  public List<OperationLogResponse> recent() {
    return logs.findTop50ByOrderByCreatedAtDesc().stream().map(OperationLogResponse::from).toList();
  }

  public record OperationLogResponse(
      Long id,
      String action,
      String targetType,
      Long targetId,
      String message,
      Instant createdAt) {
    static OperationLogResponse from(OperationLog log) {
      return new OperationLogResponse(
          log.getId(),
          log.getAction(),
          log.getTargetType(),
          log.getTargetId(),
          log.getMessage(),
          log.getCreatedAt());
    }
  }
}
