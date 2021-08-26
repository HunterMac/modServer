
let gdrive = {
  CLIENT_ID: '643125844926-j2b9rdmvu7fdrs981r9el3s67ae73ktp.apps.googleusercontent.com',
  API_KEY: 'AIzaSyC-q4z98BSwQFWRFtmCopQZbmOcu01SnNI',
  DISCOVERY_DOCS:["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  SCOPES: 'https://www.googleapis.com/auth/drive.readonly',
  
  authorizeButton: document.getElementById('authorize_button'),
  signoutButton: document.getElementById('signout_button'),

  updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      this.authorizeButton.style.display = 'none';
      this.signoutButton.style.display = 'block';
      this.listFiles();
    } else {
      this.authorizeButton.style.display = 'block';
      this.signoutButton.style.display = 'none';
    }
  },

  handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
  },

  handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
  },

  initClient() {
    gapi.client.init({
      apiKey: this.API_KEY,
      clientId: this.CLIENT_ID,
      discoveryDocs: this.DISCOVERY_DOCS,
      scope: this.SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));
  
      // Handle the initial sign-in state.
      this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      this.authorizeButton.onclick = this.handleAuthClick;
      this.signoutButton.onclick = this.handleSignoutClick;
    }.bind(this), function (error) {
      console.error(error);
    });
  },

  handleClientLoad() {
    gapi.load('client:auth2', this.initClient.bind(this));
  },

  songClickCallback(evt) {
    modurl = evt.target.getAttribute("data-path");
    let myToken = gapi.auth.getToken();
    headers = [{
      key: 'Authorization',
      value: 'Bearer ' + myToken.access_token
    }]
    loadURL(modurl, headers);
  },
  
  dirClickCallback(evt) {
    id = evt.target.getAttribute("data-path");
    ui.breadcrumbs.breadCrumbItems.push({name: evt.target.innerHTML, link: id});
    ui.breadcrumbs.updateBreadcrumbs();
    this.listFiles(id);
  },
  
  breadcrumbsClickCallback(evt) {
    id = evt.target.getAttribute("data-url");
    index = evt.target.getAttribute("data-index");
    ui.breadcrumbs.selectBreadcrumb(parseInt(index));
    this.listFiles(id);
  },

  listFiles(id) {
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
          const dirMimeType ='application/vnd.google-apps.folder';
          songs = '';
          files.sort((a, b) => {
            isDirA = a.mimeType === dirMimeType ? 1 : 0;
            isDirB = b.mimeType === dirMimeType ? 1 : 0;
            return isDirB - isDirA;
          });
  
          items = [];
          files.forEach((file) => {
            let path = '';
            let isDir = false;
            if (file.mimeType === dirMimeType) {
              path = file.id;
              isDir = true;
            } else {
              path = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;            
            }
            items.push({
              name: file.name,
              path,
              isDir
            });
          });
          const event = new CustomEvent('updatePlaylist', {detail: {
              items, 
              songClickCallback: this.songClickCallback.bind(this), 
              dirClickCallback: this.dirClickCallback.bind(this), 
              breadcrumbsClickCallback: this.breadcrumbsClickCallback.bind(this)}});
          window.dispatchEvent(event);
        }
      }.bind(this));
  }  

}
