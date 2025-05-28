package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	db "social/pkg/db"
	handler "social/pkg/handler"
	"social/pkg/model"
	"social/pkg/repository"
)

func main() {
	db, err := db.DBInstance()
	if err != nil {
		fmt.Println(err)
	}

	app := handler.App{
		Queries: repository.Query{
			Db: db,
		},
		User:    &model.User{},
	}

	server := http.Server{
		Addr:    ":8000",
		Handler: app.RouteChecker(app.WithCORS(app.Routes())),
	}
	go func() {
		if err := server.ListenAndServe(); err != nil {
			log.Println(err)
			os.Exit(0)
		}
	}()
	fmt.Printf("Listening on port %s\n", server.Addr)
	select {}
}
