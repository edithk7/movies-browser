var fs = require('fs');
var open = require('open');
var path = require('path');
var remote = require('electron').remote;
var electronImageResize = require('electron-image-resize');
var BrowserWindow = remote.BrowserWindow;

// build titlebar if not on linux
if (remote.process.platform != "linux") {
  var title_bar = document.createElement("div");
  var title = document.createElement("div");
  var title_bar_btns = document.createElement("div");
  var min_btn = document.createElement("button");
  var max_btn = document.createElement("button");
  var close_btn = document.createElement("button");

  title_bar.setAttribute("id", "title-bar");
  title.setAttribute("id", "title");
  title_bar_btns.setAttribute("id", "title-bar-btns");
  min_btn.setAttribute("id", "min-btn");
  min_btn.setAttribute("class", "button");
  max_btn.setAttribute("id", "max-btn");
  max_btn.setAttribute("class", "button");
  close_btn.setAttribute("id", "close-btn");
  close_btn.setAttribute("class", "button");

  title_bar_btns.appendChild(min_btn);
  title_bar_btns.appendChild(max_btn);
  title_bar_btns.appendChild(close_btn);

  title_bar.appendChild(title);
  title_bar.appendChild(title_bar_btns);

  document.body.appendChild(title_bar);
}

var moviesList = [];
var magnetLinks = {};
var moviesYears = {};
var moviesIds = {};
var movieYear = 0;
var deletedMoviesFile = path.join(__dirname, "cache/deletedMovies.txt");

loadMovies();

function loadMovies() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == this.DONE && this.status == 200) {
      var doc = $.parseXML(xhttp.response);
      $xml = $(doc);
      $titles = $xml.find("title");
      $links = $xml.find("link");

      try {
        fs.statSync(deletedMoviesFile);
      }
      catch(err) {
        fs.writeFileSync(deletedMoviesFile, "");
      }

      var deletedMovies = fs.readFileSync(deletedMoviesFile);
      for (i = 0; i < $titles.length; i++) {
        if (i == 0) continue;
        $movieName = $titles[i].textContent.toLowerCase();
        $movieName = getMovieName($movieName);

        // skip french movies
        if ($movieName.includes("french")) continue; // continue in jquery

        // skip deleted movies
        if (deletedMovies.indexOf($movieName) != -1) continue;

        if (!moviesList.includes($movieName)) {
          moviesList.push($movieName);
          magnetLinks[$movieName] = $links[i].textContent;
          if (movieYear > 1900 && movieYear <= new Date().getFullYear()) {
            moviesYears[$movieName] = movieYear;
          }
          else {
            moviesYears[$movieName] = "";
          }
        }
      }
      populateMoviesTable();
    }
  };
  xhttp.open("GET", "https://thepiratebay.org/rss/top100/207", true);
  xhttp.send();
}

