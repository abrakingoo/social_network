package main

import "social/pkg/util"

func main() {
	util.Init()
	defer util.Db.Close()
}
