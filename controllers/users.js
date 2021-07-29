const User = require('../models/user');
const Book = require('../models/book');
const { isValidObjectId } = require('mongoose');
const { cloudinary } = require('../cloudinary');

//NEW FORM
module.exports.renderNewForm = (req, res) => {
  res.render('users/register');
};

//CREATE
module.exports.create = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const newUser = await User.register(user, password); //register is a Passport method used to create a new user instance with a given password (checks if user is unique)
    //Passport provides the login() function which allows use to login the user after they are registered
    req.login(newUser, (err) => {
      if (err) return next(err);
    });
    // req.flash('success', `Welcome to Yelp Came ${username}!`);
    res.redirect('/books');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
};

//LOGIN FORM
module.exports.renderLoginForm = (req, res) => {
  res.render('users/login');
};

//LOGIN AUTHENTICATE
module.exports.authenticateUser = (req, res) => {
  // req.flash('success', 'Welcome back!');
  const redirectURL = req.session.returnTo || '/books';
  delete req.session.returnTo; //this is how we delete something from an object - we don't need it after the line above so we delete it
  res.redirect(redirectURL);
};

//LOGOUT
module.exports.logout = (req, res) => {
  req.logout();
  // req.flash('success', 'Logged out.');
  res.redirect('/books');
};

// PROFILE
module.exports.getProfile = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    req.flash('error', 'Invalid user ID.');
    res.redirect('/books');
  }
  const user = await User.findById(id).populate('profile.favorites').exec();
  const booksOffered = await Book.find({ owner: id }).countDocuments();
  const books = await Book.find({ owner: id }).limit(5);
  res.render('users/profile', { user, books, booksOffered });
};

module.exports.getEditProfile = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    req.flash('error', 'Invalid user ID.');
    res.redirect('/books');
  }
  const user = await User.findById(id);
  res.render('users/edit-profile', { user });
};

module.exports.editProfile = async (req, res) => {
  const { id } = req.params;
  const { name, bio, location } = req.body.profile;

  const user = await User.findById(id);
  user.profile.name = name;
  user.profile.bio = bio;
  user.profile.location = location;

  const images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));

  user.profile.images.push(...images);

  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await user.updateOne({
      $pull: {
        'profile.images': { filename: { $in: req.body.deleteImages } },
      },
    });
  }
  await user.save();
  req.flash('success', 'Profile updated successfully!');
  res.redirect(`/profile/${id}`);
};

// FAVORITE
module.exports.favorite = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    req.flash('error', 'Invalid book ID.');
    res.redirect('/books');
  }

  const book = await Book.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'owner',
      },
    })
    .populate('owner');

  if (!book) {
    req.flash('error', 'No book found with this id.');
    res.status(404).redirect('/books');
  }

  const user = await User.findById(req.user._id);
  if (user.profile.favorites.includes(id)) {
    user.profile.favorites.pull(id);
    res.status(200).json({ message: 'success', removed: true });
  } else {
    user.profile.favorites.push(id);
    res.status(200).json({ message: 'success', removed: false });
  }
  await user.save();
};
