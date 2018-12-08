package impl

import (
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
	Sid   string  `json:"sid,omitempty"`
	Name  string  `json:"name,omitempty"`
	Color uint32  `json:"color"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Score int32   `json:"score"`
}

type GetIdRsp struct {
	Id string `json:"id"`
}

func getId(w http.ResponseWriter, r *http.Request) {
	if SetCorsHeaders(w.Header(), r) {
		return
	}

	req := GetIdReq{}
	if !ReadJson(w, r, &req) {
		return
	}

	if len(req.Sid) == 0 {
		http.Error(w, "missing sid", http.StatusBadRequest)
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

	log.Printf("%s (%s) joined %s", player.name, player.pid, player.sid)

	JsonRespond(w, &GetIdRsp{
		Id: string(player.pid),
	})
}

type UpdateReq struct {
	Id    string  `json:"id,omitempty"`
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
	IsMe  bool    `json:"is_me,omitempty"`
}

type UpdateRsp struct {
	Players []PlayerStatus `json:"players"`
}

func update(w http.ResponseWriter, r *http.Request) {
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
		log.Printf("%s (%s) collected from %s", player.name, player.pid, player.sid)
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

type PlayerListEntry struct {
	Name   string `json:"name"`
	Server string `json:"server,omitempty"`
	Score  int32  `json:"score"`
}

func playerList(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		httpError(w, http.StatusMethodNotAllowed)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	now := time.Now()
	results := []PlayerListEntry{}
	for _, player := range players {
		// Omit players who haven't posted in 5 seconds or are dead.
		if player.lastScore == 0 || player.lastUpdate.Before(now.Add(-5*time.Second)) {
			continue
		}

		results = append(results, PlayerListEntry{
			Name:   player.name,
			Server: string(player.sid),
			Score:  player.lastScore,
		})
	}

	sort.Sort(byServerByScore(results))
	JsonRespondPretty(w, results)
}

type byServerByScore []PlayerListEntry

func (p byServerByScore) Len() int {
	return len(p)
}
func (p byServerByScore) Less(i, j int) bool {
	pi := p[i]
	pj := p[j]

	if pi.Server < pj.Server {
		return true
	} else if pi.Server > pj.Server {
		return false
	}

	if pi.Score > pj.Score { // descending
		return true
	} else if pi.Score < pj.Score {
		return false
	}

	return pi.Name < pj.Name
}
func (p byServerByScore) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

func Register(hostname string) {
	http.HandleFunc(hostname+"/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		httpGet("slither-container.html", "text/html; charset=utf-8", w, r)
	})

	http.HandleFunc(hostname+"/getId", getId)
	http.HandleFunc(hostname+"/update", update)
	http.HandleFunc(hostname+"/playerList", playerList)
}
