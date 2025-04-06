-- -----------------------------------------------------
-- Șterge schema dacă există și o recreează
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `facebook_clone`;
CREATE SCHEMA `facebook_clone`;
USE `facebook_clone`;

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL, -- parolele vor fi stocate criptat
  `score` FLOAT DEFAULT 0, -- pentru bonus feature
  `is_banned` BOOLEAN DEFAULT FALSE, -- status de ban
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB
AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `roles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `name` ENUM('USER', 'ADMIN') NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB
AUTO_INCREMENT = 1;

-- -----------------------------------------------------
-- Table `user_roles` (Many-to-Many relation)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` BIGINT(20) NOT NULL,
  `role_id` BIGINT(20) NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `posts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `posts` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `author_id` BIGINT(20) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `text` TEXT NOT NULL,
  `picture_url` TEXT,
  `score` FLOAT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('just_posted', 'first_reactions', 'outdated') DEFAULT 'just_posted',
  `comments_closed` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tags` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `post_tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `post_tags` (
  `post_id` BIGINT(20) NOT NULL,
  `tag_id` BIGINT(20) NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `comments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `comments` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT(20) NOT NULL,
  `author_id` BIGINT(20) NOT NULL,
  `text` TEXT NOT NULL,
  `score` FLOAT DEFAULT 0,
  `picture_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `votes`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `votes` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `post_id` BIGINT(20),
  `comment_id` BIGINT(20),
  `vote_type` ENUM('upvote', 'downvote') NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `unique_vote_post` UNIQUE (`user_id`, `post_id`),
  CONSTRAINT `unique_vote_comment` UNIQUE (`user_id`, `comment_id`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `bans`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bans` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `moderator_id` BIGINT(20) NOT NULL,
  `reason` TEXT,
  `banned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `unbanned_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`moderator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


-- USERS
INSERT INTO `users` (`id`, `username`, `email`, `password`, `score`, `is_banned`, `created_at`, `updated_at`) VALUES
(1, 'john_doe', 'john@example.com', 'hashed_pw1', 10.0, FALSE, NOW(), NOW()),
(2, 'admin_user', 'admin@example.com', 'hashed_pw2', 20.0, FALSE, NOW(), NOW()),
(3, 'jane_smith', 'jane@example.com', 'hashed_pw3', -5.0, TRUE, NOW(), NOW());

-- ROLES
INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'USER'),
(2, 'ADMIN');

-- USER ROLES
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 1),
(2, 2),
(3, 1);

-- TAGS
INSERT INTO `tags` (`id`, `name`) VALUES
(1, 'tech'),
(2, 'funny'),
(3, 'news');

-- POSTS
INSERT INTO `posts` (`id`, `author_id`, `title`, `text`, `picture_url`, `score`, `created_at`, `status`, `comments_closed`) VALUES
(1, 1, 'First Post', 'Hello world!', 'https://example.com/img1.jpg', 5.0, NOW(), 'just_posted', FALSE),
(2, 3, 'Tech News', 'New JavaScript framework released.', 'https://example.com/img2.jpg', 3.5, NOW(), 'first_reactions', FALSE);

-- POST_TAGS
INSERT INTO `post_tags` (`post_id`, `tag_id`) VALUES
(1, 2),
(2, 1),
(2, 3);

-- COMMENTS
INSERT INTO `comments` (`id`, `post_id`, `author_id`, `text`, `picture_url`, `score`, `created_at`) VALUES
(1, 1, 2, 'Nice post!', 'https://example.com/com1.jpg', 4.0, NOW()),
(2, 2, 1, 'Very informative.', 'https://example.com/com2.jpg', -1.0, NOW()),
(3, 2, 3, 'Thanks for sharing!', 'https://example.com/com3.jpg', 2.5, NOW());

-- VOTES
INSERT INTO `votes` (`id`, `user_id`, `post_id`, `comment_id`, `vote_type`) VALUES
(1, 2, 1, NULL, 'upvote'),
(2, 3, 2, NULL, 'upvote'),
(3, 1, NULL, 1, 'upvote'),
(4, 3, NULL, 2, 'downvote');

-- BANS
INSERT INTO `bans` (`id`, `user_id`, `moderator_id`, `reason`, `banned_at`, `unbanned_at`) VALUES
(1, 3, 2, 'Inappropriate content', NOW(), NULL);

-- Afișează utilizatorii și rolurile lor
SELECT u.username, r.name AS role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id;

-- Afișează postările cu autorul și tag-urile:
SELECT p.title, u.username AS author, GROUP_CONCAT(t.name) AS tags
FROM posts p
JOIN users u ON p.author_id = u.id
JOIN post_tags pt ON p.id = pt.post_id
JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id;

-- Afișează comentariile la o postare, ordonate după scor:
SELECT c.text, u.username AS author, c.score
FROM comments c
JOIN users u ON c.author_id = u.id
WHERE c.post_id = 2
ORDER BY c.score DESC;


-- Afișează voturile pe postări:
SELECT u.username, p.title, v.vote_type
FROM votes v
JOIN users u ON v.user_id = u.id
JOIN posts p ON v.post_id = p.id;

-- Verifică utilizatorii banați:
SELECT u.username, b.reason, b.banned_at
FROM bans b
JOIN users u ON b.user_id = u.id
WHERE u.is_banned = TRUE;




