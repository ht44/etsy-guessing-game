///////////////////////////////////////////////////////////////////////////////
// --------------------------------------------------------------------------

// RENDER, STATUS

'use strict';

$(function() {
  // console.log('doc ready');
  var controls = {
    clip: [],
    tag: null,
    turns: null,
    players: null,
    loading: false,
    scoreboard: {},
    donePlaying: false,
    listingObjects: [],
    intervals: [],
    playerOrder: [],
    dugout: [],
    names: [],
    gameOver: false,
    gameLoad: [],
    round: null,
    ties: [],
    playerNumber: 1,
    met: 1
  };

  // LOADER ----------------------
  $('#loadNew').on('click', function(ev) {
    ev.preventDefault();
    if (!controls.loading) {
      hardReset();
      meetPlayer(controls.met);
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
  function initGame() {
    console.log('initGame() ran');
    reload();
    meetPlayer(controls.met);
  };

  /////////////////////////////////////////////////////////////////////////////

  // --------------------
  // function validate(playForm) {
  //   playForm.forEach(function(input) {
  //     if (!input.val()) {
  //       return false;
  //     } else {
  //       return true;
  //     }
  //   })
  // };

  // PLAY ----
  function play() {
    console.log('play() ran');
    var price = parseFloat(controls.round.price);
    var runtInterval = getRunt(controls.intervals);
    var winningPlayer = controls.intervals.indexOf(runtInterval);
    var victor = controls.playerOrder[winningPlayer];

    console.log(`WINNER = ${victor}`);
    updateScore(victor);
    checkDefault(controls.turns, controls.scoreboard);
    console.log(controls.scoreboard);
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
    console.log('reload() ran');
    clearChamber();
    controls.round = controls.clip.shift();
    // console.log(controls.round.url);
    console.log(`PRICE = ${controls.round.price}`);
    roundRefresh();
    populate(
      controls.round.image,
      controls.round.title,
      controls.round.description
    );

    if (controls.shotClock === 0) {
      controls.shotClock = controls.players;
      giveTurn(shuffle(controls.names));
    }

    if (controls.clip.length === 0) {
      controls.gameOver = true;
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  // JUDGE ----------
  function judge(scoreboard) {
    console.log('judge() ran');
    // var factors = {
    //   control: 0,
    //   champion: null,
    //   scores: scoreboard,
    //   currentScore: null
    // };

    var highScore = 0;
    var champion;

    for (let key in scoreboard) {
      if (scoreboard[key] > highScore) {
        champion = key;
        highScore = scoreboard[key];
      }
    }

    if (checkTie(scoreboard, highScore)) {
      controls.gameOver = true;
      controls.donePlaying = true;
      clearChamber();
      return;
    };

    console.log('WINNER = ' + champion);
    $('#nameDisplay').text(`WINNER = ${champion}`);
    controls.donePlaying = true;
    clearChamber();
  };

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // LOADS GAME ----------------------
  function loadGame(rules) {
    console.log('loadGame() ran');
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
      initialize(loadClip(rules.turns));
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  // INITIALIZE ALL ------------------
  function initialize(fullClip) {
    console.log('initialize() ran');
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
      console.log('initialized');
      controls.loading = false;
      controls.round = fullClip.shift();
      populate(
        controls.round.image,
        controls.round.title,
        controls.round.description
      );
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
    console.log('loadClip() ran');
    var range = controls.listingObjects.length;
    console.log(range);
    while (controls.gameLoad.length < clipSize) {
      var randomIndex = Math.floor(Math.random() * range);
      var randomListing = controls.listingObjects[randomIndex];
      //------------------------------------------
      if (!controls.gameLoad.includes(randomListing)) {
        let chosenListing = controls.listingObjects.splice(randomIndex, 1);
        controls.gameLoad.push(chosenListing[0]);
        controls.clip.push(chosenListing[0]);
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

  function getInterval(guess, price) {
    var difference;
    if (guess > price) {
      difference = guess - price;
      controls.intervals.push(difference);
    } else if (guess < price) {
      difference = price - guess;
      controls.intervals.push(difference);
    } else {
      controls.intervals.push(0);
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  // LEAST DEGREE OF DIFFERENCE
  function getRunt(intervals) {
    var runt = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i] < runt) {
        runt = intervals[i];
      }
    }
    return runt;
  };

  function lockIn(finalAnswer) {
    console.log('lockIn() ran');
    --controls.shotClock;
    var price = parseFloat(controls.round.price);
    getInterval(finalAnswer, price);
    if (controls.shotClock === 0) {
      play();
    } else {
      $('#playerGuesses').empty();
      giveTurn(controls.dugout);
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  // ACCOUNT FOR TIE GAME -------------
  function checkTie(scores, best) {
    var tieTest;
    var tieGame = false;
    var xWayTie;

    for (let key in scores) {
      if (scores[key] === best) {
        controls.ties.push(key);
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
  function hardReset() {
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

  function roundRefresh() {
    controls.ties = [];
    controls.intervals = [];
    controls.playerOrder = [];
  };

  /////////////////////////////////////////////////////////////////////////////

  // GETS RULES ---
  function grabRules() {
    controls.tag = $('#tag').val();
    controls.turns = $('#turns').val();
    controls.players = $('#players').val();
    controls.needToMeet = parseFloat($('#players').val());
    controls.shotClock = parseFloat($('#players').val());
    return controls;
  };

  /////////////////////////////////////////////////////////////////////////////

  // GETS NAMES --?
  function grabName() {
    console.log('grabName() ran');
    var name = $(`#playerGuesses > input[type=text]`).val();
    // console.log(name);
    $('#playerGuesses').empty();
    return name;
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
    controls.scoreboard[winner]++;
    $(`#${winner}score`).text(controls.scoreboard[winner]);
  };

  /////////////////////////////////////////////////////////////////////////////

  // MEET PLAYERS -----------
  function meetPlayer(playerNumber) {
    console.log('meetPlayer() ran');
    // $('#playerGuesses').append(`<label id=label${i} for=player${i}></label>`);
    $('#playerGuesses').append(`<input type=text class=playerInput placeholder=\"Player ${playerNumber} \">`);
    $('#playerGuesses').append('<input type=submit id=nameSubmit>');
    // --------- NAME HANDLER ------------
    $('#nameSubmit').on('click', function(ev) {
      ev.preventDefault();
      addPlayer(grabName());
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  function addPlayer(nickname) {
    console.log('addPlayer() ran');
    // $('#playerGuesses').append(`<div class=scorecard id=p${i}score>${nickname} (SCORE = 0)</div>`);
    // $('#playerGuesses').append(`<label for=${nickname}>${nickname}: </label>`);
    // $('#playerGuesses').append(`<input type=number min=0.01 class=playerInput id=${nickname}>`);

    controls.names.push(nickname);
    controls.scoreboard[nickname] = 0;

    $('#scoreboard').append(`<div class=scoreCard id=${nickname}><div>${nickname}</div><div id=${nickname}score>0</div></div>`);
    // console.log(nickname);
    // console.log(controls.names);
    // $('#playerGuesses').append('<input type=submit id=guessSubmit>');

    if (controls.met < controls.needToMeet) {
      ++controls.met;
      meetPlayer(controls.met);
    } else {
      giveTurn(shuffle(controls.names));
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  function giveTurn(lineUp) {
    console.log('giveTurn() ran');
    // console.log(controls);
    var atBat = lineUp.shift();

    $('#playerGuesses').append(`<label for=${atBat}>${atBat}: </label>`);
    $('#playerGuesses').append(`<input type=number min=0.01 class=playerInput id=${atBat}>`);
    $('#playerGuesses').append('<input type=submit id=guessSubmit>');
    // $('#playerGuesses').append('<input type=button id=replay value=Replay>');

    // $('#replay').on('click', function(ev) {
    //   softReset(ev);
    // });

    $('#guessSubmit').on('click', function(ev) {
      console.log('guess handler triggered');
      ev.preventDefault();
      if (!controls.loading) {
        var playerGuess = $(`#playerGuesses > input[type=number]`).val();
        var guessValue = parseFloat(playerGuess);
        lockIn(guessValue);
      }
    });
  };

  // function softReset() {
  //   for (let key in controls.scoreboard) {
  //     controls.scoreboard[key] = 0;
  //     $(`#${key}score`).text('0');
  //   }
  //   console.log(controls.listingObjects.length);
  //   controls.clip = [];
  //   controls.dugout = [];
  //   controls.gameLoad = [];
  //   roundRefresh();
  //   initialize(loadClip(controls.turns));
  //   clearChamber();
  //   giveTurn(shuffle(controls.names));
  // };

  /////////////////////////////////////////////////////////////////////////////

  function shuffle(ordered) {
    console.log('shuffle() ran');
    var range = ordered.length;
    while (controls.dugout.length < ordered.length) {
      var randomInteger = Math.floor(Math.random() * range);
      var randomMember = ordered[randomInteger];
      if (!controls.dugout.includes(randomMember)) {
        controls.dugout.push(randomMember);
        controls.playerOrder.push(randomMember);
      }
    }
    return controls.dugout;
  };

  /////////////////////////////////////////////////////////////////////////////

  function clearChamber() {
    $('#playerGuesses').empty();
  };
});

////////////////////////////////////////////////////////////////////////////////
