const { ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, AttachmentBuilder, ComponentType } = require("discord.js")
const { ClientEmbed } = require('../..');

const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADOPAGO
});

const { Saldo, SaldoPagamento } = require("../../database/saldo")

const { saldoparent, logssaldo } = require("../../config/saldo.json")

module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction
     */ 
  async execute(interaction, client) {
       
    if (interaction.isButton()) {
    if (interaction.customId === "addsaldo") {

        let checkTicket = interaction.guild.channels.cache.find(
            (c) => c.topic === interaction.user.id
          );

        if (checkTicket) {
            const embedgo = new ClientEmbed().setDescription("Você ja possui uma adição de saldo pendente, clique no botão para ir até ela!")
            const botaogo = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setLabel("Ir para o ticket")
                .setStyle(5)
                .setURL(checkTicket.url)
            )

            interaction.reply({ 
                embeds: [embedgo],
                components: [botaogo],
                ephemeral: true
            })
        }
        else {

        const find = await Saldo.findOne({ user_id: interaction.user.id })

        if (!find) {
       await Saldo.create({
            server_id: interaction.guild.id,
            user_id: interaction.user.id,
            email: "",
            saldo: 0.00,
        })
    }

        await interaction.guild.channels.create({
            name: `saldo-${interaction.user.username}`,
            parent: saldoparent,
            topic: interaction.user.id,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        }).then(async (channel) => {

            
            const embedgo = new ClientEmbed().setDescription("Seu ticket de adição de saldo foi aberto com sucesso, use o botão abaixo para ir até ele!")
            const botaogo = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setLabel("Ir para o ticket")
                .setStyle(5)
                .setURL(channel.url)
            )

            interaction.reply({ 
                embeds: [embedgo],
                components: [botaogo],
                ephemeral: true
            })

            const embed = new ClientEmbed().setTitle("Adicionar Saldo - GB Store").setDescription("Esse ticket servirá para você adicionar saldo!")
            channel.send({
                content: `${interaction.user}`,
                embeds: [embed],
                components: [
                    new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                    .setLabel("Cancelar")
                    .setCustomId("cancel")
                    .setStyle(4)
                    )
                ]
            })

            channel.send("Para começar, digite seu email (ele servirá para caso ocorra algum problema com sua compra)")

            const filter = m => m.author.id == interaction.user.id

           const collector = channel.createMessageCollector({ filter, time: 35000 })

            collector.on('collect', async (m) => {

                const conteudo = m.content

                collector.stop()

                const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

                if (conteudo.match(validRegex)) {


                    await Saldo.updateOne(
                        {
                        server_id: interaction.guild.id,
                        user_id: interaction.user.id
                        },
                        {
                            email: conteudo,
                        },
                    )

                   await channel.bulkDelete(2)

                   channel.send("Quantos reais de saldo você deseja adicionar? Ex: 0.50, 1.00, 10.00")

                   const filter = v => v.author.id == interaction.user.id

                   const collector = channel.createMessageCollector({ filter, time: 30000 })
        
                    collector.on('collect', async (v) => {
        
                        const valor = v.content
        
                        collector.stop()

                        if (isNaN(valor)) {
                            
                            const embed = new ClientEmbed().setDescription("O valor do produto não pode conter letras, esse canal será deletado em 5 segundos")

                            await channel.bulkDelete(5)
        
                            channel.send({ embeds: [embed]})
                          
                            setTimeout(() => {
                                channel.delete()
                            }, 10000);

                        }
                        else {
                        const datahj = new Date().toLocaleString()

                        SaldoPagamento.create(
                            {
                                server_id: interaction.guild.id,
                                user_id: v.author.id,
                                canal: channel.id,
                                valor: Number(valor.replace(',', '.').replace(/[^\d\.]+/g, '')),
                                data: datahj,
                                pagamento_confirmado: false,
                                idpagamento: "",
                                refounded: false,
                                logmsg: ""
                            }
                        )


                      const embeds  = new ClientEmbed()
                        .setDescription(`Tem certeza que deseja adicionar R$${valor} de saldo?`)

                      const rows =  new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                            .setLabel("Ir ao pagamento")
                            .setCustomId("gopayment")
                            .setStyle(3),

                            new ButtonBuilder()
                            .setLabel("Cancelar")
                            .setCustomId("cancel")
                            .setStyle(4)

                        )

                       await channel.bulkDelete(10)

                         channel.send({
                            embeds: [embeds],
                            components: [rows]
                        })
                    }
                        })
                    
                    
                    collector.on('end', collected => {
                        
                        const msg = collected.map(v => v.content)
        
                       if (!msg.length) {
                        channel.delete()
                       }
                       
                    });

                  }
                  else {

                    const embed = new ClientEmbed().setDescription("Você inseriu um email inválido, esse canal será deletado em 10 segundos!")

                    await channel.bulkDelete(5)

                    channel.send({ embeds: [embed]})
                  
                    setTimeout(() => {
                        channel.delete()
                    }, 10000);
                  }
                

                })
            
            collector.on('end', collected => {
                
                const msg = collected.map(m => m.content)

               if (!msg.length) {
                channel.delete()
               }

            });
        })

    }}
    

    if (interaction.customId === "gopayment") {

      const values = await SaldoPagamento.findOne({ 
        server_id: interaction.guild.id,
        user_id: interaction.user.id,
        canal: interaction.channel.id
        })

        
      const emailandsaldo = await Saldo.findOne({ 
        server_id: interaction.guild.id,
        user_id: interaction.user.id
        })

        const valor = values.valor
        const email = emailandsaldo.email

        const paymentData = {
            transaction_amount: valor,
            description: "Saldo - System by PesP </>#0087 ",
            payment_method_id: 'pix',
            payer: {
                email: email,
                first_name: `${interaction.user.tag} (${interaction.user.id})`,
            }
        }

       const waiting = new ClientEmbed().setDescription("Estou criando o ambiente de pagamento, aguarde...")

        interaction.update({
            embeds: [waiting],
            components: []
        })

        const data = await mercadopago.payment.create(paymentData);                    
        const base64_img = data.body.point_of_interaction.transaction_data.qr_code_base64;
        const link = data.body.point_of_interaction.transaction_data.ticket_url;

        const buf = Buffer.from(base64_img, 'base64');
        const attachment = new AttachmentBuilder(buf, { name: 'qrcode.png' });

        const embedpayment = new ClientEmbed().setDescription("Seu pagamento foi criado com sucesso!")
        .addFields(
            {name: "Valor:", value: `${valor}`},
            {name: "ID do Pagamento:", value: `${data.body.id}`},
            {name: "Expira em:", value: `<t:${~~((Date.now() + 8.64e7) / 1000 )}:f>`}
        )
        .setImage('attachment://qrcode.png')

        const rowCopiaCola = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setLabel("Copia e Cola")
            .setStyle(2)
            .setCustomId("copypaste"),

            new ButtonBuilder()
            .setLabel("Link de pagamento")
            .setStyle(5)
            .setURL(link),

             new ButtonBuilder()
            .setLabel("Cancelar Pagamento")
            .setStyle(4)
            .setCustomId("cancelpayment"),
        )

        setTimeout(() => {
            interaction.followUp({
                embeds: [ embedpayment ],
                files: [attachment],
                components: [ rowCopiaCola ]
            })
        }, 5000);

        const coletorCopiaCola = interaction.channel.createMessageComponentCollector(
            {
                componentType: ComponentType.Button,
                time: 10 * 60 * 1000,
                filter: i => i.user.id === interaction.user.id && i.customId === 'copypaste',
            });


        coletorCopiaCola.on('collect', async i => {

            i.channel.send({
                content: `${data.body.point_of_interaction.transaction_data.qr_code}`,
            })

            rowCopiaCola.components[0].setDisabled(true);

            await i.update({ components: [ rowCopiaCola ] });
        });

        const coletorcancelar = interaction.channel.createMessageComponentCollector(
            {
                componentType: ComponentType.Button,
                time: 10 * 60 * 1000,
                filter: i => i.user.id === interaction.user.id && i.customId === 'cancelpayment',
            });


            coletorcancelar.on('collect', async i => {

                await mercadopago.payment.cancel(data.body.id)

                await SaldoPagamento.deleteOne({ 
                    server_id: interaction.guild.id,
                    user_id: interaction.user.id,
                    canal: interaction.channel.id
                })
        
               const cancelpaymentembed = new ClientEmbed().setDescription("Pagamento cancelado com sucesso! Esse canal será deletado em 10 segundos...")
        
            await interaction.channel.bulkDelete(5)

                interaction.channel.send({ 
                    embeds: [cancelpaymentembed],
                    components: []
                })
        
                setTimeout(() => {
                    interaction.channel.delete()
                }, (10000));
        });

        const interval = setInterval(async () => {

            const res = await mercadopago.payment.get(data.body.id);
            const pagamentoStatus = res.body.status;

            if (pagamentoStatus != 'approved') {
                return;
            }
            
                if (pagamentoStatus === 'approved') {
                        clearInterval(interval)

                        const findsaldoatual = await Saldo.findOne(
                            {  
                                server_id: interaction.guild.id,
                                user_id: interaction.user.id
                            })
                        
                        
                            const finalvalue = valor + Number(findsaldoatual.saldo)

                            await Saldo.updateOne(
                                {
                                    server_id: interaction.guild.id,
                                    user_id: interaction.user.id
                                },
                                {
                                    saldo: finalvalue
                                }
                            )
                            

                        const embed = new ClientEmbed()
                        .setDescription("Olá, seu pagamento foi aprovado com sucesso!")
                        .addFields(
                            {name: "Saldo antigo:", value: `${findsaldoatual.saldo.toFixed(1)}`},
                            {name: "Saldo novo:", value: `${finalvalue.toFixed(1)}`},
                            {name: "Data:", value: `<t:${~~(Date.now(1) / 1000)}:f>`},
                            {name: "Id da Transação:", value: `${data.body.id}`}
                        )
                        
                        
                        interaction.user.send({
                            embeds: [embed]
                        })

                        const logs = interaction.guild.channels.cache.get(logssaldo)
                        
                        const embedlogs = new ClientEmbed()
                        .setDescription("**Novo pagamento aprovado!(Saldo)**")
                        .addFields(
                            {name: "Usuário:", value: `${interaction.user}`},
                            {name: "Saldo antigo:", value: `${findsaldoatual.saldo.toFixed(1)}`},
                            {name: "Saldo novo:", value: `${finalvalue.toFixed(1)}`},
                            {name: "Data:", value: `<t:${~~(Date.now(1) / 1000)}:f>`},
                            {name: "ID da Transação:", value: `${data.body.id}`},
                            {name: "email:", value: `${findsaldoatual.email}`}
                        )

                        const rowlogs = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setLabel("Reembolsar pagamento").setCustomId("refound").setStyle(2)
                        )

                        const logsmsg = await logs.send({ embeds: [ embedlogs ], components: [rowlogs] })

                        const coisarlog = logsmsg.id

                        await SaldoPagamento.updateOne(
                            { 
                            server_id: interaction.guild.id,
                            user_id: interaction.user.id,
                            canal: interaction.channel.id
                           },
                           {
                            pagamento_confirmado: true,
                            idpagamento: data.body.id,
                            logmsg: coisarlog
                          }
                        )

                        setTimeout(() => {
                            interaction.channel.delete()
                        }, 2000);

                }
            }, 5 * 1000)    
}

    if (interaction.customId === "refound") {

       const findata = await SaldoPagamento.findOne({ logmsg: interaction.message.id })

       const data = findata.idpagamento

       mercadopago.payment.refund(data)

       const puxaratual = await Saldo.findOne({  
        server_id: interaction.guild.id,
        user_id: findata.user_id
    })

    const novosaldo = Number(puxaratual.saldo) - Number(findata.valor)

    const arrumar = parseFloat(novosaldo.toFixed(2))

      await SaldoPagamento.updateOne(
        {
            server_id: interaction.guild.id,
            user_id: findata.user_id,
            logmsg: interaction.message.id
        },
        {
            refounded: true
        }
       )

       await Saldo.updateOne(
        {
            server_id: interaction.guild.id,
            user_id: findata.user_id
        },
        {
            saldo: arrumar
        }
       )

       const novobotao = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setLabel("REEMBOLSADO").setCustomId("refound").setDisabled(true).setStyle(2)
       )

       interaction.update({ components: [novobotao] })

       

    }

    if (interaction.customId === "cancel") {


        const cancelpaymentembed = new ClientEmbed().setDescription("Adição de saldo cancelada com sucesso! Esse canal será deletado em 5 segundos...")

        interaction.update({ 
            embeds: [cancelpaymentembed],
            components: []
        })

        interaction.channel.permissionOverwrites.set([
            {
                id: interaction.user.id,
                deny: [PermissionsBitField.Flags.SendMessages],
              }
        ])


        await SaldoPagamento.deleteOne({ 
            server_id: interaction.guild.id,
            user_id: interaction.user.id,
            canal: interaction.channel.id
        })

        setTimeout(async() => {
            await interaction.channel.delete()
        }, 5000);
    }

}
}}