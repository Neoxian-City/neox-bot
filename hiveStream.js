/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const axios = require('axios');
const dhive = require('@hiveio/dhive');
const fs = require('fs-extra');
const moment = require('moment');
const { Queue } = require('./libs/Queue');
const config = require('./config');
const bot = require('./bot');

const client = new dhive.Client(config.hiveRPCNodes);
const key = dhive.PrivateKey.from(config.curationWif);

const hiveNodes = new Queue();
config.hiveRPCNodes.forEach((node) => hiveNodes.push(node));

const getHiveNode = () => {
  const node = hiveNodes.pop();
  hiveNodes.push(node);

  console.log('Using Hive node:', node); // eslint-disable-line no-console
  // bot.errorMessage(`Using Hive node: ${node}`);
  return node;
};

let hiveNode = '';

const call = async (method, params, failed) => {
  let failedAttempt = failed;
  try {
    let output = {};
    const query = {
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    };
    const content = await axios.post(hiveNode, query);
    if (content.data.result && content.status === 200) {
      output = content.data.result;
      return output;
    }
    // eslint-disable-next-line no-console
    console.log(method, params, failed);
    throw new Error();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`Call error block: \nFailed Attempt: ${failedAttempt}`, e);
    hiveNode = getHiveNode();
    failedAttempt += 1;
    if (failedAttempt <= 5) {
      return call(method, params, failedAttempt);
    }
    return e;
  }
};

