const MongoClient = require('mongodb').MongoClient;
const user = process.env.BLOG_MONGO_USER;
const pw = process.env.BLOG_MONGO_PW;
const server = process.env.BLOG_MONGO_SERVER;
const url = `mongodb://${user}:${pw}@${server}/main-blog`;

const getPosts = function(db) {
  return new Promise(function(resolve, reject) {
    const col = db.collection('posts');
    col.find().toArray()
      .then(function(posts) {
        resolve(posts);
      });
  });
}

const savePost = function(deets, timestamp, db, onSuccess, onError) {
  db.collection('posts')
    .insertOne({
      deets: deets,
      timestamp: timestamp
    }, function(err, result) {
      if (err) { return onError(err); }
      db.collection('posts')
        .count()
        .then(function(posts) {
          if (typeof onSuccess === 'function') {
            onSuccess(posts);
          }
        });
    });
}

const updatePost = function(post, db, onSuccess, onError) {
  db.collection('posts')
    .update(
      { timestamp: post.timestamp }, 
      { $set: { deets: post.deets, timestamp: post.timestamp }},
      function(err, result) {
        if (err) { return onError(err); }

        console.log('document updated!');

        if (typeof onSuccess === 'function') {
          onSuccess('updated!');
        }
      }
    );
}

const deletePost = function(post, db, onSuccess, onError) {
  db.collection('posts')
    .remove(
      { timestamp: post.timestamp }, 
      function(err, result) {
        if (err) { return onError(err); }

        console.log('document deleted!');

        if (typeof onSuccess === 'function') {
          onSuccess('deleted!');
        }
      }
    );
}

module.exports = {
  getPosts: function(onSuccess, onFailure) {
    MongoClient.connect(url, function(err, db) {
      getPosts(db)
        .then(function(posts) {
          onSuccess(posts);
        });
    });
  },
  savePost: function(deets, timestamp, onSuccess, onError) {
    MongoClient.connect(url, function(err, db) {
      if (err) {
        return onError(err);
      }

      savePost(deets, timestamp, db, onSuccess, onError);
    });
  },
  updatePost: function(post, timestamp, onSuccess, onError) {
    MongoClient.connect(url, function(err, db) {
      if (err) {
        return onError(err);
      }

      updatePost(post, db, onSuccess, onError);
    });
  },
  deletePost: function(post, onSuccess, onError) {
    MongoClient.connect(url, function(err, db) {
      if (err) {
        return onError(err);
      }

      deletePost(post, db, onSuccess, onError);
    });
  }
}