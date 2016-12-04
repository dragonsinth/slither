# dragonslither

## extension for slither.io

Chrome extension that enables enhanced teamplay on http://slither.io.  See your friends' map location and score in game. Based on the slither-io.com mod, but I stripped out a lot of things I didn't like and streamlined the teamplay. :)

### Features

- See friends' map location and score!
- Zoom in and out with the scroll wheel or `N`/`M`.  Press `X` to reset zoom.
- Press `Q` to die.
- Press `H` to show/hide help.

### Installing

- First, install the [Slither Friends extension](https://chrome.google.com/webstore/detail/%F0%9F%90%8D-slither-friends-by-cre/acmckabjkfogakcfhckahnpmbjfncafn).  Slither Friends is required for teamplay to work.
- Then install [dragon-slither](https://chrome.google.com/webstore/detail/dragon-slither/jkedfiaoijngpipbgkojaielgklfcgcn).

### Hacking
- Clone this repository to your local machine, `git clone https://github.com/dragonsinth/slither`
- Go to chrome://extensions/ and enabled `Developer mode`.
- Click `Load unpacked extension...` and select the directory named `extension` in your cloned git repo.

### Running

You and your friends will need to use the same Slither Friends id.  The first player in your party can leave the Friends Id field blank and just start playing.  In a few moments, the Friends id will be displayed.  All other players in your party should enter this Id when joining the game to get placed on the same server.  Your friends names and scores will be displayed in the bottom left, and colored dots will appear on your map to show their locations.

## slither container

Separately from the extension, [slither-container.html](slither-container.html) is a simple web page that runs slither.io in a square container, so that you always have maximum visibity.  There's also a fullscreen button to put the game in true fullscreen.

Hosted at http://slither.dragonsinth.com/
