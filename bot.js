const Discord = require('discord.js');
const config = require('./config');

const client = new Discord.Client({
  disableEveryone: true,
});

client.login(config.token);

const errorMessage = (desc, footerText, footerURL) => {
  client.users.cache.get('404015376511401986').send({
    embed: {
      description: desc,
      color: 16312092,
      footer: {
        icon_url: footerURL,
        text: footerText,
      },
    },
  });
};

module.exports = {
  client, errorMessage,
};
