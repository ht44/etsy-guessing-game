//

'use strict';

$(function() {
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
    met: 1,
    taken: []
  };

  // MASTER LOAD ---------------------
  $('#loadNew').on('click', function(ev) {
    ev.preventDefault();
    if (!controls.loading) {
      hardReset();
      meetPlayer(controls.met);
      loadGame(grabRules());
    }
  });

  // CONTSTRUCTS ETSY RESULTS
  function Listing (id, title, price, description, url) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.description = description;
    this.url = url;
  };

  /////////////////////////////////////////////////////////////////////////////

  // SUBMITS --
  function play() {
    var price = parseFloat(controls.round.price);
    var runtInterval = getRunt(controls.intervals);
    var winningPlayer = controls.intervals.indexOf(runtInterval);
    var victor = controls.playerOrder[winningPlayer];

    updateScore(victor);
    checkDefault(controls.turns, controls.scoreboard);

    if (controls.gameOver) {
      judge(controls.scoreboard);
    } else {
      reload();
    }

    $('#priceViewport').text('PRICE WAS $' + price + ' / ' + `POINT -> ${victor.toUpperCase()}`);
  };

  /////////////////////////////////////////////////////////////////////////////

  // DISPLAYS --
  function reload() {
    clearChamber();
    controls.round = controls.clip.shift();
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

    $('#nameDisplay').text(`WINNER = ${champion.toUpperCase()}`);
    controls.donePlaying = true;
    clearChamber();
  };
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // LOADS GAME ----------------------
  function loadGame(rules) {
    controls.loading = true;
    var listingRequest = `https://openapi.etsy.com/v2/listings/active.js?tags=${rules.tag}&limit=99&api_key=dp7irwv1ffg7qvrdk2ymlc18`;

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
      initialize(loadClip(rules.turns));
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  // PREPARE ONE GAME ---------
  function initialize(fullClip) {
    var loopDuration = fullClip.length;
    // PROMISE TO GET IMAGES -------
    var getImages = new Promise(function(resolve, reject) {
      var index = 0;
      getImage();
      function getImage() {
        setTimeout(function() {
          var imageRequest = `https://openapi.etsy.com/v2/listings/${fullClip[index].id}/images.js?api_key=dp7irwv1ffg7qvrdk2ymlc18`;
          makeRequest(imageRequest).done(function(imageData) {
            var imageUrl = imageData.results[0].url_570xN;
            controls.clip[index].image = imageUrl;
            index++;
            if (index < loopDuration) {
              getImage();
            } else {
              resolve('SUCCESS');
            }
          });
        }, 144);
      };
    });

    // KEEPS PROMISE ------
    getImages.then(function() {
      controls.loading = false;
      controls.round = fullClip.shift();
      populate (
        controls.round.image,
        controls.round.title,
        controls.round.description
      );
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  // GETS JSONP ------------
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
        let chosenListing = controls.listingObjects[randomIndex];
        controls.gameLoad.push(chosenListing);
        controls.clip.push(chosenListing);
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

  // GETS DEGREE OF DIFFERENCE----
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

  // LEAST DEGREE OF DIFF -
  function getRunt(intervals) {
    var runt = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i] < runt) {
        runt = intervals[i];
      }
    }
    return runt;
  };

  /////////////////////////////////////////////////////////////////////////////

  function lockIn(finalAnswer) {
    --controls.shotClock;
    controls.taken.push(finalAnswer);
    var price = parseFloat(controls.round.price);
    getInterval(finalAnswer, price);
    if (controls.shotClock === 0) {
      controls.taken = [];
      play();
    } else {
      $('#playerGuesses').empty();
      giveTurn(controls.dugout);
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  // ACCOUNT FOR TIE GAME -----
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

  // CLEARS ALL --
  function hardReset() {
    controls.clip = [];
    controls.tag = null;
    controls.turns = null;
    controls.players = null;
    controls.loading = false;
    controls.scoreboard = {};
    controls.donePlaying = false;
    controls.listingObjects = [];
    controls.intervals = [];
    controls.playerOrder = [];
    controls.dugout = [];
    controls.names = [];
    controls.gameOver = false;
    controls.gameLoad = [];
    controls.round = null;
    controls.ties = [];
    controls.playerNumber = 1;
    controls.met = 1;
    controls.taken = [];
    $('#scoreboard').empty();
    $('#nameDisplay').text(null);
    $('#priceViewport').text(null);
    $('#playerGuesses').empty();
    $('section.listingDisplay > div').empty();
  };

  /////////////////////////////////////////////////////////////////////////////

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

  // TAKES NAME --
  function grabName() {
    var name = $(`#playerGuesses > input[type=text]`).val();
    $('#playerGuesses').empty();
    return name;
  };

  /////////////////////////////////////////////////////////////////////////////

  // LOADS DISPLAY ------------------------
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

  // ENTER PLAYER --------------
  function meetPlayer(playerNumber) {
    var nameField = $(`<input type=text class=playerInput placeholder=\"Player ${playerNumber} \">`);
    $('#playerGuesses').append(nameField);
    nameField.focus();
    $('#playerGuesses').append('<input type=submit id=nameSubmit>');
    $('#nameSubmit').on('click', function(ev) {
      ev.preventDefault();
      if ($(`#playerGuesses > input[type=text]`).val()) {
        addPlayer(grabName());
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  function addPlayer(nickname) {
    controls.names.push(nickname);
    controls.scoreboard[nickname] = 0;
    $('#scoreboard').append(`<div class=scoreCard id=${nickname}><div>${nickname}</div><div id=${nickname}score>0</div></div>`);
    if (controls.met < controls.needToMeet) {
      controls.met++;
      meetPlayer(controls.met);
    } else {
      giveTurn(shuffle(controls.names));
    }
  };

  /////////////////////////////////////////////////////////////////////////////

  function giveTurn(lineup) {
    var atBat = lineup.shift();
    var guessField = $(`<input type=number min=0.01 class=playerInput id=${atBat} placeHolder=${[atBat]}>`);
    $('#playerGuesses').append(guessField);
    guessField.focus();
    $('#playerGuesses').append('<input type=submit id=guessSubmit>');



    $('#guessSubmit').on('click', function(ev) {
      ev.preventDefault();
      if (!controls.loading) {
        var playerGuess = $(`#playerGuesses > input[type=number]`).val();
        var guessValue = parseFloat(playerGuess);
        if (playerGuess && !controls.taken.includes(guessValue)) {
          lockIn(guessValue);
        } else {
          console.log('FORM ERROR: NOT VALID');
        }
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////

  function shuffle(ordered) {
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
  //
});
//
