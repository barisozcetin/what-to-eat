let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL().then(restaurant => {
    // console.log(restaurant);
    // console.table(restaurant);
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: restaurant.latlng,
      scrollwheel: false,
      tabIndex: -1
    });
    fillBreadcrumb()
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        /** noTabOnMap function is Located in app.js */
    google.maps.event.addListener(map, 'idle', noTabOnMap);
    google.maps.event.addListener(map, 'idle', setTitleToIframe);
  })
  .catch(error=> {
    console.error(error)
  })
}



/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  return new Promise((resolve, reject) => {
    if (self.restaurant) { // restaurant already fetched!
      resolve(self.restaurant);
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
      error = 'No restaurant id in URL'
      reject(error);
    } else {
      return DBHelper.fetchRestaurantById(id).then(restaurant => {
        self.restaurant = restaurant;
        if (!restaurant) {
          reject(error);
        }
        return restaurant
      }).then((restaurant) => {
        fetchReviewsForRestaurant(id).then(reviews => {
          // console.log(reviews)
          self.restaurant.reviews = reviews;
          return restaurant;
          
        })
        .then(restaurant => {

            fillRestaurantHTML();
            resolve(restaurant);
        })
        
      })
      .catch(error => {
        console.error(error)
      })
    }
  })
  
}


//** Fetching restaurant reviews */
fetchReviewsForRestaurant = (restaurantId) => {
  return DBHelper.fetchReviewsForRestaurant(restaurantId);
}



//** Posting new review to restaurant */
postReviewToRestaurant = () => {
  // event.preventDefault();
  const name = document.querySelector('#review-name').value.trim();
  const rating = document.querySelector('input[name="score"]:checked').value;
  const comments = document.querySelector('#review-text').value.trim();
  const restaurant_id = self.restaurant.id
  if (name != '' && rating && comments != '') {
    const review = {
      restaurant_id,
      name,
      rating,
      comments,
      id: new Date().getTime()
    }
    DBHelper.postReviewToRestaurant(restaurant_id,review)
    .then(response => {
      console.log('aaaa' + response)
      if (response) {
        console.log(response)
        const reviewList = document.getElementById('reviews-list');
        reviewList.prepend(createReviewHTML(response));
        return true
      }
    }) 
    // .then(response => {
    //   console.log(response)
    //   // const reviewList = document.getElementById('reviews-list');
    //   // reviewList.prepend(createReviewHTML(response));
    //   return true;
    // })
  } else {
    return false;
  }
  // console.log(this)
}


//** Check if the restaurant is in favorites */
checkFavoriteStatus = (restaurant = self.restaurant) => {
  if (self.restaurant.hasOwnProperty("is_favorite")) {
    return self.is_favorite;
  } else return false;
};





// const favoriteButton = document.getElementById('favorite-btn');
//*** TOGGLES FAVORITE STATUS */
toggleFavorite = (restaurant = self.restaurant) => {
  let command = restaurant.is_favorite.toString()  == 'true' ? false : true;
  
  DBHelper.toggleFavoriteStatus(restaurant.id, command).then(updatedRestaurant => {
    if (updatedRestaurant) {
      self.restaurant.is_favorite = updatedRestaurant.is_favorite;
      favoriteButton.setAttribute('aria-checked', updatedRestaurant.is_favorite);
      favoriteButton.innerHTML = updatedRestaurant.is_favorite.toString() == 'true'  ?  '❤️' :  '🖤'   ;
      let favoriteLabel = updatedRestaurant.is_favorite.toString() == 'true'  ? 'Restaurant is in favorites. Click to unfavorite' : 'Restaurant is not in favorites. Click to favorite';
      favoriteButton.setAttribute('aria-label',favoriteLabel)
    } else {
      console.log('updated yok')
      let staus = !self.restaurant.is_favorite
      console.log(status)
      self.restaurant.is_favorite = staus
      favoriteButton.setAttribute('aria-checked', status);
      favoriteButton.innerHTML = status.toString() == 'true'  ?  '❤️' :  '🖤'   ;
      let favoriteLabel = status.toString() == 'true'  ? 'Restaurant is in favorites. Click to unfavorite' : 'Restaurant is not in favorites. Click to favorite';
      favoriteButton.setAttribute('aria-label',favoriteLabel)
    }
    
  })

}



/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  // console.log(restaurant)
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  let favoriteLabel = restaurant.is_favorite.toString() == 'true'  ? 'Restaurant is in favorites. Click to unfavorite' : 'Restaurant is not in favorites. Click to favorite';
  favoriteButton.setAttribute('aria-label',favoriteLabel)
  favoriteButton.innerHTML = restaurant.is_favorite.toString() == 'true' ?  '❤️' : '🖤';
  favoriteButton.setAttribute('aria-checked', restaurant.is_favorite);
  //*** ADDING EVENT LISTENER TO FAVORITE TOGGLE BUTTON */
  favoriteButton.addEventListener("click", (event) => {
    event.preventDefault();
    toggleFavorite();
  });

  const image = document.getElementById('restaurant-img');
  const webpSource = document.getElementById('webp-source');
  const jpegSource = document.getElementById('jpeg-source');
  image.className = 'restaurant-img'
  jpegSource.srcset = DBHelper.imageSrcSetForRestaurant(restaurant) || '/img/default.jpg';
  webpSource.srcset = DBHelper.imageWebpForRestaurant(restaurant);
  image.sizes=`(max-width: 320px) 280px,
            (max-width: 480px) 440px,
            800px`
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  
  
  image.alt = `${restaurant.name} Restaurant's photo`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();

  //** ADDED EVENT LISTENER TO NEW REVIEW FORM */
  const reviewForm = document.querySelector('#new-review-form');
  reviewForm.addEventListener('submit', event => {
    event.preventDefault();
    postReviewToRestaurant();
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
  .forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
// Added tab index to all comment elements - Barış

createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabIndex="0";
  const name = document.createElement('p');
  name.tabIndex="0";
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleString() ;
  date.tabIndex="0";
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.tabIndex="0"
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex="0";
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page')
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}






//*** Custom code */
const favoriteButton = document.querySelector('#favorite-btn');

function toggleHeart() {
  if ( favoriteButton.innerHTML == '🖤') favoriteButton.innerHTML = '❤️'
  else favoriteButton.innerHTML = '🖤';
}

// favoriteButton.addEventListener("mouseover", toggleHeart);
// favoriteButton.addEventListener("mouseleave", toggleHeart);

const reviewText = document.querySelector('#review-text');
reviewText.addEventListener("focus", function(event) {
  this.rows = 4;
})