const ensureFile = async () => {
  try {
    await fs.ensureFile('./hiveState.json');
    const conf = {};
    const stat = fs.statSync('./hiveState.json');
    if (stat.size === 0) {
      const gp = await call('condenser_api.get_dynamic_global_properties', [], 0);
      const latestBlock = gp.last_irreversible_block_num;
      conf.lastHiveBlockParsed = latestBlock;
      await fs.writeJSONSync('./hiveState.json', conf, { spaces: 4 });
    }
    return;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

const getGlobalProperties = async () => {
  let totalVestingShares = '';
  let totalVestingFundHive = '';
  try {
    const result = await call('condenser_api.get_dynamic_global_properties', [], 0);
    totalVestingShares = result.total_vesting_shares;
    totalVestingFundHive = result.total_vesting_fund_hive;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Error in getGlobalProperties: \n', e);
    bot.errorMessage(`Error in getGlobalProperties: \n ${e}`);
  }
  return { totalVestingShares, totalVestingFundHive };
};

const getHivePostDetails = async (postAuthor, postLink) => {
  let output = {};
  try {
    const content = await call('condenser_api.get_content', [postAuthor, postLink], 0);
    if (content) {
      if (content.json_metadata) {
        const obj = JSON.parse(content.json_metadata);
        const { tags } = obj;
        let { app } = obj;
        const benf = [];
        for (let i = 0; i < content.beneficiaries.length; i += 1) {
          benf.push(`${content.beneficiaries[i].account}(${content.beneficiaries[i].weight / 100}%)`);
        }
        if (benf.length === 0) {
          benf.push('No beneficiaries added');
        }
        if (!app) {
          app = 'No app added';
        }
        output = {
          created: content.created,
          lastUpdate: content.last_update,
          tags,
          app,
          beneficiaries: benf,
          pendingPayout: content.pending_payout_value,
        };
      } else {
        output = {
          created: content.created,
          lastUpdate: content.last_update,
          pendingPayout: content.pending_payout_value,
        };
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`Error getting Hive Post Details: \n\n Author: ${postAuthor} \n Permlink: ${postLink} \n`, e);
    bot.errorMessage(`Error getting Hive Post Details: \n ${e} \n\n Author: ${postAuthor} \n Permlink: ${postLink}`);
  }
  return output;
};

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

          if (Math.round(diffDuration.asSeconds()) >= 86400 * 2) {
            msg.reply('The post is greater than 48 hours old. The post link has been deleted. Please post only links that are less than 48 hours old.');
            msg.delete();
            return;
          }

          const message = `${moment.utc(date).format('MMMM Do YYYY, h:mm:ss a')} \n This post was created ${diffDuration.days()} day(s), ${diffDuration.hours()} hour(s), ${diffDuration.minutes()} min(s) ago.`;
          msg.channel.send({
            embeds: [{
              color: 2146335,
              fields: [
                {
                  name: 'Date Created',
                  value: message,
                },
                {
                  name: 'Post Link',
                  value: `https://${config.UI}/@${postAuthor}/${postLink}`,
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
            }],
          });

          if (msg.channel.name === 'city-curation') {
            const vote = {
              voter: 'neoxian-city',
              author: postAuthor,
              permlink: postLink,
              weight: 2300, // needs to be an integer for the vote function
            };
            client.broadcast.vote(vote, key)
              .then(async (result) => {
                // eslint-disable-next-line no-console
                console.log('City Curation Vote Successful:', result);
                bot.errorMessage(`City Curation Vote Successful: \n\n ${JSON.stringify(result)}`);
                const authorPermlink = `neoxian-${Date.now()}`;
                const gp = await getGlobalProperties();
                const postComment = `This post has been rewarded with an upvote from city trail as part of Neoxian City Curation program ![](https://cdn.steemitimages.com/DQmZ4SqDess96h8nz3E2BnRczepPF9WaYa2MrGdgGbf6yTT/ezgif-5-4ec7c52a09cb.gif) ![](https://cdn.steemitimages.com/DQmZLjMtgpjfPzjf6xmHUpCH4DYmFjXRZJrHb3KmUkQCcSj/ezgif-5-7a2c6f978f8b.gif). We are glad to see you using #neoxian tag in your posts. If you still not in our discord, you can join our [Discord Server](${config.neoxianDiscord}) for more goodies and giveaways.\n\nDo you know that you can earn NEOXAG tokens as passive income by delegating to @neoxiancityvb. Here are some handy links for delegations: [100HP](https://hivesigner.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=${(100 * parseFloat(gp.totalVestingShares.split(' ')[0])) / parseFloat(gp.totalVestingFundHive.split(' ')[0])}%20VESTS), [250HP](https://hivesigner.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=${(250 * parseFloat(gp.totalVestingShares.split(' ')[0])) / parseFloat(gp.totalVestingFundHive.split(' ')[0])}%20VESTS), [500HP](https://hivesigner.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=${(500 * parseFloat(gp.totalVestingShares.split(' ')[0])) / parseFloat(gp.totalVestingFundHive.split(' ')[0])}%20VESTS), [1000HP](https://hivesigner.com/sign/delegateVestingShares?delegator=&delegatee=neoxiancityvb&vesting_shares=${(1000 * parseFloat(gp.totalVestingShares.split(' ')[0])) / parseFloat(gp.totalVestingFundHive.split(' ')[0])}%20VESTS). Read more about the bot in [this post](https://www.neoxian.city/neoxian/@zaku/introducing-neoxag-bid-bot-sink-delegate-steem-power-and-earn-neoxag-each-and-every-day-passive-profit-for-upvote-buyers). Note: The liquid neoxag reward of this comment will be burned and stake will be used for curation. \n<center>[![](https://ipfs.busy.org/ipfs/QmTLAG3rV9fUr2N9XrdoVrAmot4APQXZQeaYJqbw9Jtp1G)](${config.neoxianDiscord})</center> \n\n`;
                const comment = {
                  author: 'neoxian-city',
                  body: postComment,
                  json_metadata: JSON.stringify({ app: 'neoxiancity/0.1', tags: ['neoxian'] }),
                  parent_author: postAuthor,
                  parent_permlink: postLink,
                  permlink: authorPermlink,
                  title: `Neoxian City Curation ${Date.now()}`,
                };
                client.broadcast
                  .comment(comment, key)
                  .then((output) => {
                    // eslint-disable-next-line no-console
                    console.log('City Curation Comment Successful:', output);
                    bot.errorMessage(`City Curation Comment Successful: \n ${JSON.stringify(output)}`);
                  })
                  .catch((error) => {
                    // eslint-disable-next-line no-console
                    console.log('City Curation Comment Error:', error);
                    bot.errorMessage(`City Curation Comment Error: \n ${error}`);
                  });
              })
              .catch((error) => {
                // eslint-disable-next-line no-console
                console.log('City Curation Vote Error:', error);
                bot.errorMessage(`City Curation Vote Error: \n\n ${error}`);
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

const parseBlock = async (block) => {
  for (let i = 0; i < block.length; i += 1) {
    if (block[i]) {
      if (block[i].op[0] === 'comment' && !block[i].op[1].parent_author) {
        const data = await getHivePostDetails(block[i].op[1].author, block[i].op[1].permlink);
        if (data.tags && data.tags.length > 0 && data.app && data.app === 'neoxiancity/0.1') {
          if (data.tags.includes('neoxian') || data.tags.includes('hive-177682')) {
            if (data.created === data.lastUpdate) {
              bot.client.channels.cache.get(config.cityPostsChannel).send(`New Post from Neoxian City: \n https://${config.UI}/@${block[i].op[1].author}/${block[i].op[1].permlink}`);
              bot.client.channels.cache.get(config.cityPostsChannel).send({
                embeds: [{
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
                }],
              });
            }
          }
        }
      }
    }
  }
};

async function parseChain(blockNumber) {
  try {
    const blockRaw = await call('block_api.get_block', { block_num: blockNumber }, 0);
    if (blockRaw.block && blockRaw.block.transactions !== null) {
      if (blockRaw.block.transactions.length > 0) {
        await parseBlock(blockRaw.block.transactions, blockRaw.block.transaction_ids);
      }
      const state = {};
      state.lastHiveBlockParsed = blockNumber + 1;
      fs.writeJSONSync('./hiveState.json', state, { spaces: 4 });
      parseChain(blockNumber + 1);
    } else {
      setTimeout(() => parseChain(blockNumber), config.pollingTime);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error in parseHiveChain', blockNumber, error);
    hiveNode = getHiveNode();
    // eslint-disable-next-line no-unused-vars
    setTimeout(() => parseChain(blockNumber), config.pollingTime);
  }
}

const init = async () => {
  hiveNode = await getHiveNode();
  await ensureFile();
  const conf = fs.readJSONSync('./hiveState.json');
  await parseChain(conf.lastHiveBlockParsed);
};

module.exports = {
  init,
  checkPosts,
};
