'use strict';

$(function() {
  // SHARIABLES
  var controls = {
    limit: 10,
    shuffleFor: 3,
    imageUrls: [],
    listingIDs: [],
    shuffledIDs: [],
    tag: 'awesome',
    tags: [
      'weird', 'odd', 'curiosities', 'oddities',
      'unusual', 'bdsm', 'kinky', 'circus', 'dark',
      'fetish', 'bondage', 'sideshow', 'freak', 'gross',
      'mature', 'fun', 'cool', 'awesome'
    ]
  };

  // ON CLICK GET EVERYTHING-----
  $('button').on('click', function() {
    $('ul').empty();
    controls.imageUrls = [];
    controls.listingIDs = [];
    controls.shuffledIDs = [];
    letsGetWeird(controls.tag, controls.limit, controls.shuffleFor);
  });

  // GETS EVERYTHING ------------------------------------
  function letsGetWeird(tagParam, limitParam, shuffleLength) {
    var listingRequest = `https://openapi.etsy.com/v2/listings/active.js?tags=${tagParam}&limit=${limitParam}&api_key=${etsyKey}`;
    // GET WEIRD --------
    var getWeird = $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      url: listingRequest
    });
    // WHEN DONE -------------
    getWeird.done(function(data) {
      var results = data.results;
      // GATHER IDS ----------------
      results.forEach(function(result) {
        var listingID = result.listing_id;
        controls.listingIDs.push(listingID);
      });
      // SHUFFLE IDS --------------------------
      controls.shuffledIDs = shuffleListings(controls.listingIDs, shuffleLength);
      // GET WEIRD IMAGES ----------------
      controls.shuffledIDs.forEach(function(listingID) {
        setTimeout(function() {
          var imageRequest = `https://openapi.etsy.com/v2/listings/${listingID}/images.js?api_key=${etsyKey}`;
          var getWeirdImages = $.ajax({
            type: 'GET',
            dataType: 'jsonp',
            url: imageRequest
          });
          // WHEN DONE IMAGES -----------------
          getWeirdImages.done(function(imageData) {
            var imageUrl = imageData.results[0].url_570xN;
            controls.imageUrls.push(imageUrl);
            $('ul').append(`<li><img src=${imageUrl}></li>`);
          });
        });
        // ADD RANDO ABOVE IF GOING ABOVE 10
      });
      //images^
      console.log(controls.imageUrls);
    });
    //data^
  };

  // SHUFFLES ----------------------------------
  function shuffleListings(listings, desiredLength) {
    var shuffledListings = [];
    while (shuffledListings.length < desiredLength) {
      let randomIndex = Math.floor(Math.random() * listings.length);
      if (!shuffledListings.includes(listings[randomIndex])) {
        shuffledListings.push(listings[randomIndex]);
      }
    }
    return shuffledListings;
  };
});
//ready^
