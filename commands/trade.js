const { SlashCommandBuilder } = require('@discordjs/builders');
const { Message, ReactionCollector, MessageEmbed } = require('discord.js');
const { clientId } = require('../config.json');
const dayjs = require('dayjs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trade')
		.setDescription('Trade Card with another user')
		.addUserOption(option => option.setName('trade_target').setDescription('The user to trade with').setRequired( true )),
	async execute(interaction, db, client) {
		const targetUser = interaction.options.getUser('trade_target');
		if (!targetUser.bot && (targetUser !== interaction.user))
		await interaction.reply(`Sent trade menu to ${interaction.user}'s DM`);
		else {
			await interaction.reply('Trade target can not be a bot or yourself');
			return;
		}
		let infoMessage = await interaction.user.send("Pick card to trade from your wallet with ✅ or use ❌ to select NO card");
		
		//Testing main user collect item
		userTradeItem = await this.tradeBuilder(interaction.user, db, interaction.user);
		await infoMessage.delete();

		infoMessage = await interaction.user.send("Pick card to trade from target wallet with ✅ or use ❌ to select NO card");
		targetTradeItem = await this.tradeBuilder(targetUser, db, interaction.user);
		console.log(targetTradeItem);
		await infoMessage.delete();

		if ((userTradeItem == null) && (targetTradeItem == null)) {
			interaction.user.send('No cards selected, Exiting.');
			return;
		}

		let userAccept;
		let targetAccept;

		await interaction.user.send(`**Do you want to offer this trade to ${targetUser.username}**`);
		userAccept = await this.finalChoiceBuilder(userTradeItem, targetTradeItem, interaction.user, interaction.user.username, targetUser.username);
		if (userAccept) {
			await interaction.user.send('Sent request to target user!');
			
			await targetUser.send(`**You have received a trade request from ${interaction.user.username}!**`);
			await targetUser.send(`**Click ✅ to accept or ❌ to decline**`);
			targetAccept = await this.finalChoiceBuilder(userTradeItem, targetTradeItem, targetUser, interaction.user.username, targetUser.username);
			if (targetAccept) {
				await targetUser.send('**Trade Accepted**');
				await interaction.user.send(`**${targetUser.username} accepted the trade!**`);
				const now = dayjs();
				if ((userTradeItem != null) && (targetTradeItem != null)) {

					db.exec(`UPDATE Items
					SET Owner_ID = "${interaction.user.id}", Date_Aquired = "${now.month()+1}-${now.date()}-${now.year()}"
					WHERE Title = "${targetTradeItem.Title}" AND Owner_ID = "${targetTradeItem.Owner_ID}";
					
					UPDATE Items
					SET Owner_ID = "${targetUser.id}", Date_Aquired = "${now.month()+1}-${now.date()}-${now.year()}"
					WHERE Title = "${userTradeItem.Title}" AND Owner_ID = "${userTradeItem.Owner_ID}";`);
					return;
				}
				else if (userTradeItem == null) {
					await db.exec(`UPDATE Items
					SET Owner_ID = "${interaction.user.id}", Date_Aquired = "${now.month()+1}-${now.date()}-${now.year()}"
					WHERE Title = "${targetTradeItem.Title}" AND Owner_ID = "${targetTradeItem.Owner_ID}";`);
					return;
				}
				else if (targetTradeItem == null) {
					await db.exec(`UPDATE Items
					SET Owner_ID = "${targetUser.id}", Date_Aquired = "${now.month()+1}-${now.date()}-${now.year()}"
					WHERE Title = "${userTradeItem.Title}" AND Owner_ID = "${userTradeItem.Owner_ID}";`);
					return;
				}
			}
			else {
				await targetUser.send('**Trade Declined**');
				await interaction.user.send(`**${targetUser.username} declined the trade or did not respond!**`);
				return;
			}
		}
		interaction.user.send("**Canceled trade offer.**");
		return;


    },
	async finalChoiceBuilder(userTradeItem, targetTradeItem, interactionUser, firstCardName, secondCardName) {

		// OFFERING MENU SETUP
		const embedPages = [];
		let accepted = false;

		if (userTradeItem != null) {
			embedPages.push(new MessageEmbed()
					.setColor('#800080')
					.setTitle(`${firstCardName}'s Card`)
					.addFields(
						{ name: 'Current Card', value: `${userTradeItem.Title}`, inline: false},
					)
					.setImage(`${userTradeItem.File_path}`)
					.setFooter({ text: `Made by Austin`, iconURL: 'https://i.imgur.com/ARER89d.jpg'}));
				}
		else {
			embedPages.push(new MessageEmbed()
			.setColor('#800080')
			.setTitle(`${firstCardName}'s Card`)
			.addFields(
				{ name: 'Current Card', value: `None`}
			)
			.setFooter({ text: `Made by Austin`, iconURL: 'https://i.imgur.com/ARER89d.jpg'}));
		}

		if (targetTradeItem != null) {
			embedPages.push(new MessageEmbed()
					.setColor('#800080')
					.setTitle(`${secondCardName}'s Card`)
					.addFields(
						{ name: 'Current Card', value: `${targetTradeItem.Title}`, inline: false},
					)
					.setImage(`${targetTradeItem.File_path}`)
					.setFooter({ text: `Made by Austin`, iconURL: 'https://i.imgur.com/ARER89d.jpg'}));
				}
		else {
			embedPages.push(new MessageEmbed()
			.setColor('#800080')
			.setTitle(`${secondCardName}'s Card`)
			.addFields(
				{ name: 'Current Card', value: `None`}
			)
			.setFooter({ text: `Made by Austin`, iconURL: 'https://i.imgur.com/ARER89d.jpg'}));
		}

		const sentMessage = await interactionUser.send({ text: 'Review trade offer!', embeds: [embedPages[0]] });
		sentMessage.react('✅').then(() => sentMessage.react('⬅️')).then(() => sentMessage.react('➡️')).then(() => sentMessage.react('❌')).catch(error => console.error('Emoji failed to react', error));
		
		let currPage = 0;

		const filter = (reaction, user) => (reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️' || reaction.emoji.name === '❌' || reaction.emoji.name === '✅') && !user.bot;
		const pageFlipper = sentMessage.createReactionCollector({filter, idle: 300000});

		pageFlipper.on('collect', (reaction, reactUser) => {
			if (reaction.emoji.name === '⬅️') {
				if (currPage > 0) {
					currPage--;
				}
				else {
					currPage = 1;
				}
			}
			else if (reaction.emoji.name === '➡️') {
				if (currPage < 1) {
					currPage++;
				}
				else {
					currPage = 0;
				}
			}
			else if (reaction.emoji.name === '✅') {
				accepted = true;
				pageFlipper.stop();
			}
		
			else if (reaction.emoji.name === '❌') {
				accepted = false;
				pageFlipper.stop();
			}
			if (currPage != null) {
				sentMessage.edit({ embeds: [embedPages[currPage]]});
			}
		})

		return new Promise(resolve => pageFlipper.on('end', async () => {
			resolve(accepted);
		}))
	},
	async tradeBuilder(user, db, interactionUser) {
		const rowResult = await db.all(`SELECT Title, File_path, Date_Aquired, Owner_ID FROM Items WHERE Owner_ID = ${user.id}`);

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
		
        // Only allows reactions and checks them if user has more than 1 Card
        if (embedPages.length > 1) {
			const sentMessage = await interactionUser.send({ embeds: [embedPages[0]] });
            sentMessage.react('✅').then(() => sentMessage.react('⬅️')).then(() => sentMessage.react('➡️')).then(() => sentMessage.react('❌')).catch(error => console.error('Emoji failed to react', error));
            
            let currPage = 0;

            const filter = (reaction, user) => (reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️' || reaction.emoji.name === '❌' || reaction.emoji.name === '✅') && !user.bot;
            const pageFlipper = sentMessage.createReactionCollector({filter, idle: 300000});

            pageFlipper.on('collect', (reaction, reactUser) => {
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
				else if (reaction.emoji.name === '✅') {
					pageFlipper.stop();
				}
			
				else if (reaction.emoji.name === '❌') {
					currPage = null;
					pageFlipper.stop();
				}
				if (currPage != null) {
					sentMessage.edit({ embeds: [embedPages[currPage]]});
				}
            })

			return new Promise(resolve => pageFlipper.on('end', async () => {
				if (currPage != null) {
					await sentMessage.edit(`**Selected ${rowResult[currPage].Title} from wallet**`);
					await sentMessage.suppressEmbeds(true);
					resolve(rowResult[currPage]);
				}
				else {
					await sentMessage.edit(`**Selected NO card from wallet**`);
					await sentMessage.suppressEmbeds(true);
					resolve(null);
				}
			}))
        }
		
		await interactionUser.send(`**No cards found in wallet, defaulting to no card**`);
		return new Promise(resolve => {
			resolve(null);
		})

		
	}
};
