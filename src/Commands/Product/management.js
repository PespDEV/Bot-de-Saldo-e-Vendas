const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits, SelectMenuBuilder } = require('discord.js');
const { ClientEmbed } = require('../..');

const { Produto } = require("../../database/cart")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("management")
    .setDescription("Gerencie os produtos da loja!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const itens = await Produto.find({ server_id: interaction.guildId });
       let itemAtual = itens.find(() => {}); // tipagem

    if (itens.length < 1) {

       const embed = new ClientEmbed().setDescription("Não há produtos cadastrados na loja")

        return interaction.reply({ embeds: [embed], ephemeral: true});
    } else {

    const rowMenu = new ActionRowBuilder()
    .addComponents(
        new SelectMenuBuilder()
            .setCustomId('managementmenu')
            .setPlaceholder('Selecione algum produto para gerenciar')
            .addOptions(
                itens.map(item => (
                    {
                        label: `${item.nome} (R$ ${item.valor})`,
                        value: `${item._id}`
                    }
                ))
            ),
    );

    const nome = 'Nenhum' 
    const valor = '-'
    const desc = "-"
    const quantidade = '-'

  const embed = new ClientEmbed()
    .setTitle('Gerenciador de produtos')
    .setDescription(
        `Atual produto: \`${nome}\`\n`+
        `Valor: \`${valor}\`\n`+
        `Descrição: \`${desc}\`\n`+
        `Quantidade em estoque: \`${quantidade}\``
    );

    interaction.reply({ embeds: [embed], components: [rowMenu] })
    

    }
    }
}