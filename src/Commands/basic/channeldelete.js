const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    Client,
} = require ("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("channeldelete")
    .setDescription("Exclui o canal onde o comando é executado")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
/**
 * 
 * @param {ChatInputCommandInteraction} interaction
 * @param {Client} client 
 */

 execute(interaction, client) {
    interaction.channel.delete()
}
}