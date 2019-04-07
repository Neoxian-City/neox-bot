const Discord = require("discord.js");
const express = require('express');
const bodyParser = require('body-parser');
const steem = require("steem");
var moment = require('moment');
const config = require("./config");
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
        console.log(link);
    } catch (e) {
        console.log(e.stack);
    }

});

bot.on("message", async msg => {
    if (msg.author.bot) return;
    if (msg.channel.type === "dm") return;

    if (msg.channel.name === "post-promotion") {
        checkPosts(msg);
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
    console.log(isPostValid);

    var postValue = url[0];
    var postAuthor = postValue.split("@")[1].split("/")[0];
    //var weightPercentage = 10000;
    postLink = url[0].split('@')[1].split('/')[1];


    if (isPostValid === true) {
        getPostDetails(postAuthor, postLink)
            .then(function (date) {

                const now = moment();
                const created = moment(date);

                // get the difference between the moments
                const diff = now.diff(created);

                //express as a duration
                const diffDuration = moment.duration(diff);

                // display
                console.log("Days:", diffDuration.days());
                console.log("Hours:", diffDuration.hours());
                console.log("Minutes:", diffDuration.minutes());

                var message = `This post was created ${diffDuration.days()} days, ${diffDuration.hours()} hours, ${diffDuration.minutes()} mins ago. (${moment(date).format('MMMM Do YYYY, h:mm:ss a')})`;
                msg.reply(message);

            }).catch(function (e) {
                console.log(e);
            })
    } else {
        message.channel.send('The post link you have entered is invalid. Please share only valid links in this channel.');
        return null;
    }
}

function getPostDetails(postAuthor, postLink) {
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