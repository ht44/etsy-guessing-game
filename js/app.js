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
    $('ul').empty();
    controls.tag = $('#tag').val();
    controls.turns = $('#turns').val();
    controls.listingObjects = [];
    controls.gameLoad = [];
    loadGame(controls.tag, controls.turns);
    console.log(controls.tag, controls.turns);
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
    // WHEN DONE -------------
    getListings.done(function(data) {
      var results = data.results;
      // CONSTRUCT OBJECTS -------
      results.forEach(function(result) {
        var listingObject = new Listing (
          result.listing_id,
          result.title,
          result.price,
          result.description
        );
        controls.listingObjects.push(listingObject);
      });

      // POPULATE GAMELOAD ------------
      for (let i = 0; i < gameLength; i++) {
        var range = controls.listingObjects.length;
        var randomIndex = Math.floor(Math.random() * range);
        console.log(randomIndex);
        controls.gameLoad.push(controls.listingObjects[randomIndex]);
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
            $('ul').append(`<li><img src=${listing.image}></li>`);
          });
        // }, Math.floor(Math.random() * 5000));
      });
    });
  };

  /////////////////////////////////////////////////////////////////////////////

});
//ready^
