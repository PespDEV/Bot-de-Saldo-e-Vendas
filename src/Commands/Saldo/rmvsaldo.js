const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
const { ClientEmbed } = require('../..');

const { Saldo } = require("../../database/saldo")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("rmvsaldo")
    .setDescription("Remove saldo de um usuário!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addNumberOption(option =>
        option.setName('saldo')
        .setDescription('Quantos reais deseja remover do usuário? | 0,5 - 1,5')
        .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('user')
            .setDescription('Usuário que deseja remover o saldo')
            .setRequired(true)
            ),

    async execute(interaction) {
        const newsaldo = interaction.options.getNumber("saldo")
        const usersaldo = interaction.options.getUser("user")

    const findbd = await Saldo.findOne({ user_id: usersaldo.id })

    if (!findbd) {
        interaction.reply("O usuário não possui saldo!")
    }
    if (findbd) {

        const old = await Saldo.findOne({
            server_id: interaction.guild.id,
            user_id: usersaldo.id,
        })

        const oldsaldo = old.saldo

        const novosaldo = Number(oldsaldo) - Number(newsaldo)

        await Saldo.updateOne(
            {
                server_id: interaction.guild.id,
                user_id: usersaldo.id,
            },
            {
                saldo: novosaldo
            }
        )

    const embednew0 = new ClientEmbed()
    .setDescription("Saldo removido com sucesso!")
   .addFields(
    {
        name: "Saldo antigo:",
        value: `${oldsaldo}`,
    },
    {
        name: "Saldo novo:",
       value: `${novosaldo}`
    },
   )

   interaction.reply({
    embeds: [ embednew0 ]
   })

    }




    }}
