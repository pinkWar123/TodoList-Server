const express = require('express');
const router = express.Router();
const passport = require('passport');
var FacebookStrategy = require('facebook-strategy').Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackUrl: process.env.CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, cb) => {
      console.log(profile);
      return cb(null, profile);
    },
  ),
);

router.get('/', (req, res, next) => {
  passport.authenticate('facebook');
});

router.get('/callback', (req, res, next) => {
  passport.authenticate('facebook', { failureRedirect: '/login' }, (req, res, next) => {
    res.redirect('/');
  });
});

module.exports = router;
