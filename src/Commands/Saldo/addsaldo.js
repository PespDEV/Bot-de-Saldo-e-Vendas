const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
const { ClientEmbed } = require('../..');

const { Saldo, SaldoPagamento } = require("../../database/saldo")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("addsaldo")
    .setDescription("Adiciona saldo a um usuário!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addNumberOption(option =>
        option.setName('saldo')
        .setDescription('Quantos reais deseja adicionar ao usuário? | EX: 0,5 - 1,5')
        .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('user')
            .setDescription('Usuário que deseja adicionar saldo')
            .setRequired(true)
            ),

    async execute(interaction) {
        const newsaldo = interaction.options.getNumber("saldo")
        const usersaldo = interaction.options.getUser("user")

    const findbd = await Saldo.findOne({ user_id: usersaldo.id })

    const data = new Date().toLocaleString()

    if (!findbd) {

        await SaldoPagamento.create({
            server_id: interaction.guild.id,
             user_id: usersaldo.id,
             valor: newsaldo,
             data: data,
             pagamento_confirmado: true,
        })

        await Saldo.create({
            server_id: interaction.guild.id,
            user_id: usersaldo.id,
            email: "",
            saldo: newsaldo,
        })

    const embednew0 = new ClientEmbed()
    .setDescription("Saldo adicionado com sucesso!")
   .addFields(
    {
        name: "Saldo antigo:",
        value: `0`,
    },
    {
        name: "Saldo novo:",
       value: `${newsaldo}`
    },
   )

   interaction.reply({
    embeds: [ embednew0 ]
   })
    }
    if (findbd) {

        const old = await Saldo.findOne({
            server_id: interaction.guild.id,
            user_id: usersaldo.id,
        })

        const oldsaldo = old.saldo

        const novosaldo = Number(oldsaldo) + Number(newsaldo)

        await SaldoPagamento.create({
            server_id: interaction.guild.id,
             user_id: usersaldo.id,
             valor: newsaldo,
             data: data,
             pagamento_confirmado: true,
        })

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
    .setDescription("Saldo adicionado com sucesso!")
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
