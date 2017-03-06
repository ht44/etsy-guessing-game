'use strict';

$(function() {

  // -
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
    controls.tag = $('#tag').val();
    controls.turns = $('#turns').val();
    controls.listingObjects = [];
    controls.gameLoad = [];
    loadGame(controls.tag, controls.turns);
    console.log(controls.tag, controls.turns);
  });

  // --------------------------------------

  // ON LOAD POPULATE CHAMBER --
  $('#load').on('click', function() {
    if (controls.gameLoad.length > 0) {
      var currentListing = controls.gameLoad.shift();
    } else {
      console.log('ERROR: mag empty');
      return;
    }
    $('ul').empty();
    $('ul').append(`<li><img src=${currentListing.image}></li>`);
    $('ul').append(`<li>${currentListing.title}</li>`);
    $('ul').append(`<li>${currentListing.description}</li>`);
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

  // LOAD GAME --------------------------
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

      // POPULATE GAMELOAD ---------------------
      while (controls.gameLoad.length < gameLength) {
        var range = controls.listingObjects.length;
        var randomIndex = Math.floor(Math.random() * range);
        var randomListing = controls.listingObjects[randomIndex];
        //------------------------------------------
        if (!controls.gameLoad.includes(randomListing)) {
          console.log(randomIndex);
          controls.gameLoad.push(controls.listingObjects[randomIndex]);
        }
      }
      console.log(controls.gameLoad);

      // GET IMAGES ---------------------------
      controls.gameLoad.forEach(function(listing) {
        // setTimeout(function() {
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
        // }, Math.floor(Math.random() * 10000));
      });
    });
  };
  // --------------------------------------------------------------------------
  /////////////////////////////////////////////////////////////////////////////
});
//ready^
