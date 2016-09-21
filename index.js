var fs = require('fs');
var open = require('open');
var remote = require('electron').remote;
var BrowserWindow = remote.BrowserWindow;

var rows = 3;
var columns = 5;
var moviesList = [];
var magnetLinks = {};

createMoviesTable();
loadMovies();

function loadMovies() {
  moviesList = [];
  magnetLinks = {};
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
        var movieInfo = $.parseJSON(jsonhttp.response);
        var img = document.getElementById("movieImg"+id);
        var title = document.getElementById("movieTitle"+id);
        var info = document.getElementById("movieInfo"+id);
        title.innerText = movieInfo["Title"];

        var movieInfoText = "<b>Year</b>: " + movieInfo["Year"] + "<br/>";
        movieInfoText += "<b>Genre</b>: " + movieInfo["Genre"] + "<br/>";
        movieInfoText += "<b>Actors</b>: " + movieInfo["Actors"] + "<br/>";
        movieInfoText += "<b>Rating</b>: " + movieInfo["imdbRating"] + "<br/><br/>";
        movieInfoText += "<b>Plot</b>: " + movieInfo["Plot"];
        info.innerHTML = movieInfoText;

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

        info.appendChild(downloadButton);
        info.appendChild(deleteButton);

        if (movieInfo["Poster"] != "N/A") {
          img.src = movieInfo['Poster'];
        }
        else {
          img.src = "NA.jpg";
        }

        // After all info is ready, present table
        if (id == rows*columns - 1) {
          $("#loading-img").fadeOut(500);
          $("#movies-table-container").fadeIn(1000);
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

function createMoviesTable() {
  var table = document.getElementById('movies-table');
  for (i = 0; i < rows; i++) {
    var tr = document.createElement('tr');
    for (j = 0; j < columns; j++) {
      var id = (i*columns + j).toString();

      var td = document.createElement('td');
      var container = document.createElement("div");
      var article = document.createElement("article");
      var poster = document.createElement('img');
      var captionOverlay = document.createElement("div");
      var title = document.createElement("h1");
      var content = document.createElement("p");


      container.setAttribute("class","container");
      article.setAttribute("class", "caption");
      poster.src = "princess_bell.jpg";
      poster.setAttribute("id", "movieImg" + id);
      poster.setAttribute("class", "caption__media");
      captionOverlay.setAttribute("class", "caption__overlay");
      title.setAttribute("class", "caption__overlay__title");
      title.setAttribute("id", "movieTitle" + id);
      content.setAttribute("class", "caption__overlay__content");
      content.setAttribute("id", "movieInfo" + id);

      title.innerText = "Harry Potter And The Integrated Zone";
      content.innerText = "Harry learns how to set up the Active Directory Domain Name Services Integrated Zone.";

      captionOverlay.appendChild(title);
      captionOverlay.appendChild(content);
      article.appendChild(poster);
      article.appendChild(captionOverlay);
      container.appendChild(article);

      td.appendChild(article);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
}

function populateMoviesTable() {
  for (i = 0; i < rows*columns; i++) {
    fillMoviePoster(moviesList[i], i.toString());
  }
}

function deleteMovie(movieName) {
  fs.appendFile('deletedMovies.txt', movieName + "\n");
  remote.getCurrentWindow().reload();
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
