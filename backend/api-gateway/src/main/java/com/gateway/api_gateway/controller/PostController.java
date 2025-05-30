package com.gateway.api_gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {
    private final List<Map<String, Object>> posts = new ArrayList<>();
    private final List<Map<String, Object>> tags = new ArrayList<>(List.of(
        Map.of("id", 1, "name", "General"),
        Map.of("id", 2, "name", "Feedback")
    ));
    private final Map<String, Double> userScores = new HashMap<>();
    private final Set<String> blockedUsers = new HashSet<>();

    public PostController() {
        // Initialize demo posts
        Map<String, Object> author1 = new HashMap<>();
        author1.put("id", "1");
        author1.put("name", "Admin User");
        author1.put("avatarUrl", "https://via.placeholder.com/150");
        Map<String, Object> post1 = new HashMap<>();
        post1.put("id", 1);
        post1.put("author", author1);
        post1.put("title", "Welcome to our platform!");
        post1.put("content", "This is our first post. Feel free to share your thoughts!");
        post1.put("timePosted", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(new Date()));
        post1.put("status", "JUST_POSTED");
        post1.put("comments", new ArrayList<>());
        post1.put("likesCount", 5);
        post1.put("commentsCount", 0);
        post1.put("likedBy", new ArrayList<>());
        post1.put("dislikedBy", new ArrayList<>());
        post1.put("commentsDisabled", false);

        // Comentarii hardcodate pentru post1
        List<Map<String, Object>> comments1 = new ArrayList<>();
        Map<String, Object> commentAuthor1 = new HashMap<>();
        commentAuthor1.put("id", "2");
        commentAuthor1.put("name", "Regular User");
        commentAuthor1.put("avatarUrl", "https://via.placeholder.com/150");
        Map<String, Object> comment1 = new HashMap<>();
        comment1.put("id", 1);
        comment1.put("author", commentAuthor1);
        comment1.put("content", "Felicitări pentru lansare!");
        comment1.put("timePosted", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(new Date()));
        comment1.put("likes", 2);
        comment1.put("dislikes", 0);
        comment1.put("likedBy", new ArrayList<>());
        comment1.put("dislikedBy", new ArrayList<>());
        comments1.add(comment1);
        post1.put("comments", comments1);
        post1.put("commentsCount", comments1.size());

        Map<String, Object> author2 = new HashMap<>();
        author2.put("id", "2");
        author2.put("name", "Regular User");
        author2.put("avatarUrl", "https://via.placeholder.com/150");
        Map<String, Object> post2 = new HashMap<>();
        post2.put("id", 2);
        post2.put("author", author2);
        post2.put("title", "My first post");
        post2.put("content", "Hello everyone! This is my first post here.");
        post2.put("timePosted", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(new Date()));
        post2.put("status", "JUST_POSTED");
        post2.put("comments", new ArrayList<>());
        post2.put("likesCount", 3);
        post2.put("commentsCount", 0);
        post2.put("likedBy", new ArrayList<>());
        post2.put("dislikedBy", new ArrayList<>());
        post2.put("commentsDisabled", false);

        // Comentarii hardcodate pentru post2
        List<Map<String, Object>> comments2 = new ArrayList<>();
        Map<String, Object> commentAuthor2 = new HashMap<>();
        commentAuthor2.put("id", "1");
        commentAuthor2.put("name", "Admin User");
        commentAuthor2.put("avatarUrl", "https://via.placeholder.com/150");
        Map<String, Object> comment2 = new HashMap<>();
        comment2.put("id", 1);
        comment2.put("author", commentAuthor2);
        comment2.put("content", "Bine ai venit pe platformă!");
        comment2.put("timePosted", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(new Date()));
        comment2.put("likes", 1);
        comment2.put("dislikes", 0);
        comment2.put("likedBy", new ArrayList<>());
        comment2.put("dislikedBy", new ArrayList<>());
        comments2.add(comment2);
        post2.put("comments", comments2);
        post2.put("commentsCount", comments2.size());

        posts.add(post1);
        posts.add(post2);

        // Inițializez scorurile pentru utilizatorii existenți
        userScores.put("Admin User", 0.0);
        userScores.put("Regular User", 0.0);
    }

    private double getUserScore(String userName) {
        return userScores.getOrDefault(userName, 0.0);
    }

    private void addUserScore(String userName, double delta) {
        userScores.put(userName, getUserScore(userName) + delta);
    }

    private void injectScoresInPost(Map<String, Object> post) {
        Map<String, Object> author = (Map<String, Object>) post.get("author");
        author.put("score", getUserScore(author.get("name").toString()));
        List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
        if (comments != null) {
            for (Map<String, Object> comment : comments) {
                Map<String, Object> commentAuthor = (Map<String, Object>) comment.get("author");
                commentAuthor.put("score", getUserScore(commentAuthor.get("name").toString()));
            }
        }
    }

    private boolean isModerator(Map<String, String> userData) {
        return userData != null && "moderator".equals(userData.get("role"));
    }

    private boolean isBlocked(String userName) {
        return blockedUsers.contains(userName);
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts(@RequestParam(required = false) String requester, @RequestParam(required = false) String role) {
        System.out.println("Getting all posts");
        System.out.println("Total posts found: " + posts.size());
        
        // Injectez scorurile în fiecare post
        posts.forEach(post -> {
            injectScoresInPost(post);
            System.out.println("Post ID: " + post.get("id") + 
                             ", Author: " + ((Map<String, Object>)post.get("author")).get("name") + 
                             ", Score: " + ((Map<String, Object>)post.get("author")).get("score"));
        });
        
        Map<String, Object> response = new HashMap<>();
        response.put("posts", posts);
        if ("moderator".equals(role)) {
            response.put("blockedUsers", blockedUsers);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> postData) {
        System.out.println("Creating new post");
        System.out.println("Titlu primit: " + postData.get("title"));
        System.out.println("Conținut primit: " + postData.get("content"));
        System.out.println("Status primit: " + postData.get("status"));
        
        Map<String, Object> newPost = new HashMap<>(postData);
        newPost.put("id", posts.size() + 1);
        newPost.put("timePosted", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(new Date()));
        if (!newPost.containsKey("status")) {
            newPost.put("status", "JUST_POSTED");
        }
        newPost.put("comments", new ArrayList<>());
        newPost.put("likesCount", 0);
        newPost.put("commentsCount", 0);
        newPost.put("likedBy", new ArrayList<>());
        newPost.put("commentsDisabled", false);

        posts.add(0, newPost);
        injectScoresInPost(newPost);
        System.out.println("New post created by: " + ((Map<String, Object>)newPost.get("author")).get("name"));
        System.out.println("Post status: " + newPost.get("status"));
        return ResponseEntity.ok(newPost);
    }

    @PutMapping("/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable int id, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        System.out.println("[LIKE POST] User: " + user + " PostID: " + id);
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == id).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            Map<String, Object> author = (Map<String, Object>) post.get("author");
            String authorName = author.get("name").toString();
            if (authorName.equals(user)) {
                System.out.println("[LIKE POST] User tried to like own post. BLOCKED.");
                return ResponseEntity.badRequest().body("Cannot like own post");
            }
            List<String> likedBy = (List<String>) post.get("likedBy");
            List<String> dislikedBy = (List<String>) post.getOrDefault("dislikedBy", new ArrayList<String>());
            if (likedBy.contains(user)) {
                System.out.println("[LIKE POST] User already liked this post. BLOCKED.");
                return ResponseEntity.badRequest().body("Already liked this post");
            }
            if (dislikedBy.contains(user)) {
                addUserScore(authorName, 1.5);
                dislikedBy.remove(user);
            }
            likedBy.add(user);
            post.put("dislikedBy", dislikedBy);
            post.put("likesCount", likedBy.size() - dislikedBy.size());
            addUserScore(authorName, 2.5);
            injectScoresInPost(post);
            System.out.println("[LIKE POST] SUCCESS. likesCount=" + post.get("likesCount"));
            return ResponseEntity.ok(post);
        }
        return ResponseEntity.badRequest().body("Post not found");
    }

    @PutMapping("/{id}/dislike")
    public ResponseEntity<?> dislikePost(@PathVariable int id, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        System.out.println("[DISLIKE POST] User: " + user + " PostID: " + id);
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == id).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            Map<String, Object> author = (Map<String, Object>) post.get("author");
            String authorName = author.get("name").toString();
            if (authorName.equals(user)) {
                System.out.println("[DISLIKE POST] User tried to dislike own post. BLOCKED.");
                return ResponseEntity.badRequest().body("Cannot dislike own post");
            }
            List<String> likedBy = (List<String>) post.get("likedBy");
            List<String> dislikedBy = (List<String>) post.getOrDefault("dislikedBy", new ArrayList<String>());
            if (dislikedBy.contains(user)) {
                System.out.println("[DISLIKE POST] User already disliked this post. BLOCKED.");
                return ResponseEntity.badRequest().body("Already disliked this post");
            }
            if (likedBy.contains(user)) {
                addUserScore(authorName, -2.5);
                likedBy.remove(user);
            }
            dislikedBy.add(user);
            post.put("dislikedBy", dislikedBy);
            post.put("likesCount", likedBy.size() - dislikedBy.size());
            addUserScore(authorName, -1.5);
            injectScoresInPost(post);
            System.out.println("[DISLIKE POST] SUCCESS. likesCount=" + post.get("likesCount"));
            return ResponseEntity.ok(post);
        }
        return ResponseEntity.badRequest().body("Post not found");
    }

    @PutMapping("/{id}/unlike")
    public ResponseEntity<?> unlikePost(@PathVariable int id, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        System.out.println("[UNLIKE POST] User: " + user + " PostID: " + id);
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == id).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            Map<String, Object> author = (Map<String, Object>) post.get("author");
            String authorName = author.get("name").toString();
            List<String> likedBy = (List<String>) post.get("likedBy");
            List<String> dislikedBy = (List<String>) post.getOrDefault("dislikedBy", new ArrayList<String>());
            if (!likedBy.contains(user)) {
                System.out.println("[UNLIKE POST] User tried to unlike without like. BLOCKED.");
                return ResponseEntity.badRequest().body("You have not liked this post");
            }
            likedBy.remove(user);
            post.put("likesCount", likedBy.size() - dislikedBy.size());
            addUserScore(authorName, -2.5);
            injectScoresInPost(post);
            System.out.println("[UNLIKE POST] SUCCESS. likesCount=" + post.get("likesCount"));
            return ResponseEntity.ok(post);
        }
        System.out.println("[UNLIKE POST] Post not found.");
        return ResponseEntity.badRequest().body("Post not found");
    }

    @PutMapping("/{id}/undislike")
    public ResponseEntity<?> undislikePost(@PathVariable int id, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        System.out.println("[UNDISLIKE POST] User: " + user + " PostID: " + id);
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == id).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            Map<String, Object> author = (Map<String, Object>) post.get("author");
            String authorName = author.get("name").toString();
            List<String> likedBy = (List<String>) post.get("likedBy");
            List<String> dislikedBy = (List<String>) post.getOrDefault("dislikedBy", new ArrayList<String>());
            if (!dislikedBy.contains(user)) {
                System.out.println("[UNDISLIKE POST] User tried to undislike without dislike. BLOCKED.");
                return ResponseEntity.badRequest().body("You have not disliked this post");
            }
            dislikedBy.remove(user);
            post.put("dislikedBy", dislikedBy);
            post.put("likesCount", likedBy.size() - dislikedBy.size());
            addUserScore(authorName, 1.5);
            injectScoresInPost(post);
            System.out.println("[UNDISLIKE POST] SUCCESS. likesCount=" + post.get("likesCount"));
            return ResponseEntity.ok(post);
        }
        System.out.println("[UNDISLIKE POST] Post not found.");
        return ResponseEntity.badRequest().body("Post not found");
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable int id, @RequestBody Map<String, Object> commentData) {
        System.out.println("Adding comment to post: " + id);
        if (isBlocked(commentData.get("author").toString())) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream()
                .filter(p -> (int)p.get("id") == id)
                .findFirst();

        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            if ((Boolean) post.get("commentsDisabled")) {
                return ResponseEntity.badRequest().body("Comments are disabled for this post");
            }

            List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
            Map<String, Object> newComment = new HashMap<>(commentData);
            newComment.put("id", comments.size() + 1);
            newComment.put("timePosted", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(new Date()));
            newComment.put("likes", 0);
            newComment.put("dislikes", 0);
            newComment.put("likedBy", new ArrayList<>());
            newComment.put("dislikedBy", new ArrayList<>());

            comments.add(newComment);
            post.put("commentsCount", comments.size());
            
            if (commentData.containsKey("status")) {
                String newStatus = (String) commentData.get("status");
                post.put("status", newStatus);
            } else if (comments.size() == 1) {
                post.put("status", "FIRST_REACTIONS");
            }

            injectScoresInPost(post);
            return ResponseEntity.ok(post);
        }
        return ResponseEntity.badRequest().body("Post not found");
    }

    @PutMapping("/{postId}/comment/{commentId}/like")
    public ResponseEntity<?> likeComment(@PathVariable int postId, @PathVariable int commentId, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == postId).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
            Optional<Map<String, Object>> commentOpt = comments.stream().filter(c -> (int)c.get("id") == commentId).findFirst();
            if (commentOpt.isPresent()) {
                Map<String, Object> comment = commentOpt.get();
                Map<String, Object> author = (Map<String, Object>) comment.get("author");
                String authorName = author.get("name").toString();
                if (authorName.equals(user)) {
                    return ResponseEntity.badRequest().body("Cannot like own comment");
                }
                if (isBlocked(authorName)) return ResponseEntity.status(403).body("Author is blocked");
                List<String> likedBy = (List<String>) comment.get("likedBy");
                List<String> dislikedBy = (List<String>) comment.getOrDefault("dislikedBy", new ArrayList<String>());
                if (likedBy.contains(user)) {
                    return ResponseEntity.badRequest().body("Already liked this comment");
                }
                likedBy.add(user);
                dislikedBy.remove(user);
                comment.put("dislikedBy", dislikedBy);
                comment.put("likes", likedBy.size() - dislikedBy.size());
                
                addUserScore(authorName, 5.0);
                injectScoresInPost(post);
                
                comments.sort((a, b) -> ((int)b.get("likes")) - ((int)a.get("likes")));
                return ResponseEntity.ok(post);
            }
        }
        return ResponseEntity.badRequest().body("Comment not found");
    }

    @PutMapping("/{postId}/comment/{commentId}/dislike")
    public ResponseEntity<?> dislikeComment(@PathVariable int postId, @PathVariable int commentId, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == postId).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
            Optional<Map<String, Object>> commentOpt = comments.stream().filter(c -> (int)c.get("id") == commentId).findFirst();
            if (commentOpt.isPresent()) {
                Map<String, Object> comment = commentOpt.get();
                Map<String, Object> author = (Map<String, Object>) comment.get("author");
                String authorName = author.get("name").toString();
                if (authorName.equals(user)) {
                    return ResponseEntity.badRequest().body("Cannot dislike own comment");
                }
                if (isBlocked(authorName)) return ResponseEntity.status(403).body("Author is blocked");
                List<String> likedBy = (List<String>) comment.get("likedBy");
                List<String> dislikedBy = (List<String>) comment.getOrDefault("dislikedBy", new ArrayList<String>());
                if (dislikedBy.contains(user)) {
                    return ResponseEntity.badRequest().body("Already disliked this comment");
                }
                dislikedBy.add(user);
                likedBy.remove(user);
                comment.put("dislikedBy", dislikedBy);
                comment.put("likes", likedBy.size() - dislikedBy.size());
                
                addUserScore(authorName, -2.5);
                addUserScore(user, -1.5);
                injectScoresInPost(post);
                
                comments.sort((a, b) -> ((int)b.get("likes")) - ((int)a.get("likes")));
                return ResponseEntity.ok(post);
            }
        }
        return ResponseEntity.badRequest().body("Comment not found");
    }

    @PutMapping("/{postId}/comment/{commentId}/unlike")
    public ResponseEntity<?> unlikeComment(@PathVariable int postId, @PathVariable int commentId, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        System.out.println("[UNLIKE COMMENT] User: " + user + " PostID: " + postId + " CommentID: " + commentId);
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == postId).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
            Optional<Map<String, Object>> commentOpt = comments.stream().filter(c -> (int)c.get("id") == commentId).findFirst();
            if (commentOpt.isPresent()) {
                Map<String, Object> comment = commentOpt.get();
                Map<String, Object> author = (Map<String, Object>) comment.get("author");
                String authorName = author.get("name").toString();
                if (authorName.equals(user)) {
                    return ResponseEntity.badRequest().body("Cannot unlike own comment");
                }
                if (isBlocked(authorName)) return ResponseEntity.status(403).body("Author is blocked");
                List<String> likedBy = (List<String>) comment.get("likedBy");
                List<String> dislikedBy = (List<String>) comment.getOrDefault("dislikedBy", new ArrayList<String>());
                if (!likedBy.contains(user)) {
                    System.out.println("[UNLIKE COMMENT] User tried to unlike without like. BLOCKED.");
                    return ResponseEntity.badRequest().body("You have not liked this comment");
                }
                likedBy.remove(user);
                comment.put("likes", likedBy.size() - dislikedBy.size());
                addUserScore(authorName, -5.0);
                injectScoresInPost(post);
                System.out.println("[UNLIKE COMMENT] SUCCESS. likes=" + comment.get("likes"));
                return ResponseEntity.ok(post);
            }
        }
        System.out.println("[UNLIKE COMMENT] Comment not found.");
        return ResponseEntity.badRequest().body("Comment not found");
    }

    @PutMapping("/{postId}/comment/{commentId}/undislike")
    public ResponseEntity<?> undislikeComment(@PathVariable int postId, @PathVariable int commentId, @RequestBody Map<String, String> userData) {
        String user = userData.get("user");
        System.out.println("[UNDISLIKE COMMENT] User: " + user + " PostID: " + postId + " CommentID: " + commentId);
        if (isBlocked(user)) return ResponseEntity.status(403).body("User is blocked");
        Optional<Map<String, Object>> postOpt = posts.stream().filter(p -> (int)p.get("id") == postId).findFirst();
        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
            Optional<Map<String, Object>> commentOpt = comments.stream().filter(c -> (int)c.get("id") == commentId).findFirst();
            if (commentOpt.isPresent()) {
                Map<String, Object> comment = commentOpt.get();
                Map<String, Object> author = (Map<String, Object>) comment.get("author");
                String authorName = author.get("name").toString();
                if (authorName.equals(user)) {
                    return ResponseEntity.badRequest().body("Cannot undislike own comment");
                }
                if (isBlocked(authorName)) return ResponseEntity.status(403).body("Author is blocked");
                List<String> likedBy = (List<String>) comment.get("likedBy");
                List<String> dislikedBy = (List<String>) comment.getOrDefault("dislikedBy", new ArrayList<String>());
                if (!dislikedBy.contains(user)) {
                    System.out.println("[UNDISLIKE COMMENT] User tried to undislike without dislike. BLOCKED.");
                    return ResponseEntity.badRequest().body("You have not disliked this comment");
                }
                dislikedBy.remove(user);
                comment.put("dislikedBy", dislikedBy);
                comment.put("likes", likedBy.size() - dislikedBy.size());
                addUserScore(authorName, 2.5);
                addUserScore(user, 1.5);
                injectScoresInPost(post);
                System.out.println("[UNDISLIKE COMMENT] SUCCESS. likes=" + comment.get("likes"));
                return ResponseEntity.ok(post);
            }
        }
        System.out.println("[UNDISLIKE COMMENT] Comment not found.");
        return ResponseEntity.badRequest().body("Comment not found");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable int id) {
        System.out.println("Delete attempt for post: " + id);
        
        Optional<Map<String, Object>> postOpt = posts.stream()
                .filter(p -> (int)p.get("id") == id)
                .findFirst();

        if (postOpt.isPresent()) {
            posts.removeIf(p -> (int)p.get("id") == id);
            System.out.println("Post deleted successfully");
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.badRequest().body("Post not found");
    }

    @DeleteMapping("/{postId}/comment/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable int postId, @PathVariable int commentId) {
        System.out.println("Delete attempt for comment: " + commentId + " from post: " + postId);
        
        Optional<Map<String, Object>> postOpt = posts.stream()
                .filter(p -> (int)p.get("id") == postId)
                .findFirst();

        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
            
            boolean removed = comments.removeIf(c -> (int)c.get("id") == commentId);
            if (removed) {
                post.put("commentsCount", comments.size());
                System.out.println("Comment deleted successfully");
                return ResponseEntity.ok(post);
            }
        }

        return ResponseEntity.badRequest().body("Post or comment not found");
    }

    @PutMapping("/{id}/edit")
    public ResponseEntity<?> editPost(@PathVariable int id, @RequestBody Map<String, String> updates) {
        System.out.println("Edit attempt for post: " + id);
        
        Optional<Map<String, Object>> postOpt = posts.stream()
                .filter(p -> (int)p.get("id") == id)
                .findFirst();

        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            updates.forEach((key, value) -> {
                if (!key.equals("id") && !key.equals("author") && !key.equals("timePosted")) {
                    post.put(key, value);
                }
            });
            System.out.println("Post edited successfully");
            return ResponseEntity.ok(post);
        }

        return ResponseEntity.badRequest().body("Post not found");
    }

    @PutMapping("/{postId}/comment/{commentId}/edit")
    public ResponseEntity<?> editComment(@PathVariable int postId, @PathVariable int commentId, 
                                       @RequestBody Map<String, String> updates) {
        System.out.println("Edit attempt for comment: " + commentId + " from post: " + postId);
        
        Optional<Map<String, Object>> postOpt = posts.stream()
                .filter(p -> (int)p.get("id") == postId)
                .findFirst();

        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            List<Map<String, Object>> comments = (List<Map<String, Object>>) post.get("comments");
            
            Optional<Map<String, Object>> commentOpt = comments.stream()
                    .filter(c -> (int)c.get("id") == commentId)
                    .findFirst();

            if (commentOpt.isPresent()) {
                Map<String, Object> comment = commentOpt.get();
                updates.forEach((key, value) -> {
                    if (!key.equals("id") && !key.equals("author") && !key.equals("timePosted")) {
                        comment.put(key, value);
                    }
                });
                System.out.println("Comment edited successfully");
                return ResponseEntity.ok(post);
            }
        }

        return ResponseEntity.badRequest().body("Post or comment not found");
    }

    @PutMapping("/{id}/toggle-comments")
    public ResponseEntity<?> toggleComments(@PathVariable int id) {
        System.out.println("Toggle comments attempt for post: " + id);
        
        Optional<Map<String, Object>> postOpt = posts.stream()
                .filter(p -> (int)p.get("id") == id)
                .findFirst();

        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            boolean currentState = (Boolean) post.get("commentsDisabled");
            post.put("commentsDisabled", !currentState);
            
            if (!currentState) {
                post.put("status", "EXPIRED");
            }
            
            System.out.println("Comments toggled to: " + !currentState);
            return ResponseEntity.ok(post);
        }

        return ResponseEntity.badRequest().body("Post not found");
    }

    @GetMapping("/tags")
    public ResponseEntity<?> getTags() {
        System.out.println("Getting all tags");
        System.out.println("Total tags found: " + tags.size());
        System.out.println("Lista tag-uri disponibile:");
        tags.forEach(tag -> {
            System.out.println("- Tag ID: " + tag.get("id") + ", Name: " + tag.get("name"));
        });
        return ResponseEntity.ok(tags);
    }

    @PostMapping("/tags")
    public ResponseEntity<?> createTag(@RequestBody Map<String, Object> tagData) {
        System.out.println("Creating new tag");
        System.out.println("Tag name received: " + tagData.get("name"));
        
        String tagName = tagData.get("name").toString();
        Map<String, Object> newTag = Map.of(
            "id", tags.size() + 1,
            "name", tagName
        );
        tags.add(newTag);
        System.out.println("New tag created: " + tagName);
        System.out.println("Total tags after creation: " + tags.size());
        return ResponseEntity.ok(newTag);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updatePostStatus(@PathVariable int id, @RequestBody Map<String, String> statusData) {
        System.out.println("Updating status for post: " + id);
        System.out.println("New status: " + statusData.get("status"));
        
        Optional<Map<String, Object>> postOpt = posts.stream()
                .filter(p -> (int)p.get("id") == id)
                .findFirst();

        if (postOpt.isPresent()) {
            Map<String, Object> post = postOpt.get();
            String newStatus = statusData.get("status");
            String oldStatus = (String) post.get("status");
            post.put("status", newStatus);
            System.out.println("Post status updated successfully:");
            System.out.println("- Post ID: " + id);
            System.out.println("- Author: " + ((Map<String, Object>)post.get("author")).get("name"));
            System.out.println("- Old status: " + oldStatus);
            System.out.println("- New status: " + newStatus);
            return ResponseEntity.ok(post);
        }

        return ResponseEntity.badRequest().body("Post not found");
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        System.out.println("=== [UPLOAD IMAGE] ===");
        try {
            System.out.println("Received file: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize());

            String uploadDir = System.getProperty("user.dir") + "/uploads/poze/";
            System.out.println("Upload directory: " + uploadDir);

            File dir = new File(uploadDir);
            if (!dir.exists()) {
                boolean created = dir.mkdirs();
                System.out.println("Created upload directory: " + created);
            }

            String fileName = java.util.UUID.randomUUID() + "_" + file.getOriginalFilename();
            String filePath = uploadDir + fileName;
            System.out.println("Saving file as: " + filePath);

            File dest = new File(filePath);
            file.transferTo(dest);

            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", "/uploads/poze/" + fileName);
            System.out.println("Image uploaded successfully: /uploads/poze/" + fileName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("Exception at upload:");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Image upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/block-user")
    public ResponseEntity<?> blockUser(@RequestBody Map<String, String> data) {
        String userToBlock = data.get("user");
        String requester = data.get("requester");
        String role = data.get("role");
        if (!"moderator".equals(role)) {
            return ResponseEntity.status(403).body("Only moderators can block users");
        }
        blockedUsers.add(userToBlock);
        System.out.println("[BLOCK USER] Moderator " + requester + " blocked user: " + userToBlock);
        return ResponseEntity.ok(blockedUsers);
    }

    @PostMapping("/unblock-user")
    public ResponseEntity<?> unblockUser(@RequestBody Map<String, String> data) {
        String userToUnblock = data.get("user");
        String requester = data.get("requester");
        String role = data.get("role");
        if (!"moderator".equals(role)) {
            return ResponseEntity.status(403).body("Only moderators can unblock users");
        }
        blockedUsers.remove(userToUnblock);
        System.out.println("[UNBLOCK USER] Moderator " + requester + " unblocked user: " + userToUnblock);
        return ResponseEntity.ok(blockedUsers);
    }
} 