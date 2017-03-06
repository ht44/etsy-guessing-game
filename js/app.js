'use strict';

$(function() {

  // SHARIABLES -
  var controls = {
    tag: null,
    turns: null,
    listingObjects: [],
    gameLoad: [],
  };

  /////////////////////////////////////////////////////////////////////////////

  // ON SUB LOAD GAME ---------
  $('input[type=submit]').on('click', function(ev) {
    ev.preventDefault();
    $('ul').empty();
    controls.tag = $('#tag').val();
    controls.turns = $('#turns').val();
    controls.listingObjects = [];
    controls.gameLoad = [];
    loadGame(controls.tag, controls.turns);
  });

  /////////////////////////////////////////////////////////////////////////////

  // LISTING CONSTRUCTOR ---------------------
  function Listing(id, title, price, description) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.description = description;
  };

  /////////////////////////////////////////////////////////////////////////////

  // SHUFFLER ----------------------------------
  function shuffleListings(listings, desiredLength) {
    var shuffler = [];
    while (shuffler.length < desiredLength) {
      let randomIndex = Math.floor(Math.random() * listings.length);
      if (!shuffler.includes(listings[randomIndex])) {
        shuffler.push(listings[randomIndex]);
      }
    }
    return shuffler;
  };

  /////////////////////////////////////////////////////////////////////////////

  // LOAD GAME --------------------------
  function loadGame(tagParam, shuffleLength) {
    var listingRequest = `https://openapi.etsy.com/v2/listings/active.js?tags=${tagParam}&limit=99&api_key=${etsyKey}`;
    // GET WEIRD --------
    var getWeird = $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      url: listingRequest
    });
    // WHEN DONE -------------
    getWeird.done(function(data) {
      var results = data.results;
      console.log(results);
      // CONSTRUCT LISTINGS -------
      results.forEach(function(result) {
        var listingObject = new Listing (
          result.listing_id,
          result.title,
          result.price,
          result.description
        );
        controls.listingObjects.push(listingObject);
      });
      // LOAD OBJECTS --------------------------
      controls.gameLoad = shuffleListings(controls.listingObjects, shuffleLength);
      // GET WEIRD IMAGES ----------------
      controls.gameLoad.forEach(function(level) {
        // setTimeout(function() {
          var imageRequest = `https://openapi.etsy.com/v2/listings/${level.id}/images.js?api_key=${etsyKey}`;
          var getWeirdImages = $.ajax({
            type: 'GET',
            dataType: 'jsonp',
            url: imageRequest
          });
          // WHEN DONE IMAGES -----------------
          getWeirdImages.done(function(imageData) {
            var imageUrl = imageData.results[0].url_570xN;
            level.image = imageUrl;
            $('ul').append(`<li><img src=${level.image}></li>`);
          });
        // }, Math.floor(Math.random() * 5000));
        // ^UNCOMMENT TIMEOUT IF SHUFFLED.LENGTH > 10^
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////

});
//ready^
