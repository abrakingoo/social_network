package util

import (
	"database/sql"
	"log"

	pkg "social/pkg/db"
)

var Db *sql.DB

func init() {
	db, err := pkg.DBInstance()
	if err != nil {
		log.Println(err)
	}
	Db = db
}
