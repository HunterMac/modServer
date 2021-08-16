window['libopenmpt'] = {};

libopenmpt.locateFile = function (filename) {
  return filename;
};
libopenmpt.onRuntimeInitialized = function () {
  var player;
  var seekBarAvalailable = true;

  function init() {
    if (player == undefined) {
      player = new ChiptuneJsPlayer(new ChiptuneJsConfig(-1));
    }
    else {
      player.stop();
      playPauseButton();
    }
    setInterval(updateProgress, 500);
  }

  function attachPlayslistEvents() {
    document.querySelectorAll('.dir').forEach(function (e) {
      e.addEventListener('click', function (evt) {
        dir = evt.target.getAttribute("data-dirurl");
        updatePlaylist(dir);
      }, false);
    });
    document.querySelectorAll('.song').forEach(function (e) {
      e.addEventListener('click', function (evt) {
        modurl = evt.target.getAttribute("data-modurl");
        loadURL(modurl);
      }, false);
    });
  }

  async function updatePlaylist(path) {
    if (!path.startsWith('/')) {
      path = encodeURI(`/${path}`);
    }
    url = `/modlist${path}`;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      url += `?code=${code}`;
    }
    let response = await fetch(url);
    let songs = '';
    if (response.ok) {
      let jsonResponse = await response.json();
      if (path !== '/') {
        songs += '<div><a class="dir dir-top" data-dirurl="" href="#">.</a></div>';
        parentDir = path.substr(0, path.lastIndexOf('/'));
        songs += `<div><a class="dir dir-top" data-dirurl="${parentDir}" href="#">..</a></div>`;
      }
      jsonResponse.sort((a, b) => {
        isDirA = a.isDir ? 1 : 0;
        isDirB = b.isDir ? 1 : 0;
        return isDirB - isDirA;
      });
      updatePlaylistItems(jsonResponse);
      jsonResponse.forEach((item) => {
        let relativePath = item.relativePath.replace(/#/g, '%23');
        if (item.isDir) {
          songs += `<div><a class="dir" data-dirurl="${relativePath}" href="#">${item.name}</a></div>`;
        } else {
          songs += `<div><a class="song" data-modurl="${relativePath}" href="#">${item.name}</a></div>`;
        }
      });
      if (songs !== '') {
        document.getElementById('songlist').innerHTML = songs;
        attachPlayslistEvents();
      }
      console.log('Playlist Updated.')
    } else {
      console.error("HTTP-Error: " + response.status);
    }
  }

  function updatePlaylistItems(jsonItems) {
    let songs = '';
    jsonItems.forEach((item) => {
      let relativePath = item.relativePath.replace(/#/g, '%23');
      if (item.isDir) {
        songs += `<div><a class="dir" data-dirurl="${relativePath}" href="#">${item.name}</a></div>`;
      } else {
        songs += `<div><a class="song" data-modurl="${relativePath}" href="#">${item.name}</a></div>`;
      }
    });
    document.getElementById('songlist').innerHTML = songs;
  }

  function setMetadata(filename) {
    var metadata = player.metadata();
    if (metadata['title'] != '') {
      document.getElementById('title').innerHTML = metadata['title'];
    }
    else {
      document.getElementById('title').innerHTML = filename;
    }

    if (metadata['artist'] != '') {
      document.getElementById('artist').innerHTML = '<br />' + metadata['artist'];
    }
    else {
      document.getElementById('artist').innerHTML = '';
    }
    updateDuration();
  }

  function initSeekbar() {
    const seekbar = document.querySelector('#seekbar');
    seekbar.setAttribute('max', player.duration());
    seekbar.value = 0;
  }

  function afterLoad(path, buffer) {
    player.play(buffer);
    setMetadata(path);
    pausePauseButton();
    initSeekbar();
  }

  function loadURL(path, headers) {
    init();
    player.load(path, afterLoad.bind(this, path), headers);
  }

  function pauseButton() {
    player.togglePause();
    switchPauseButton();
  }

  function switchPauseButton() {
    var button = document.getElementById('pause')
    if (button) {
      button.id = "play_tmp";
    }
    button = document.getElementById('play')
    if (button) {
      button.id = "pause";
    }
    button = document.getElementById('play_tmp')
    if (button) {
      button.id = "play";
    }
  }

  function playPauseButton() {
    var button = document.getElementById('pause')
    if (button) {
      button.id = "play";
    }
  }

  function pausePauseButton() {
    var button = document.getElementById('play')
    if (button) {
      button.id = "pause";
    }
  }

  function seek(event) {
    player.seek(event.target.value);
  }

  function updateProgress() {
    if (seekBarAvalailable) {
      document.getElementById('seekbar').value = player.getPosition();
    }
  }

  function updateDuration() {
    var sec_num = player.duration();
    var minutes = Math.floor(sec_num / 60);
    var seconds = Math.floor(sec_num % 60);
    if (seconds < 10) { seconds = '0' + seconds; }
    document.getElementById('duration').innerHTML = minutes + ':' + seconds;
    document.getElementById('seekbar').max = sec_num;
  }

  //updatePlaylist('');

  var fileaccess = document.querySelector('*');
  fileaccess.ondrop = function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    init();

    player.load(file, afterLoad.bind(this, path));
  }

  fileaccess.ondragenter = function (e) { e.preventDefault(); }
  fileaccess.ondragover = function (e) { e.preventDefault(); }

  document.querySelectorAll('.song').forEach(function (e) {
    e.addEventListener('click', function (evt) {
      modurl = evt.target.getAttribute("data-modurl");
      loadURL(modurl);
    }, false);
  });

  document.querySelector('input[name=files]').addEventListener('change', function (evt) {
    loadURL(evt.target.files[0]);
  });

  document.querySelector('input[name=submiturl]').addEventListener('click', function () {
    var exturl = document.querySelector('input[name=exturl]');
    modurl = exturl.value;
    loadURL(modurl);
    exturl.value = null;
  });

  document.querySelector('#play').addEventListener('click', pauseButton, false);
  var seekBar = document.querySelector('#seekbar');
  seekBar.addEventListener('change', seek, false);
  seekBar.addEventListener("mousedown", () => seekBarAvalailable = false);
  seekBar.addEventListener("mouseup", () => seekBarAvalailable = true);

  window.loadURL = loadURL;
};

