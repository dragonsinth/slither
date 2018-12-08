/*
 * // Copyright 2018 FullStory, Inc.
 * //
 * // Licensed under the Apache License, Version 2.0 (the "License");
 * // you may not use this file except in compliance with the License.
 * // You may obtain a copy of the License at
 * //
 * // http://www.apache.org/licenses/LICENSE-2.0
 * //
 * // Unless required by applicable law or agreed to in writing, software
 * // distributed under the License is distributed on an "AS IS" BASIS,
 * // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * // See the License for the specific language governing permissions and
 * // limitations under the License.
 *
 */

package impl

import (
	"bytes"
	"encoding/json"
	"github.com/dragonsinth/slither"
	"log"
	"net/http"
)

// Send a JSON response.  Sends a 500 if rsp could not be json encoded.
func JsonRespond(w http.ResponseWriter, rsp interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if err := json.NewEncoder(w).Encode(rsp); err != nil {
		log.Printf("failed to json-encode response: %s", err)
		httpError(w, http.StatusInternalServerError)
		return
	}
}

// Send a pretty-printed JSON response.  Sends a 500 if rsp could not be json encoded.
func JsonRespondPretty(w http.ResponseWriter, rsp interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if data, err := json.MarshalIndent(rsp, "", "  "); err != nil {
		log.Printf("failed to json-encode response: %s", err)
		httpError(w, http.StatusInternalServerError)
	} else {
		w.Write(data)
	}
}

// Parse a JSON request.  Returns true if the request could be parsed, otherwise serves a 4XX.
func ReadJson(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	if r.Method != "POST" && r.Method != "PUT" {
		httpError(w, http.StatusMethodNotAllowed)
		return false
	}

	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.UseNumber()
	if err := decoder.Decode(dst); err != nil {
		httpError(w, http.StatusBadRequest)
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

func httpError(w http.ResponseWriter, code int) {
	http.Error(w, http.StatusText(code), code)
}

func httpGet(resource string, contentType string, w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		httpError(w, http.StatusMethodNotAllowed)
		return
	}

	data := slither.MustAsset(resource)
	info, _ := slither.AssetInfo(resource)
	w.Header().Add("Content-Type", contentType)
	http.ServeContent(w, r, resource, info.ModTime(), bytes.NewReader(data))
}
