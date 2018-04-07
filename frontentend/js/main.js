let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
// fetchNeighborhoods = () => {
//   DBHelper.fetchNeighborhoods((error, neighborhoods) => {
//     if (error) { // Got an error
//       console.error(error);
//     } else {
//       self.neighborhoods = neighborhoods;
//       fillNeighborhoodsHTML();
//     }
//   });
// }

fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods().then(neighborhoods => {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }).catch(error => {
    console.log(error);
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
// fetchCuisines = () => {
//   DBHelper.fetchCuisines((error, cuisines) => {
//     if (error) { // Got an error!
//       console.error(error);
//     } else {
//       self.cuisines = cuisines;
//       fillCuisinesHTML();
//     }
//   });
// }

fetchCuisines = () => {
  DBHelper.fetchCuisines().then(cuisines => {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  }).catch(error => {
    console.log(error);
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
  google.maps.event.addListener(map, 'idle', noTabOnMap);
  google.maps.event.addListener(map, 'idle', setTitleToIframe);
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const fSelect = document.getElementById('favorites-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const fIndex = fSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  const isFavorite = fSelect[fIndex].value;
 
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine,neighborhood, isFavorite).then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
// Added tab index and image alt 

createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const picture = document.createElement('picture');
  const webpSource = document.createElement('source');
  // const jpegSource = 
  webpSource.srcset = DBHelper.webpThumbnailForRestaurant(restaurant);
  webpSource.type = 'image/webp';

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  // image.srcset = DBHelper.imageSrcSetForRestaurant(restaurant);
  // image.sizes=`(max-width: 320px) 280px,
  //           (max-width: 480px) 440px,
  //           800px`;
  image.src = DBHelper.imgThumbnailForRestaurant(restaurant);
  image.alt = `${restaurant.name} Restaurant's photo`;
  picture.append(webpSource);
  picture.append(image);
  li.append(picture);
  

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  name.tabIndex="0";
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.tabIndex="0"
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.tabIndex="0";
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.tabIndex="0";
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}





//*** On mobile screen, filter aria is hidden. It can be expanded with button  */
const filterGroup = document.querySelector('#select-group');
const expandFiltersButton = document.querySelector('#expand-filters-btn');
expandFiltersButton.addEventListener("click", function(event) {
  this.setAttribute('aria-checked', this.getAttribute('aria-checked') == 'true' ? 'false' : 'true');
  filterGroup.setAttribute('aria-label', filterGroup.getAttribute('aria-expanded') == 'true' ? 'Expands filters' : 'Collapse filters' );
  filterGroup.setAttribute('aria-expanded', filterGroup.getAttribute('aria-expanded') == 'true' ? 'false' : 'true' );
  
})