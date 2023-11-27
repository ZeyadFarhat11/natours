const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
if (process.argv.includes('--production')) {
  process.env.NODE_ENV = 'production';
}
const app = require('./app');
const mongoose = require('mongoose');

const DB = process.env.DB?.replace('${DB_PASSWORD}', process.env.DB_PASSWORD);
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DB_NAME,
  })
  .then(() => console.log(`Database Connected Successfully!`));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Listening to port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(`UNHANDELED REJECTION 💥`);
  console.log(err.name, '-', err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log(`SIGTERM RECIEVED. Shutting down gracfully`);
  });
});
