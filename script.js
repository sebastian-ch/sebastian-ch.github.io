fetch('https://gh-pinned-repos-5l2i19um3.vercel.app/?username=sebastian-ch')
    .then(resp => resp.json())
    .then(data => {

        addToHtml(data);
        //console.log(data);        

    })

    function addToHtml(data) {

        var wrap = document.getElementById('github-pin');

        data.forEach(function(x){
            //console.log(x)
            var linky = document.createElement('a')
            var created = document.createElement('li')
            linky.textContent = x.repo
            linky.setAttribute('href', x.link)
            linky.setAttribute('target', '_blank')
            created.appendChild(linky)
            wrap.appendChild(created)

        })
    }

   /* window.onscroll = function() {myFunction()};

    // Get the navbar
    var navbar = document.getElementById("nav");
    
    // Get the offset position of the navbar
    var sticky = navbar.offsetTop;
    
    // Add the sticky class to the navbar when you reach its scroll position. Remove "sticky" when you leave the scroll position
    function myFunction() {
      if (window.pageYOffset >= sticky) {
        navbar.classList.add("sticky")
      } else {
        navbar.classList.remove("sticky");
      }
    } */

const priv_key = '0e8fe66ebe7d63b8a37d8b6533fdcff2121f746c';
const pub_key = '9e656fd191967a9bf10b3f6cc034b0ac';

//callMarvel();
 
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

