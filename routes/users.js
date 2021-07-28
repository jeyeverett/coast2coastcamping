const express = require('express');
const router = express.Router();
const passport = require('passport');
const users = require('../controllers/users');
const catchAsync = require('../utilities/catchAsync');
const {
  isLoggedIn,
  isProfileOwner,
  validateProfile,
} = require('../middleware');

const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

//Here we use the router.route method to group our routes
router
  .route('/register')
  .get(users.renderNewForm)
  .post(catchAsync(users.create));

router
  .route('/login')
  .get(users.renderLoginForm)
  .post(
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    users.authenticateUser
  );

router.get('/logout', users.logout);

router
  .route('/profile/:id/edit')
  .get(isLoggedIn, isProfileOwner, users.getEditProfile)
  .put(
    isLoggedIn,
    isProfileOwner,
    upload.array('image'),
    validateProfile,
    catchAsync(users.editProfile)
  );

router.route('/profile/:id').get(users.getProfile);

router.post('/favorite/:id', isLoggedIn, catchAsync(users.favorite));

module.exports = router;
