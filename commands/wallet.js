const { SlashCommandBuilder } = require('@discordjs/builders');
const { Message } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wallet')
		.setDescription('Get the wallet of the selected user, or your own wallet.')
		.addUserOption(option => option.setName('target').setDescription('The user\'s wallet to show')),
	async execute(interaction, db) {
        let rowResult;
		let user = interaction.options.getUser('target');
		if (!user) user = interaction.user;
        db.all(`SELECT * FROM Items WHERE Owner_ID = ${user.id}`, (err, rows) =>{
            rowResult = rows;
            console.log(rows);
            rows.forEach(row => {
                //console.log(row.length);
                console.log(row.Title + "\t" + row.File_path + "\t" + row.Date_Aquired);
            })
        });
		const sentMessage = await interaction.reply({content: `${user.username} wallet`, fetchReply: true});
        sentMessage.react('⬅️').then(() => sentMessage.react('➡️')).catch(error => console.error('Emoji failed to react', error));
        return sentMessage;
	},
};
