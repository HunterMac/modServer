const express = require('express');
const fs = require('fs');
const config = require('./config.js');
const app = express();

//Mod folder for static access
app.use('/', express.static(config.folder));
app.use(express.static('client'));

app.get('/modlist/*', (req, res) => {
  path = req.params[0];
  console.log(path);

  result = [];
  fs.readdirSync(config.folder + '/' + path).forEach(name => {
    relativePath = path + '/' + name;
    isDir = fs.statSync(config.folder + '/' + relativePath).isDirectory();
    item = {
      name, relativePath, isDir
    };

    console.log(item);
    result.push(item);
    
  });
  res.send(JSON.stringify(result));
})

app.listen(config.port, () => {
  console.log(`Example app listening at http://localhost:${config.port}`);
})

