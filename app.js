const express = require('express');
const app = express();
const https = require('https');
const http = require('http');
const myRouter = express.Router();
const request = require('request');

const hostname = '192.168.1.12';
const port = 3000;
const fs = require('fs-extra');
const path = require('path');

let fullPath = `./tests`;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


myRouter.route('/list')

.put(function(req,res){
  const promises = [];
  const fs = require('fs');
  let fullPath = `./tests`;
  const folder = req.body.url;

  if(folder != undefined){
    fullPath = fullPath+folder;
  }

  fs.readdir(fullPath, function(err, items) {
    let files = [];
    if(items != undefined && items.length > 0){
      for (var i=0; i<items.length; i++) {
        const pathFull = fullPath+'/'+items[i]
        const name = items[i];

        const checkDirectory = isDirectory(pathFull)
          .then(result =>{
            return{
              id:i,
              isDirectory:result.isDirectory,
              isFile:result.isFile,
              name:name,
              size:result.size,
              date:result.date,
              dlPath:'http://'+hostname+':'+port+'/'+pathFull.split('./')[1]
            };
          });

          promises.push(checkDirectory);
      }
    }

    Promise.all(promises).then(list => res.json({
      files:list
    }));

  });

  function isDirectory(pathFull) {
    return new Promise(function(resolve, reject) {
      fs.stat(pathFull, function (err, stats) {
        if (err) {
          reject(err);
        }
        else {
          let size = stats.size;
          let date = '';
          if(stats.isFile()){
            if(stats.size > 1073741824){
              size = Math.round(stats.size/1073741824)+' Go'
            }
            else if(stats.size > 1048576){
              size = Math.round(stats.size/1048576)+' Mo'
            }
            else if(stats.size > 1024){
              size = Math.round(stats.size/1024)+' Ko'
            }
            else{
              size = Math.round(stats.size)+' oct'
            }
          }

          resolve({
            isDirectory:stats.isDirectory(),
            isFile:stats.isFile(),
            size:size,
            date:this.cleanDate(stats.mtime),
          });
        }
      });
    })
  }
  cleanDate = (date) =>{
    let newDate = '';
    newDate = date.toString().split(' ');
    newDate = newDate[2]+"/"+newDate[1]+"/"+newDate[3]
    return newDate
  }
})

myRouter.route('/remove')
.put(function(req,res){

  const folder = req.body.file;
  if(req.body.file){
    fs.remove(fullPath+ folder)
    .then(() => {
      res.json({message : "Delete success"});
    })
    .catch(err => {
      console.error(err)
    })
  }



})

myRouter.route('/cut')
.put(function(req,res){
  const oldPath = fullPath+req.body.file;
  const newPath = fullPath+req.body.path;
  if(req.body.file && req.body.path){
    fs.rename(oldPath, newPath, function (err) {
      if (err){
        throw err
      }
      else{
        res.json({message : "File copy"});
      }
    })
  }
})


myRouter.route('/add')
.post(function(req,res){
    var fileToDownload=req.body.fileToDownload;
    var location=fullPath + req.body.url;
    if(req.body.fileToDownload != ''){
      if(req.body.fileToDownload.split(":")[0] == 'https'){
        var file = fs.createWriteStream(location+"/"+fileToDownload.split('/')[fileToDownload.split('/').length-1]);
        var request = https.get(fileToDownload, function(response) {
          response.pipe(file);
        });
      }
      else if (req.body.fileToDownload.split(":")[0] == 'http') {
        var file = fs.createWriteStream(location+"/"+fileToDownload.split('/')[fileToDownload.split('/').length-1]);
        var request = http.get(fileToDownload, function(response) {
          response.pipe(file);
        });
      }

      //  need callback
      res.json({message : "Download ok"});
    }

});

myRouter.route('/add/folder')
.post(function(req,res){
    var foldername=req.body.foldername;
    var location=fullPath + req.body.url;

    if(foldername != ''){
      fs.ensureDir(location+'/'+foldername)
      .then(() => {
        res.json({message : "Dossier creer"});
      })
      .catch(err => {
        res.json({error : err});
      })
    }


});


app.use(myRouter);

app.listen(port, hostname, function(){
	console.log("Mon serveur fonctionne sur http://"+ hostname +":"+port);
});
