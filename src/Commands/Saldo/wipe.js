const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
const { ClientEmbed } = require('../..');

const { Saldo, SaldoPagamento } = require("../../database/saldo")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("wipe")
    .setDescription("Zera o saldo e ranking de todos os usuários")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        await SaldoPagamento.deleteMany(
            {
                server_id: interaction.guild.id,
            }
        )

        await Saldo.deleteMany(
            {
                server_id: interaction.guild.id,
            }
        )

    const embednew0 = new ClientEmbed()
    .setDescription("Os saldos e rankings foram zerados com sucesso!")

   interaction.reply({
    embeds: [ embednew0 ]
   })
}
}
