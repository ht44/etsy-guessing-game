///////////////////////////////////////////////////////////////////////////////
// --------------------------------------------------------------------------

// RENDER, STATUS

'use strict';

$(function() {
  // -------
  var controls = {
    clip: [],
    tag: null,
    turns: null,
    players: null,
    loading: false,
    scoreboard: {},
    donePlaying: false,
    listingObjects: [],
    names: [],
    gameOver: false,
    gameLoad: [],
    round: null,
    ties: []
  };

  // LOADER ----------------------
  $('#loadNew').on('click', function(ev) {
    ev.preventDefault();
    if (!controls.loading) {
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

  // INITIALIZES ---------
  function initGame(settings) {
    // console.log('initGame() ran');
    reload();
    meetPlayers(controls.players);
    // --------- NAME HANDLER ------------
    $('#nameSubmit').on('click', function(ev) {
      ev.preventDefault();

      addPlayers(controls.players, grabNames());
      // ---------- PLAY HANDLER ----------
      $('#guessSubmit').on('click', function(ev) {
        ev.preventDefault();
        // MAYBE EVENT TARGET?
        var current = settings.round;
        if (!settings.donePlaying) {
          play(current);
        }
      });
    // ------------ END NAME HANDLER BELOW --
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  // --------------------
  function validate(playForm) {
    playForm.forEach(function(input) {
      if (!input.val()) {
        return false;
      } else {
        return true;
      }
    })
  };

  // PLAY ----
  function play(round) {
    // console.log('play() ran');
    var price = parseFloat(round.price);
    console.log(price);
    var currentIntervals = getIntervals(controls.players, price);
    var runtInterval = getRunt(currentIntervals);
    var winningPlayer = currentIntervals.indexOf(runtInterval) + 1;

    updateScore(winningPlayer);
    checkDefault(controls.turns, controls.scoreboard);

    if (controls.gameOver) {
      judge(controls.scoreboard);
    } else {
      reload();
    }

    $('#priceViewport').text('PRICE WAS $' + price);
  };

  /////////////////////////////////////////////////////////////////////////////

  // DISPLAY --
  function reload() {
    // console.log('reload() ran');
    controls.round = controls.clip.shift();
    console.log(controls.round.image);

    populate(
      controls.round.image,
      controls.round.title,
      controls.round.description
    );

    if (controls.clip.length === 0) {
      controls.gameOver = true;
    }
    // console.log(controls.round.url);
    console.log(`PRICE = ${controls.round.price}`);
  };

  /////////////////////////////////////////////////////////////////////////////

  // JUDGE ---
  function judge(status) {
    // console.log('judge() ran');
    var factors = {
      control: 0,
      victor: null,
      scores: status,
      currentScore: null
    };

    for (let i = 1; i <= controls.players; i++) {
      factors.currentScore = factors.scores[`player${i}`];
      if (factors.currentScore > factors.control) {
        factors.victor = $(`#label${i}`).text();
        factors.control = factors.currentScore;
      }
    }
    if (checkTie(controls.players, factors.control)) {
      controls.gameOver = true;
      controls.donePlaying = true;
      return;
    };
    $('#nameDisplay').text(`WINNER = ${factors.victor}`);
    controls.donePlaying = true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // LOADS GAME ----------------------
  function loadGame(rules) {
    // console.log('loadGame() ran');
    controls.loading = true;
    var listingRequest = `https://openapi.etsy.com/v2/listings/active.js?tags=${rules.tag}&limit=99&api_key=${etsyKey}`;

    makeRequest(listingRequest).done(function(data) {
      var results = data.results;
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

      // INIT ALL --------------------
      initialize(loadClip(rules.turns), rules);
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  // INITIALIZE ALL ------------------
  function initialize(fullClip, settings) {
    // console.log('initialize() ran');
    var loopDuration = fullClip.length;
    // PLEDGE TO GET IMAGES -------
    var pledgeToGet = new Promise(function(resolve, reject) {
      var index = 0;
      getImages();
      function getImages() {
        // console.log('getImages() ran');
        setTimeout(function() {
          var imageRequest = `https://openapi.etsy.com/v2/listings/${fullClip[index].id}/images.js?api_key=${etsyKey}`;
          makeRequest(imageRequest).done(function(imageData) {
            var imageUrl = imageData.results[0].url_570xN;
            controls.clip[index].image = imageUrl;
            index++;
            if (index < loopDuration) {
              getImages();
            } else {
              resolve('SUCCESS');
            }
          });
        }, 150);
      };
    });

    // CHECK PROMISE ------
    pledgeToGet.then(function() {
      controls.loading = false;
      initGame(settings);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  function makeRequest(request) {
    return $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      url: request
    })
  };

  /////////////////////////////////////////////////////////////////////////////

  function loadClip(clipSize) {
    var range = controls.listingObjects.length;
    while (controls.gameLoad.length < clipSize) {
      var randomIndex = Math.floor(Math.random() * range);
      var randomListing = controls.listingObjects[randomIndex];
      //------------------------------------------
      if (!controls.gameLoad.includes(randomListing)) {
        controls.gameLoad.push(controls.listingObjects[randomIndex]);
        controls.clip.push(controls.listingObjects[randomIndex]);
      }
    }
    return controls.clip;
  };

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
  function getIntervals(headCount, price) {
    var guess;
    var intervals = [];
    var difference;
    for (let i = 1; i <= headCount; i++) {
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

  // ACCOUNT FOR TIE GAME -------------
  function checkTie(headCount, tieControl) {
    var tieTest;
    var tieGame = false;
    var xWayTie;

    for (let j = 1; j <= headCount; j++) {
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
    controls.clip = [];
  };

  /////////////////////////////////////////////////////////////////////////////

  // GETS RULES ---
  function grabRules() {
    controls.tag = $('#tag').val();
    controls.turns = $('#turns').val();
    controls.players = $('#players').val();
    return controls;
  };

  // GETS NAMES --?
  function grabNames() {
    console.log('grabNames() ran');
    for (let k = 1; k <= controls.players; k++) {
      let name = $(`#player${k}`).val();
      controls.names.push(name);
    }

    console.log(controls.names);

    // controls.tag = $('#tag').val();
    // controls.turns = $('#turns').val();
    // controls.players = $('#players').val();
    $('#playerGuesses').empty();
    return controls.names;
  };

  /////////////////////////////////////////////////////////////////////////////

  function populate(image, title, description) {
    $('section.listingDisplay > div').empty();
    $('#listingImage').append(`<img src=${image}>`);
    $('#listingTitle').append(`<h2>${title}</h2>`);
    $('#listingDescrip').append(`<p>${description}</p>`);
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

  // MEETS PLAYERS -----------
  function meetPlayers(headCount) {
    for (let i = 1; i <= headCount; i++) {
      // $('#playerGuesses').append(`<label id=label${i} for=player${i}></label>`);
      $('#playerGuesses').append(`<input type=text class=playerInput id=player${i} placeholder=\"Player ${i}\">`);
    };
    $('#playerGuesses').append('<input type=submit id=nameSubmit>');
  };

  // ADDS PLAYERS ---------
  function addPlayers(headCount, playerNames) {
    console.log(playerNames);
    for (let i = 1; i <= headCount; i++) {
      let j = (i - 1);
      let playerName = playerNames[j];
      console.log(playerName);
      $('#playerGuesses').append(`<div class=scorecard id=p${i}score>0</div>`);
      $('#playerGuesses').append(`<label id=label${i} for=player${i}>${playerName}</label>`);
      $('#playerGuesses').append(`<input type=number min=0.01 class=playerInput id=player${i}>`);
      controls.scoreboard[`player${i}`] = 0;
    };
    $('#playerGuesses').append('<input type=submit id=guessSubmit>');
  };

  //

  /////////////////////////////////////////////////////////////////////////////
});
////////////////////////////////////////////////////////////////////////////////
