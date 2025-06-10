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
	"social/pkg/websocket"
)

func main() {
	db, err := db.DBInstance()
	if err != nil {
		fmt.Println(err)
	}

	hub := websocket.NewHub()
	go hub.Run()

	app := handler.App{
		Queries: repository.Query{
			Db: db,
		},
		User: &model.User{},
		Hub:  hub,
	}

	server := http.Server{
		Addr:    ":8000",
		Handler: app.WithCORS(app.RouteChecker(app.Routes())),
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
