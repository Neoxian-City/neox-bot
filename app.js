const Discord = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const steem = require('steem');
const moment = require('moment');
// eslint-disable-next-line no-unused-vars
const { mongoose } = require('./db.js');
const config = require('./config');
const pkg = require('./package.json');


const bot = new Discord.Client({
  disableEveryone: true,
});

function getSteemPostDetails(postAuthor, postLink) {
  return new Promise(((yes, no) => {
    steem.api.getContent(postAuthor, postLink, (err, result) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.log(`Get content Error: ${err}`);
        no(err);
      } else
      if (result) {
        const obj = JSON.parse(result.json_metadata);
        const { tags } = obj;
        const { app } = obj;
        const benf = [];
        for (let i = 0; i < result.beneficiaries.length; i += 1) {
          benf.push(`${result.beneficiaries[i].account}(${result.beneficiaries[i]
            .weight / 100}%)`);
        }
        if (benf.length === 0) {
          benf.push('No beneficiaries added');
        }
        yes({
          created: result.created, tags, app, beneficiaries: benf,
        });
      }
    });
  }));
}

function stream() {
  try {
    bot.users.get('404015376511401986').send({
      embed: {
        description: 'Stream has started',
        color: 16312092,
      },
    });
    steem.api.streamOperations((err, result) => {
      // console.log(result);
      if (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        bot.users.get('404015376511401986').send({
          embed: {
            description: '1. Error while streaming operations. Streaming will be restarted.',
            color: 13632027,
          },
        });
        stream();
      }

      if (result) {
        if (result[0] === 'comment' && !result[1].parent_author) {
          const obj = JSON.parse(result[1].json_metadata);
          const { app } = obj;
          if (app === 'neoxiancity/0.1') {
            getSteemPostDetails(result[1].author, result[1].permlink)
              .then((data) => {
                const date = data.created;

                if (date === '1970-01-01T00:00:00') {
                  return;
                }

                const now = moment.utc();
                const created = moment.utc(date);
                // get the difference between the moments
                const diff = now.diff(created);

                // console.log(moment(msg.createdTimestamp));

                // express as a duration
                const diffDuration = moment.duration(diff);

                if (Math.round(diffDuration.asSeconds()) <= 60) {
                  bot.channels.get('637410373380866058').send(`New Post from Neoxian City: \n https://${config.steemUI}/@${result[1].author}/${result[1].permlink}`);
                  bot.channels.get('637410373380866058').send({
                    embed: {
                      color: 2146335,
                      fields: [
                        {
                          name: 'Date Created',
                          value: `${moment.utc(data.created).format('MMMM Do YYYY, h:mm:ss a')}`,
                        },
                        {
                          name: 'Tags',
                          value: `${data.tags.join(', ')}`,
                        },
                        {
                          name: 'Beneficiaries',
                          value: `${data.beneficiaries.join(', ')}`,
                        },
                        {
                          name: 'App',
                          value: `${data.app}`,
                        },
                      ],
                    },
                  });
                }
              }).catch((e) => {
              // eslint-disable-next-line no-console
                console.log(`Get steemPostDetails Catch Block: ${e}`);
              });
          }
        }
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    bot.users.get('404015376511401986').send({
      embed: {
        description: '2. Error while streaming operations. Streaming will be restarted.',
        color: 13632027,
      },
    });
    stream();
  }
}

function checkPosts(msg) {
  const url = msg.content.match(/\bhttps?:\/\/\S+/gi);
  // Check if the URL is null or not
  if (url === null) {
    return;
  }

  const isPostValid = !!url[0].match(
    // eslint-disable-next-line no-useless-escape
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g,
  );
  // console.log(isPostValid);

  const postValue = url[0];
  const postAuthor = postValue.split('@')[1].split('/')[0];
  // eslint-disable-next-line prefer-destructuring
  const postLink = url[0].split('@')[1].split('/')[1].split('?')[0];


  if (isPostValid === true) {
    if (msg.channel.name === 'post-promotion' || msg.channel.name === 'dragon-posts' || msg.channel.name === 'high-quality-posts' || msg.channel.name === 'photography-posts' || msg.channel.name === 'city-curation') {
      getSteemPostDetails(postAuthor, postLink)
        .then((data) => {
          const date = data.created;

          if (date === '1970-01-01T00:00:00') {
            msg.reply('The post link is invalid.');
            return;
          }

          const now = moment.utc();
          const created = moment.utc(date);
          // get the difference between the moments
          const diff = now.diff(created);

          // console.log(moment(msg.createdTimestamp));

          // express as a duration
          const diffDuration = moment.duration(diff);

          if (Math.round(diffDuration.asSeconds()) <= 300) {
            msg.reply('The post is less than 5 minutes old. The post link has been deleted. Please read the guidelines.');
            msg.delete();
            return;
          }

          if (Math.round(diffDuration.asSeconds()) >= 432000) {
            msg.reply('The post is more than 5 days old. The post link has been deleted. Please read the guidelines.');
            msg.delete();
            return;
          }

          const message = `${moment.utc(date).format('MMMM Do YYYY, h:mm:ss a')} \n This post was created ${diffDuration.days()} day(s), ${diffDuration.hours()} hour(s), ${diffDuration.minutes()} min(s) ago.`;
          msg.channel.send({
            embed: {
              color: 2146335,
              fields: [
                {
                  name: 'Date Created',
                  value: message,
                },
                {
                  name: 'Post Link',
                  value: `https://${config.steemUI}/@${postAuthor}/${postLink}`,
                },
                {
                  name: 'Tags',
                  value: `${data.tags.join(', ')}`,
                },
                {
                  name: 'Beneficiaries',
                  value: `${data.beneficiaries.join(', ')}`,
                },
                {
                  name: 'App',
                  value: `${data.app}`,
                },
              ],
            },
          });

          if (msg.channel.name === 'city-curation') {
            steem.broadcast.voteAsync(config.curationWif, 'neoxian-city', postAuthor, postLink, 2300, (err) => {
              if (err) {
                // eslint-disable-next-line no-console
                console.log(`City Curation Vote Error: ${err}`);
              }
            });

            const authorPermlink = `neoxian-${Date.now()}`;
            const postComment = `This post has been rewarded with an upvote from city trail as part of Neoxian City Curation program ![](https://cdn.steemitimages.com/DQmZ4SqDess96h8nz3E2BnRczepPF9WaYa2MrGdgGbf6yTT/ezgif-5-4ec7c52a09cb.gif) ![](https://cdn.steemitimages.com/DQmZLjMtgpjfPzjf6xmHUpCH4DYmFjXRZJrHb3KmUkQCcSj/ezgif-5-7a2c6f978f8b.gif). We are glad to see you using #neoxian tag in your posts. If you still not in our discord, you can join our [Discord Server](${config.neoxianDiscord}) for more goodies and giveaways.\n\nDo you know that you can earn NEOXAG tokens as passive income by delegating to @neoxiancityvb. Here are some handy links for delegations: [100SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=200000%20VESTS), [250SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=500000%20VESTS), [500SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=999000%20VESTS), [1000SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=2000000%20VESTS). Read more about the bot in [this post](https://www.neoxian.city/neoxian/@zaku/introducing-neoxag-bid-bot-sink-delegate-steem-power-and-earn-neoxag-each-and-every-day-passive-profit-for-upvote-buyers). Note: The liquid neoxag reward of this comment will be burned and stake will be used for curation. \n<center>[![](https://ipfs.busy.org/ipfs/QmTLAG3rV9fUr2N9XrdoVrAmot4APQXZQeaYJqbw9Jtp1G)](${config.neoxianDiscord})</center> \n\n`;
            steem.broadcast.comment(config.curationWif, postAuthor, postLink, 'neoxian-city', authorPermlink, '', postComment, { tags: ['neoxian'] }, (err) => {
              if (err) {
                // eslint-disable-next-line no-console
                console.log(`Broadcast Comment Error: ${err}`);
              }
            });
          }
        }).catch((e) => {
          // eslint-disable-next-line no-console
          console.log(`Get steemPostDetails Catch Block: ${e}`);
        });
    }
  } else {
    msg.channel.send('The post link is invalid. Please share only valid links in this channel.');
  }
}

function getRndInteger(min, max) {
  const minim = Math.ceil(min);
  const maxim = Math.floor(max);
  return Math.floor(Math.random() * (maxim - minim + 1)) + minim;
}

bot.login(config.token);

const app = express();
app.use(bodyParser.json());

const server = app.listen(process.env.PORT, '0.0.0.0', () => {
  const host = server.address().address;
  const { port } = server.address();
  // eslint-disable-next-line no-console
  console.log('Web server started at http://%s:%s', host, port);
});

steem.api.setOptions({
  url: config.RPCNode,
});

bot.on('ready', async () => {
  // eslint-disable-next-line no-console
  console.log(`Bot is ready ${bot.user.username}`);
  try {
    await bot.generateInvite(['ADMINISTRATOR']);
    stream();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e.stack);
  }
});

bot.on('message', async (msg) => {
  try {
    // console.log(msg.author.bot);
    if (msg.author.bot) return;

    if (msg.channel.type === 'dm') return;

    if (msg.channel.name === 'post-promotion' || msg.channel.name === 'city-curation' || msg.channel.name === 'dragon-posts' || msg.channel.name === 'high-quality-posts' || msg.channel.name === 'photography-posts') {
      checkPosts(msg);
    }

    if (msg.channel.name === 'play-with-bots') {
      if (msg.content.indexOf('$neox') === 0) {
        // eslint-disable-next-line max-len, no-useless-concat
        const command = 'Please use the following commands to use my features.\n \n ' + '`' + '$random 405 and 670' + '`' + ' - Use this command to find a random number in #play-with-bots channel.';

        msg.channel.send({
          embed: {
            title: `Hi, I'm the Neox Bot version ${pkg.version}.`,
            description: command,
          },
        });
      }

      if (msg.content.indexOf('$random') === 0) {
        const rnd = msg.content.split(' ');
        const min = rnd[1];
        const max = rnd[3];
        // eslint-disable-next-line no-restricted-globals
        if (isNaN(min) || isNaN(max)) {
          // eslint-disable-next-line max-len, no-useless-concat
          msg.reply('Please enter a valid number range to find a random number. ' + '`' + '$random 100 and 250' + '`' + '.');
          return;
        }

        const rndNumber = getRndInteger(min, max);
        msg.reply(`Hey, I found ${rndNumber} as the random number.`);
      }
    }
    return;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e.stack);
  }
});
