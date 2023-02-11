const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ClientEmbed } = require('../..');

const { Cupom } = require("../../database/cupom")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("cupom")
    .setDescription("Crie um cupom na loja!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('nome')
        .setDescription('Qual será o nome para uso do cupom?')
        .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('valor')
            .setDescription('Quantos % de desconto esse cupom irá dar?.')
            .setRequired(true)
            ),


    async execute(interaction) {
        const nome = interaction.options.getString("nome")
        const desconto = interaction.options.getString("valor")

        const descontoformat = Number(desconto.replace("%", ""))

        interaction.reply({
            embeds: [new ClientEmbed().setDescription("Estou criando o cupom...")]
        })
      
       await Cupom.create({
        server_id: interaction.guild.id,
        nome: nome,
        desconto: descontoformat,
       })

       setTimeout(() => {
        interaction.editReply({
            embeds: [new ClientEmbed().setDescription("Cupom criado com sucesso!")]
        })
       }, 3000);

    }
}