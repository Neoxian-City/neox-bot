const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  token: process.env.token,
  hiveRPCNodes: [
    'https://anyx.io',
    'https://api.hivekings.com',
    'https://api.hive.blog',
    'https://api.openhive.network',
    'https://rpc.ausbit.dev',
    'https://hive-api.arcange.eu',
    'https://hive.roelandp.nl',
  ],
  cityPostsChannel: process.env.cityPostsChannel,
  UI: 'neoxian.city',
  curationWif: process.env.curationWif,
  neoxianDiscord: 'https://discord.gg/s2ff6JQ',
};
