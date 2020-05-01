const { Client } = require('@hivechain/dhive');
const moment = require('moment');
const config = require('./config.json');
const bot = require('./bot.js');

const client = new Client(config.hiveRPCNodes);

let streamOn = false;

const getHivePostDetails = async (postAuthor, postLink) => new Promise(((yes, no) => {
  client.database.call('get_content', [postAuthor, postLink])
    .then((result) => {
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
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log(err);
      bot.errorMessage(`Error getting Hive Post Details: \n ${err}`);
      no(err);
    });
}));

const checkPosts = async (msg) => {
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
      getHivePostDetails(postAuthor, postLink)
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
            const vote = {
              voter: 'neoxian-city',
              author: postAuthor,
              permlink: postLink,
              weight: 2300, // needs to be an integer for the vote function
            };
            client.broadcast.vote(vote, config.curationWif)
              .then((result) => {
                // eslint-disable-next-line no-console
                console.log('City Curation Vote Successful:', result);
              })
              .catch((error) => {
                // eslint-disable-next-line no-console
                console.log(`City Curation Vote Error: ${error}`);
              });

            const authorPermlink = `neoxian-${Date.now()}`;
            const postComment = `This post has been rewarded with an upvote from city trail as part of Neoxian City Curation program ![](https://cdn.steemitimages.com/DQmZ4SqDess96h8nz3E2BnRczepPF9WaYa2MrGdgGbf6yTT/ezgif-5-4ec7c52a09cb.gif) ![](https://cdn.steemitimages.com/DQmZLjMtgpjfPzjf6xmHUpCH4DYmFjXRZJrHb3KmUkQCcSj/ezgif-5-7a2c6f978f8b.gif). We are glad to see you using #neoxian tag in your posts. If you still not in our discord, you can join our [Discord Server](${config.neoxianDiscord}) for more goodies and giveaways.\n\nDo you know that you can earn NEOXAG tokens as passive income by delegating to @neoxiancityvb. Here are some handy links for delegations: [100SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=200000%20VESTS), [250SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=500000%20VESTS), [500SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=999000%20VESTS), [1000SP](https://beta.steemconnect.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=2000000%20VESTS). Read more about the bot in [this post](https://www.neoxian.city/neoxian/@zaku/introducing-neoxag-bid-bot-sink-delegate-steem-power-and-earn-neoxag-each-and-every-day-passive-profit-for-upvote-buyers). Note: The liquid neoxag reward of this comment will be burned and stake will be used for curation. \n<center>[![](https://ipfs.busy.org/ipfs/QmTLAG3rV9fUr2N9XrdoVrAmot4APQXZQeaYJqbw9Jtp1G)](${config.neoxianDiscord})</center> \n\n`;
            const comment = {
              author: 'neoxian-city',
              postComment,
              json_metadata: { app: 'neoxiancity/0.1', tags: ['neoxian'] },
              parent_author: postAuthor,
              parent_permlink: postLink,
              authorPermlink,
              title: `Neoxian City Curation ${Date.now()}`,
            };
            client.broadcast
              .comment(comment, config.curationWif)
              .then((result) => {
                // eslint-disable-next-line no-console
                console.log(`City Curation Comment Successful: \n ${result}`);
                bot.errorMessage(`City Curation Comment Successful: \n ${result}`);
              })
              .catch((error) => {
                // eslint-disable-next-line no-console
                console.log(`City Curation Comment Error: \n ${error}`);
                bot.errorMessage(`City Curation Comment Error: \n ${error}`);
              });
          }
        }).catch((e) => {
          // eslint-disable-next-line no-console
          console.log(`Get steemPostDetails Catch Block: \n ${e}`);
          bot.errorMessage(`Get steemPostDetails Catch Block: \n ${e}`);
        });
    }
  } else {
    msg.channel.send('The post link is invalid. Please share only valid links in this channel.');
  }
};

const stream = async () => {
  try {
    streamOn = true;
    bot.errorMessage('Stream has started');
    (async () => {
      const opsStream = client.blockchain.getOperationsStream();
      opsStream.on('data', (result) => {
        if (result) {
          if (result[0] === 'comment' && !result[1].parent_author) {
            const obj = JSON.parse(result[1].json_metadata);
            const { app } = obj;
            if (app === 'neoxiancity/0.1') {
              getHivePostDetails(result[1].author, result[1].permlink)
                .then((data) => {
                  const date = data.created;

                  if (date === '1970-01-01T00:00:00') {
                    return;
                  }

                  const now = moment.utc();
                  const created = moment.utc(date);
                  // get the difference between the moments
                  const diff = now.diff(created);

                  // express as a duration
                  const diffDuration = moment.duration(diff);

                  if (Math.round(diffDuration.asSeconds()) <= 60) {
                    bot.client.channels.cache.get(config.cityPostsChannel).send(`New Post from Neoxian City: \n https://${config.steemUI}/@${result[1].author}/${result[1].permlink}`);
                    bot.client.channels.cache.get(config.cityPostsChannel).send({
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
                  console.log(`Get steemPostDetails Catch Block: \n ${e}`);
                  bot.errorMessage(`Get HivePostDetails Catch Block: \n ${e}`);
                });
            }
          }
        }
      });
    })();
  } catch (e) {
    streamOn = false;
    // eslint-disable-next-line no-console
    console.log(e);
    bot.errorMessage(`Error while streaming: \n ${e} \n\n Streaming will be restarted.`);
    if (streamOn === false) {
      stream();
    }
  }
};

const startStream = () => {
  if (streamOn === false) {
    stream();
  }
};

module.exports = {

  stream, startStream, getHivePostDetails, checkPosts,

};