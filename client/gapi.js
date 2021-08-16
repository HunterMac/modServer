// Client ID and API key from the Developer Console
var CLIENT_ID = '643125844926-j2b9rdmvu7fdrs981r9el3s67ae73ktp.apps.googleusercontent.com';
var API_KEY = 'AIzaSyC-q4z98BSwQFWRFtmCopQZbmOcu01SnNI';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function (error) {
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    listFiles();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

function attachPlayslistEvents() {
  document.querySelectorAll('.dir').forEach(function (e) {
    e.addEventListener('click', function (evt) {
      id = evt.target.getAttribute("data-dirurl");
      ui.breadCrumbItems.push({name: evt.target.innerHTML, link: id});
      ui.updateBreadcrumbs();
      listFiles(id);
    }, false);
  });

  document.querySelectorAll('.breadcrumb-link').forEach(function (e) {
    e.addEventListener('click', function (evt) {
      id = evt.target.getAttribute("data-url");
      index = evt.target.getAttribute("data-index");
      ui.selectBreadcrumb(parseInt(index));
      listFiles(id);
    }, false);
  });

  document.querySelectorAll('.song').forEach(function (e) {
    e.addEventListener('click', function (evt) {
      modurl = evt.target.getAttribute("data-modurl");
      var myToken = gapi.auth.getToken();
      headers = [{
        key: 'Authorization',
        value: 'Bearer ' + myToken.access_token
      }]
      loadURL(modurl, headers);
    }, false);
  });
}

/**
 * Print files.
 */
function listFiles(id) {
  if (!id) {
    id = 'root';
  }
  options = {
    'pageSize': 500,
    'includeItemsFromAllDrives': false,
    'spaces': 'drive',
    'fields': "nextPageToken, files(id, name, mimeType, parents)",
    'q': `'${id}' in parents`
  };

  gapi.client.drive.files.list(options)
    .then(function (response) {
      var files = response.result.files;
      if (files && files.length > 0) {
        songs = '';
        files.sort((a, b) => {
          isDirA = a.mimeType === 'application/vnd.google-apps.folder' ? 1 : 0;
          isDirB = b.mimeType === 'application/vnd.google-apps.folder' ? 1 : 0;
          return isDirB - isDirA;
        });
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            songs += `<div><a class="dir" data-dirurl="${file.id}" href="#">${file.name}</a></div>`;
          } else {
            const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            songs += `<div><a class="song" data-modurl="${url}" href="#">${file.name}</a></div>`;
          }
        }
        document.getElementById('songlist').innerHTML = songs;
        attachPlayslistEvents();
      }
    });
}
