package main

import (
	"flag"
	"github.com/dragonsinth/slither/main/slitherserver/impl"
	"log"
	"net/http"
)

func main() {
	addr := flag.String("addr", ":8080", "http service address")
	flag.Parse()

	impl.Register("")

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
