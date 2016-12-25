package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
)

var scriptRe = regexp.MustCompile(`<script type='text/javascript' src='(/s/game\d+.js)'></script>`)
var sosRe = regexp.MustCompile(`getData\("(/i\d+.txt)"`)

func getSlitherScriptUrlFromPage(pageUrl string) (string, error) {
	return scrapeContent(pageUrl, scriptRe)
}

func getSosUrlFromScript(scriptUrl string) (string, error) {
	return scrapeContent(scriptUrl, sosRe)
}

func scrapeContent(url string, re *regexp.Regexp) (string, error) {
	body, err := fetchContent(url)
	if err != nil {
		return "", err
	}
	matches := re.FindStringSubmatch(body)
	if len(matches) != 2 {
		return "", fmt.Errorf("wrong number of matches; expected 2 found %+v", matches)
	}
	return matches[1], nil
}

func fetchContent(url string) (string, error) {
	rsp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	if rsp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("returned non-200 status: %d", rsp.StatusCode)
	}
	data, err := ioutil.ReadAll(rsp.Body)
	if err != nil {
		return "", err
	}
	return string(data), nil
}
