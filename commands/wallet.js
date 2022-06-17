const { SlashCommandBuilder } = require('@discordjs/builders');
const { Message, ReactionCollector, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wallet')
		.setDescription('Get the wallet of the selected user, or your own wallet.')
		.addUserOption(option => option.setName('target').setDescription('The user\'s wallet to show')),
	async execute(interaction, db, client) {
		let user = interaction.options.getUser('target');
		if (!user) user = interaction.user;

        // Gets the users owned cards from SQLite db
        const rowResult = await db.all(`SELECT Title, File_path, Date_Aquired FROM Items WHERE Owner_ID = ${user.id}`);
        // Makes array of every possible page to be shown
        const embedPages = [];
        if (rowResult.length > 0) {
            for (let i = 0; i < rowResult.length; i++) {
                embedPages.push(new MessageEmbed()
                .setColor('#800080')
                .setTitle(`${user.username}'s wallet`)
                .addFields(
                    { name: 'Current Card', value: `${rowResult[i].Title}`, inline: true},
                    { name: 'Date Aquired', value: `${rowResult[i].Date_Aquired}`, inline: true}
                )
                .setImage(`${rowResult[i].File_path}`)
                .setFooter({ text: `Made by Austin --- Card ${i+1}/${rowResult.length}`, iconURL: 'https://i.imgur.com/ARER89d.jpg'}));
            }
        }
        // Default page if user does not have any cards
        else {
            embedPages.push(new MessageEmbed()
            .setColor('#800080')
            .setTitle(`${user.username}'s wallet`)
            .addFields(
                { name: 'Current Card', value: `None`}
            )
            .setFooter({ text: `Made by Austin --- Card 0/0`, iconURL: 'https://i.imgur.com/ARER89d.jpg'}));

        }

        // Inital Message send
		const sentMessage = await interaction.reply({ embeds: [embedPages[0]] , fetchReply: true});

        // Only allows reactions and checks them if user has more than 1 Card
        if (embedPages.length > 1) {
            sentMessage.react('⬅️').then(() => sentMessage.react('➡️')).catch(error => console.error('Emoji failed to react', error));
            
            let currPage = 0;

            const filter = (reaction, user) => (reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️') && !user.bot;
            const pageFlipper = sentMessage.createReactionCollector({filter, idle: 30000});

            pageFlipper.on('collect', (reaction, reactUser) => {
                reaction.users.remove(reactUser);
                if (reactUser == interaction.user) {
                    if (reaction.emoji.name === '⬅️') {
                        if (currPage > 0) {
                            currPage--;
                        }
                        else {
                            currPage = (rowResult.length - 1);
                        }
                    }
                    else if (reaction.emoji.name === '➡️') {
                        if (currPage < (rowResult.length - 1)) {
                            currPage++;
                        }
                        else {
                            currPage = 0;
                        }

                    }
                    sentMessage.edit({ embeds: [embedPages[currPage]]});
                }
            })

            pageFlipper.on('end', () => {
                sentMessage.reactions.removeAll();
            })
        }

        return sentMessage;
	},
};
