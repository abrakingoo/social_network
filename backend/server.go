package main

import (
	"fmt"

	db "social/pkg/db"
)

func main() {
	db, err := db.DBInstance()
	if err != nil {
		fmt.Println(err)
	}
	defer db.Close()
}
