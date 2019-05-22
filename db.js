const mongoose = require('mongoose');
const config = require('./config');

mongoose.connect(config.database,{ useNewUrlParser: true, useFindAndModify: false });
let db = mongoose.connection;

// Check DB Connection
db.once('open',function(){
  console.log('Connected to MongoDB');
}) 

//Check for DB errors
db.on('error',function(err){
  console.log(err);
})

module.exports = mongoose;