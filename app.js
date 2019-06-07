const Discord = require("discord.js");
const express = require('express');
const bodyParser = require('body-parser');
const steem = require("steem");
var wlsjs = require('@whaleshares/wlsjs');
var moment = require('moment');

const { mongoose } = require('./db.js');
const { Giveaway } = require('./models/giveaway')
const config = require("./config");
const package = require("./package.json");


const bot = new Discord.Client({
    disableEveryone: true
});

wlsjs.api.setOptions({
    url: 'https://pubrpc.whaleshares.io/'
});

bot.login(config.token);

const app = express();
app.use(bodyParser.json());

const giveaway = [];

var server = app.listen(process.env.PORT, "0.0.0.0", () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log('Web server started at http://%s:%s', host, port);
});

bot.on("ready", async () => {
    console.log(`Bot is ready ${bot.user.username}`);
    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);

    } catch (e) {
        console.log(e.stack);
    }

});

bot.on("message", async msg => {

    try {

        //console.log(msg.author.bot);
        if (msg.author.bot) {
            //console.log(msg.embeds.length);
            if (msg.channel.name === "giveaway") return;
            if (msg.content.indexOf(':tada: Congratulations') === 0) return;
            if (msg.content.indexOf(':tada: Giveaway') === 0) return;

            if (msg.embeds.length === 0) return;

            if (msg.embeds[0].title == ':tada: Neoxian City Giveaway :tada:') {

                var giveawayID = msg.embeds[0].footer.text.split(" ")[1];
                console.log(` giveawayID: ${giveawayID}`);
                await msg.react('🎉');

                Giveaway.findOne(
                    { status: 'ongoing', gid: giveawayID },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                        }

                        if (data) {

                            // This will be repeated every for 5 times with 10 second intervals:
                            setIntervalX(function () {
                                msg.edit({
                                    "embed": {
                                        "title": ":tada: Neoxian City Giveaway :tada:",
                                        "description": msg.embeds[0].description,
                                        "url": "",
                                        "color": 2146335,
                                        "footer": {
                                            "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                            "text": msg.embeds[0].footer.text
                                        },
                                        "fields": [
                                            {
                                                "name": "React with :tada: to enter the Giveaway",
                                                "value": `Time Remaining: ${timeRemaining(data.endTime)}`
                                            },
                                            {
                                                "name": msg.embeds[0].fields[1].name,
                                                "value": msg.embeds[0].fields[1].value
                                            }
                                        ]
                                    }
                                });
                            }, 10000, (data.duration * 6) - 1);

                            // Create a reaction collector
                            const filter = (reaction) => reaction.emoji.name === '🎉'
                            msg.awaitReactions(filter, {
                                time: data.duration * 60000
                            })
                                .then(collected => {

                                    var winnersArray = [];
                                    console.log(`giveawayData : ${data}`);
                                    //console.log(`Collected ${collected.size} reactions`);
                                    var users = collected.get('🎉').users;
                                    //console.log(users);
                                    var humanUsers = users.filter(u => !u.bot);
                                    //console.log(`Human Array: ${humanUsers.array()}`);
                                    console.log(`User Length: ${users.array().length}`);
                                    console.log(`Human Length: ${humanUsers.array().length}`);

                                    if (users.array().length === 1) {

                                        msg.edit({
                                            "embed": {
                                                "title": ":tada: Neoxian City Giveaway :tada:",
                                                "description": msg.embeds[0].description,
                                                "url": "",
                                                "color": 2146335,
                                                "footer": {
                                                    "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                                    "text": msg.embeds[0].footer.text
                                                },
                                                "fields": [
                                                    {
                                                        "name": ":tada: Giveaway has ended",
                                                        "value": `Could not determine a winner!`
                                                    }
                                                ]
                                            }
                                        });

                                        msg.channel.send(`:tada: Giveaway has Ended. A winner could not be determined!`);

                                        console.log(winnersArray);
                                        Giveaway.updateOne({ _id: data.id }, { winners: winnersArray, status: "completed" }, (err) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                        return;

                                    }

                                    if (humanUsers.array().length <= data.winnerCount) {

                                        humanUsers.forEach((user) => {
                                            winnersArray.push(`<@${user.id}>`)
                                            console.log(`${user.username}`);
                                        })
                                    }
                                    else {

                                        var randomWinners = humanUsers.random(data.winnerCount);
                                        console.log(randomWinners);
                                        //console.log(humanUsers);

                                        randomWinners.forEach((user) => {
                                            winnersArray.push(`<@${user.id}>`)
                                            console.log(`${user.username}`);
                                        })

                                    }

                                    msg.edit({
                                        "embed": {
                                            "title": ":tada: Neoxian City Giveaway :tada:",
                                            "description": msg.embeds[0].description,
                                            "url": "",
                                            "color": 2146335,
                                            "footer": {
                                                "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                                "text": msg.embeds[0].footer.text
                                            },
                                            "fields": [
                                                {
                                                    "name": ":tada: Giveaway has ended",
                                                    "value": `Congratulations ${winnersArray}`
                                                },
                                                {
                                                    "name": msg.embeds[0].fields[1].name,
                                                    "value": msg.embeds[0].fields[1].value
                                                }
                                            ]
                                        }
                                    });

                                    msg.channel.send(`:tada: Congratulations ${winnersArray}. You have been randomly selected as the winner for the giveaway.`);

                                    console.log(winnersArray);
                                    Giveaway.updateOne({ _id: data.id }, { winners: winnersArray, status: "completed" }, (err) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });

                                })
                                .catch(console.error);

                        }

                        else {
                            msg.channel.send(`There was an error in completing the giveaway. Please contact administrator.`);
                        }
                    }
                )



            }




        }

        if (msg.channel.type === "dm") return;

        if (msg.channel.name === "post-promotion" || msg.channel.name === "hunts" || msg.channel.name === "dragon-posts" || msg.channel.name === "whaleshares-post-promotion" || msg.channel.name === "giveaway-post-candidates") {
            checkPosts(msg);
        }
        if (msg.channel.name === "play-with-bots") {
            if (msg.content.indexOf('$neox') === 0) {
                msg.reply(`Hi I'm the Neox Bot version ${package.version}.`);
                //msg.react('🎉');
            }
            if (msg.content.indexOf('$random') === 0) {
                var rnd = msg.content.split(" ");
                var min = rnd[1];
                var max = rnd[3];

                if (isNaN(min) || isNaN(max)) {
                    msg.reply(`Please enter a valid number range to find a random number. ` + '`' + `$random 100 and 250` + '`' + `.`);
                    return;
                }
                else {
                    var rndNumber = getRndInteger(min, max);                    
                    msg.reply(`Hey, I found ${rndNumber} as the random number.`);
                }
            }
        }

        if (msg.channel.name === "giveaway") {

            Giveaway.findOne(
                { status: 'started', initiatorID: msg.author.id },
                (err, data) => {
                    if (err) {
                        console.log(err);
                    }

                    if (data) {
                        if (msg.content.indexOf('$neox gcreate') == 0) {

                            msg.channel.send(`You have already initiated a giveaway. You cannot initiate one more in parallel. If you would like to cancel the current giveaway, reply with a command  ` + '`' + `cancel` + '`' + ``);

                        }

                        if (msg.content.indexOf('cancel') == 0) {

                            Giveaway.updateOne({ "_id": data.id }, { status: "deleted" }, (err, data) => {

                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    msg.channel.send(`Previous giveaway has been successfully marked as deleted. You can now start a new giveaway with the command ` + '`' + `$neox gcreate` + '`' + `.`);
                                }

                            });

                        }
                        else {

                            if (data.channel == "") {

                                if (msg.content.indexOf('<#') == 0) {

                                    Giveaway.updateOne({ _id: data.id }, { channel: msg.content }, (err, data) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            msg.channel.send(`:tada: Sweet! The giveaway will be in ${msg.content}! Next, how long should the giveaway last? \n Please enter the duration of the giveaway in minutes. Please enter a value between 1 and 60. ` + '`' + `Eg: 3` + '`' + `.`);
                                            return;
                                        }
                                    })
                                    return;

                                }

                                else {

                                    msg.channel.send(`This is not a valid channel. In order to select a channel, please enter ` + '`' + `#` + '`' + ` followed by the channel name and choose the channel.`);
                                    return;

                                }                         

                            }


                            if (data.duration == null) {

                                var minutes = parseInt(msg.content);

                                if (isNaN(minutes)) {
                                    msg.channel.send(`The entered value ` + '`' + `${msg.content}` + '`' + ` is not a valid number. Please enter again.`);
                                    return;
                                } else {

                                    Giveaway.update({ _id: data.id }, { duration: msg.content }, (err, data) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            msg.channel.send(`:tada: Neat! This giveaway will last ` + '`' + `${msg.content}` + '`' + ` minutes! Now, how many winners should there be? \n Please enter a value between 1 and 10. ` + '`' + `Eg: 2` + '`' + `.`);
                                            return;
                                        }
                                    })

                                    return;
                                }

                            }

                            if (data.winnerCount == null) {

                                var winners = parseInt(msg.content);

                                if (isNaN(winners)) {
                                    msg.channel.send(`The entered value ` + '`' + `${msg.content}` + '`' + ` is not a valid number. Please enter again.`);
                                    return;
                                } else {

                                    Giveaway.update({ _id: data.id }, { winnerCount: msg.content }, (err, data) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            msg.channel.send(`:tada: Ok! ` + '`' + `${msg.content}` + '`' + ` winner it is! Finally, what do you want to give away? \n Please enter the giveaway prize. This will also begin the giveaway.`);
                                            return;
                                        }
                                    })
                                    return;

                                }
                            }

                            if (data.prize == "") {

                                Giveaway.findOne().sort({ gid: -1 })
                                    .then((seq) => {

                                        var update = {
                                            prize: msg.content,
                                            gid: seq.gid + 1,
                                            status: 'ongoing',
                                            startTime: new Date(),
                                            endTime: moment(new Date()).add(data.duration, 'm').toDate()
                                        };
                                        Giveaway.findOneAndUpdate({ _id: data.id }, update, { new: true }, (err, value) => {
                                            if (err) {
                                                console.log(err);
                                            }
                                            else {
                                                
                                                msg.channel.send(`Done! The giveaway for ` + '`' + `${msg.content}` + '`' + ` is starting in ${value.channel}!`);
                                                var ch = value.channel.replace(/[^0-9\.]/g, '');
                                                var gift = ":gift: "
                                                var footer = `No: ${value.gid} | Ends at • ${moment(new Date()).add(value.duration, 'm').format('MMMM Do YYYY, h:mm:ss a')}`;
                                                var timeRemaining = `Time Remaining: ${value.duration} minutes`;
                                                bot.channels.get(ch).send({
                                                    "embed": {
                                                        "title": ":tada: Neoxian City Giveaway :tada:",
                                                        "description": value.prize,
                                                        "url": "",
                                                        "color": 2146335,
                                                        "footer": {
                                                            "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                                            "text": footer
                                                        },
                                                        "fields": [
                                                            {
                                                                "name": "React with :tada: to enter the Giveaway",
                                                                "value": timeRemaining
                                                            },
                                                            {
                                                                "name": `${value.winnerCount} Winners`,
                                                                "value": gift.repeat(value.winnerCount)
                                                            }
                                                        ]
                                                    }
                                                });
                                                return;
                                            }
                                        })
                                    }
                                    )
                                    .catch((err) => {
                                        console.log(err);
                                    })


                            }

                            else {
                                msg.channel.send(`The command is not valid.`);
                            }

                        }


                    } else {
                        if (msg.content.indexOf('$neox gcreate') == 0) {                            
                            var giveaway = new Giveaway({
                                initiatorID: msg.author.id,
                                initiatorUsername: msg.author.username,
                                createdTimestamp: msg.createdTimestamp,
                                startTime: "",
                                endTime: "",
                                channel: "",
                                duration: "",
                                winnerCount: "",
                                winners: "",
                                prize: "",
                                gid: "",
                                status: "started"
                            });
                            giveaway.save((err, doc) => {
                                if (!err) {
                                    msg.channel.send(`:tada: Alright! Let's set up your giveaway! First, what channel do you want the giveaway in?`);
                                    return;
                                }
                                else {
                                    console.log('Error in Saving Giveaway: ' + JSON.stringify(err, undefined, 2));
                                    msg.channel.send(`There was an error while initiating the Giveaway. Please contact Administrator.`);
                                }
                            })
                        }
                        else {
                            msg.channel.send(`This is not a valid command. Please use ` + '`' + `$neox gcreate` + '`' + ` to initiate a giveaway.`);
                        }

                    }

                },
            )
            return;

        }
        return;

    } catch (e) {
        console.log(e.stack);
    }

});

