const projects = [
      {
            'name': 'use AI and DALL-E to generate random new Pokemon  [React + NodeJS]',
            'url': 'https://sebastian-ch.github.io/newPokeGenerator/',
            'github': 'https://github.com/sebastian-ch/newPokeGenerator'
      },
      {
        'name': 'Digidex [React]',
        'url': 'https://digimon.rocks/',
        'github': 'https://github.com/sebastian-ch/digidex'
      },
      {
        'name': 'GloNAF Atlas - Master\'s Thesis [d3]',
        'url': 'https://sebastian-ch.github.io/glonafAtlas/',
        'github': 'https://github.com/sebastian-ch/glonafAtlas'
      },
      {
        'name': 'US Zip Code <-> German Zip Code [Leaflet]',
        'url': 'https://sebastian-ch.github.io/zipcodes/',
        'github': 'https://github.com/sebastian-ch/zipcodes'
      },
      {
        'name': 'Every County [d3]',
        'url': 'https://sebastian-ch.github.io/everyCounty/',
        'github': 'https://github.com/sebastian-ch/everyCounty'
      },
      {
        'name': 'Heat map of my location 2019-2020 [Leaflet + NodeJS backend]',
        'url': 'https://sebastian-ch.github.io/TrackMe/',
        'github': 'https://github.com/sebastian-ch/TrackMe'
      },
      {
        'name': 'I rode a scooter 550 miles from Phnom Penh to Saigon [Leaflet]',
        'url': 'https://sebastian-ch.github.io/motorbike-trip/',
        'github': 'https://github.com/sebastian-ch/motorbike-trip'
      },
      {
        'name': 'Find your FEMA flood zone [Leaflet]',
        'url': 'https://sebastian-ch.github.io/floodzones/',
        'github': 'https://github.com/sebastian-ch/floodzones'
      },
      {
        'name': 'Virginia Population [React + Mapbox]',
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
        'name': 'I made a website for my Stardew Valley farm [React]',
        'url': 'https://sebastian-ch.github.io/stromFarms/',
        'github': 'https://github.com/sebastian-ch/stromFarms'
      },
      {
        'name': 'Search flickr for geotagged photos [Leaflet]',
        'url': 'https://sebastian-ch.github.io/flickrTagSearch/',
        'github': 'https://github.com/sebastian-ch/flickrTagSearch'
      },
      {
        'name': 'NodeJS app to track TheBus on Oahu [Leaflet]',
        'url': 'https://github.com/sebastian-ch/OahuBusMap',
        'github': ''
      },

    ]


    addToHtml()

    function addToHtml() {

        const wrap = document.getElementById('github-pin');

        projects.forEach(function(x) {
          //console.log(x);
          const linky = document.createElement('a')
          const created = document.createElement('li')
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



const mapHover = document.getElementById('maps')
const beachHover = document.getElementById('beach')
const hikingHover = document.getElementById('hiking')

const mappic = document.getElementsByClassName('mappic')
const beachpic = document.getElementsByClassName('beachpic')
const hikingpic = document.getElementsByClassName('hikingpic')

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


//eventually adding a night mode like the cool kids have
function getLocaltime(){
  return new Date().getHours();
}
console.log(getLocaltime());

if(getLocaltime() < 5 || getLocaltime() > 19) {
  console.log('good evening')
} else {
  console.log('good day')
}
