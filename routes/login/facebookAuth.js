const express = require('express');
const router = express.Router();
const passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      profileFields: ['id', 'name', 'picture.type(large)', 'emails', 'displayName', 'about', 'gender'],
    },
    (accessToken, refreshToken, profile, cb) => {
      process.nextTick(() => {
        console.log('accessToken: ' + accessToken);
        console.log('refreshToken: ' + refreshToken);
        return cb(null, profile);
      });
    },
  ),
);

router.get('/success', (req, res) => {
  console.log('session1:', req.user);
  // if (req.session.passport.user) {
  //   res.status(200).json({
  //     success: true,
  //     message: 'success',
  //     user: req.session.user,
  //   });
  // }
});

router.get('/failed', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'failure',
  });
});

router.get('/', passport.authenticate('facebook', { scope: 'email' }));

router.get(
  '/callback',
  passport.authenticate('facebook', { failureRedirect: '/login/failed', successRedirect: 'http://localhost:3000' }),
  function (req, res) {
    console.log('session:', req.session);
    res.redirect('http://localhost:3000');
  },
);

router.get('/home', (req, res, next) => {
  console.log(req);
  res.json(req.session.passport.user);
});

module.exports = router;
