var fs = require('fs');
var open = require('open');
var remote = require('electron').remote;
const electronImageResize = require('electron-image-resize');
var BrowserWindow = remote.BrowserWindow;

var moviesList = [];
var magnetLinks = {};

loadMovies();

function loadMovies() {
  moviesList = [];
  magnetLinks = {};
  $("#movies-container").remove();

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == this.DONE && this.status == 200) {
      var doc = $.parseXML(xhttp.response);
      $xml = $(doc);
      $titles = $xml.find("title");
      $links = $xml.find("link");

      var deletedMovies = fs.readFileSync("deletedMovies.txt");
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
        var container = document.createElement("div");
        var article = document.createElement("article");
        var poster = document.createElement('img');
        var captionOverlay = document.createElement("div");
        var title = document.createElement("h1");
        var content = document.createElement("p");

        container.setAttribute("class","container");
        article.setAttribute("class", "caption");
        poster.setAttribute("class", "caption__media");
        captionOverlay.setAttribute("class", "caption__overlay");
        content.setAttribute("class", "caption__overlay__content");

        captionOverlay.appendChild(content);
        article.appendChild(poster);
        article.appendChild(captionOverlay);
        container.appendChild(article);

        var movieInfo = $.parseJSON(jsonhttp.response);

        var movieInfoText = "<b><h1>" + movieInfo["Title"] + "</h1></b>";
        movieInfoText += "<b>Year</b>: " + movieInfo["Year"] + "<br/>";
        movieInfoText += "<b>Genre</b>: " + movieInfo["Genre"] + "<br/>";
        movieInfoText += "<b>Actors</b>: " + movieInfo["Actors"] + "<br/>";
        movieInfoText += "<b>Rating</b>: " + movieInfo["imdbRating"] + "<br/><br/>";
        movieInfoText += "<b>Plot</b>: " + movieInfo["Plot"];
        content.innerHTML = movieInfoText;

        var deleteButton = document.createElement("input");
        var downloadButton = document.createElement("input");

        deleteButton.setAttribute("type", "image");
        deleteButton.src = "delete.png";
        deleteButton.setAttribute("height", "50px");
        deleteButton.setAttribute("width", "50px");
        deleteButton.setAttribute("class", "delete_button");
        deleteButton.addEventListener('click', function() {
          deleteMovie(movieName);
        });

        downloadButton.setAttribute("type", "image");
        downloadButton.src = "download.png";
        downloadButton.setAttribute("height", "50px");
        downloadButton.setAttribute("width", "50px");
        downloadButton.setAttribute("class", "download_button");
        downloadButton.addEventListener('click', function() {
          downloadMovie(movieName);
        });

        content.appendChild(downloadButton);
        content.appendChild(deleteButton);

        if (movieInfo["Poster"] != "N/A") {
          var cachedImage = movieName + '.jpg';

          // download image if needed
          fs.stat(cachedImage, function(err, stat) {
            if(err != null) {
              poster.src = movieInfo["Poster"];
              electronImageResize({
                url: movieInfo['Poster'],
                width: 300,
                height: 445
              }).then(img => {
                // save it as a png file
                fs.writeFileSync(movieName+'.jpg', img.toJpeg(100));
              })
            }
            else {
              poster.src = cachedImage;
            }
          });
        }
        else {
          poster.src = "NA.jpg";
        }

        document.getElementById("movies-container").appendChild(container);

        // After all info is ready, present table
        if (id == moviesList.length - 1) {
          $("#loading-img").fadeOut(500);
          $("#movies-container").fadeIn(1000);
        }
      }
      else {
        alert("error");
      }
    }
  }
  var movieSearchString = movieName.replace(/\s/g, '+');
  movieSearchString = "http://www.omdbapi.com/?t="+movieSearchString+"&y=&plot=short&r=json";
  jsonhttp.open("GET", movieSearchString, true);
  jsonhttp.send();
}

function getMovieName(movieString) {
  movieString = movieString.replace(/\./g, ' ');
  var re = /\d{4}/;
  var match = re.exec(movieString);
  if (match != null) {
    var yearIndex = movieString.indexOf(match[0]);
    return movieString.substring(0, yearIndex-1).trim();
  }
  else {
    return movieString;
  }
}

function populateMoviesTable() {
  var moviesContainer = document.createElement("div");
  moviesContainer.setAttribute("id", "movies-container");
  $("#main-section").append(moviesContainer);
  for (i = 0; i < moviesList.length; i++) {
    fillMoviePoster(moviesList[i], i);
  }
}

function deleteMovie(movieName) {
  fs.appendFile('deletedMovies.txt', movieName + "\n");
  $("#loading-img").fadeIn();
  $("#movies-container").fadeOut();
  setTimeout(function() { loadMovies(); }, 750);
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
