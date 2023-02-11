const {SlashCommandBuilder, ComponentType,CommandInteraction, AttachmentBuilder ,PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
const { ClientEmbed } = require('../..');

const { SaldoPagamento } = require("../../database/saldo")

const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: process.env.MERCADOPAGO
});

module.exports = {
    data: new SlashCommandBuilder()
    .setName("autobuy")
    .setDescription("gere um qrcode / pix com aprovação automática com o valor que desejar!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('valor')
        .setDescription('Insira um valor para o pagamento!.')
        .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('descrição')
            .setDescription('Insira uma descrição para esse pagamento.')
            .setRequired(false)
            ),

    async execute(interaction) {
       const value = interaction.options.getString("valor")
       let desc = interaction.options.getString("descrição")

        if (!desc) {
            desc = "Não informado"
        }

        if (desc) {
            desc = desc
        }

        const valor = Number(value.replace(',', '.').replace(/[^\d\.]+/g, ''))

        interaction.reply({
            embeds: [
                new ClientEmbed().setDescription("Aguarde, estou criando o pagamento...")
            ]
        })

        const paymentData = {
            transaction_amount: valor,
            description: desc,
            payment_method_id: 'pix',
            payer: {
                email: `${interaction.user.id}@${interaction.guild.id}.com`,
                first_name: `${interaction.user.tag} (${interaction.user.id})`,
            }
        }
      
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
            interaction.editReply({
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
    
               const cancelpaymentembed = new ClientEmbed().setDescription("Pagamento cancelado com sucesso!")
        
            await interaction.channel.bulkDelete(5)

                interaction.channel.send({ 
                    embeds: [cancelpaymentembed],
                    components: []
                })
        });

        const interval = setInterval(async () => {

            const res = await mercadopago.payment.get(data.body.id);
            const pagamentoStatus = res.body.status;

            if (pagamentoStatus != 'approved') {
                return;
            }
            
                if (pagamentoStatus === 'approved') {
                        clearInterval(interval)
                        const embedlogs = new ClientEmbed()
                        .setDescription("**Pagamento aprovado!**")
                        .addFields(
                            {name: "Data:", value: `<t:${~~(Date.now(1) / 1000)}:f>`},
                            {name: "ID da Transação:", value: `${data.body.id}`},
                        )

                        interaction.fetchReply()

                       await interaction.editReply({ embeds: [ embedlogs ], components: [], files: [] })
     
    
   }
}, 5 * 1000)}}

