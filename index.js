var rows = 5;
var columns = 6;
var moviesList = [];
createMoviesTable();
loadMovies();

function loadMovies(rows, columns) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == this.DONE) {
      if (this.status == 200) {
        // Get xml response
        var doc = $.parseXML(xhttp.response);
        $xml = $(doc);
        $title = $xml.find("title");

        // iterate movies
        $($title).each(function(index, value) {
          if (index > 0) {
            $movieName = value.textContent.toLowerCase();
            if ($movieName.includes("french")) return; // continue in jquery
            $movieName = getMovieName($movieName);
            if (!moviesList.includes($movieName)) {
              moviesList.push($movieName);
            }
          }
        });
      }
      else {
        moviesList.append("failed");
      }
      populateMoviesTable();
    }
  }
  xhttp.open("GET", "https://thepiratebay.org/rss/top100/207", true);
  xhttp.send();
}

function fillMoviePoster(movieName, id) {
  var jsonhttp = new XMLHttpRequest();
  jsonhttp.onreadystatechange = function() {
    if (this.readyState == this.DONE) {
      if (this.status == 200) {
        var movieInfo = $.parseJSON(jsonhttp.response);
        var img = document.getElementById(id);
        img.src = movieInfo['Poster'];
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
      var td = document.createElement('td');
      var img = document.createElement('img');
      img.src = "selena.jpg";
      img.setAttribute("id", "movieImg" + (i*(rows + 1) + j).toString());
      td.appendChild(img);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
}

function populateMoviesTable() {
  for (i = 0; i < rows*columns; i++) {
    fillMoviePoster(moviesList[i], "movieImg" + i);
  }
}

// Bind min/max/close buttons
(function () {

  var remote = require('electron').remote;
  var BrowserWindow = remote.BrowserWindow;

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
