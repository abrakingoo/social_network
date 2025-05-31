package repository

import "social/pkg/model"

func(q *Query) FetchGroupData(groupid string) (model.GroupData, error) {
	var group model.GroupData

	// fetch available group info
	if err := q.fetchGroupInfo(groupid, &group); err != nil {
		return model.GroupData{}, err
	}
	// fetch all group members
	if err := q.fetchGroupMembers(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	// fetch all group events information
	if err := q.fetchGroupEvents(groupid, &group); err != nil {
		return model.GroupData{}, err
	}


	return group, nil
}

func (q *Query) fetchGroupInfo(groupid string, group *model.GroupData) error {

	return nil
}

func (q *Query) fetchGroupMembers(groupid string, group *model.GroupData) error {

	return nil
}

func (q *Query) fetchGroupEvents(groupid string, group *model.GroupData) error {

	return nil
}