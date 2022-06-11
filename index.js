const { Client, Intents } = require('discord.js');
const sqlite3 = require('sqlite3');
const { token } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
    console.log('Logged on as: '+ client.user.username);
})

const db = new sqlite3.Database('./data.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err)
    {
        console.log("Error at DB open is" + err);
        exit(1);
    }
})


client.login(token);
