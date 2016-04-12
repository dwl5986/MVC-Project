var mongoose = require('mongoose');
var _ = require('underscore');

var ScoreModel;

var ScoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  score: {
    type: Number,
    min: 0,
    required: true
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account'
  },
  createdData: {
    type: Date,
    default: Date.now
  }
});

ScoreSchema.methods.toAPI = function() {
  return {
    name: this.name,
    score: this.score,
  };
};

ScoreSchema.statics.findByOwner = function(ownerId, callback) {
  var search = {
    owner: mongoose.Types.ObjectId(ownerId)
  };

  return ScoreModel.find(search).select('name score').exec(callback);
};

ScoreModel = mongoose.model('HighScore', ScoreSchema);

module.exports.ScoreModel = ScoreModel;
module.exports.ScoreSchema = ScoreSchema;
