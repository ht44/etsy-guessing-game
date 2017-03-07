///////////////////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------------
'use strict';

$(function() {

  // ROUND.PRICE WILL BE A STRING
  var round;
  // -------
  var controls = {
    tag: null,
    turns: null,
    players: null,
    listingObjects: [],
    gameLoad: [],
    mag: []
  };

  // LISTING CONSTRUCTOR ---------------------
  function Listing(id, title, price, description) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.description = description;
  };

  /////////////////////////////////////////////////////////////////////////////

  // LOAD GAME ON SUB -------------------------
  $('#loadNew').on('click', function(ev) {
    ev.preventDefault();
    clearGame();
    grabRules();
    loadGame(controls.tag, controls.turns);
    // DEBUG
    console.log(`players = ${controls.players}, turns = ${controls.turns}, tag(s) = ${controls.tag}`);
    // DEBUG
  });

  /////////////////////////////////////////////////////////////////////////////

  // CLEARS GAME --
  function clearGame() {
    $('section.listingDisplay > div').empty();
    controls.listingObjects = [];
    controls.gameLoad = [];
    controls.mag = [];
  };

  // ----------

  // GETS RULES ---
  function grabRules() {
    controls.tag = $('#tag').val();
    controls.turns = $('#turns').val();
    controls.players = $('#players').val();
  };

  /////////////////////////////////////////////////////////////

  // INITIALIZE PLAY
  function initGame() {
    // FILL CHAMBER --
    setTimeout(function() {
      fillChamber();
    }, 2000);
    // GENERATE PLAYER GUESS FORM ----------
    for (var i = 1; i <= controls.players; i++) {
      $('#playerGuesses').append(`<input type=number class=playerInput id=player${i}>`);
    };
    $('#playerGuesses').append('<input type=submit id=guessSubmit>');


    // ------------------------------------
    // ---------- ADD PLAY LISTEN ----------
    $('#guessSubmit').on('click', function(ev) {
      ev.preventDefault();
      posit();
      fillChamber();
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  function fillChamber() {
    // ISOLATE -------------------
    if (controls.mag.length > 0) {
      round = controls.mag.shift();
      var currentPrice = round.price;

      // DEBUG
      console.log(`PRICE = ${currentPrice}`);
      // console.log(controls.mag);
      // console.log(controls.gameLoad);
      console.log(round);
      // DEBUG
    } else {
      // DEBUG
      console.log('ERROR: mag empty');
      // DEBUG
      return;
    }
    // POPULATE --------------------------
    $('section.listingDisplay > div').empty();
    $('#listingImage').append(`<img src=${round.image}>`);
    $('#listingTitle').append(`<h2>${round.title}</h2>`);
    $('#listingDescrip').append(`<p>${round.description}</p>`);
  };

  /////////////////////////////////////////////////////////////////////////////

  // CHECK ANSWERS
  function posit() {

    var guesses = [];
    var intervals = [];
    var runtInterval;
    var closestGuess;
    var winningPlayer;
    var currentPrice = parseFloat(round.price);
    var currentGuess;

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
    // DEBUG
    console.log(guesses);
    console.log(intervals);
    // DEBUG

    runtInterval = intervals[0];
    for (let i = 1; i <= controls.players; i++) {
      if (intervals[i] < runtInterval) {
        runtInterval = intervals[i];
      }
    }

    winningPlayer = intervals.indexOf(runtInterval) + 1;
    closestGuess = guesses[winningPlayer - 1];

    // DEBUG
    console.log('off by = ' + runtInterval);
    console.log('closest guess = ' + closestGuess);
    console.log('winning player = ' + winningPlayer);
    // DEBUG
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
      round = controls.gameLoad[0];
      initGame();
    });
  };
  /////////////////////////////////////////////////////////////////////////////
});
// ----------------------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////
