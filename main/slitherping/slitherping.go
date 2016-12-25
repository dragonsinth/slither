package main

import (
	"fmt"
	"os"
)

func main() {
	scriptUrl, err := getSlitherScriptUrlFromPage("http://slither.io/")
	if err != nil {
		fmt.Fprintf(os.Stderr, "error finding slither script in outer page, using default: %s", err)
		scriptUrl = `/s/game144000.js`
	}

	sosUrl, err := getSosUrlFromScript("http://slither.io" + scriptUrl)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error finding sos url in script, using default: %s", err)
		sosUrl = `/i33628.txt`
	}

	sosData, err := fetchContent("http://slither.io" + sosUrl)
	if err != nil {
		fmt.Fprintf(os.Stderr, "fetching sos data, using default: %s", err)
		sosData = defaultSosData
	}

	servers := loadSos(sosData)
	results := ping(servers)
	for _, r := range results {
		fmt.Printf("addr=%s min=%s max=%s ave=%s succ=%d fail=%d\n", r.addr, r.min, r.max, r.ave(), r.succ, r.fail)
	}

}
