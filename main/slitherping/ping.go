package main

import (
	"log"
	"net"
	"sort"
	"sync"
	"time"
)

type result struct {
	addr            string
	min, max, total time.Duration
	succ, fail      int
}

func (r *result) ave() time.Duration {
	return r.total / time.Duration(r.succ)
}

type byQualityDesc []result

func (p byQualityDesc) Len() int {
	return len(p)
}
func (p byQualityDesc) Less(i, j int) bool {
	if p[i].fail != p[j].fail {
		return p[i].fail < p[j].fail
	}
	return p[i].ave() < p[j].ave()
}
func (p byQualityDesc) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

// Pings a bunch of host:port to find the fastest connections.
func ping(servers []string) []result {
	var wg sync.WaitGroup

	chResult := make(chan result)
	for _, server := range servers {
		wg.Add(1)
		go func(addr string) {
			defer wg.Done()
			r := result{
				addr: addr,
			}
			for i := 0; i < 5; i++ {
				start := time.Now()
				if conn, err := net.DialTimeout("tcp", addr, 1*time.Second); err != nil {
					log.Printf("addr=%s err=%s\n", addr, err.Error())
					r.fail++
				} else {
					dur := time.Since(start)
					conn.Close()
					if r.succ == 0 || dur < r.min {
						r.min = dur
					}
					if r.succ == 0 || dur > r.max {
						r.max = dur
					}
					r.total += dur
					r.succ++
				}
			}
			chResult <- r
		}(server)
	}

	results := []result{}
	resCh := make(chan struct{})
	go func() {
		for r := range chResult {
			results = append(results, r)
		}
		close(resCh)
	}()

	wg.Wait()
	close(chResult)
	<-resCh

	sort.Sort(byQualityDesc(results))
	return results
}
