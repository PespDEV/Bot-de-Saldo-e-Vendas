const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder, PermissionFlagsBits, SelectMenuBuilder, ButtonBuilder, ComponentType } = require('discord.js');
const { ClientEmbed } = require('../..');

const { Produto, ProdutoEstoque, MsgProduto } = require("../../database/cart")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("show")
    .setDescription("exibe a mensagem de algum produto!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

      /** @type {{ _id: Number, nome: String, server_id: String, valor: Number, quantidade: Number }[]} */
    const produtos = await Produto.find({ server_id: interaction.guildId });

    const embed = new ClientEmbed().setDescription("Não há produtos cadastrados na loja")

    if (produtos.length < 1) return interaction.reply({ embeds: [embed], ephemeral: true});

    const embedshow = new ClientEmbed().setDescription("Selecione um produto para exibir.")

    const menuRow = new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId('menu_produtos')
                .setPlaceholder('Selecione um item para exibir aqui')
                .addOptions(produtos
                    .map(produto => ({

                        label: produto.nome,
                        value: `${produto._id}`,
                        description: `Valor: R$${produto.valor}`,
                    })
                    )
                )
        );

    const msgMenu = await interaction.channel.send({ embeds: [embedshow], components: [menuRow] });

    const menuCollector = interaction.channel.awaitMessageComponent({
        filter: i => i.customId === 'menu_produtos',
        componentType: ComponentType.SelectMenu,
        max: 1,
        idle: 120_000
    }).then( async (i) => {

        const itemSelecionado = produtos.find(p => `${p._id}` === i.values[0]);

        // console.log(itemSelecionado);

        const filtroBuscaProduto = {
            produtoId: itemSelecionado._id,
            server_id: interaction.guildId
        };

        itemSelecionado.quantidade = await ProdutoEstoque.countDocuments(filtroBuscaProduto);

        await Produto.updateOne(filtroBuscaProduto, { quantidade: itemSelecionado.quantidade });

        

        const embed = new ClientEmbed().setDescription(`\`\`\`${!itemSelecionado.desc ? "Não informado!" : itemSelecionado.desc}\`\`\`\n✨ | **Nome:** ${itemSelecionado.nome}\n💳 | **Preço:** ${itemSelecionado.valor}\n📦 | **Estoque:** ${itemSelecionado.quantidade}`)

        const verifyImage =
        !/^(https?:\/\/)((([-a-z0-9]{1,})?(-?)+[-a-z0-9]{1,})(\.))+([a-z]{1,63})\/((([a-z0-9._\-~#%])+\/)+)?([a-z0-9._\-~#%]+)\.(jpg|jpeg|gif|png|bmp)$/i.test(
            itemSelecionado.image
        );

      if (itemSelecionado.image && !verifyImage) embed.setImage(itemSelecionado.image);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`buy-${itemSelecionado._id}`)
                    .setLabel('Comprar item')
            );

        const filtroBuscaMsg = { produtoId: itemSelecionado._id, server_id: interaction.guildId };

        /** @type {{canal_id: String, msg_id: String, server_id: String, produtoId: Number}} */
        const msgProduto = await MsgProduto.findOne(filtroBuscaMsg);

        await i.deferUpdate();

        if (msgProduto) {

            try {
                /** @type {TextChannel} */
                const canal = interaction.guild.channels.cache.get(msgProduto.canal_id);
                const msgRegistrada = await canal?.messages.fetch(msgProduto.msg_id);

                await i.followUp({ content: `Esse item já está cadastrado [aqui](${msgRegistrada.url})`, ephemeral: true });
                await msgMenu.delete();
                return;
            }
            catch (error) {

                await i.followUp({ content: 'Mensagem ou canal não encontrados, removido do banco... Tente executar novamente', ephemeral: true });
                await MsgProduto.deleteOne(filtroBuscaMsg);
                msgMenu.delete().catch(() => {});
                return;
            }

        }

        const msgProdutoFinal = await interaction.channel.send({ components: [row], embeds: [embed] });

        await MsgProduto.create({
            canal_id: interaction.channelId,
            msg_id: msgProdutoFinal.id,
            server_id: interaction.guildId,
            produtoId: itemSelecionado._id,
        });

        await i.followUp({ content: 'Salvo com sucesso', ephemeral: true });
        msgMenu.delete();
    })
    }}