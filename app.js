const Discord = require("discord.js");
const express = require('express');
const bodyParser = require('body-parser');
const steem = require("steem");
var moment = require('moment');

const { mongoose } = require('./db.js');
const { Giveaway } = require('./models/giveaway')
const { GiveawayNotification } = require('./models/giveawayNotification')
const config = require("./config");
const package = require("./package.json");


const bot = new Discord.Client({
    disableEveryone: true
});

bot.login(config.token);

const app = express();
app.use(bodyParser.json());

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
                //console.log(` giveawayID: ${giveawayID}`);
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
                                                "name": "Initiator",
                                                "value": msg.embeds[0].fields[0].value
                                            },
                                            {
                                                "name": "React with :tada: to enter the Giveaway",
                                                "value": `Time Remaining: ${timeRemaining(data.endTime)}`
                                            },
                                            {
                                                "name": msg.embeds[0].fields[2].name,
                                                "value": msg.embeds[0].fields[2].value
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
                                    //console.log(`giveawayData : ${data}`);
                                    //console.log(`Collected ${collected.size} reactions`);
                                    var users = collected.get('🎉').users;
                                    //console.log(users);
                                    var humanUsers = users.filter(u => !u.bot);
                                    //console.log(`Human Array: ${humanUsers.array()}`);
                                    //console.log(`User Length: ${users.array().length}`);
                                    //console.log(`Human Length: ${humanUsers.array().length}`);

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
                                                        "name": "Initiator",
                                                        "value": msg.embeds[0].fields[0].value
                                                    },
                                                    {
                                                        "name": ":tada: Giveaway has ended",
                                                        "value": `Could not determine a winner!`
                                                    }
                                                ]
                                            }
                                        });

                                        msg.channel.send(`:tada: Giveaway has Ended. A winner could not be determined!`);

                                        //console.log(winnersArray);
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
                                            //console.log(`${user.username}`);
                                        })
                                    }
                                    else {

                                        var randomWinners = humanUsers.random(data.winnerCount);
                                        //console.log(randomWinners);
                                        //console.log(humanUsers);

                                        randomWinners.forEach((user) => {
                                            winnersArray.push(`<@${user.id}>`)
                                            //console.log(`${user.username}`);
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
                                                    "name": "Initiator",
                                                    "value": msg.embeds[0].fields[0].value
                                                },
                                                {
                                                    "name": ":tada: Giveaway has ended",
                                                    "value": `Congratulations ${winnersArray}`
                                                },
                                                {
                                                    "name": msg.embeds[0].fields[2].name,
                                                    "value": msg.embeds[0].fields[2].value
                                                }
                                            ]
                                        }
                                    });

                                    msg.channel.send(`:tada: Congratulations ${winnersArray}. You have been randomly selected as the winner for the giveaway.`);

                                    //console.log(winnersArray);
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

        if (msg.channel.name === "post-promotion" || msg.channel.name === "city-curation" || msg.channel.name === "hunts" || msg.channel.name === "dragon-posts" || msg.channel.name === "whaleshares-post-promotion" || msg.channel.name === "giveaway-post-candidates") {
            checkPosts(msg);
        }

        if (msg.channel.name === "play-with-bots") {
            if (msg.content.indexOf('$neox') === 0) {

                var command = `Please use the following commands to use my features.\n\n ` + '`' + `$neox gcreate` + '`' + ` - Use in #giveaway channel to initiate giveaway.\n\n` + '`' + `$random 405 and 670` + '`' + ` - Use this command to find a random number in #play-with-bots channel.\n\n` + '`' + `$gtop` + '`' + ` - Use this command in #play-with-bots channel to get top 10 giveaway initiators.\n\n` + '`' + `$gwinners` + '`' + ` - Use this command in #play-with-bots channel to get top 10 giveaway winners.\n\n` + '`' + `$gnotification Start` + '`' + ` - Use this command in #play-with-bots channel to start receiving giveaway notifications in DM.\n\n` + '`' + `$gnotification Stop` + '`' + ` - Use this command in #play-with-bots channel to stop receiving giveaway notifications in DM`

                msg.channel.send({
                    "embed": {
                        "title": `Hi, I'm the Neox Bot version ${package.version}.`,
                        "description": command
                    }
                });
            }

            if (msg.content.indexOf('$gtop') === 0) {

                getTopInitiators()
                    .then((result) => {

                        msg.channel.send({
                            "embed": {
                                "title": ":trophy: Top Giveaway Initiators",
                                "description": result
                            }
                        });


                    }).catch(function (e) {
                        console.log(e);
                    })

            }

            if (msg.content.indexOf('$gwinners') === 0) {

                getTopWinners()
                    .then((result) => {

                        msg.channel.send({
                            "embed": {
                                "title": ":trophy: Top Giveaway Winners",
                                "description": result
                            }
                        });


                    }).catch(function (e) {
                        console.log(e);
                    })
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

            if (msg.content.indexOf('$gnotification Start') === 0) {

                GiveawayNotification.findOne(
                    { user: msg.author.id },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                            msg.reply(`There was an error in processing this request. Try again and if the problem persists, please contact Administrator`);
                            return;
                        }

                        if (data) {
                            msg.reply(`Notification service is already enabled for you. Use the command ` + '`' + `$gnotification Stop` + '`' + ` to stop receiving notifications.`);
                            return;
                        }

                        var giveawayNotification = new GiveawayNotification({
                            user: msg.author.id,
                            userName: msg.author.username
                        });
                        giveawayNotification.save((err, doc) => {
                            if (!err) {
                                msg.reply(`Congratulations, you have been subscribed to receive notifications on your DM when a :tada: Giveaway :tada: is initiated in the city. Please note the notification will be sent only to the Sharp Citizens of the city.`);
                                return;
                            }
                            else {
                                console.log('Error in Saving Giveaway: ' + JSON.stringify(err, undefined, 2));
                                msg.reply(`There was an error in subscribing you to the notification service. Please contact Administrator.`);
                            }
                        })

                    }
                )
            }

            if (msg.content.indexOf('$gnotification Stop') === 0) {

                GiveawayNotification.findOne(
                    { user: msg.author.id },
                    (err, data) => {
                        if (err) {
                            console.log(err);
                            msg.reply(`There was an error in processing this request. Try again and if the problem persists, please contact Administrator`);
                            return;
                        }

                        if (data) {

                            GiveawayNotification.deleteOne(
                                { user: msg.author.id },
                                (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        msg.reply(`There was an error in removing your subscription to the notification service. Please contact Administrator.`);
                                        return;
                                    }

                                    if (result) {
                                        msg.reply(`Notification service has been disabled for you. Use the command ` + '`' + `$gnotification Start` + '`' + ` to start receiving notifications.`);
                                        return;

                                    }
                                }
                            )

                        }

                    }
                )
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

                                    Giveaway.updateOne({ _id: data.id }, { duration: msg.content }, (err, data) => {
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

                                    Giveaway.updateOne({ _id: data.id }, { winnerCount: msg.content }, (err, data) => {
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
                                                                "name": "**Initiator**",
                                                                "value": `<@${value.initiatorID}>`
                                                            },
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


                                                GiveawayNotification.find({}, (err, val) => {
                                                    if (err) {
                                                        console.log(err);
                                                        return;
                                                    }

                                                    if (val.length > 0) {
                                                        for (let i = 0; i < val.length; i++) {

                                                            if (msg.guild.roles.get(config.roleID).members.get(val[i].user)) {

                                                                console.log(val[i].userName);

                                                                bot.users.get(val[i].user).send({
                                                                    "embed": {
                                                                        "title": ":tada: Neoxian City Giveaway Notification :tada:",
                                                                        "description": value.prize,
                                                                        "url": "",
                                                                        "color": 2146335,
                                                                        "footer": {
                                                                            "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                                                            "text": footer
                                                                        },
                                                                        "fields": [
                                                                            {
                                                                                "name": "**Initiator**",
                                                                                "value": `<@${value.initiatorID}>`
                                                                            },
                                                                            {
                                                                                "name": "Visit Neoxian City to react with :tada: to enter the Giveaway",
                                                                                "value": timeRemaining
                                                                            },
                                                                            {
                                                                                "name": `${value.winnerCount} Winners`,
                                                                                "value": gift.repeat(value.winnerCount)
                                                                            }
                                                                        ]
                                                                    }
                                                                });
                                                            }
                                                        }
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
        if (msg.channel.name === "post-promotion" || msg.channel.name === "dragon-posts" || msg.channel.name === "giveaway-post-candidates" || msg.channel.name === "city-curation") {

            getSteemPostDetails(postAuthor, postLink)
                .then(function (data) {

                    var date = data.created;

                    if (date == "1970-01-01T00:00:00") {

                        msg.reply("The post link is invalid.");
                        return;

                    }

                    const now = moment.utc();
                    const created = moment.utc(date);
                    // get the difference between the moments
                    const diff = now.diff(created);

                    //console.log(moment(msg.createdTimestamp));

                    //express as a duration
                    const diffDuration = moment.duration(diff);

                    if (Math.round(diffDuration.asSeconds()) <= 900) {

                        msg.reply(`The post is less than 15 minutes old. The post link has been deleted. Please read the guidelines.`)
                        msg.delete();
                        return;

                    }

                    if (Math.round(diffDuration.asSeconds()) >= 432000) {
                        msg.reply(`The post is more than 5 days old. The post link has been deleted. Please read the guidelines.`)
                        msg.delete();
                        return;
                    }

                    var message = `${moment.utc(date).format('MMMM Do YYYY, h:mm:ss a')} \n This post was created ${diffDuration.days()} day(s), ${diffDuration.hours()} hour(s), ${diffDuration.minutes()} min(s) ago.`;
                    msg.channel.send({
                        "embed": {
                            "color": 2146335,
                            "fields": [
                                {
                                    "name": "Date Created",
                                    "value": message
                                },
                                {
                                    "name": "Post Link",
                                    "value": `https://${config.steemUI}/@${postAuthor}/${postLink}`
                                },
                                {
                                    "name": "Tags",
                                    "value": `${data.tags.join(', ')}`
                                }
                            ]
                        }
                    });

                    if (msg.channel.name === "city-curation") {
                        steem.broadcast.voteAsync(config.curationWif, "neoxian-city", postAuthor, postLink, 2300, (err, result) => {
                            if (err) {
                                console.log(err);
                            }
            
                        })

                        var authorPermlink = 'neoxian-' + Date.now();
                        var postComment = "This post has been rewarded with an upvote from city trail as part of Neoxian City Curation program ![](https://cdn.steemitimages.com/DQmZ4SqDess96h8nz3E2BnRczepPF9WaYa2MrGdgGbf6yTT/ezgif-5-4ec7c52a09cb.gif) ![](https://cdn.steemitimages.com/DQmZLjMtgpjfPzjf6xmHUpCH4DYmFjXRZJrHb3KmUkQCcSj/ezgif-5-7a2c6f978f8b.gif). We are glad to see you using #neoxian tag in your posts. If you still not in our discord, you can join our [Discord Server](https://discord.gg/TvcKKcJ) for more goodies and giveaways.\n\nDo you know that you can earn NEOXAG tokens as passive income by delegating to @neoxiancityvb. Here are some handy links for delegations: [100SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=200000%20VESTS), [250SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=500000%20VESTS), [500SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=999000%20VESTS), [1000SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=2000000%20VESTS). Read more about the bot in [this post](https://www.neoxian.city/neoxian/@zaku/introducing-neoxag-bid-bot-sink-delegate-steem-power-and-earn-neoxag-each-and-every-day-passive-profit-for-upvote-buyers). \n<center>[![](https://ipfs.busy.org/ipfs/QmTLAG3rV9fUr2N9XrdoVrAmot4APQXZQeaYJqbw9Jtp1G)](https://discord.gg/TvcKKcJ)</center> \n\n";
                        steem.broadcast.comment(config.curationWif, postAuthor, postLink, "neoxian-city", authorPermlink, '', postComment, { tags: ['neoxian'] }, function(err, result) {         
                            if (err) {
                                console.log(err);
                            }
                        });


                    }

                }).catch(function (e) {
                    console.log(e);
                })

        }


    } else {
        message.channel.send('The post link is invalid. Please share only valid links in this channel.');
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

                    var obj = JSON.parse(result.json_metadata);
                    var tags = obj.tags;

                    yes({ "created": result.created, "tags": tags });
                }


        });
    });
}

