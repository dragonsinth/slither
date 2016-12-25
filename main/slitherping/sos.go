package main

import "fmt"

var defaultSosData = `amopagyffelsarzubipwhkaktxijrqdcjqypxszgnvfiyirvghqsbahownvqxeltdgwgijuaszayfmultovcjteeuenrcdmoywdksjrmtahsvcstmtwgcuwubiqhpkryfovaqajnyzhguszgofnipwdmgyoyabmskrtqxemdlgnublxwmwfjuvdcrovckbjelszgtukudhstcepmtaizhcjqxevsisuvgmelokrygxfahovkrqgnqejtpzbipwevdyfmtasoflochqqezgnuctbwdkrbjmdjmafpsuxelsarzubipwnkbhkydnjydcjqypxszgnyfizfiwbloquahownvqxeluagxdguzjllayfmultovcjqhevbesxhdsywdksjrmtahsbctzcqvfhgwubiqhpkryfncarxaotcjnmszgofnipwdqwypvymrbeftqxemdlgnubltwnvryosdgpovckbjelszjqudtpwmmggnmtaizhcjqxfpsbrnuklejdkrygxfahoveqqzplsimycjipwevdyfmthooxcoqgfozzgnuctbwdkrcrmvlhoekrbyelsarzubipymktjfmccrzecjqypxszgnvoirhdkaffzuahownvqxelscgpfbiyemsbyfmultovcjdhenentafdxrwdksjrmtahodcuajjyyijpubiqhpkryfqeasyhhwwasnszgofnipwdogyqzunvuvmtqxemdlgnubjswomebptggrovckbjelszjyumsbbqqbdhmtaizhcjqxhaskqzzootznkrygxfahovkxqinqvhhryjipwevdyfmtdioylotffpaignuctbwdkrbomwjmrddnuhelsarzubipzskuhkpbblwfcjqypxszgnukisfinzzjueahownvqxelffgqaixdfmuryfmultovcjymepfajxfiqxwdksjrmtahwjcndyhvdgsoubiqhpkryfztalqgrsscquszgofnipwduxyroepqqzqsqxemdlgnubsvwpmcnooyiiovckbjelszqquntyzfqzhnmtaizhcjqxeaserwxdoxglkrygxfahoveoqcpuvbmvdkipwevdyfmtawoanstzktcignuctbwdkrghmylqrxirbyelsarzubipzskwjopvgpzxcjqypxszgnhjiuxswdhgstahownvqxelckgavqubfeqzyfmultovcjbzeytoszdcoqwdksjrmtahzacwweqoydmpubiqhpkryftwanucomwclnszgofnipwdncylsamkuamtqxemdlgnubruwjqykisyjjovckbjelsziuuhowigqvkhmtaizhcjqxpusftabkrdymkrygxfahovqkqeryzipnjkipwevdyfmtoloc`

func loadSos(b string) []string {
	result := []string{}

	var c, f, q, h int
	u := []int{}
	v := []int{}
	x := []int{}
	B := []int{}

	for e := 1; e < len(b); e++ {
		w := (int(b[e]) - 97 - h) % 26
		if 0 > w {
			w += 26
		}
		q *= 16
		q += w
		h += 7
		if 1 == c {
			if 0 == f {
				u = append(u, q)
				if 4 == len(u) {
					f++
				}
			} else if 1 == f {
				v = append(v, q)
				if 3 == len(v) {
					f++
				}
			} else if 2 == f {
				x = append(x, q)
				if 3 == len(x) {
					f++
				}
			} else if 3 == f && func() bool {
				B = append(B, q)
				return true
			}() && 1 == len(B) {
				w := 0
				for f := 0; f < len(v); f++ {
					w *= 256
					w += v[f]
				}
				result = append(result, fmt.Sprintf("%d.%d.%d.%d:%d", u[0], u[1], u[2], u[3], w))
				u = []int{}
				v = []int{}
				x = []int{}
				B = []int{}
				f = 0
			} else {
				panic("shouldn't get here")
			}
			c = 0
			q = 0
		} else {
			c++
		}
	}

	return result
}
