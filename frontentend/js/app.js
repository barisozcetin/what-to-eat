/** Decided to add the scripts which is complately written by me in an additional file
 * also registering the service worker in this file
 */


 /**
 * Initiate service worker
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => {
      console.log('Service worker registered...');
    })
    .catch(err => {
      console.log(err);
    });
}

/** I intended to listen idle event on map but it didn't load all the links and buttons on map. so i had to use some hacky way and use set timeout */
function noTabOnMap() {
  setTimeout(function(){ 
    const mapDiv = document.querySelector('#map-container');
    let mapLinks = mapDiv.querySelectorAll("#map-container *");
    for (let link of mapLinks) {
      link.tabIndex = "-1";
    }
  }, 1000);
}

//** Adding title to iframe for accessibility */
function setTitleToIframe() {
  setTimeout(() => {
    const mapsIframe = document.querySelector('iframe');
    mapsIframe.title = 'Google Maps'
  }, 1000);
}




