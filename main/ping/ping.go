package main

import (
	"bufio"
	"fmt"
	"log"
	"net"
	"os"
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

type byAveDurationAscending []result

func (p byAveDurationAscending) Len() int {
	return len(p)
}
func (p byAveDurationAscending) Less(i, j int) bool {
	return p[i].ave() < p[j].ave()
}
func (p byAveDurationAscending) Swap(i, j int) {
	p[i], p[j] = p[j], p[i]
}

// Pings a bunch of host:port to find the fastest connections.
// var out = ""; for (var i in window.sos) { out += window.sos[i].ip + ":" + window.sos[i].po + "\n"; }; console.log(out);
//
func main() {
	scanner := bufio.NewScanner(bufio.NewReader(os.Stdin))
	scanner.Split(bufio.ScanLines)

	var wg sync.WaitGroup

	chResult := make(chan result)
	for scanner.Scan() {
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
		}(scanner.Text())
	}

	results := []result{}
	go func() {
		for r := range chResult {
			results = append(results, r)
		}
	}()

	wg.Wait()
	close(chResult)

	sort.Sort(byAveDurationAscending(results))
	for _, r := range results {
		fmt.Printf("addr=%s min=%s max=%s ave=%s succ=%d fail=%d\n", r.addr, r.min, r.max, r.ave(), r.succ, r.fail)
	}
}
