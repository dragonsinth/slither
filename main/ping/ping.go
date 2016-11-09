package main

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"os"
	"sort"
	"time"
)

type result struct {
	addr string
	dur  time.Duration
}

type byDurationAscending []result

func (p byDurationAscending) Len() int {
	return len(p)
}
func (p byDurationAscending) Less(i, j int) bool {
	return p[i].dur < p[j].dur
}
func (p byDurationAscending) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

// Pings a bunch of host:port to find the fastest connections.
// var out = ""; for (var i in window.sos) { out += window.sos[i].ip + ":" + window.sos[i].po + "\n"; }; console.log(out);
//
func main() {
	scanner := bufio.NewScanner(bufio.NewReader(os.Stdin))
	scanner.Split(bufio.ScanLines)

	results := []result{}
	for scanner.Scan() {
		addr := scanner.Text()
		start := time.Now()
		if conn, err := net.DialTimeout("tcp", addr, 1*time.Second); err != nil {
			log.Printf("addr=%s err=%s\n", addr, err.Error())
		} else {
			dur := time.Now().Sub(start)
			log.Printf("addr=%s time=%s", addr, dur.String())
			results = append(results, result{
				addr: addr,
				dur:  dur,
			})
			conn.Close()
		}
	}

	sort.Sort(byDurationAscending(results))
	for _, r := range results {
		fmt.Printf("addr=%s time=%s\n", r.addr, r.dur.String())
	}
}