function getTopInitiators() {
    return new Promise(function (yes, no) {
        Giveaway.aggregate(
            [{ $group: { _id: '$initiatorID', count: { $sum: 1 } } },
            { $sort: { "count": -1 } }
            ]
        ).exec((err, result) => {

            if (err) {
                console.log(err);
                no(err);
            } else
                if (result) {

                    var output = "";

                    if (result.length >= 1) {
                        output = `:first_place: :one: <@${result[0]._id}> - **${result[0].count}** \n`;
                    }

                    if (result.length >= 2) {
                        output = output + `:second_place: :two: <@${result[1]._id}> - **${result[1].count}** \n`;
                    }

                    if (result.length >= 3) {
                        output = output + `:third_place: :three: <@${result[2]._id}> - **${result[2].count}** \n`;
                    }

                    if (result.length >= 4) {
                        output = output + `:medal: :four: <@${result[3]._id}> - **${result[3].count}** \n`;
                    }

                    if (result.length >= 5) {
                        output = output + `:medal: :five: <@${result[4]._id}> - **${result[4].count}** \n`;
                    }

                    if (result.length >= 6) {
                        output = output + `:medal: :six: <@${result[5]._id}> - **${result[5].count}** \n`;
                    }

                    if (result.length >= 7) {
                        output = output + `:medal: :seven: <@${result[6]._id}> - **${result[6].count}** \n`;
                    }

                    if (result.length >= 8) {
                        output = output + `:medal: :eight: <@${result[7]._id}> - **${result[7].count}** \n`;
                    }

                    if (result.length >= 9) {
                        output = output + `:medal: :nine: <@${result[8]._id}> - **${result[8].count}** \n`;
                    }

                    if (result.length >= 10) {
                        output = output + `:medal: :keycap_ten: <@${result[9]._id}> - **${result[9].count}**`;
                    }

                    yes(output);
                }

        })
    })
}

