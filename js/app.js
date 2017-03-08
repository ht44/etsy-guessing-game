///////////////////////////////////////////////////////////////////////////////
// --------------------------------------------------------------------------
'use strict';

$(function() {
  var loading = false;
  // -------
  var controls = {
    mag: [],
    tag: null,
    turns: null,
    players: null,
    scoreboard: {},
    donePlaying: false,
    listingObjects: [],
    gameOver: false,
    gameLoad: [],
    round: null,
    ties: []
  };

  // LOADER ----------------------
  $('#loadNew').on('click', function(ev) {
    ev.preventDefault();
    if (!loading) {
      clearGame();
      loadGame(grabRules());
    }
  });

  // LISTING CONSTRUCTOR ---------------------
  function Listing (id, title, price, description, url) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.description = description;
    this.url = url;
  };

  /////////////////////////////////////////////////////////////////////////////

  // INITIALIZES -
  function initGame(settings) {

    reload();
    addPlayers(settings.players);

    // ---------- PLAY HANDLER ----------
    $('#guessSubmit').on('click', function(ev) {
      ev.preventDefault();
      var current = parseFloat(settings.round.price);
      if (!settings.donePlaying) {
        play(current);
      }

    });
  };

  /////////////////////////////////////////////////////////////////////////////

  // PLAY ----
  function play(round) {

    var price = round;
    var currentIntervals = getIntervals(controls.players, price);
    var runtInterval = getRunt(currentIntervals);
    var winningPlayer = currentIntervals.indexOf(runtInterval) + 1;

    updateScore(winningPlayer);
    checkDefault(controls.turns, controls.scoreboard);

    if (controls.gameOver) {
      judge();
    } else {
      reload();
    }

    $('#priceViewport').text('PRICE WAS $' + price);
  };

  /////////////////////////////////////////////////////////////////////////////

  // DISPLAY --
  function reload() {
    console.log('reload() ran');

    controls.round = controls.mag.shift();
    var currentPrice = controls.round.price;

    console.log(controls.round.url);
    console.log(`PRICE = ${currentPrice}`);


    // POPULATE --------------------------
    $('section.listingDisplay > div').empty();
    $('#listingImage').append(`<img src=${controls.round.image}>`);
    $('#listingTitle').append(`<h2>${controls.round.title}</h2>`);
    $('#listingDescrip').append(`<p>${controls.round.description}</p>`);

    if (controls.mag.length === 0) {
      controls.gameOver = true;
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  // JUDGE --------
  function judge() {
    console.log('judge() ran');
    var victor;
    var control = 0;
    var currentScore;
    var scores = controls.scoreboard;
    var currentTest;

    for (let i = 1; i <= controls.players; i++) {
      currentScore = scores[`player${i}`];
      if (currentScore > control) {
        victor = $(`#label${i}`).text();
        control = currentScore;
      }
    }

    if (checkTie(controls.players, control)) {
      console.log('heeeeey');
      controls.gameOver = true;
      controls.donePlaying = true;
      return;
    };
    // !!!!!!!!
    $('#nameDisplay').text(`WINNER = ${victor}`);
    controls.donePlaying = true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // LOADS GAME ----------------------
  function loadGame(rules) {
    loading = true;
    var ammo = rules.turns;
    var listingRequest = `https://openapi.etsy.com/v2/listings/active.js?tags=${rules.tag}&limit=99&api_key=${etsyKey}`;

    var getListings = $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      url: listingRequest
    });

    getListings.done(function(data) {
      var results = data.results;
      // console.log(results);

      // CONSTRUCT OBJECTS --------
      results.forEach(function(result) {
        var listingObject = new Listing (
          result.listing_id,
          result.title,
          result.price,
          result.description,
          result.url
        );
        controls.listingObjects.push(listingObject);
      });

      // ESTABLISH RANGE -----------
      // GET IMAGES ---------------------------
      //------------------------------------------

      initialize(loadMag(ammo));

      function initialize(ofActive) {
        var imagePromises = [];
        ofActive.forEach(function(listing) {
          var imageRequest = `https://openapi.etsy.com/v2/listings/${listing.id}/images.js?api_key=${etsyKey}`;
          // WHEN DONE EACH IMAGE --------------
            callImage(imageRequest, imagePromises).done(function(imageData) {
            var imageUrl = imageData.results[0].url_570xN;
            listing.image = imageUrl;
          });
        });

        Promise.all(imagePromises).then(function() {
          loading = false;
          initGame(rules);
          imagePromises = [];
        });
      };

    });
  };

  // --------------------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  function callImage(location, destination) {
    var listingImage = $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      url: location
    });

    destination.push(listingImage);
    return listingImage;
  };

  //

  function loadMag(clip) {
    var range = controls.listingObjects.length;
    // POPULATE GAMELOAD ---------------------
    while (controls.gameLoad.length < clip) {
      var randomIndex = Math.floor(Math.random() * range);
      var randomListing = controls.listingObjects[randomIndex];
      //------------------------------------------
      if (!controls.gameLoad.includes(randomListing)) {
        controls.gameLoad.push(controls.listingObjects[randomIndex]);
        controls.mag.push(controls.listingObjects[randomIndex]);
      }
    }
    return controls.mag;
  };

  // --------------------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////


  // WIN BY DEFAULT ---------------
  function checkDefault(turns, scores) {
    for (let key in scores) {
      if (turns / scores[key] < 2) {
        controls.gameOver = true;
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  // GETS GUESS/PRICE DIFFERENCES -----
  function getIntervals(headcount, price) {
    var guess;
    var intervals = [];
    var difference;
    for (let i = 1; i <= headcount; i++) {
      // might not need parseFloat here...
      guess = parseFloat($(`#player${i}`).val());
      if (guess > price) {
        difference = guess - price;
        intervals.push(difference);
      } else if (guess < price) {
        difference = price - guess;
        intervals.push(difference);
      } else {
        intervals.push(0);
      }
    }
    return intervals;
  };

  /////////////////////////////////////////////////////////////////////////////

  // LEAST DEGREE OF DIFFERENCE
  function getRunt(intervals) {
    var runt = intervals[0];
    for (let i = 1; i <= intervals.length; i++) {
      if (intervals[i] < runt) {
        runt = intervals[i];
      }
    }
    return runt;
  };

  /////////////////////////////////////////////////////////////////////////////

  function checkTie(headcount, tieControl) {
    var tieTest;
    var tieGame = false;
    var xWayTie;

    for (let j = 1; j <= headcount; j++) {
      tieTest = controls.scoreboard[`player${j}`];
      if (tieTest === tieControl) {
        controls.ties.push($(`#label${j}`).text());
      }
    }

    if (controls.ties.length > 1) {
      tieGame = true;
      xWayTie = `${controls.ties.length}-WAY TIE BETWEEN: `;
      controls.ties.forEach(function(tie) {
        xWayTie += (tie + ', ');
      });
      $('#nameDisplay').text(xWayTie);
    }
    return tieGame;
  };

  /////////////////////////////////////////////////////////////////////////////

  // CLEARS GAME --
  function clearGame() {
    controls.ties = [];
    controls.gameOver = false;
    controls.donePlaying = false;
    controls.scoreboard = {};
    $('#nameDisplay').text(null);
    $('#priceViewport').text(null);
    $('#playerGuesses').empty();
    $('section.listingDisplay > div').empty();
    controls.listingObjects = [];
    controls.gameLoad = [];
    controls.mag = [];
  };

  /////////////////////////////////////////////////////////////////////////////

  // GETS RULES ---
  function grabRules() {
    controls.tag = $('#tag').val();
    controls.turns = $('#turns').val();
    controls.players = $('#players').val();
    return controls;
  };

  /////////////////////////////////////////////////////////////////////////////

  // DISPLAYS / TRACKS SCORES
  function updateScore(winner) {
    var newScore;
    var roundWinner = $(`#label${winner}`).text();
    console.log(`ROUND WINNER = ${roundWinner}`);
    controls.scoreboard[`player${winner}`]++;
    newScore = controls.scoreboard[`player${winner}`];
    $(`#p${winner}score`).text(newScore);
  };

  /////////////////////////////////////////////////////////////////////////////

  // ADDS PLAYERS ---------
  function addPlayers(headCount) {
    for (let i = 1; i <= headCount; i++) {
      var playerName = prompt(`Enter a name for Player ${i}:`);
      $('#playerGuesses').append(`<div class=scorecard id=p${i}score>0</div>`);
      $('#playerGuesses').append(`<label id=label${i} for=player${i}>${playerName}</label>`);
      $('#playerGuesses').append(`<input type=number class=playerInput id=player${i}>`);
      controls.scoreboard[`player${i}`] = 0;
    };
    $('#playerGuesses').append('<input type=submit id=guessSubmit>');
  };
  /////////////////////////////////////////////////////////////////////////////
});
// ----------------------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////
