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
var displayedMovies = 0;
var deletedMoviesFile = path.join(__dirname, "cache/deletedMovies.txt");
var firstMovieLoaded = false;

loadMovies("HD", true);
//loadMovies("normal", true);
var stepSize = 12.5;

function loadMovies(moviesQuality, lastList) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    console.log("PB state: " + this.readyState);
    progressBarDoStep();
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

          // skip french movies
          if ($movieName.includes("french")) continue;

          // skip hardcoded subtitles
          if ($movieName.includes(".hc.")) continue;
          if ($movieName.includes(" hc ")) continue;
          if ($movieName.includes("korsub")) continue;

          // skip cam
          if ($movieName.includes(".cam.")) continue;
          if ($movieName.includes(" cam ")) continue;

	  if ($movieName.includes(".hdcam.")) continue;
          if ($movieName.includes(" hdcam ")) continue;

		  // skip hdts
		  if ($movieName.includes(".hdts.")) continue;
          if ($movieName.includes(" hdts ")) continue;
          if ($movieName.includes("hd-ts")) continue;
          if ($movieName.includes("hd-tc")) continue;
		  if ($movieName.includes(".hdtc.")) continue;
		  if ($movieName.includes("hdtc")) continue;

          // leave only pure movie name
          $movieName = getMovieName($movieName);

 console.log($movieName);
        // skip empty movies
          if ($movieName == "")  continue;

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
        if (lastList) {
          if (moviesList.length == 0) {
            $("#progress-bar").fadeOut();
            $("#no-movies-container").fadeIn();
          }
          else {
            populateMoviesTable();
          }
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
    xhttp.open("GET", "https://pirateproxy.live/rss/top100/207", true);
  }
  else if (moviesQuality == "normal") {
    xhttp.open("GET", "https://pirateproxy.live/rss/top100/201", true);
  }
  xhttp.send();
}

function progressBarDoStep() {
  var pBar = document.getElementById('progress-bar');
  pBar.value += stepSize;
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
          fs.appendFile(deletedMoviesFile, movieName + "\n");
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

		plotText = movieInfo["Plot"];
		if (plotText.length > 150) {
			plotText = plotText.substring(0,150) + "...";
		}
        movieInfoText += "<b>Plot</b>: " + plotText;

        rig_text.innerHTML = movieInfoText;
        rig_text.addEventListener('click', function() {
          getMovieReviews(movieInfo["imdbID"], movieInfo["Title"]);
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
          $("#progress-bar").fadeOut();
        }
        $("#"+movieInfo["imdbID"]).fadeIn(2000);
        displayedMovies++;
        document.getElementById("title").innerText = "Electron Movies Browser - displaying " + (displayedMovies) + " movies";
      }
      else {
        console.log("error: status for " + movieName + " is " + this.status);
      }
    }
  }
  var movieSearchString = movieName.replace(/\s/g, '+');
  movieSearchString = "http://www.omdbapi.com/?apikey=90c2bc1b&t="+movieSearchString+"&y="+moviesYears[movieName]+"&plot=short&r=json";
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
  displayedMovies--;
  document.getElementById("title").innerText = "Electron Movies Browser - displaying " + (displayedMovies) + " movies";
}

function downloadMovie(movieName) {
  var link = magnetLinks[movieName];
  open(link);
}

function openImdb(id) {
  open("http://www.imdb.com/title/"+id+"/");
}

function getMovieReviews(movieId, movieName) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == this.DONE) {
      if (this.status == 200) {
        var reviewsPageText = xhttp.responseText;
        reviewsPageText = stripMovieReviewsGarbage(reviewsPageText);
        document.getElementById("reviews-title").innerText = movieName + " - User Reviews";

        if (reviewsPageText == "") {
          $("#no-reviews-container").fadeIn();
        }

        document.getElementById("reviews").innerHTML = reviewsPageText;
        $("#cover").fadeIn();
        $("#reviews-overlay").fadeIn();
        document.getElementById("reviews").scrollTop = 0;
      }
      else {
        alert("can't contact imdb :(");
      }
    }
  };
  xhttp.open("GET", "http://www.imdb.com/title/"+movieId+"/reviews", true);
  xhttp.send();
}

var reviewsHTML;
function stripMovieReviewsGarbage(reviewsPageText) {

  var titles = [];
  var scores = [];
  var texts = [];
  var helpfuls = [];
  var reviews = "";

  //console.log(reviewsPageText);
  reviewsHTML = reviewsPageText;
  var reviewsHTMLArray = $(reviewsHTML).find('.imdb-user-review').toArray();
  reviewsHTMLArray.forEach(function(review) {
		var reviewScore = $(review).find('.rating-other-user-rating').text().trim();
		if (reviewScore != "") {
	    var reviewTitle = $(review).find('.title').text().trim();
			var reviewText = $(review).find('.text').text().trim();
			var reviewHelpfulness = $(review).find('.actions').text().trim();
			titles.push(reviewTitle);
			scores.push(reviewScore);
			texts.push(reviewText);
			helpfuls.push(reviewHelpfulness);
		}
  });

  for (i = 0; i < titles.length; i++) {
		reviews += "<div>	<font color=lightgray size=5>" + titles[i] + "</font><br/> \
		<font color=gold size=2>" + scores[i] + "</font><br/> \
		<font size=4>" + texts[i] + "</font></br> \
		<font size=2>" + helpfuls[i].substr(0, helpfuls[i].indexOf('.')) + "</font></div><br/>";
  }
  return reviews;
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

  document.getElementById("reviews-close-btn").addEventListener('click', function() {
    $("#no-reviews-container").fadeOut();
    $("#reviews-overlay").fadeOut();
    $("#cover").fadeOut();
  });

  document.onreadystatechange = function () {
    if (document.readyState == "complete") {
      init();
    }
  };
})();
