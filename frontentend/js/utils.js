//* Common scripts to use both dbhelper and sw for fetching and reading data with idb *//

const dbPromise = idb.open('restaurants-store', 3, function(db) {
  if (!db.objectStoreNames.contains('restaurants')) {
    db.createObjectStore('restaurants', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('reviews')) {
    db.createObjectStore('reviews', {keyPath: 'restaurant_id'});
  }
  if (!db.objectStoreNames.contains('sync-reviews')) {
    db.createObjectStore('sync-reviews', {keyPath: 'id'});
  }
  if (!db.objectStoreNames.contains('sync-favorite')) {
    db.createObjectStore('sync-favorite', {keyPath: 'id'});
  }
});


function writeToIdb(st, data) {
  return dbPromise.then(db => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    // console.log(data)
    store.put(data);
    return tx.complete;
  }).catch(error => {
    console.error(error)
  })
}

function readAllFromIdb(st) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readonly');
      var store = tx.objectStore(st);
      return store.getAll();
    });
}

function readOneFromIdb(st, id) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readonly');
      var store = tx.objectStore(st);
      return store.get(Number(id));
    }).then(obj => {
      // console.log(obj)
      return obj
    })
}

function addReviewToIdb(st, id, data) {
  return dbPromise
    .then(function(db) {
      const tx = db.transaction(st, 'readwrite');
      const store = tx.objectStore(st);
      const restaurant = store.get(Number(id));
      // console.log(restaurant)
      // restaurant.reviews.append(data)
      return store.get(Number(id)).then(obj => {
        obj.reviews.push(data);
        console.log(obj)
        return store.put(obj)
      })
    }).then(obj => {
      // obj.reviews.push(data);
      console.log(obj)
      return obj
    })
}

// function deleteItemFromData(st, id) {
//   dbPromise
//     .then(function(db) {
//       var tx = db.transaction(st, 'readwrite');
//       var store = tx.objectStore(st);
//       store.delete(id);
//       return tx.complete;
//     })
//     .then(function() {
//       console.log('Item deleted!');
//     });
// }

function deleteItemFromIdb(st, id) {
  dbPromise.then((db) => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.delete(id);
    return tx.complete;
  })
  .then(()=> {
    console.log('Item deleted');
  });
}

//*** Need to refactor this. i'm using similar function in restaurant info and dbhelper */
function checkFavoriteStatus() {

}