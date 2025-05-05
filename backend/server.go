package main

import (
	"fmt"
	"social/pkg"
)

func main() {
	db, err := pkg.DBInstance()
	if err != nil {
		fmt.Println(err)
	}
	defer db.Close()

	
}
