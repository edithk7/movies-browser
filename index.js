var fs = require('fs');
var open = require('open');
var path = require('path');
var remote = require('electron').remote;
var electronImageResize = require('electron-image-resize');
var BrowserWindow = remote.BrowserWindow;

var moviesList = [];
var magnetLinks = {};
var moviesYears = {};
var moviesIds = {};
var movieYear = 0;
var deletedMoviesFile = path.join(__dirname, "cache/deletedMovies.txt");
var firstMovieLoaded = false;

// if on linux, hide title bar
if (remote.process.platform == "linux") {
  $("#title-bar").remove();
}
else {
  document.getElementById("main-section").style.height = "96vh";
}

loadMovies("HD");
loadMovies("normal");

function loadMovies(moviesQuality) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    console.log("PB state: " + this.readyState);
    if (this.readyState == this.DONE) {
      if (this.status == 200) {
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

          // filter low quality movies
          if (moviesQuality == "normal") {
              if (!($movieName.includes("brrip") || $movieName.includes("hdrip") || $movieName.includes("dvdrip") || $movieName.includes("bdrip") || $movieName.includes("webrip") || $movieName.includes("blueray")))
              {
                continue;
              }
          }

          $movieName = getMovieName($movieName);

          // skip french movies
          if ($movieName.includes("french")) continue;

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
        if (moviesQuality == "normal") {
            populateMoviesTable();
        }
      }
      else {
        alert("can't contact the pirate bay :(");
        var window = BrowserWindow.getFocusedWindow();
        window.close();
      }
    }
  };
  if (moviesQuality == "HD") {
      xhttp.open("GET", "https://thepiratebay.org/rss/top100/207", true);
  }
  else if (moviesQuality == "normal") {
    xhttp.open("GET", "https://thepiratebay.org/rss/top100/201", true);
  }
  xhttp.send();
}

function fillMoviePoster(movieName, id) {
  var jsonhttp = new XMLHttpRequest();
  jsonhttp.onreadystatechange = function() {
    console.log(id + "/" + (moviesList.length - 1) + "(" + movieName + ") state: " + this.readyState);
    if (this.readyState == this.DONE) {
      if (this.status == 200) {
        var movieInfo = $.parseJSON(jsonhttp.response);

        if (movieInfo["Response"] == "False") {
          console.log("***can't find movie " + movieName + "***");
          return;
        }

        var li = document.createElement("li");
        var rig_cell = document.createElement("div");
        var rig_img = document.createElement('img');
        var rig_overlay = document.createElement("span");
        var rig_text = document.createElement("span");

        moviesIds[movieName] = movieInfo["imdbID"];
        li.setAttribute("id", movieInfo["imdbID"]);
        li.style.display = "none";
        rig_cell.setAttribute("class", "rig-cell");
        rig_img.setAttribute("class", "rig-img");
        rig_overlay.setAttribute("class", "rig-overlay");
        rig_text.setAttribute("class", "rig-text");

        rig_cell.appendChild(rig_img);
        rig_cell.appendChild(rig_overlay);
        rig_cell.appendChild(rig_text);
        li.appendChild(rig_cell);
        document.getElementById("rig").appendChild(li);

        var movieInfoText = "<b>" + movieInfo["Title"] + "</b><br/><br/>";
        movieInfoText += "<b>Year</b>: " + movieInfo["Year"] + "<br/>";
        movieInfoText += "<b>Genre</b>: " + movieInfo["Genre"] + "<br/>";
        movieInfoText += "<b>Actors</b>: " + movieInfo["Actors"] + "<br/>";
        movieInfoText += "<b>Rating</b>: " + movieInfo["imdbRating"] + "<br/><br/>";
        movieInfoText += "<b>Plot</b>: " + movieInfo["Plot"];

        if (movieInfoText.length > 400) {
          rig_text.style.fontSize = "15px";
        }

        rig_text.innerHTML = movieInfoText;
        rig_text.addEventListener('click', function() {
          getMovieReviews(movieInfo["imdbID"]);
        });

        var deleteButton = document.createElement("input");
        var downloadButton = document.createElement("input");

        deleteButton.setAttribute("type", "image");
        deleteButton.src = path.join(__dirname, "img/delete.png");
        deleteButton.setAttribute("class", "delete_button");
        deleteButton.addEventListener('click', function() {
          deleteMovie(movieName);
        });

        downloadButton.setAttribute("type", "image");
        downloadButton.src = path.join(__dirname, "img/download.png");
        downloadButton.setAttribute("class", "download_button");
        downloadButton.addEventListener('click', function() {
          downloadMovie(movieName);
        });

        rig_overlay.appendChild(downloadButton);
        rig_overlay.appendChild(deleteButton);

        var cachedImage = path.join(__dirname, "cache/" + movieName + '.jpg');

        // download image if needed
        fs.stat(cachedImage, function(err, stat) {
          if(err != null) {
            if (movieInfo['Poster'] != "N/A") {
              rig_img.src = movieInfo['Poster'];
            }
            else {
              rig_img.src = path.join(__dirname, "img/NA.jpg");
            }
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

        if (!firstMovieLoaded) {
          firstMovieLoaded = true;
          $("#loading-img").fadeOut();
        }
        $("#"+movieInfo["imdbID"]).fadeIn(2000);
      }
      else {
        alert("error: status for " + movieName + " is " + this.status);
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
  movieString = movieString.replace(/&/g, 'and');
  movieString = movieString.replace(/;/g, '');
  movieString = movieString.replace(/\//g, '');
  movieString = movieString.replace(/!/g, '');
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

function openImdb(id) {
  open("http://www.imdb.com/title/"+id+"/");
}

document.getElementById("reviews-overlay-close").addEventListener('click', function() {
  $("#reviews-overlay").fadeOut();
});
function getMovieReviews(movieId) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == this.DONE) {
      if (this.status == 200) {
        var reviewsPageText = xhttp.responseText;
        reviewsPageText = stripMovieReviewsGarbage(reviewsPageText);
        document.getElementById("reviews").innerHTML = reviewsPageText;
        $("#reviews-overlay").fadeIn();
        document.getElementById("reviews-overlay").scrollTop = 0;
      }
      else {
        alert("can't contact imdb :(");
      }
    }
  };
  xhttp.open("GET", "http://www.imdb.com/title/"+movieId+"/reviews", true);
  xhttp.send();
}

function stripMovieReviewsGarbage(reviewsPageText) {

  // no reviews
  if (reviewsPageText.indexOf("0 reviews in total") != -1) {
    return "There are no reviews for this movie.";
  }

  var mark = "</td><\/tr><\/table>\n\n<hr size=\"1\" noshade=\"1\">";
  var start = reviewsPageText.indexOf(mark) + mark.length;
  var reviewsPageTextSliced = reviewsPageText.slice(start, reviewsPageText.length);
  var end = reviewsPageTextSliced.indexOf("<hr noshade=\"1\" size=\"1\" width=\"50%\" align=\"center\">\n\n<hr size=\"1\" noshade=\"1\">");
  return reviewsPageTextSliced.slice(0, end);
}

// Bind delete/download/min/max/close buttons
if (remote.process.platform != "linux") {
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
}
