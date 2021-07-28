const User = require('../models/user');
const Book = require('../models/book');
const { isValidObjectId } = require('mongoose');

//NEW FORM
module.exports.renderNewForm = (req, res) => {
  res.render('users/register');
};

//CREATE
module.exports.create = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username }); //note that if the variable shares the same name as the model field then we can do it like this (as opposed to: {email: email, username: username})
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

// Profile
module.exports.getProfile = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  res.render('users/profile', { user });
};

// Favorite
module.exports.favorite = async (req, res) => {
  const { id } = req.params;
  const { page } = req.query;

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

  // if (page) {
  //   res.status(200).redirect(`/books?page=${page}`);
  // } else {
  //   res.status(200).redirect(`/books/${id}`);
  // }
};
