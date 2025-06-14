package repository

import (
	"fmt"
	"log"
	"social/pkg/model"
)

func (q *Query) FetchAllUsers(userID string) (model.AllUsers, error) {

	var (
        users model.AllUsers
        err   error  
    )


    // fetch all your followers
    users.Followers, err = q.FetchFollowers(userID) 
    if err != nil {
        return model.AllUsers{}, err
    }
	// fetch all who you are following
    users.Following, err = q.FetchFollowing(userID) 
    if err != nil {
        return model.AllUsers{}, err
    }
	
    // return follower request sent
    users.SentRequest, err = q.FetchSentFollowRequests(userID)
    if err != nil {
        return model.AllUsers{}, err
    }

    // return follower request recieved
    users.ReceivedRequest, err = q.FetchReceivedFollowRequests(userID) 
    if err != nil {
        return model.AllUsers{}, err
    }

    // fetch  non mutual users
    users.NonMutual, err = q.FetchNonMutual(userID)
    if err != nil {
        return model.AllUsers{}, err
    }

	return users , nil
}

func (q *Query) FetchNonMutual(userID string) ([]model.Follower, error) {

	var users []model.Follower
	query := `
		SELECT 
			u.id, u.first_name, u.last_name, u.nickname, u.avatar,  
			u.is_public
		FROM users u
		WHERE u.id != ? 
		AND NOT EXISTS (
      		SELECT 1
     			FROM user_follows uf
      			WHERE 
        		(uf.follower_id = u.id AND uf.following_id = ?) OR
        		(uf.follower_id = ? AND uf.following_id = u.id)
 		)
		ORDER BY u.created_at ASC
        LIMIT 100
	`
	rows, err := q.Db.Query(query, userID)
	if err != nil {
		log.Printf("FetchAllUsers: db error: %v", err)
		return nil, fmt.Errorf("failed to fetch non mutuL users: %w", err)
	}

	defer rows.Close()

	for rows.Next() {
		var user model.Follower

		err := rows.Scan(
			&user.ID, &user.FirstName, &user.Nickname,
			&user.Avatar, &user.IsPublic,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		users = append(users, user)

	}

	return users, nil
}


// FetchSentFollowRequests returns a list of users to whom the given user has sent follow requests
// with a 'pending' status. These are the users the given user wants to follow.
func (q *Query) FetchSentFollowRequests(userID string) ([]model.Follower, error) {
    query := `
        SELECT 
            u.id,
            u.first_name,
            u.nickname,
            u.avatar,
            u.is_public
        FROM user_follows uf
        JOIN users u ON uf.following_id = u.id
        WHERE uf.follower_id = ?
          AND uf.status = 'pending'
		ORDER BY uf.created_at ASC
		LIMIT 100
    `

    rows, err := q.Db.Query(query, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var followers []model.Follower
    for rows.Next() {
        var f model.Follower
        if err := rows.Scan(&f.ID, &f.FirstName, &f.Nickname, &f.Avatar, &f.IsPublic); err != nil {
            return nil, err
        }
        followers = append(followers, f)
    }

    return followers, nil
}

// FetchReceivedFollowRequests returns a list of users who have sent a follow request
// to the given user. These are users who want to follow the given user and are waiting for approval.
func (q *Query) FetchReceivedFollowRequests(userID string) ([]model.Follower, error) {
    query := `
        SELECT 
            u.id,
            u.first_name,
            u.nickname,
            u.avatar,
            u.is_public
        FROM user_follows uf
        JOIN users u ON uf.follower_id = u.id
        WHERE uf.following_id = ?
          AND uf.status = 'pending'
		ORDER BY uf.created_at ASC
		LIMIT 100
    `

    rows, err := q.Db.Query(query, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var followers []model.Follower
    for rows.Next() {
        var f model.Follower
        if err := rows.Scan(&f.ID, &f.FirstName, &f.Nickname, &f.Avatar, &f.IsPublic); err != nil {
            return nil, err
        }
        followers = append(followers, f)
    }

    return followers, nil
}
