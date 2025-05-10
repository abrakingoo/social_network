package main

import (
	"fmt"

	db "social/pkg/db"
)

var Db, Err = db.DBInstance()

func main() {
	if Err != nil {
		fmt.Println(Err)
	}
	defer Db.Close()
}
