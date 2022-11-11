const {
  Client, GatewayIntentBits, Partials,
} = require('discord.js');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.login(config.token);

const errorMessage = (desc, footerText, footerURL) => {
  client.users.cache.get('404015376511401986').send({
    embeds: [
      {
        description: desc,
        color: 16312092,
        footer: {
          icon_url: footerURL,
          text: footerText,
        },
      },
    ],
  });
};

module.exports = {
  client, errorMessage,
};