function fillMoviePoster(movieName, id) {
  var jsonhttp = new XMLHttpRequest();
  jsonhttp.onreadystatechange = function() {
    if (this.readyState == this.DONE) {
      if (this.status == 200) {
        var movieInfo = $.parseJSON(jsonhttp.response);

        if (movieInfo["Response"] == "False") return;

        var li = document.createElement("li");
        var rig_cell = document.createElement("div");
        var rig_img = document.createElement('img');
        var rig_overlay = document.createElement("span");
        var rig_text = document.createElement("span");

        moviesIds[movieName] = movieInfo["imdbID"];
        li.setAttribute("id", movieInfo["imdbID"]);
        rig_cell.setAttribute("class", "rig-cell");
        rig_img.setAttribute("class", "rig-img");
        rig_overlay.setAttribute("class", "rig-overlay");
        rig_text.setAttribute("class", "rig-text");

        rig_cell.appendChild(rig_img);
        rig_cell.appendChild(rig_overlay);
        rig_cell.appendChild(rig_text);
        li.appendChild(rig_cell);
        document.getElementById("rig").appendChild(li);

        var movieInfoText = "<b><h1>" + movieInfo["Title"] + "</h1></b>";
        movieInfoText += "<b>Year</b>: " + movieInfo["Year"] + "<br/>";
        movieInfoText += "<b>Genre</b>: " + movieInfo["Genre"] + "<br/>";
        movieInfoText += "<b>Actors</b>: " + movieInfo["Actors"] + "<br/>";
        movieInfoText += "<b>Rating</b>: " + movieInfo["imdbRating"] + "<br/><br/>";
        movieInfoText += "<b>Plot</b>: " + movieInfo["Plot"];

        if (movieInfoText.length > 400) {
          rig_text.style.fontSize = "14px";
        }

        rig_text.innerHTML = movieInfoText;

        var deleteButton = document.createElement("input");
        var downloadButton = document.createElement("input");

        deleteButton.setAttribute("type", "image");
        deleteButton.src = path.join(__dirname, "img/delete.png");
        deleteButton.setAttribute("height", "50px");
        deleteButton.setAttribute("width", "50px");
        deleteButton.setAttribute("class", "delete_button");
        deleteButton.addEventListener('click', function() {
          deleteMovie(movieName);
        });

        downloadButton.setAttribute("type", "image");
        downloadButton.src = path.join(__dirname, "img/download.png");
        downloadButton.setAttribute("height", "50px");
        downloadButton.setAttribute("width", "50px");
        downloadButton.setAttribute("class", "download_button");
        downloadButton.addEventListener('click', function() {
          downloadMovie(movieName);
        });

        rig_overlay.appendChild(downloadButton);
        rig_overlay.appendChild(deleteButton);

        if (movieInfo["Poster"] != "N/A") {
          var cachedImage = path.join(__dirname, "cache/" + movieName + '.jpg');

          // download image if needed
          fs.stat(cachedImage, function(err, stat) {
            if(err != null) {
              rig_img.src = movieInfo['Poster'];
              electronImageResize({
                url: movieInfo['Poster'],
                width: 300,
                height: 445
              }).then(img => {
                fs.writeFile(cachedImage, img.toJpeg(100), (err) => {
                  if (err) throw err;
                });
              })
            }
            else {
              rig_img.src = cachedImage;
            }
          });
        }
        else {
          rig_img.src = path.join(__dirname, "img/NA.jpg");
        }

        // After all info is ready, present table
        if (id == moviesList.length - 1) {
          $("#loading-img").fadeOut(500);
          $("#rig").fadeIn(1000);
        }
      }
      else {
        alert("error");
      }
    }
  }
  var movieSearchString = movieName.replace(/\s/g, '+');
  movieSearchString = "http://www.omdbapi.com/?t="+movieSearchString+"&y="+moviesYears[movieName]+"&plot=short&r=json";
  jsonhttp.open("GET", movieSearchString, true);
  jsonhttp.send();
}

function getMovieName(movieString) {
  movieYear = 0;
  movieString = movieString.replace(/\./g, ' ');
  movieString = movieString.replace(/:/g, '');
  var re = /\d{4}/;
  var match = re.exec(movieString);
  if (match != null) {
    movieYear = match[0];
    var yearIndex = movieString.indexOf(match[0]);
    return movieString.substring(0, yearIndex-1).trim();
  }
  else {
    return movieString;
  }
}

function populateMoviesTable() {
  var moviesContainer = document.createElement("ul");
  moviesContainer.setAttribute("id", "rig");
  $("#main-section").append(moviesContainer);
  for (i = 0; i < moviesList.length; i++) {
    fillMoviePoster(moviesList[i], i);
  }
}

function deleteMovie(movieName) {
  fs.appendFile(deletedMoviesFile, movieName + "\n");
  $("#"+moviesIds[movieName]).hide('slow', function(){ $("#"+moviesIds[movieName]).remove(); });
}

function downloadMovie(movieName) {
  var link = magnetLinks[movieName];
  open(link);
}

// Bind delete/download/min/max/close buttons
(function () {
  function init() {
    document.getElementById("min-btn").addEventListener("click", function (e) {
      var window = BrowserWindow.getFocusedWindow();
      window.minimize();
    });

    document.getElementById("max-btn").addEventListener("click", function (e) {
      var window = BrowserWindow.getFocusedWindow();
      if (!window.isMaximized()) {
        window.maximize();
      } else {
        window.unmaximize();
      }
    });

    document.getElementById("close-btn").addEventListener("click", function (e) {
      var window = BrowserWindow.getFocusedWindow();
      window.close();
    });
  };


  document.onreadystatechange = function () {
    if (document.readyState == "complete") {
      init();
    }
  };
})();
