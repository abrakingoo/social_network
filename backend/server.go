package main

import "social/pkg/util"

func main() {
	util.init()
	defer util.Db.Close()
}
