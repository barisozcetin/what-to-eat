importScripts("/js/idb.js");
importScripts("/js/utils.js");
// Caching static assets at install process
const CACHE_STATIC_NAME = "static-v1";
const CACHE_DYNAMIC_NAME = "dynamic-v1";

self.addEventListener("install", function(event) {
  console.log("[Service Worker] Installing Service Worker ...", event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function(cache) {
      console.log("[Service Worker] Caching static assets");
      cache.addAll([
        "/",
        "/index.html",
        "/restaurant.html",
        "/offline.html",
        "/js/main.js",
        "/js/app.js",
        "/js/idb.js",
        "/js/dbhelper.js",
        "/js/utils.js",
        "/js/restaurant_info.js",
        "/css/styles.css",
        "/css/styles.min.css"
        // 'https://normalize-css.googlecode.com/svn/trunk/normalize.css',
      ]);
    })
  );
});

// const dbPromise = idb.open('restaurants-store', 1, function(db) {
//   if (!db.objectStoreNames.contains('restaurants')) {
//     db.createObjectStore('restaurants', {keyPath: 'id'});
//   }
// })

self.addEventListener("activate", function(event) {
  console.log("[Service Worker] Activating Service Worker ....", event);
  return self.clients.claim();
});

// First checking cache for matching response. If not fetching and putting a clone in dynamic cache
self.addEventListener("fetch", function(event) {
  console.log(event.request.url)
  const dbUrl = "http://localhost:1337/restaurants";
  const reviewsUrl = "http://localhost:1337/reviews/";
  if (event.request.url.includes(dbUrl)) {
    // console.log('includes')
    event.respondWith(
      fetch(event.request).then(res => {
        const cloneRes = res.clone();
        cloneRes.json().then(data => {
          // console.log(data)
          if (data.length > 1) {
            for (const rest of data) {
              writeToIdb("restaurants", rest);
            }
          }
        });
        return res;
      })
    );
  } else if (event.request.url.includes(reviewsUrl)) {
    // console.log('reviews fetch ' + event.request.url)
    // console.log(event.request)
    const restaurantId = Number(event.request.url.split("id=")[1]);
    // console.log(restaurantId)
    event.respondWith(
      fetch(event.request).then(res => {
        const cloneRes = res.clone();
        cloneRes.json().then(data => {
          // console.log('response datası: ' + data)
          const reviewData = { restaurant_id: restaurantId, reviews: [] };
          for (const review of data) {
            reviewData.reviews.push(review);
          }
          // console.log(reviewData)
          writeToIdb("reviews", reviewData);
        });
        return res;
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function(res) {
              return caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(error => {
              console.error(error);
              return caches.match("/offline.html");
            });
        }
      })
    );
  }
});

// else if (event.request.url.includes(reviewsUrl) ){
//   console.log('reviews fetch ' + event.request.url)
//   event.respondWith(fetch(event.request)
//   .then(res => {
//     const cloneRes = res.clone();
//     cloneRes.json()
//     .then(data => {
//       console.log('response datası: ' + data)
//       // for (const review of data) {
//       //   writeToIdb('reviews', review);
//       // }
//     })
//     return res;
//   }))
// }

// self.addEventListener("sync", event => {
//   console.log("Background sync started", event);
//   if (event.tag === "sync-new-review") {
//     console.log("Syncing new posts");
//     event.waitUntil(
//       readAllFromIdb("sync-reviews").then(data => {
//         for (let review of data) {
//           console.log(review);
//           fetch('http://localhost:1337/reviews/', {
//             method: "POST",
//             headers: {
//               "content-type": "application/json",
//               accept: "application/json"
//             },
//             body: JSON.stringify({
//               restaurant_id: review.restaurant_id,
//               name : review.name,
//               rating: review.rating,
//               comments: review.comments
//             })
//           })
//             .then(response => {
//               if (response.ok) {
//                 deleteItemFromIdb('sync-reviews', review.name);
//               }
//             })
//         }

//       })
//     );
//   }
// });

/** Event listener for background sync */
self.addEventListener("sync", function(event) {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === "sync-new-review") {
    console.log("[Service Worker] Syncing new Posts");
    event.waitUntil(
      readAllFromIdb("sync-reviews").then(data => {
        for (let review of data) {
          // console.log(review);
          fetch("http://localhost:1337/reviews/", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json"
            },
            body: JSON.stringify(review)
          }).then(response => {
            if (response.ok) {
              response.json().then(data => {
                // console.log(data)
                addReviewToIdb("reviews", review.restaurant_id, data);
                deleteItemFromIdb("sync-reviews", review.id);
              });
            }
          });
        }
      })
    );
  }
  if (event.tag === "sync-favorite-status") {
    console.log("[Service Worker] Syncing favorite changes");
    event.waitUntil(
      readAllFromIdb("sync-favorite").then(data => {
        for (let restaurant of data) {
          // console.log(review);
          fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=` + restaurant.status, {
            method: "PUT",
            headers: {
              "content-type": "application/json",
              "accept": "application/json"
            }
          }).then(response => {
            if (response.ok) {
              response.json().then(data => {
                // console.log(data)
                // addReviewToIdb("reviews", review.restaurant_id, data);
                readOneFromIdb("restaurants",restaurant.id).then(res => {
                  res.is_favorite = restaurant.status
                  writeToIdb("restaurants",res).then(() => {
                    deleteItemFromIdb("sync-favorite", restaurant.id);
                  })
                })
                
              });
            }
          });
        }
      })
    );
  }
});
