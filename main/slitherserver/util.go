package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// Send a JSON response.  Sends a 500 if rsp could not be json encoded.
func JsonRespond(w http.ResponseWriter, rsp interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if err := json.NewEncoder(w).Encode(rsp); err != nil {
		log.Printf("failed to json-encode response: %s", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

// Parse a JSON request.  Returns true if the request could be parsed, otherwise serves a 4XX.
func ReadJson(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	if r.Method != "POST" && r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return false
	}

	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.UseNumber()
	if err := decoder.Decode(dst); err != nil {
		http.Error(w, "could not parse request", http.StatusBadRequest)
		return false
	}

	return true
}

// Allow cross origin requests. Returns true if the request was an OPTIONS preflight.
func SetCorsHeaders(rspHdrs http.Header, r *http.Request) bool {
	rspHdrs.Set("Access-Control-Allow-Origin", r.Header.Get("Origin")) // TODO: Actually validate origin.
	rspHdrs.Set("Access-Control-Allow-Credentials", "true")

	if r.Method == "OPTIONS" {
		rspHdrs.Set("Access-Control-Allow-Headers", "origin, content-type, Authorization, X-Requested-With")
		return true
	}

	return false
}
