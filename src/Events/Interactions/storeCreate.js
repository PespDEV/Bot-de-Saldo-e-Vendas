const { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, AttachmentBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")
const { ClientEmbed } = require('../..');

const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADOPAGO
});

const { Produto, ProdutoEstoque, MsgProduto, ProdutoVendido } = require("../../database/cart")

/**
 * @typedef {Object} Produto
 * @property {Number} _id
 * @property {String} nome
 * @property {String} desc
 * @property {String} server_id
 * @property {Number} valor
 * @property {Number} quantidade
 */

/**
 * @typedef {Object} MsgProduto
 * @property {String} canal_id
 * @property {String} msg_id
 * @property {String} server_id
 * @property {Number} produtoId
 */

/**
 * @typedef {Object} ProdutoEstoque
 * @property {Number} produtoId
 * @property {String} server_id
 * @property {String} conteudo
 * @property {Number} data_adicao
 */

module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction
     */ 
  async execute(interaction, client) {
    
    const itens = await Produto.find({ server_id: interaction.guildId });
       let itemAtual = itens.find(() => {}); // tipagem

    if (interaction.isModalSubmit()) {
        if (interaction.customId === "productmodal") {


            const nome = interaction.fields.getTextInputValue('nomeproduto');
            const desc = interaction.fields.getTextInputValue('descproduto');
            const valor = interaction.fields.getTextInputValue('valorproduto');
            const imagem = interaction.fields.getTextInputValue('imgproduto');

            if (isNaN(valor)) {
                interaction.reply({
                    embeds: [
                        new ClientEmbed().setDescription("O valor do produto não pode conter letras!")
                    ], ephemeral: true
                })
            }

           else if (!isNaN(valor)) {
            interaction.reply({ embeds: [new ClientEmbed().setDescription("Estou criando o produto, aguarde...")], ephemeral: true })

            await Produto.create({
                server_id: interaction.guild.id,
                nome: nome,
                desc: desc,
                image: imagem,
                valor: Number(valor.replace(',', '.').replace(/[^\d\.]+/g, '')),
            })

            setTimeout(() => {
                interaction.editReply({ embeds: [new ClientEmbed().setDescription("Produto criado com sucesso!")] })                
            }, 3000);
        }

        }
    }

    if (interaction.isSelectMenu()) {
        if (interaction.customId === "managementmenu") {
            
            const [ itemId ] = interaction.values;
            const itemEscolhido = itens.find(i => `${i._id}` === itemId);
            itemEscolhido.quantidade = await ProdutoEstoque.countDocuments({
                server_id: interaction.guildId,
                produtoId: itemEscolhido._id,
            });

            itemAtual = itemEscolhido;

            const embed = new ClientEmbed()
            .setTitle('Gerenciador de produtos')
            .setDescription(
                `Atual produto: \`${itemEscolhido.nome}\`\n`+
                `Valor: \`${itemEscolhido.valor}\`\n`+
                `Descrição: \`${!itemEscolhido.desc ? 'Não informado!' : itemEscolhido.desc}\`\n`+
                `Quantidade em estoque: \`${itemEscolhido.quantidade}\``
            );

        const botaoAdd = new ButtonBuilder()
        .setLabel('Adicionar estoque')
        .setCustomId('btnADD')
        .setStyle(3);

         const botaoEdit = new ButtonBuilder()
        .setLabel('Editar produto')
        .setCustomId('editProduct')
        .setStyle(1);

        const botaodeletar = new ButtonBuilder()
        .setLabel('Deletar produto')
        .setCustomId('delP')
        .setStyle(4);

        const row = new ActionRowBuilder().addComponents(botaoAdd, botaoEdit, botaodeletar)

        interaction.update({ embeds: [ embed ], components: [row] });

        const coletor = interaction.channel.createMessageComponentCollector({
            filter: i => [ 'delP', 'editProduct', 'btnADD'  ].includes(i.customId),
            idle: 5 * 60 * 1_000
        });

        coletor.on('collect', async interaction => {

            if (interaction.user.id !== interaction.user.id) return interaction.deferUpdate();
    
             if (interaction.isButton()) { 
        if (interaction.customId === 'btnADD') {

            try {

                const modal = new ModalBuilder()
                .setCustomId('novo_item')
                .setTitle('Adicionar estoque');

                  const conteudoInput = new TextInputBuilder()
                        .setCustomId('conteudo')
                      .setLabel('O que será entregue à quem comprar?')
                      .setRequired(true)
                      .setStyle(TextInputStyle.Paragraph);

                      const cinput = new ActionRowBuilder().addComponents(conteudoInput);

                      modal.addComponents(cinput)

                      await interaction.showModal(modal);

                      const modalInteraction = await interaction.awaitModalSubmit({ filter: i => i.user.id === interaction.user.id, time: 120_000 });

                        const conteudo = modalInteraction.fields.getTextInputValue('conteudo');
            
                             await modalInteraction.reply({ embeds: [new ClientEmbed().setDescription("Processando...")], ephemeral: true });

                const filtroBusca = {
                    produtoId: itemAtual._id,
                    server_id: interaction.guildId,
                };


                await ProdutoEstoque.create({
                    ...filtroBusca,
                    conteudo,
                    data_adicao: Date.now(),
                });

                const quantidadeItens = await ProdutoEstoque.countDocuments(filtroBusca);
                itemAtual.quantidade = quantidadeItens;

                await Produto.updateOne({ _id: itemAtual._id }, { quantidade: itemAtual.quantidade });

                setTimeout(async() => {
                    await modalInteraction.editReply({ embeds: [new ClientEmbed().setDescription("Produto adicionado ao estoque com sucesso!")], ephemeral: true });
                }, 3000);

                const embed = new ClientEmbed()
                .setTitle('Gerenciador de produtos')
                .setDescription(
                    `Atual produto: \`${itemAtual.nome}\`\n`+
                    `Valor: \`${itemAtual.valor}\`\n`+
                    `Descrição: \`${!itemAtual.desc ? 'Não informado!' : itemAtual.desc}\`\n`+
                    `Quantidade em estoque: \`${itemAtual.quantidade}\``
                );

                interaction.message.edit({ embeds: [ embed ] });

               /** @type {MsgProduto} */
    const msgProduto = await MsgProduto.findOne({ server_id: interaction.guildId, produtoId: itemAtual._id });

    if (!msgProduto) {
        return;
    }

    /** @type {TextChannel} */
    const canal = interaction.guild.channels.cache.get(msgProduto.canal_id);
    if (!canal) return interaction.followUp({ content: `Canal de atualizar estoque de ${itemAtual.nome} não encontrado`, ephemeral: true });


    canal.messages.fetch(msgProduto.msg_id)
        .then(async m => {
            await m.edit({ embeds: [

                new ClientEmbed().setDescription(`\`\`\`${itemAtual.desc}\`\`\`\n✨|Nome: ${itemAtual.nome}\n💳|Preço: ${itemAtual.valor}\n📦|Estoque: ${itemAtual.quantidade}`)

            ] });
            interaction.followUp({ content: 'Mensagem do produto atualizada com sucesso.', ephemeral: true });
        })
        .catch(() => interaction.followUp(
            {
                content: 'Erro ao atualizar a mensagem do produto.',
                ephemeral: true
            }
        ));

            }
            catch(err) {
                console.log(err);
            }
        }
        if (interaction.customId === 'delP') {

                 interaction.update({
                    embeds:[
                        new ClientEmbed()
                        .setDescription("Produto excluido da database com sucesso!")
                    ],
                    components: []
                })

            await Produto.deleteOne({
                produtoId: itemAtual._id,
                server_id: interaction.guildId,
            })

            await ProdutoEstoque.deleteOne({
                produtoId: itemAtual._id,
                server_id: interaction.guildId,
            });

        }
        if (interaction.customId === 'editProduct') {

            const modal = new ModalBuilder()
            .setCustomId('newproductmodal')
            .setTitle('Edição de produto!');
    
        const namep = new TextInputBuilder()
            .setCustomId('newnomeproduto')
            .setLabel("Qual será o novo nome do produto? (OPCIONAL)")
            .setMaxLength(20)
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
    
        const descp = new TextInputBuilder()
            .setCustomId('newdescproduto')
            .setLabel("Qual será a nova descrição do produto?")
            .setRequired(false)
            .setPlaceholder("OPICIONAL")
            .setMaxLength(100)
            .setStyle(TextInputStyle.Paragraph);
    
            const valorp = new TextInputBuilder()
            .setCustomId('newvalorproduto')
            .setLabel("Qual será o novo valor do produto? (OPCIONAL)")
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("1.0 | 0.5 | 10.50")
            .setRequired(false);
            
            const imagemp = new TextInputBuilder()
            .setCustomId('newimgproduto')
            .setLabel("Qual será a nova imagem do produto?")
            .setMinLength(0)
            .setMaxLength(100)
            .setRequired(false)
            .setPlaceholder("OPCIONAL")
            .setStyle(TextInputStyle.Short);
    
        const p1 = new ActionRowBuilder().addComponents(namep);
        const p2 = new ActionRowBuilder().addComponents(descp);
        const p3 = new ActionRowBuilder().addComponents(valorp);
        const p4 = new ActionRowBuilder().addComponents(imagemp);
    
        modal.addComponents(p1, p2, p3, p4);
    
        await interaction.showModal(modal);

        const modalInteraction = await interaction.awaitModalSubmit({
            filter: i => i.user.id === interaction.user.id,
            time: 120_000
        }); 
        
        const novonome = modalInteraction.fields.getTextInputValue('newnomeproduto');
        const novadesc = modalInteraction.fields.getTextInputValue('newdescproduto');
        const novovalor = modalInteraction.fields.getTextInputValue('newvalorproduto');
        const novaimagem = modalInteraction.fields.getTextInputValue('newimgproduto');

        if (isNaN(novovalor)) {
            interaction.editReply({
                embeds: [
                    new ClientEmbed().setDescription("O valor do produto não pode conter letras!")
                ], ephemeral: true
            })
        }

       else if (!isNaN(novovalor)) {

        if (!novonome && !novadesc && !novovalor && !novaimagem) {
            modalInteraction.reply({content: 'Nenhum campo foi preenchido, nada foi alterado', ephemeral: true})
        }
       
        const dadosAtualizar = {};

         const valorFmt = Number(novovalor?.replace(',', '.'));

         if (novovalor && !valorFmt) {
             return modalInteraction.reply({ content: 'Valor no formato inválido, tente usar algo no formato `5`, ou `2,50`', ephemeral: true})
        } 

        if (novonome) dadosAtualizar.nome = novonome;
        if (novovalor) dadosAtualizar.valor = novovalor;
        if (novadesc) dadosAtualizar.desc = novadesc;
        if (novaimagem) dadosAtualizar.image = novaimagem;

        const dadosAlterados = Object.keys(dadosAtualizar)
        .map(k => `${k} alterado para \`${dadosAtualizar[k]}\``)
        .join('\n');

        await modalInteraction.reply({ content: dadosAlterados, ephemeral: true})
                  
          /** @type {Produto}*/
          const produtoAtualizado = await Produto.findOneAndUpdate(
            {
                _id: itemAtual._id,
                server_id: itemAtual.server_id,
            },
            {
                ...dadosAtualizar
            },
            {
                returnDocument: 'after'
            }
            
        );

        itemAtual = produtoAtualizado;

        interaction.message.edit({ embeds: [ new ClientEmbed()
            .setTitle('Gerenciador de produtos')
            .setDescription(
                `Atual produto: \`${itemAtual.nome}\`\n`+
                `Valor: \`${itemAtual.valor}\`\n`+
                `Descrição: \`${!itemAtual.desc ? 'Não informado!' : itemAtual.desc}\`\n`+
                `Quantidade em estoque: \`${itemAtual.quantidade}\``
            ) ] });

            if (novonome) await ProdutoVendido.updateMany(
                {
                    server_id: itemAtual.server_id,
                    id: itemAtual._id,
                },
                {
                    novonome
                }
            );

                 /** @type {MsgProduto} */
    const msgProduto = await MsgProduto.findOne({ server_id: interaction.guildId, produtoId: itemAtual._id });

    if (!msgProduto) {
        return;
    }

    /** @type {TextChannel} */
    const canal = interaction.guild.channels.cache.get(msgProduto.canal_id);
    if (!canal) return interaction.followUp({ content: `Canal de atualizar estoque de ${itemAtual.nome} não encontrado`, ephemeral: true });


    canal.messages.fetch(msgProduto.msg_id)
        .then(async m => {
            
           const embededit = new ClientEmbed().setDescription(`\`\`\`${!itemAtual.desc ? "Não informado" : itemAtual.desc}\`\`\`\n✨ | **Nome:** ${itemAtual.nome}\n💳 | **Preço:** ${itemAtual.valor}\n📦 | **Estoque:** ${itemAtual.quantidade}`)

            await m.edit({ embeds: [
                embededit
            ] });

            const verifyImage =
            !/^(https?:\/\/)((([-a-z0-9]{1,})?(-?)+[-a-z0-9]{1,})(\.))+([a-z]{1,63})\/((([a-z0-9._\-~#%])+\/)+)?([a-z0-9._\-~#%]+)\.(jpg|jpeg|gif|png|bmp)$/i.test(
              itemAtual.image
            );
    
          if (itemAtual.image && !verifyImage) embededit.setImage(itemAtual.image);

            interaction.followUp({ content: 'Mensagem do produto atualizada com sucesso.', ephemeral: true });
        })
        .catch(() => interaction.followUp(
            {
                content: 'Erro ao atualizar a mensagem do produto.',
                ephemeral: true
            }
        ));

            return;

    }

        }
    }})
    }

    }}}