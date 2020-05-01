const express = require('express');
const bodyParser = require('body-parser');
const hive = require('./hive.js');
const bot = require('./bot.js');
// eslint-disable-next-line no-unused-vars
const { mongoose } = require('./db.js');
const pkg = require('./package.json');

function getRndInteger(min, max) {
  const minim = Math.ceil(min);
  const maxim = Math.floor(max);
  return Math.floor(Math.random() * (maxim - minim + 1)) + minim;
}

const app = express();
app.use(bodyParser.json());

const server = app.listen(process.env.PORT, '0.0.0.0', () => {
  const host = server.address().address;
  const { port } = server.address();
  // eslint-disable-next-line no-console
  console.log('Web server started at http://%s:%s', host, port);
});

bot.client.on('ready', async () => {
  // eslint-disable-next-line no-console
  console.log(`Bot is ready ${bot.client.user.username}`);
  try {
    await bot.client.generateInvite(['ADMINISTRATOR']);
    hive.startStream();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e.stack);
  }
});

bot.client.on('message', async (msg) => {
  try {
    // console.log(msg.author.bot);
    if (msg.author.bot) return;

    if (msg.channel.type === 'dm') return;

    if (msg.channel.name === 'post-promotion' || msg.channel.name === 'city-curation' || msg.channel.name === 'dragon-posts' || msg.channel.name === 'high-quality-posts' || msg.channel.name === 'photography-posts') {
      const msgLower = msg.content.toLowerCase();
      const strPos = msgLower.indexOf('steemit.com');
      if (strPos > -1) {
        msg.delete();
        msg.reply('Steemit links are forbidden in this City. Please use other links like Neoxian.city or SteemPeak. Your link has been deleted. Also, please read the rules of the city for more details.');
        return;
      }
      hive.checkPosts(msg);
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
