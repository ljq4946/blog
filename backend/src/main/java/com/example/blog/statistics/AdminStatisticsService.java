package com.example.blog.statistics;

import com.example.blog.interaction.CommentStatus;
import com.example.blog.interaction.PostComment;
import com.example.blog.interaction.PostCommentRepository;
import com.example.blog.post.Post;
import com.example.blog.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.example.blog.statistics.AdminStatisticsDtos.*;

@Service
public class AdminStatisticsService {

  private static final int POPULAR_POST_LIMIT = 5;

  private final PostRepository posts;
  private final PostCommentRepository comments;

  public AdminStatisticsService(PostRepository posts, PostCommentRepository comments) {
    this.posts = posts;
    this.comments = comments;
  }

  @Transactional(readOnly = true)
  public AdminStatisticsResponse snapshot() {
    List<Post> allPosts = posts.findAllForAdmin();
    List<PostComment> allComments = comments.findAllForAdmin();
    Map<Long, Long> commentCountsByPostId = allComments.stream()
        .collect(Collectors.groupingBy(comment -> comment.getPost().getId(), Collectors.counting()));
    return new AdminStatisticsResponse(
        metrics(allPosts, allComments),
        popularPosts(commentCountsByPostId));
  }

  private StatisticsMetrics metrics(List<Post> allPosts, List<PostComment> allComments) {
    return new StatisticsMetrics(
        allPosts.stream().mapToLong(Post::getViewCount).sum(),
        allPosts.stream().mapToLong(Post::getLikeCount).sum(),
        allComments.size(),
        countComments(allComments, CommentStatus.PENDING),
        countComments(allComments, CommentStatus.APPROVED),
        countComments(allComments, CommentStatus.REJECTED));
  }

  private long countComments(List<PostComment> allComments, CommentStatus status) {
    return allComments.stream().filter(comment -> comment.getStatus() == status).count();
  }

  private List<PopularPost> popularPosts(Map<Long, Long> commentCountsByPostId) {
    return posts.findVisibleOrderByPublishedAtDescCreatedAtDesc(Instant.now()).stream()
        .map(post -> popularPost(post, commentCountsByPostId.getOrDefault(post.getId(), 0L)))
        .sorted(Comparator
            .comparingLong(this::engagementScore).reversed()
            .thenComparing(PopularPost::publishedAt, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(PopularPost::id))
        .limit(POPULAR_POST_LIMIT)
        .toList();
  }

  private PopularPost popularPost(Post post, long commentCount) {
    return new PopularPost(
        post.getId(),
        post.getTitle(),
        post.getSlug(),
        post.getViewCount(),
        post.getLikeCount(),
        commentCount,
        post.getPublishedAt());
  }

  private long engagementScore(PopularPost post) {
    return post.viewCount() + post.likeCount() + post.commentCount();
  }
}
