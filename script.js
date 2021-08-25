const projects = [
      {
        'name': 'Digidex',
        'url': 'https://digimon.rocks/',
        'github': 'https://github.com/sebastian-ch/digidex'
      },
      {
        'name': 'US Zip Code <-> German Zip Code',
        'url': 'https://sebastian-ch.github.io/zipcodes/',
        'github': 'https://github.com/sebastian-ch/zipcodes'
      },
      {
        'name': 'Every County',
        'url': 'https://sebastian-ch.github.io/zipcodes/',
        'github': 'https://github.com/sebastian-ch/zipcodes'
      },
      {
        'name': 'Heat map of my location 2019-2020',
        'url': 'https://sebastian-ch.github.io/TrackMe/',
        'github': 'https://github.com/sebastian-ch/TrackMe'
      },
      {
        'name': 'I rode a scooter 550 miles from Phnom Penh to Saigon',
        'url': 'https://sebastian-ch.github.io/motorbike-trip/',
        'github': 'https://github.com/sebastian-ch/motorbike-trip'
      },
      {
        'name': 'Find your FEMA flood zone',
        'url': 'https://sebastian-ch.github.io/floodzones/',
        'github': 'https://github.com/sebastian-ch/floodzones'
      },
      {
        'name': 'Virginia Population w/ Mapbox + React',
        'url': 'https://sebastian-ch.github.io/virginiaPopulation/',
        'github': 'https://github.com/sebastian-ch/virginiaPopulation'
      },
      {
        'name': 'My old portfolio',
        'url': 'https://sebastian-ch.github.io/oldportfolio/',
        'github': 'https://github.com/sebastian-ch/oldportfolio'
      },
      {
        'name': 'basic flashcards to learn German',
        'url': 'https://sebastian-ch.github.io/flashCards/',
        'github': 'https://github.com/sebastian-ch/flashCards'
      },
      {
        'name': 'I made a website for my Stardew Valley farm',
        'url': 'https://sebastian-ch.github.io/stromFarms/',
        'github': 'https://github.com/sebastian-ch/stromFarms'
      },
      {
        'name': 'Search flickr for geotagged photos',
        'url': 'https://sebastian-ch.github.io/flickrTagSearch/',
        'github': 'https://github.com/sebastian-ch/flickrTagSearch'
      },
      {
        'name': 'NodeJS app to track TheBus on Oahu ',
        'url': 'https://github.com/sebastian-ch/OahuBusMap',
        'github': ''
      },

    ]


    addToHtml()

    function addToHtml() {

        var wrap = document.getElementById('github-pin');

        projects.forEach(function(x) {
          //console.log(x);
          var linky = document.createElement('a')
          var created = document.createElement('li')
          linky.textContent = x.name
          linky.setAttribute('href', x.url)
          linky.setAttribute('target', '_blank')

          created.appendChild(linky)

          if(!(x.github === '')) {
            var githubLinky = document.createElement('a')
            githubLinky.textContent = '(GitHub)'
            githubLinky.setAttribute('href', x.github)
            githubLinky.setAttribute('class', 'githublink')
            githubLinky.setAttribute('target', '_blank')
            created.appendChild(githubLinky)
          }
        
          wrap.appendChild(created)
        })
    }

//const priv_key = '0e8fe66ebe7d63b8a37d8b6533fdcff2121f746c';
//const pub_key = '9e656fd191967a9bf10b3f6cc034b0ac';

//callMarvel();
/*i need this for another project, 
seems cool right? who knew marvel had an API */
function callMarvel() {

  var ts = new Date().getTime();
  var hash = CryptoJS.MD5(ts + priv_key + pub_key).toString(); 

  var characterId = '1009718'; // wolverine  
  //var url = 'http://gateway.marvel.com:80/v1/public/comics';

  var url = 'http://gateway.marvel.com:80/v1/public/events';
  console.log(url);
  

  $.getJSON(url, {
    ts: ts,
    apikey: pub_key,
    hash: hash,
    characters: characterId
    })
    .done(function(data) {
      // sort of a long dump you will need to sort through
      console.log(data);
    })
    .fail(function(err){
      // the error codes are listed on the dev site
      console.log(err);
    });



}


var mapHover = document.getElementById('maps')
var beachHover = document.getElementById('beach')
var hikingHover = document.getElementById('hiking')

var mappic = document.getElementsByClassName('mappic')
var beachpic = document.getElementsByClassName('beachpic')
var hikingpic = document.getElementsByClassName('hikingpic')

mapHover.addEventListener('mouseover', function(evt) {

  mappic[0].classList.remove('hide');

})

mapHover.addEventListener('mouseout', function(evt) {

  mappic[0].classList.add('hide');

})
hikingHover.addEventListener('mouseover', function(evt) {

  hikingpic[0].classList.remove('hide');

})

hikingHover.addEventListener('mouseout', function(evt) {

  hikingpic[0].classList.add('hide');

})

beachHover.addEventListener('mouseover', function(evt) {

  beachpic[0].classList.remove('hide');

})

beachHover.addEventListener('mouseout', function(evt) {

  beachpic[0].classList.add('hide');

})