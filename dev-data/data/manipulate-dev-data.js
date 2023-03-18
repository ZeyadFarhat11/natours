const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const { makeSlug } = require('../../utils/utils');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

let tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

tours = tours.map((tour) => {
  return { ...tour, slug: makeSlug(tour.name, { lower: true }) };
});

const DB =
  'mongodb+srv://zeyad:pY8EmWdCVi6CsJwN@cluster2.1lyouxs.mongodb.net/?retryWrites=true&w=majority';
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DB_NAME,
  })
  .then(() => console.log(`Database Connected Successfully!`))
  .catch((err) => console.log(err));

const importData = async () => {
  try {
    await Tour.create(tours);
    await Review.create(reviews);
    await User.create(users);
    console.log(`Tours imported successfully.`);
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log(`Data deleted successfully.`);
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
