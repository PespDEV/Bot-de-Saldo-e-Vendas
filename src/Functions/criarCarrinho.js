// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonInteraction, PermissionsBitField } = require('discord.js');
const { Carrinho, Produto } = require('../database/cart');
const { gerarEmbedCarrinhoDetalhes } = require('./gerarEmbedCarrinhoDetalhes');


/** @param {ButtonInteraction} interaction */
const criarCarrinho = async (categoriaCarrinho, interaction) => {

    const filtroCarrinho = {
        user_id: interaction.user.id,
        server_id: interaction.guildId,
    };

    const produtoId = Number(interaction.customId.split('-')[1]);

    const itens = await Produto.find({ server_id: interaction.guildId });
    const itemEncontrado = itens.find(obj => obj._id === produtoId);
     const { nome, valor, _id } = itemEncontrado;
     

    const carrinhoCanal = await interaction.guild.channels.create({
        name: `carrinho-${interaction.user.username}`,
        parent: categoriaCarrinho.id,
        topic: interaction.user.id,
        permissionOverwrites: [
            {
                id: interaction.guild.id,
               deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [ PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages ]
            },
        ],
    });

    const msgCarrinhoStatus = await carrinhoCanal.send({

        embeds: [
            gerarEmbedCarrinhoDetalhes(null, interaction)
        ],

        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('➕')
                        .setStyle(1)
                        .setCustomId(`adicionar_produto_${_id}`),
                    new ButtonBuilder()
                        .setLabel('Finalizar')
                        .setStyle(1)
                        .setCustomId('finalizar-compra'),
                    new ButtonBuilder()
                        .setLabel('Cancelar compra')
                        .setStyle(4)
                        .setCustomId('cancelar-compra'),
                        new ButtonBuilder()
                        .setLabel('➖')
                        .setStyle(4)
                        .setCustomId(`remover_produto_${_id}`),
                )
        ]

    });

    await Carrinho.updateOne(
        { ...filtroCarrinho },
        {
            ...filtroCarrinho,
            msg_carrinho_status: msgCarrinhoStatus.id,
            produtos: []
        },
        {
            upsert: true
        }
    );

    return carrinhoCanal;
};

module.exports = { criarCarrinho };
