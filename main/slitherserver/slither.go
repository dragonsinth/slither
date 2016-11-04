package main

import (
	"flag"
	"log"
	"math/rand"
	"net/http"
	"sort"
	"strconv"
	"sync"
	"time"
)

type sid string
type pid string

type Server struct {
	sid     sid
	players map[pid]*Player
}

type Player struct {
	pid          pid
	sid          sid
	name         string
	color        uint32
	lastUpdate   time.Time
	lastX, lastY float64
	lastScore    int32
}

var mu sync.Mutex
var rnd = rand.New(rand.NewSource(time.Now().Unix()))
var players = map[pid]*Player{}
var servers = map[sid]*Server{}

func newId() string {
	return strconv.FormatInt(rnd.Int63(), 16)
}

type GetIdReq struct {
	Sid   string  `json:"sid"`
	Name  string  `json:"name"`
	Color uint32  `json:"color"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Score int32   `json:"score"`
}

type GetIdRsp struct {
	Id string `json:"id"`
}

func getId(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if SetCorsHeaders(w.Header(), r) {
		return
	}

	req := GetIdReq{}
	if !ReadJson(w, r, &req) {
		return
	}

	if len(req.Sid) == 0 {
		http.Error(w, "missing sId", http.StatusBadRequest)
		return
	}
	if len(req.Name) == 0 {
		http.Error(w, "missing name", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	sid := sid(req.Sid)
	id := pid(newId())
	server, ok := servers[sid]
	if !ok {
		server = &Server{
			sid:     sid,
			players: map[pid]*Player{},
		}
		servers[sid] = server
	}

	player := &Player{
		pid:        id,
		sid:        sid,
		name:       req.Name,
		color:      req.Color,
		lastX:      req.X,
		lastY:      req.Y,
		lastScore:  req.Score,
		lastUpdate: time.Now(),
	}
	players[id] = player
	server.players[id] = player

	JsonRespond(w, &GetIdRsp{
		Id: string(player.pid),
	})
}

type UpdateReq struct {
	Id    string  `json:"id"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Score int32   `json:"score"`
}

type PlayerStatus struct {
	Name  string  `json:"name"`
	Color uint32  `json:"color"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Score int32   `json:"score"`
	IsMe  bool    `json:"is_me"`
}

type UpdateRsp struct {
	Players []PlayerStatus `json:"players"`
}

func update(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if SetCorsHeaders(w.Header(), r) {
		return
	}

	req := UpdateReq{}
	if !ReadJson(w, r, &req) {
		return
	}

	if len(req.Id) == 0 {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	id := pid(req.Id)
	player, ok := players[id]
	if !ok {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	server, ok := servers[player.sid]
	if !ok {
		http.Error(w, "no server for that player", http.StatusInternalServerError)
		return
	}

	now := time.Now()
	player.lastScore = req.Score
	player.lastX = req.X
	player.lastY = req.Y
	player.lastUpdate = now

	results := []PlayerStatus{}
	playersToGc := []pid{}
	for _, player := range server.players {
		// GC players who haven't posted in 30 seconds.
		if player.lastUpdate.Before(now.Add(-30 * time.Second)) {
			playersToGc = append(playersToGc, player.pid)
			continue
		}
		// Omit players who haven't posted in 5 seconds or are dead.
		if player.lastScore == 0 || player.lastUpdate.Before(now.Add(-5*time.Second)) {
			continue
		}

		results = append(results, PlayerStatus{
			Name:  player.name,
			Color: player.color,
			X:     player.lastX,
			Y:     player.lastY,
			Score: player.lastScore,
			IsMe:  (player.pid == id),
		})
	}

	for _, gc := range playersToGc {
		delete(server.players, gc)
		delete(players, gc)
	}

	sort.Sort(sort.Reverse(byScore(results))) // by score descending
	JsonRespond(w, &UpdateRsp{
		Players: results,
	})
}

type byScore []PlayerStatus

func (p byScore) Len() int {
	return len(p)
}
func (p byScore) Less(i, j int) bool {
	pi := p[i]
	pj := p[j]
	if pi.Score < pj.Score {
		return true
	} else if pi.Score > pj.Score {
		return false
	}

	return pi.Name < pj.Name
}
func (p byScore) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

func main() {
	addr := flag.String("addr", ":8080", "http service address")
	flag.Parse()
	http.HandleFunc("/getId", getId)
	http.HandleFunc("/update", update)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
