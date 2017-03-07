///////////////////////////////////////////////////////////////////////////////
// --------------------------------------------------------------------------
'use strict';

$(function() {
  var defaultWin = false;
  // -------
  var controls = {
    tag: null,
    turns: null,
    players: null,
    scoreboard: {},
    donePlaying: false,
    listingObjects: [],
    gameOver: false,
    gameLoad: [],
    round: null,
    ties: [],
    mag: []
  };

  // LISTING CONSTRUCTOR ---------------------
  function Listing(id, title, price, description) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.description = description;
  };

  // LOAD GAME ON SUB ---------------
  $('#loadNew').on('click', function(ev) {
    ev.preventDefault();
    clearGame();
    grabRules();
    loadGame(controls.tag, controls.turns);
  });

  /////////////////////////////////////////////////////////////////////////////

  // INITIALIZES -
  function initGame() {
    // FILL CHAMBER --
    setTimeout(function() {
      fillChamber();
    }, 1100);
    addPlayers(controls.players);

    // ------------------------------------
    // ---------- ADD PLAY LISTEN ----------
    $('#guessSubmit').on('click', function(ev) {
      ev.preventDefault();
      if (!controls.donePlaying) {
        play();
      }
    });
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

  // LOADS DISPLAY --
  function fillChamber() {
    console.log('fillChamber() ran');
  // ISOLATE -------------------
    controls.round = controls.mag.shift();
    var currentPrice = controls.round.price;

    // DEBUG
    console.log(`PRICE = ${currentPrice}`);
    // console.log(controls.mag);
    // console.log(controls.gameLoad);
    // console.log(controls.round);
    // DEBUG

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

  // DETERMINE WIN--
  function nameVictor() {
    console.log('nameVictor() ran');
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

    $('#nameDisplay').text(`WINNER = ${victor}`);
    controls.donePlaying = true;
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

  // CHECKS ANSWERS
  function play() {
    console.log('play() ran');
    var guesses = [];
    var intervals = [];
    var runtInterval;
    var closestGuess;
    var winningPlayer;
    var currentPrice = parseFloat(controls.round.price);
    var currentGuess;
    var newScore;

    for (let i = 1; i <= controls.players; i++) {
      currentGuess = parseFloat($(`#player${i}`).val());
      guesses.push(currentGuess);
      if (currentGuess > currentPrice) {
        let difference = currentGuess - currentPrice;
        intervals.push(difference);
      } else if (currentGuess < currentPrice) {
        let difference = currentPrice - currentGuess;
        intervals.push(difference);
      } else {
        intervals.push(0);
      }
    }

    runtInterval = intervals[0];
    for (let i = 1; i <= controls.players; i++) {
      if (intervals[i] < runtInterval) {
        runtInterval = intervals[i];
      }
    }

    winningPlayer = intervals.indexOf(runtInterval) + 1;
    closestGuess = guesses[winningPlayer - 1];

    // DEBUG
    // console.log('off by = ' + runtInterval);
    // console.log('closest guess = ' + closestGuess);
    // console.log('winning player = ' + winningPlayer);
    // DEBUG

    controls.scoreboard[`player${winningPlayer}`]++;
    // for (let key in controls.scoreboard) {
    //   if (controls.turns / controls.scoreboard[key] < 2) {
    //     defaultWin = true;
    //   }
    // }
    newScore = controls.scoreboard[`player${winningPlayer}`];
    $(`#p${winningPlayer}score`).text(newScore);
    $('#priceViewport').text('PRICE WAS $' + currentPrice);

    if (controls.gameOver) {
      nameVictor();
    } else {
      fillChamber();
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  // LOADS GAME ----------------------
  function loadGame(tagParam, gameLength) {
    var listingRequest = `https://openapi.etsy.com/v2/listings/active.js?tags=${tagParam}&limit=99&api_key=${etsyKey}`;
    // GET LISTINGS -------
    var getListings = $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      url: listingRequest
    });
    // WHEN DONE ---------------
    getListings.done(function(data) {
      var results = data.results;
      // CONSTRUCT OBJECTS --------
      results.forEach(function(result) {
        var listingObject = new Listing (
          result.listing_id,
          result.title,
          result.price,
          result.description
        );
        controls.listingObjects.push(listingObject);
      });
      // ESTABLISH RANGE -----------
      controls.range = controls.listingObjects.length;
      // POPULATE GAMELOAD ---------------------
      while (controls.gameLoad.length < gameLength) {
        var randomIndex = Math.floor(Math.random() * controls.range);
        var randomListing = controls.listingObjects[randomIndex];
        //------------------------------------------
        if (!controls.gameLoad.includes(randomListing)) {
          // console.log(randomIndex);
          controls.gameLoad.push(controls.listingObjects[randomIndex]);
          controls.mag.push(controls.listingObjects[randomIndex]);
        }
      }
      // GET IMAGES ---------------------------
      controls.mag.forEach(function(listing) {
        var imageRequest = `https://openapi.etsy.com/v2/listings/${listing.id}/images.js?api_key=${etsyKey}`;
        var getListingImage = $.ajax({
          type: 'GET',
          dataType: 'jsonp',
          url: imageRequest
        });
        // WHEN DONE IMAGES -----------------
        getListingImage.done(function(imageData) {
          var imageUrl = imageData.results[0].url_570xN;
          listing.image = imageUrl;
        });
      });
      // INITIALIZE GAME
      initGame();
    });
  };
  /////////////////////////////////////////////////////////////////////////////
});
// ----------------------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////
