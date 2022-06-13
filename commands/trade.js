const { SlashCommandBuilder } = require('@discordjs/builders');
const { Message, ReactionCollector, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giveCard')
		.setDescription('Trade Card to another user')
        .addStringOption(option => option.setName('Card Title').setDescription('Card Title to give away'))
		.addUserOption(option => option.setName('target').setDescription('The user to trade to')),
	async execute(interaction, db) {
    }
};