function getTopWinners() {
    return new Promise(function (yes, no) {
        var winners = [];

        Giveaway.find({}, { winners: 1, _id: 0 })
            .then((data) => {
                for (var i = 0; i < data.length; i++) {
                    //winners.push(data[i].winners.length);
                    if (data[i].winners.length === 1) {
                        winners.push(data[i].winners[0])
                    }
                    if (data[i].winners.length > 1) {
                        for (var j = 0; j < data[i].winners.length; j++) {
                            winners.push(data[i].winners[j])
                        }

                    }
                }
                //console.log(winners);
                var newArray = compressArray(winners);
                var sortedArray = newArray.sort(function (a, b) {
                    return b.count - a.count;
                });
                //console.log(sortedArray);

                var output = "";

                if (sortedArray.length >= 1) {
                    output = `:first_place: :one: ${sortedArray[0].value} - **${sortedArray[0].count}** \n`;
                }

                if (sortedArray.length >= 2) {
                    output = output + `:second_place: :two: ${sortedArray[1].value} - **${sortedArray[1].count}** \n`;
                }

                if (sortedArray.length >= 3) {
                    output = output + `:third_place: :three: ${sortedArray[2].value} - **${sortedArray[2].count}** \n`;
                }

                if (sortedArray.length >= 4) {
                    output = output + `:medal: :four: ${sortedArray[3].value} - **${sortedArray[3].count}** \n`;
                }

                if (sortedArray.length >= 5) {
                    output = output + `:medal: :five: ${sortedArray[4].value} - **${sortedArray[4].count}** \n`;
                }

                if (sortedArray.length >= 6) {
                    output = output + `:medal: :six: ${sortedArray[5].value} - **${sortedArray[5].count}** \n`;
                }

                if (sortedArray.length >= 7) {
                    output = output + `:medal: :seven: ${sortedArray[6].value} - **${sortedArray[6].count}** \n`;
                }

                if (sortedArray.length >= 8) {
                    output = output + `:medal: :eight: ${sortedArray[7].value} - **${sortedArray[7].count}** \n`;
                }

                if (sortedArray.length >= 9) {
                    output = output + `:medal: :nine: ${sortedArray[8].value} - **${sortedArray[8].count}** \n`;
                }

                if (sortedArray.length >= 10) {
                    output = output + `:medal: :keycap_ten: ${sortedArray[9].value} - **${sortedArray[9].count}**`;
                }

                //console.log(output);
                yes(output);

            }).catch(function (e) {
                console.log(e);
                no(e);
            })
    })

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
        //console.log(`${seconds} seconds`);
        value = `${seconds} seconds`;
        return value;

    }
    if (diffDuration.minutes() === 1) {
        value = minutes + " minute, " + seconds + " seconds";
        return value;
    }
    else {
        //console.log(minutes + " minutes, " + seconds + " seconds");
        value = minutes + " minutes, " + seconds + " seconds";
        return value;
    }

}

function getRndInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function compressArray(original) {

    var compressed = [];
    // make a copy of the input array
    var copy = original.slice(0);

    // first loop goes over every element
    for (var i = 0; i < original.length; i++) {

        var myCount = 0;
        // loop over every element in the copy and see if it's the same
        for (var w = 0; w < copy.length; w++) {
            if (original[i] == copy[w]) {
                // increase amount of times duplicate is found
                myCount++;
                // sets item to undefined
                delete copy[w];
            }
        }

        if (myCount > 0) {
            var a = new Object();
            a.value = original[i];
            a.count = myCount;
            compressed.push(a);
        }
    }

    return compressed;
};