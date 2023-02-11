const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
const { ClientEmbed } = require('../..');

const { SaldoMsg } = require("../../database/saldo")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("saldo")
    .setDescription("Exibe a mensagem de saldo!.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

   const embed = new ClientEmbed().setDescription("Clique no botão abaixo para adicionar saldo no servidor!")
   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Adicionar Saldo").setCustomId("addsaldo").setStyle(2)
   )

   interaction.reply({ content: "Enviado!", ephemeral: true})

  const saldomsgem = await interaction.channel.send({
    embeds: [ embed ],
    components: [ row ]
   })

  const findmsg = await SaldoMsg.findOne({ server_id: interaction.guild.id })

  if (!findmsg) {

    SaldoMsg.create({
        server_id: interaction.guild.id,
        msgurl: saldomsgem.url
    })

  }
  if (findmsg) {
    SaldoMsg.updateOne({
        server_id: interaction.guild.id
    },
    {
        msgurl: saldomsgem.url
    }
    )
  }

       
    }
}