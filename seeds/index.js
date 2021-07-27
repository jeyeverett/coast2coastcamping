const mongoose = require('mongoose');
const cities = require('./canadacities');
const books = require('./book-data');
const Book = require('../models/book');

const dbURL = process.env.MONGO_URL || 'mongodb://localhost:27017/boox';

mongoose
  .connect('mongodb://localhost:27017/boox', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('Mongo connection established.');
  })
  .catch((err) => {
    console.log('Mongo connection failed.');
    console.log(err);
  });

//the sample function takes an array and returns a random item from it
const sample = (array) => array[Math.floor(Math.random() * array.length)];

//This async functions deletes the collections and then
const seedDB = async () => {
  await Book.deleteMany({});
  for (let i = 0; i < 200; i++) {
    const randomLocation = Math.floor(Math.random() * 1000);
    const randomBook = Math.floor(Math.random() * 1000);
    const random100 = Math.floor(Math.random() * 100);

    const book = new Book({
      title: books[randomBook].title,
      description: books[randomBook].description,
      author: books[randomBook].author,
      ratingInfo: {
        rating: books[randomBook].rating,
        numRatings: random100,
        sumRatings: random100 * books[randomBook].rating
      },
      language: books[randomBook].language,
      genres: books[randomBook].genres,
      pages: books[randomBook].pages,
      publisher: books[randomBook].publisher,
      firstPublishDate: books[randomBook].firstPublishDate,
      coverImg: books[randomBook].coverImg,
      owner: '61001db4d11bee3770db125c',
      location: `${cities[randomLocation].city}, ${cities[randomLocation].province_id}`,
      geometry: {
        coordinates: [
          cities[randomLocation].lng,
          cities[randomLocation].lat,
        ],
        type: 'Point',
      },
    });

    await book.save();
  }
};

//Call the seedDB async function and when it completes close the connection to Mongo
seedDB().then(() => {
  mongoose.connection.close();
});
