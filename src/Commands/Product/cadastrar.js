const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ClientEmbed } = require('../..');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("cadastrar")
    .setDescription("Cadastre um produto na loja!!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const modal = new ModalBuilder()
        .setCustomId('productmodal')
        .setTitle('Criação de produto!');

    const namep = new TextInputBuilder()
        .setCustomId('nomeproduto')
        .setLabel("Qual será o nome do produto?")
        .setMaxLength(20)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const descp = new TextInputBuilder()
        .setCustomId('descproduto')
        .setLabel("Qual será a descrição do produto?")
        .setPlaceholder("OPICIONAL")
        .setRequired(false)
        .setMaxLength(100)
        .setStyle(TextInputStyle.Paragraph);

        const valorp = new TextInputBuilder()
        .setCustomId('valorproduto')
        .setLabel("Qual será o valor do produto?")
        .setPlaceholder("1.0 | 0.5 | 10.50")
        .setMaxLength(100)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
        
        const imagemp = new TextInputBuilder()
        .setCustomId('imgproduto')
        .setLabel("Qual será a imagem do produto? (OPCIONAL)")
        .setMinLength(0)
        .setMaxLength(100)
        .setRequired(false)
        .setPlaceholder("https://cdn.discordapp.com/attachments/12...")
        .setStyle(TextInputStyle.Short);

    const p1 = new ActionRowBuilder().addComponents(namep);
    const p2 = new ActionRowBuilder().addComponents(descp);
    const p3 = new ActionRowBuilder().addComponents(valorp);
    const p4 = new ActionRowBuilder().addComponents(imagemp);

    modal.addComponents(p1, p2, p3, p4);

    await interaction.showModal(modal);
       
    }
}