function checkPosts(msg) {

    var url = msg.content.match(/\bhttps?:\/\/\S+/gi);
    // Check if the URL is null or not
    if (url === null) {
        return;
    }

    let isPostValid = !!url[0].match(
        /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g
    );
    //console.log(isPostValid);

    var postValue = url[0];
    var postAuthor = postValue.split("@")[1].split("/")[0];
    postLink = url[0].split('@')[1].split('/')[1].split('?')[0];


    if (isPostValid === true) {
        if (msg.channel.name === "post-promotion" || msg.channel.name === "hunts" || msg.channel.name === "dragon-posts" || msg.channel.name === "giveaway-post-candidates") {

            getSteemPostDetails(postAuthor, postLink)
                .then(function (date) {

                    const now = moment.utc();
                    const created = moment.utc(date);
                    // get the difference between the moments
                    const diff = now.diff(created);

                    console.log(moment(msg.createdTimestamp));

                    //express as a duration
                    const diffDuration = moment.duration(diff);                   

                    if (Math.round(diffDuration.asSeconds()) <= 900) {

                        msg.reply(`The post is less than 15 minutes old. The post has been deleted. Please read the guidelines.`)
                        msg.delete();
                        return;
                        
                    }

                    if (Math.round(diffDuration.asSeconds()) >= 432000) {
                        msg.reply(`The post is more than 5 days old. The post has been deleted. Please read the guidelines.`)
                        msg.delete();
                        return;
                    }

                    var message = `This post was created ${diffDuration.days()} days, ${diffDuration.hours()} hours, ${diffDuration.minutes()} mins ago. (${moment(date).format('MMMM Do YYYY, h:mm:ss a')})`;
                    console.log(message);
                    msg.reply(message);

                }).catch(function (e) {
                    console.log(e);
                })

        }
        if (msg.channel.name === "whaleshares-post-promotion") {

            getWlsPostDetails(postAuthor, postLink)
                .then(function (date) {

                    const now = moment.utc();
                    const created = moment.utc(date);

                    // get the difference between the moments
                    const diff = now.diff(created);

                    //express as a duration
                    const diffDuration = moment.duration(diff);

                    if (Math.round(diffDuration.asSeconds()) <= 900) {

                        msg.reply(`The post is less than 15 minutes old. The post has been deleted. Please read the guidelines.`)
                        msg.delete();
                        return;
                        
                    }

                    if (Math.round(diffDuration.asSeconds()) >= 432000) {
                        msg.reply(`The post is more than 5 days old. The post has been deleted. Please read the guidelines.`)
                        msg.delete();
                        return;
                    }

                    var message = `This post was created ${diffDuration.days()} days, ${diffDuration.hours()} hours, ${diffDuration.minutes()} mins ago. (${moment(date).format('MMMM Do YYYY, h:mm:ss a')})`;
                    console.log(message);
                    msg.reply(message);

                }).catch(function (e) {
                    console.log(e);
                })

        }

    } else {
        message.channel.send('The post link you have entered is invalid. Please share only valid links in this channel.');
        return null;
    }
}

