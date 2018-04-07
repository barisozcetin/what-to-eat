/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    // const port = 5500 // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;

    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
  }

  static get RESTAURANT_REVIEWS_ENDPOINT() {
    return "http://localhost:1337/reviews/?restaurant_id=";
  }

  static get NEW_REVIEW_ENDPOINT() {
    return "http://localhost:1337/reviews/";
  }

  static get FAVORITE_RESTAURANTS_ENDPOINT() {
    return "http://localhost:1337/restaurants/?is_favorite=true";
  }

  static TOGGLE_FAVORITE_ENDPOINT(id, newStatus) {
    return `http://localhost:1337/restaurants/${id}/?is_favorite=${newStatus}`;
  }

  /**
   * Fetch all restaurants.
   */

  /// First checks idb for results. if results then returns them. if not fetches them. Fetching in sw adds them to idb
  static fetchRestaurants() {
    return readAllFromIdb("restaurants")
      .then(response => {
        // console.log ('dbhelper readall :'+ response);
        if (!response.length == 0) {
          return response;
        } else {
          return fetch(DBHelper.DATABASE_URL).then(response => response.json());
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  // First checkes idb. if there is response, returns it. if not fetches.
  static fetchRestaurantById(id) {
    return readOneFromIdb("restaurants", id)
      .then(response => {
        // console.log("dbhelper readone :" + response);
        if (response) {
          return response;
        } else {
          // console.log('feth yapmaya gidiyor')
          return fetch(DBHelper.DATABASE_URL + id).then(response =>
            response.json()
          );
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  /*** NEW - Fetching restaurant reviews in this new method */
  static fetchReviewsForRestaurant(restaurantId) {
    return readOneFromIdb("reviews", restaurantId)
      .then(response => {
        // console.log("dbhelper readone :" + response);
        if (response) {
          return response.reviews;
        } else {
          return fetch(
            DBHelper.RESTAURANT_REVIEWS_ENDPOINT + restaurantId
          ).then(response => {
            return response.json();
          });
        }
      })
      .catch(error => {
        console.error(error);
      });
    // return fetch(DBHelper.RESTAURANT_REVIEWS_ENDPOINT+ restaurantId).then(response => response.json());
  }

  /** NEW - Posting a new review */
  static postReviewToRestaurant(restaurantId, review) {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      return navigator.serviceWorker.ready
        .then(sw => {
          writeToIdb("sync-reviews", review)
            .then(() => {
              return sw.sync.register("sync-new-review");
            })
            .then(() => {
              // console.log ('yeni fonksiyon cevap göndermeli')
              // const response = {status: 'synced'};
              // console.log('response')
              // return response;
              const snackbar = document.querySelector("#snackbar");
              snackbar.innerHTML =
                'Your review saved for syncronization  <a href="#" id="close-notification">Dismiss</a>';
              snackbar.setAttribute("aria-expanded", "true");
              snackbar.addEventListener("click", () => {
                snackbar.setAttribute("aria-expanded", "false");
              });
              // debugger;
              setTimeout(() => {
                snackbar.setAttribute("aria-expanded", "false");
              }, 5000);
              return review;
            });
          //** Probably i should move this to restaurant info but not sure how to catch it */
        })
        .then(() => review);
    } else {
      return fetch(DBHelper.NEW_REVIEW_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(review)
      })
        .then(response => response.json())
        .then(response => {
          // console.log(response);
          return response;
        });
    }
  }

  //** Fetch all favorited restaurants */
  static fetchFavoriteRestaurants() {
    return fetch(DBHelper.FAVORITE_RESTAURANTS_ENDPOINT).then(response =>
      response.json()
    );
  }

  //** Change favorite status of a restaurant */
  static toggleFavoriteStatus(restaurantId, newStatus) {
    return fetch(DBHelper.TOGGLE_FAVORITE_ENDPOINT(restaurantId, newStatus), {
      method: "PUT"
    })
      .then(response => {
        // console.log(response);
        if ("serviceWorker" in navigator) {
          readOneFromIdb("restaurants", restaurantId).then(restaurant => {
            restaurant.is_favorite = newStatus;
            writeToIdb("restaurants", restaurant);
          });
        }
        return response.json();
      })
      .catch(error => {
        this.syncFavoriteStatus(restaurantId,newStatus)
      });
  }

  static syncFavoriteStatus(restaurantId, newStatus) {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const favoriteObject = { id: restaurantId, status: newStatus };
      return navigator.serviceWorker.ready.then(sw => {
        writeToIdb("sync-favorite", favoriteObject).then(() => {
          return sw.sync.register("sync-favorite-status");
        });
      });
    }
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  //
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        return results;
      })
      .catch(error => {
        console.error("error");
      });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        return results;
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */

  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    isFavorite
  ) {
    return DBHelper.fetchRestaurants().then(restaurants => {
      let results = restaurants;
      if (cuisine != "all") {
        // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != "all") {
        // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      if (isFavorite != "all") {
        results = results.filter(r => r.is_favorite.toString() == isFavorite);
      }
      return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        return uniqueNeighborhoods;
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */

  static fetchCuisines() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        return uniqueCuisines;
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `/restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return restaurant.photograph
      ? `/img/${restaurant.photograph}.jpg`
      : `/img/default.jpg`;
  }
  // get image sourceset
  static imageSrcSetForRestaurant(restaurant) {
    return restaurant.photograph
      ? `/img/${restaurant.photograph +
          "-320w"}.jpg 320w, /img/${restaurant.photograph +
          "-480w"}.jpg 480w, /img/${restaurant.photograph}.jpg 800w`
      : "/img/default.jpg";
  }
  static imageWebpForRestaurant(restaurant) {
    return restaurant.photograph
      ? `/img/${restaurant.photograph}.webp`
      : `/img/default.webp`;
  }
  static imgThumbnailForRestaurant(restaurant) {
    return restaurant.photograph
      ? `/img/${restaurant.photograph}-320w.jpg`
      : `/img/default.jpg`;
  }
  static webpThumbnailForRestaurant(restaurant) {
    return restaurant.photograph
      ? `/img/${restaurant.photograph}-320w.webp`
      : `/img/default-320w.webp`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
