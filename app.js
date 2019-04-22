const Discord = require("discord.js");
const express = require('express');
const bodyParser = require('body-parser');
const steem = require("steem");
var wlsjs = require('@whaleshares/wlsjs');
var moment = require('moment');
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
        console.log(link);
        console.log(new Date());
        console.log(moment(new Date()).add(30, 'm').format('llll'));
        //console.log(moment(moment(new Date()).add(3, 'minutes').calendar()));

    } catch (e) {
        console.log(e.stack);
    }

});

bot.on("message", async msg => {
    //console.log(msg.author.bot);
    if (msg.author.bot) {
        if (msg.channel.name === "giveaway") return;
        if (msg.content.indexOf(':tada: Congratulations') !== 0) {

            if (msg.embeds[0].title == ':tada: Neoxian City Giveaway :tada:') {
                await msg.react('🎉');
    
                // const usrs = await msg.reactions.find(r => r.emoji.name === '🎉').fetchUsers();
    
                // console.log(usrs);
    
                //console.log(reaction);
    
                // Create a reaction collector
                const filter = (reaction) => reaction.emoji.name === '🎉'
                msg.awaitReactions(filter, {
                        time: 15000
                    })
                    .then(collected => {
                        console.log(`Collected ${collected.size} reactions`);
                        var users = collected.get('🎉').users;
                        var humanUsers = users.filter(u => !u.bot);
                        var randomWinners = humanUsers.random(2);
                        var winnersArray = [];
                        randomWinners.forEach((user) => {
                            winnersArray.push(`<@${user.id}>`)
                            console.log(`${user.username}`);
                        })
                        //console.log(randomWinners[0].id);
                        //console.log(humanUsers.random(2));
                        msg.channel.send(`:tada: Congratulations ${winnersArray}. You have been randomly selected as the winner.`);
    
    
                        // Both return true.
                        //console.log(bots.every(b => b.bot));
                        //console.log(humans.every(h => !h.bot));
                        //console.log(collected.get('🎉').users.findAll(val => val.id !== msg.author.id));
    
    
                        // for (var key in users) {
                        //     if (p.hasOwnProperty(key)) {
                        //         console.log(key + " -> " + p[key]);
                        //     }
                        // }
    
                        //console.log(users.get());
                    })
                    .catch(console.error);
    
                // const reactions = await msg.awaitReactions((reaction,user) => {
                //     //console.log(`Reaction: ${reaction}`);
                //     return reaction.emoji.name === '🎉';
                // }, {
                //     time: 10000
                // });
                // var users = [];
                // reactions.get('🎉').users
                // console.log(reactions.get('🎉').users);
                //console.log(reactions.user.id);
    
    
    
            }

        }
        else {
            return;
        }
        

    }
    //if (msg.author.bot) return;
    // if (msg.author.bot && msg.channel.name !== "giveaway") {
    //     if (msg.content.indexOf('$test') === 0) {
    //      console.log(msg.content.embed.title);
    //     return;   
    //     }

    // };

    if (msg.channel.type === "dm") return;

    if (msg.channel.name === "post-promotion" || msg.channel.name === "hunts" || msg.channel.name === "dragon-posts" || msg.channel.name === "whaleshares-post-promotion" || msg.channel.name === "giveaway-post-candidates") {
        checkPosts(msg);
    }
    if (msg.channel.name === "play-with-bots") {
        //console.log(msg);
        if (msg.content.indexOf('$neox') === 0) {
            msg.reply(`Hi I'm the Neox Bot version ${package.version}.`);
            //msg.react('🎉');
        }
    }

    if (msg.channel.name === "giveaway") {

        //console.log(msg.content);
        //console.log(msg.channel);
        //console.log(bot.getChannel())
        if (msg.content.indexOf('$neox g') == 0) {

            giveaway.push({
                "userID": msg.author.id,
                "userName": msg.author.username,
                "createdTimestamp": msg.createdTimestamp,
                "channel": "",
                "minutes": "",
                "winners": "",
                "prize": ""

            });
            //console.log(giveaway);
            msg.channel.send(`:tada: Alright! Let's set up your giveaway! First, what channel do you want the giveaway in?`);
            return;

        } else {
            //console.log(giveaway);
            //console.log(msg.author.id);
            //console.log(giveaway[0].userID);
            if (msg.author.id == giveaway[0].userID) {
                if (giveaway[0].channel == "") {
                    giveaway[0].channel = msg.content;
                    //console.log(giveaway);
                    msg.channel.send(`:tada: Sweet! The giveaway will be in ${msg.content}! Next, how long should the giveaway last? \n Please enter the duration of the giveaway in minutes.`);
                    return;
                } else
                if (giveaway[0].minutes == "") {

                    var minutes = parseInt(msg.content);

                    if (isNaN(minutes)) {
                        msg.channel.send(`The entered value ` + '`' + `${msg.content}` + '`' + ` is not a valid number. Please enter again.`);
                        return;
                    } else {
                        giveaway[0].minutes = msg.content;
                        //console.log(giveaway);
                        msg.channel.send(`:tada: Neat! This giveaway will last ` + '`' + `${msg.content}` + '`' + ` minutes! Now, how many winners should there be? \n Please enter a number of winners between 1 and 15.`);
                        return;
                    }

                } else
                if (giveaway[0].winners == "") {

                    var winners = parseInt(msg.content);

                    if (isNaN(winners)) {
                        msg.channel.send(`The entered value ` + '`' + `${msg.content}` + '`' + ` is not a valid number. Please enter again.`);
                        return;
                    } else {

                        giveaway[0].winners = msg.content;
                        //console.log(giveaway);
                        msg.channel.send(`:tada: Ok! ` + '`' + `${msg.content}` + '`' + ` winner it is! Finally, what do you want to give away? \n Please enter the giveaway prize. This will also begin the giveaway.`);
                        return;

                    }



                } else
                if (giveaway[0].prize == "") {
                    giveaway[0].prize = msg.content;
                    //console.log(giveaway);
                    msg.channel.send(`Done! The giveaway for ` + '`' + `${msg.content}` + '`' + ` is starting in ${giveaway[0].channel}!`);
                    var ch = giveaway[0].channel.replace(/[^0-9\.]/g, '');
                    var endTime = `2 winners | Ends at • ${moment(new Date()).add(giveaway[0].minutes, 'm').format('llll')}`;
                    var timeRemaining = `Time Remaining: ${giveaway[0].minutes} minutes`;
                    //console.log(ch);
                    bot.channels.get(ch).send({
                        "embed": {
                            "title": ":tada: Neoxian City Giveaway :tada:",
                            "description": giveaway[0].prize,
                            "url": "",
                            "color": 2146335,
                            "footer": {
                                "icon_url": "https://steemitimages.com/p/4qEixipsxSf1jXvCicS49aiaKDfFxASf1eKR39suyU4qmikNaw2FMepusxFTD1TUaJ",
                                "text": endTime
                            },
                            "fields": [{
                                "name": "React with :tada: to enter the Giveaway",
                                "value": timeRemaining
                            }]
                        }
                    });
                }

            } else {
                //console.log(giveaway);
                msg.channel.send(`This is not a valid command.`);
            }
        }

    }

    return;

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

                    const now = moment();
                    const created = moment(date);
                    // get the difference between the moments
                    const diff = now.diff(created);

                    console.log(moment(msg.createdTimestamp));

                    //express as a duration
                    const diffDuration = moment.duration(diff);

                    // display
                    //console.log("Days:", diffDuration.days());
                    //console.log("Hours:", diffDuration.hours());
                    //console.log("Minutes:", diffDuration.minutes());

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

                    const now = moment();
                    console.log(now);
                    const created = moment(date);

                    // get the difference between the moments
                    const diff = now.diff(created);

                    //express as a duration
                    const diffDuration = moment.duration(diff);

                    // display
                    //console.log("Days:", diffDuration.days());
                    //console.log("Hours:", diffDuration.hours());
                    //console.log("Minutes:", diffDuration.minutes());

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