const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/reco-system')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Mongo error:', err));

module.exports = mongoose;