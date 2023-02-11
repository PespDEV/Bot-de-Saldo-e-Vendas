// eslint-disable-next-line no-unused-vars
const { ButtonInteraction, ComponentType ,Collection, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { Buffer }  = require('buffer');
const { ProdutoEstoque, Produto, Pagamento, Carrinho, ProdutoVendido } = require('../database/cart');
const { ClientEmbed } = require('..');
const { atualizarMsgProduto } = require("./atualizarMsgProduto") 
const { Saldo, SaldoPagamento, SaldoMsg } = require("../database/saldo");
const { Cupom } = require('../database/cupom');
const { logscart } = require("../config/saldo.json")

/**
 * @typedef {Object} ProdutoCarrinho
 * @property {String} msg_produto_id
 * @property {Number} produto_id
 * @property {String} produto_nome
 * @property {String} produto_conteudo
 * @property {Number} produto_valor
 */

/**
 * @typedef {Object} Carrinho
 * @property {String} server_id
 * @property {String} user_id
 * @property {String} msg_carrinho_status
 * @property {ProdutoCarrinho[]} produtos
 */

/**
 * @param {ButtonInteraction} interaction
 */
const gerarPagamento = async (interaction) => {


    const corEmbedPendente = '#FF0031';
    const corEmbedAprovado = '#3AFF03';


    try {
        /** @type {Carrinho} */
        const carrinhoDados = await Carrinho.findOne({
            server_id: interaction.guildId,
            user_id: interaction.user.id,
        });


        const quantidade = carrinhoDados.produtos.length;

        if (quantidade < 1) return interaction.reply('Não tem nada no carrinho!')
            .then(() => {

                setTimeout(() => {
                    interaction.deleteReply();
                }, 10_000);
            });


            const valor = carrinhoDados.produtos
            .map(p => p.produto_valor * 100)
            .reduce((acc, curr) => acc + curr) / 100;


            const saldodb = await Saldo.findOne({
                server_id: interaction.guild.id,
                user_id: interaction.user.id
            })

            if (!saldodb || valor > saldodb.saldo) {

                /** @type {Carrinho} */
                const carrinhoDados = await Carrinho.findOne({
                    server_id: interaction.guildId,
                    msg_carrinho_status: interaction.message.id,
                });

                if (carrinhoDados.produtos.length > 0) {

                    /** @type {Produto[]} */
                    const todosProdutos = await Produto.find({ server_id: interaction.guildId });

                    /** @type {Collection<Number,ProdutoCarrinho[]>} */
                    const categoriasProdutos = new Collection();
                    // Para separar os produtoss corretamente

                    carrinhoDados.produtos.forEach(p => {
                        categoriasProdutos.get(p.produto_id)?.push(p) || categoriasProdutos.set(p.produto_id, [p]);
                    });

                    for (const [ id, produtos ] of categoriasProdutos) {

                        await ProdutoEstoque.insertMany(produtos.map(i => (
                            {
                                produtoId: i.produto_id,
                                server_id: interaction.guildId,
                                conteudo: i.produto_conteudo,
                                data_adicao: i.produto_data_adicao,
                            })
                        ));
                        const produtoAtualizar = todosProdutos.find(i => i._id === id);
                        produtoAtualizar.quantidade = await ProdutoEstoque.countDocuments(
                            {
                                server_id: interaction.guildId,
                                produtoId: id,    
                            });
                        atualizarMsgProduto(produtoAtualizar, interaction);
                    }

                }

                await Carrinho.deleteOne({
                    server_id: interaction.guildId,
                    user_id: interaction.user.id,
                });

                interaction.update({embeds: [new ClientEmbed().setDescription("Você não possui saldo suficiente para comprar esse produto! - Esse canal será deletado em 5 segundos")], components: []})

                setTimeout(() => {
                    interaction.channel.delete()
                }, 5000);
                
            } else {

                var data = new Date();
            const gerarprotocol = ("0" + data.getDate()).substr(-2)+("0" + (data.getMonth() + 1)).substr(-2)+data.getFullYear()+Math.floor(1000 + Math.random() * 9000);

            const idMsgsProduto = carrinhoDados.produtos.map(p => p.msg_produto_id);

            const msgsProduto = (await interaction.channel.messages.fetch())
                .filter(msg => idMsgsProduto.includes(msg.id));
    
    
           await interaction.channel.bulkDelete(1).catch(() => {});

            const msgsApagar = [];

            const saldorestante = saldodb.saldo - valor

            const finalrestante = saldorestante.toFixed(1)

            const embed = new ClientEmbed()
            .setDescription(`Deseja confimar o pagamento no valor de R$${valor}? O seu saldo restante será de R$${finalrestante}`)

            const botoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setLabel("Confimar")
                .setStyle(3)
                .setCustomId("confirmpayment"),

                new ButtonBuilder()
                .setLabel("Cancelar")
                .setStyle(4)
                .setCustomId("cancelpayment"),

                new ButtonBuilder()
                .setLabel("Adicionar Cupom")
                .setStyle(2)
                .setCustomId("cupomadd")

            )

         interaction.channel.send({ embeds: [embed], components: [botoes]})

         const cartid = interaction.user.id+Math.floor(1000 + Math.random() * 9000);

         await Pagamento.create({
            server_id: interaction.guildId,
            user_id: interaction.user.id,
            canal_id: interaction.channel.id,
            pagamento_confirmado: false,
            cupomaplicado: false,
            valordocupom: 0,
            saldorestante: 0,
            idpayment: ""
         })

         const coletorcupom = interaction.channel.createMessageComponentCollector(
            {
                componentType: ComponentType.Button,
                time: 10 * 60 * 1000,
                filter: i => i.user.id === interaction.user.id && i.customId === 'cupomadd',
            });

            coletorcupom.on('collect', async (i) => {

                i.reply("Envie seu cupom nesse chat")

                const filter = m => m.author.id == i.user.id

                const collector = i.channel.createMessageCollector({ filter, time: 10 * 60 * 1000 })
     
                 collector.on('collect', async (m) => {
     
                     const conteudo = m.content
                     console.log(conteudo)

                    const acharcupom = await Cupom.findOne(
                        {
                            server_id: interaction.guildId,
                            nome: conteudo
                        }
                     )

                     if (!acharcupom) {
                        m.delete()
                        return interaction.channel.send("Esse cupom não existe!")
                     } else if (acharcupom) {


                     const inversevalue = Number(valor) * Number(acharcupom.desconto) / 100
                     const valorfinal = Number(valor) - Number(inversevalue)

                     const saldodesconto = saldorestante + inversevalue

                    const finaldesconto = saldodesconto.toFixed(1)

                     const newembed = new ClientEmbed()
                     .setDescription(`Deseja confimar o pagamento no valor de R$${Number(valorfinal)}? O seu saldo restante será de R$${finaldesconto}\n\n **Cupom inserido com sucesso!**`)

                     await interaction.channel.bulkDelete(10)

                     
                     await Pagamento.updateOne(
                        {
                            server_id: interaction.guildId,
                            user_id: interaction.user.id,
                            canal_id: interaction.channel.id
                        },
                        {
                            cupomaplicado: true,
                            valordocupom: acharcupom.desconto,
                            saldorestante: saldodesconto
                        }
                     )

                    interaction.channel.send({
                        embeds: [newembed],
                        components: [botoes]
                     })

                

                    }


                 })
    
            });

            const coletorconfirm = interaction.channel.createMessageComponentCollector(
                {
                    componentType: ComponentType.Button,
                    time: 10 * 60 * 1000,
                    filter: i => i.user.id === interaction.user.id && i.customId === 'confirmpayment',
                });
    
                coletorconfirm.on('collect', async (i) => {

                   await Pagamento.updateOne(
                        {
                            server_id: interaction.guildId,
                            user_id: interaction.user.id,
                            canal_id: interaction.channel.id
                        },
                        {
                            pagamento_confirmado: true,
                            idpayment: gerarprotocol
                        }
                    )

                    const cupomstats = await Pagamento.findOne(
                        {
                            server_id: interaction.guildId,
                            user_id: interaction.user.id,
                            canal_id: interaction.channel.id
                        }
                    )



                    if (!cupomstats.cupomaplicado) {

                        const getantigosaldo = await Saldo.findOne(
                            {
                                server_id: interaction.guild.id, 
                                user_id: interaction.user.id 
                            }
                        )
                
                        //SEM CUPOM
                        const novosaldo = saldorestante
                        
                      await Saldo.updateOne(
                            { server_id: interaction.guild.id, 
                                user_id: interaction.user.id 
                            },
                            {
                                saldo: novosaldo
                            }
                            )


                    const conteudoProdutos = carrinhoDados.produtos
            .sort((a, b) => a.produto_id - b.produto_id)
            .map((produto, index) => `${index + 1}º | ${produto.produto_conteudo}`);

            const nomeproduto = carrinhoDados.produtos
            .sort((a, b) => a.produto_id - b.produto_id)
            .map((produto, index) => `${produto.produto_nome}`);

           const entregarprodutos = conteudoProdutos.join('\n')

          const newconfirmrow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
          .setLabel("Confirmado!")
          .setStyle(3)
          .setDisabled(true)
          .setCustomId("confirmpayment")
          )

          const getpaymentid = await Pagamento.findOne(
            {
                server_id: interaction.guildId,
                user_id: interaction.user.id,
                canal_id: interaction.channel.id
            }
        )

            const pegarvalor = getantigosaldo.saldo - finalrestante

            const produto = nomeproduto
            const valor = pegarvalor.toFixed(1)
            const saldoantigo = getantigosaldo.saldo.toFixed(1)
            const saldonovo = finalrestante
            const idcompra = getpaymentid.idpayment

            cartlogs(interaction, produto, valor, saldoantigo, saldonovo, idcompra )

          i.message.edit({ components: [newconfirmrow] })

          i.reply({content: `${i.user}, o(s) produto(s) foram enviados na sua DM!, Esse canal será deletado em 15 segundos...`})

          setTimeout(() => {
            i.channel.delete()
          }, 15000);

            const embedprodutos = new ClientEmbed().setDescription(`**Olá, aqui estão seus produtos:**\n\n ${entregarprodutos}`).setFooter({ text: `ID da compra: ${idcompra}`})

            i.user.send({ embeds: [embedprodutos]})


                            .then(async () => {
                                await Carrinho.deleteOne({
                                    server_id: interaction.guildId,
                                    user_id: interaction.member.id
                                });
                                await interaction.channel.setTopic(`Carrinho desativado de ${interaction.user.tag}`);
                            }
                            );



                    }

                    if (cupomstats.cupomaplicado) {
                     
                        const getsaldo = await Pagamento.findOne(
                            {
                                server_id: interaction.guildId,
                                user_id: interaction.user.id,
                                canal_id: interaction.channel.id
                            }
                        )

                        const saldorcomcupom = getsaldo.saldorestante
                        
                        const getantigosaldo = await Saldo.findOne(
                            {
                                server_id: interaction.guild.id, 
                                user_id: interaction.user.id 
                            }
                        )

                        await Saldo.updateOne(
                            { server_id: interaction.guild.id, 
                                user_id: interaction.user.id 
                            },
                            {
                                saldo: saldorcomcupom
                            }
                            )


                    const conteudoProdutos = carrinhoDados.produtos
            .sort((a, b) => a.produto_id - b.produto_id)
            .map((produto, index) => `${index + 1}º | ${produto.produto_conteudo}`);

            const nomeproduto = carrinhoDados.produtos
            .sort((a, b) => a.produto_id - b.produto_id)
            .map((produto, index) => `${produto.produto_nome}`);

            const produto = nomeproduto
            const pegarvalor = getantigosaldo.saldo - saldorcomcupom
            const valor = pegarvalor.toFixed(1)
            const saldoantigo = getantigosaldo.saldo.toFixed(1)
            const saldonovo = saldorcomcupom.toFixed(1)
            const idcompra = getsaldo.idpayment

            cartlogs(interaction, produto, valor, saldoantigo, saldonovo, idcompra )

           const entregarprodutos = conteudoProdutos.join('\n')
 
          const newconfirmrow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
          .setLabel("Confirmado!")
          .setStyle(3)
          .setDisabled(true)
          .setCustomId("confirmpayment")
          )

          i.message.edit({
            components: [newconfirmrow]
          })

          interaction = i

          i.reply({content: `${i.user}, o(s) produto(s) foram enviados na sua DM!, Esse canal será deletado em 15 segundos...`})

          setTimeout(() => {
            i.channel.delete()
          }, 15000);

            const embedprodutos = new ClientEmbed().setDescription(`**Olá, aqui estão seus produtos:**\n\n ${entregarprodutos}`).setFooter({ text: `ID da compra: ${idcompra}`})

            i.user.send({ embeds: [embedprodutos]})


                            .then(async () => {
                                await Carrinho.deleteOne({
                                    server_id: interaction.guildId,
                                    user_id: interaction.member.id
                                });
                                await interaction.channel.setTopic(`Carrinho desativado de ${interaction.user.tag}`);
                            }
                            );

                        
                    }

                })

                const coletorcancel = interaction.channel.createMessageComponentCollector(
                    {
                        componentType: ComponentType.Button,
                        time: 10 * 60 * 1000,
                        filter: i => i.user.id === interaction.user.id && i.customId === 'cancelpayment',
                    });
        
                    coletorcancel.on('collect', async (i) => {

                        const newconfirmrow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                          .setLabel("Cancelado!")
                          .setStyle(4)
                          .setDisabled(true)
                          )
                
                          i.update({
                            components: [newconfirmrow]
                          })
                
                          i.reply({content: `${interaction.user}, Compra cancelada com sucesso, esse canal será deletado em 10 segundos...`})
        
                        /** @type {Carrinho} */
                        const carrinhoDados = await Carrinho.findOne({
                            server_id: interaction.guildId,
                            msg_carrinho_status: interaction.message.id,
                        });
        
                        if (carrinhoDados.produtos.length > 0) {
        
                            /** @type {Produto[]} */
                            const todosProdutos = await Produto.find({ server_id: interaction.guildId });
        
                            /** @type {Collection<Number,ProdutoCarrinho[]>} */
                            const categoriasProdutos = new Collection();
                            // Para separar os produtoss corretamente
        
                            carrinhoDados.produtos.forEach(p => {
                                categoriasProdutos.get(p.produto_id)?.push(p) || categoriasProdutos.set(p.produto_id, [p]);
                            });
        
                            for (const [ id, produtos ] of categoriasProdutos) {
        
                                await ProdutoEstoque.insertMany(produtos.map(i => (
                                    {
                                        produtoId: i.produto_id,
                                        server_id: interaction.guildId,
                                        conteudo: i.produto_conteudo,
                                        data_adicao: i.produto_data_adicao,
                                    })
                                ));
                                const produtoAtualizar = todosProdutos.find(i => i._id === id);
                                produtoAtualizar.quantidade = await ProdutoEstoque.countDocuments(
                                    {
                                        server_id: interaction.guildId,
                                        produtoId: id,    
                                    });
                                atualizarMsgProduto(produtoAtualizar, interaction);
                            }
        
                        }
        
                        await Carrinho.deleteOne({
                            server_id: interaction.guildId,
                            user_id: interaction.user.id,
                        });
        
                        setTimeout(() => i.channel.delete().catch(() => {}), 10000);

                    })

                



                    }} catch (error) {
                        console.log(error)
                    }
                }

function cartlogs(interaction, produto, valor, saldoantigo, saldonovo, idcompra) {

    const canalogs = interaction.guild.channels.cache.get(logscart)

    const embedlogs = new ClientEmbed()
    .setTitle("Nova compra(Produto) no servidor!")
    .addFields(
        {
            name: "Usuário:", value: `${interaction.user}`
        },
        {
            name: "Produto:", value: `${produto}`
        },
        {
            name: "Valor:", value: `${valor}`
        },
        {
            name: "Saldo antigo:", value: `${saldoantigo}`
        },
        {
            name: "Saldo novo:", value: `${saldonovo}`
        },
        {
            name: "ID da compra:", value: `${idcompra}`
        },
        {
            name: "Data:", value: `<t:${~~(Date.now(1) / 1000)}:f>`
        }
    )

    canalogs.send({ embeds: [embedlogs]})

}

module.exports = { gerarPagamento };
