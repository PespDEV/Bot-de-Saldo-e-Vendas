const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
const { ClientEmbed } = require('../../');

const { Saldo } = require("../../database/saldo")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Verifique seu saldo atual no bot!"),

    async execute(interaction) {

    const findbd = await Saldo.findOne({ user_id: interaction.user.id })

   const embed = new ClientEmbed()
   .addFields(
    {
        name: "Usuário:",
        value: `${interaction.user}`,
        inline: true
    },
    {
        name: "Saldo:",
        value: `${!findbd ? '0' : parseFloat(findbd.saldo.toFixed(2))}`,
        inline: true
    },
   )

   interaction.reply({
    embeds: [ embed ]
   })

       
    }
}