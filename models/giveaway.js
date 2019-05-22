var mongoose     = require('mongoose')
, Schema = mongoose.Schema;

var giveawaySchema = new Schema({
    initiatorID: String,
    initiatorUsername: String,
    createdTimestamp: Date,
    startTime: Date,
    endTime: Date,
    channel: String,
    duration: Number,
    winnerCount: Number,
    winners: Object,
    prize: String,
    gid: Number,
    status: String

},{ versionKey: false});

var Giveaway = mongoose.model('Giveaway', giveawaySchema);


module.exports = {Giveaway};