// ui = {
//   breadCrumbItems: [{
//     name: '🖿', 
//     link: 'root'
//   }],

//   updateBreadcrumbs: () => {
//     links = '';
//     for(i=0; i< ui.breadCrumbItems.length ; i++) {
//       item = ui.breadCrumbItems[i];
//       links += `<a class="breadcrumb-link" data-url="${item.link}" data-index="${i}" href="#">${item.name} </a><span>> </span>`;
//     }
//     document.getElementById('breadcrumbs').innerHTML = links;
//   },

//   selectBreadcrumb: (index) => {
//     ui.breadCrumbItems = ui.breadCrumbItems.slice(0, index + 1);
//     ui.updateBreadcrumbs();
//   }
// };

class UserInterface {
  breadCrumbItems= [{
    name: '🖿', 
    link: 'root'
  }];

  updateBreadcrumbs() {
    let links = '';
    for(let i=0; i< this.breadCrumbItems.length ; i++) {
      let item = this.breadCrumbItems[i];
      links += `<a class="breadcrumb-link" data-url="${item.link}" data-index="${i}" href="#">${item.name} </a><span>> </span>`;
    }
    document.getElementById('breadcrumbs').innerHTML = links;
  }

  selectBreadcrumb(index) {
    this.breadCrumbItems = this.breadCrumbItems.slice(0, index + 1);
    this.updateBreadcrumbs();
  }
};

window.addEventListener('DOMContentLoaded', (event) => {
  window.ui = new UserInterface();
  ui.updateBreadcrumbs();
});


