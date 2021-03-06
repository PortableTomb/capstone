const express = require('express');
const boom = require('boom');
const knex = require('../knex');
const { camelizeKeys } = require('humps');
const { decamelizeKeys } = require('humps');
const jwt = require('jsonwebtoken');
// eslint-disable-next-line new-cap
const router = express.Router();

const authorize = function(req, res, next) {
  // req.token = {userId: 1};
  // return next();
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.token = decoded;
    next();
  });
};

router.get('/posts', (_req, res, next) => {
  knex('users_posts')
    .orderBy('id')
    .then((rows) => {
      const posts = camelizeKeys(rows);

      res.send(posts);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/posts/:id', authorize, (req, res, next) => {
  const Id = Number(req.params.id);

  knex('users_posts')
    .where('id', Id)
    .then((rows) => {
      const posts = camelizeKeys(rows);

      res.send(posts);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/posts/:id/comments', authorize, (req, res, next) => {
  const Id = req.params.id;

  knex('users_posts')
    .where('users_posts.id', Id)
    .innerJoin('users_comments', 'users_posts.id', 'users_comments.post_id')
    .select('users_comments.comment_content')
    .then((rows) => {
      const post_comments = camelizeKeys(rows);

      res.send(post_comments);
    })
    .catch((err) => {
      next(err);
    });
});


router.post('/posts', authorize, (req, res, next) => {
  const {topicId, postTitle, postUrl, postImage, postText} = req.body;
  const userId = req.token.userId;
  const insertPost = { userId, topicId, postTitle, postUrl, postImage, postText };
    knex('users_posts')

    .insert(decamelizeKeys(insertPost), '*')

    .then((rows) => {
      const post = camelizeKeys(rows[0]);

      res.send(post);
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });

});

router.patch('/posts/:id', authorize, (req, res, next) => {
  knex('users_posts')
    .where('id', req.params.id)
    .first()
    .then((post) => {
      if (!post) {
        throw boom.create(404, 'Not Found');
      }

      const {topicId, votes, likes, postTitle, postUrl, postImage, postText} = req.body;
      const userId = req.token.userId;
      const updatePost = {};

      if (votes) {
        updatePost.votes = req.body.votes;
      }

      return knex('users_posts')
        .update(decamelizeKeys(updatePost), '*')
        .where('id', req.params.id);
    })
    .then((rows) => {
      const votes = camelizeKeys(rows[0]);

      res.send(votes);
    })
    // likes
  //   if (likes) {
  //     updatePost.likes = req.body.likes;
  //   }
  //
  //   return knex('users_posts')
  //     .update(decamelizeKeys(updatePost), '*')
  //     .where('id', req.params.id);
  // })
  // .then((rows) => {
  //   const likes = camelizeKeys(rows[0]);
  //
  //   res.send(likes);
  // })
    // likes
    .catch((err) => {
      next(err);
    });
});

router.delete('/posts/:id', authorize, (req, res, next) => {
  let post;

  knex('users_posts')
  .where('id', req.params.id)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(404, 'Not Found');
      }

      post = camelizeKeys(row);
      return knex('users_posts')
        .del()
        .where('id', req.params.id);
    })
    .then(() => {
      delete post.id;
      res.send(post);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
