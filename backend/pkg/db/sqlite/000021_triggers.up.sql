
-- trigger for adding likes count on post
CREATE TRIGGER increment_likes_count
AFTER INSERT ON post_likes
WHEN NEW.is_like = 1
BEGIN
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
END;

-- trigger for subtracting likes count on post
CREATE TRIGGER decrement_likes_count
AFTER DELETE ON post_likes
WHEN OLD.is_like = 1
BEGIN
    UPDATE posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
END;

-- trigger for comments count on post
CREATE TRIGGER increment_post_comments_count
AFTER INSERT ON comments
BEGIN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
END;

-- incase we are deleting comments
CREATE TRIGGER decrement_post_comments_count
AFTER DELETE ON comments
BEGIN
    UPDATE posts
    SET comments_count = comments_count - 1
    WHERE id = OLD.post_id;
END;


-- comments like counts
CREATE TRIGGER increment_comment_likes_count
AFTER INSERT ON comment_likes
WHEN NEW.is_like = 1
BEGIN
    UPDATE comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
END;


CREATE TRIGGER decrement_comment_likes_count
AFTER DELETE ON comment_likes
WHEN OLD.is_like = 1
BEGIN
    UPDATE comments
    SET likes_count = likes_count - 1
    WHERE id = OLD.comment_id;
END;

-- group members count increase 
CREATE TRIGGER increment_group_members_count
AFTER INSERT ON group_members
BEGIN
    UPDATE groups
    SET members_count = members_count + 1
    WHERE id = NEW.group_id;
END;



CREATE TRIGGER decrement_group_members_count
AFTER DELETE ON group_members
BEGIN
    UPDATE groups
    SET members_count = members_count - 1
    WHERE id = OLD.group_id;
END;
