const fetch = require("node-fetch");
const { exec } = require("child_process");
const fs = require("fs");
var express = require("express");
var app = express();

let cachedDictionary = {};

function fetchAndSaveVideo(url = "") {
  return new Promise(resolve => {
    fetch(url).then(res => {
      const fileName = `${new Date().getTime()}_video`;

      const fileDestination = fs.createWriteStream(`${fileName}.webm`);

      res.body.pipe(fileDestination);

      fileDestination.on("finish", function() {
        resolve(`${fileName}`);
      });
    });
  });
}

function convertWebmToMP4(filePath) {
  return new Promise(resolve =>
    exec(
      `./ffmpeg -i ${filePath}.webm ${filePath}.mp4`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        resolve();
      }
    )
  );
}

console.log();

app.get("/", async function(req, res) {
  let url = req.query.url;

  if (cachedDictionary[url]) {
    console.log(`Enviando do cache ${url}`);
    console.log();
    let filename = cachedDictionary[url];
    res.sendFile(`${__dirname}/${filename}.mp4`);
  } else {
    console.log(`Baixando ${url}`);
    let filename = await fetchAndSaveVideo(url);

    console.log(`Convertendo ${filename}`);
    await convertWebmToMP4(filename);

    console.log(`Enviando ${filename} e cacheando`);

    cachedDictionary[url] = filename;

    res.sendFile(`${__dirname}/${filename}.mp4`, () => {
      // console.log(`Deletando ${filename}`);
      // fs.unlinkSync(`${__dirname}/${filename}.mp4`);
      // fs.unlinkSync(`${__dirname}/${filename}.webm`);
      // console.log("");
    });
  }
});

app.listen(5050, function() {
  console.log("WebmToMP4 na porta 5050!");
});
