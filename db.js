const mongoose = require('mongoose');
const config = require('./config');

mongoose.connect(config.database, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true });
const db = mongoose.connection;

// Check DB Connection
db.once('open', () => {
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.log(err);
});

module.exports = mongoose;