function getSteemPostDetails(postAuthor, postLink) {
    return new Promise(function (yes, no) {
        steem.api.getContent(postAuthor, postLink, (err, result) => {
            if (err) {
                console.log(err);
                no(err);
            } else
                if (result) {

                    yes(result.created);
                }


        });
    });
}

function getWlsPostDetails(postAuthor, postLink) {
    return new Promise(function (yes, no) {
        wlsjs.api.getContent(postAuthor, postLink, (err, result) => {
            if (err) {
                console.log(err);
                no(err);
            } else
                if (result) {

                    yes(result.created);
                }


        });
    });
}

function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = setInterval(function () {

        callback();

        if (++x === repetitions) {
            clearInterval(intervalID);
        }
    }, delay);
}

function timeRemaining(endTime) {
    var now = moment.utc();
    var created = moment(endTime);
    // get the difference between the moments
    var diff = now.diff(created);
    var value = "";
    //express as a duration
    var diffDuration = moment.duration(diff);

    var minutes = diffDuration.minutes() * -1;
    var seconds = diffDuration.seconds() * -1;

    //console.log("Days:", diffDuration.days());
    //console.log("Hours:", diffDuration.hours());
    //console.log("Minutes:", diffDuration.minutes() * -1);
    //console.log("Seconds:", diffDuration.seconds() * -1);

    if (diffDuration.minutes() === 0) {
        console.log(`${seconds} seconds`);
        value = `${seconds} seconds`;
        return value;

    }
    if (diffDuration.minutes() === 1) {
        value = minutes + " minute, " + seconds + " seconds";
        return value;
    }
    else {
        console.log(minutes + " minutes, " + seconds + " seconds");
        value = minutes + " minutes, " + seconds + " seconds";
        return value;
    }

}

function getRndInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}