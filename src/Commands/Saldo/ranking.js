const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js');
const { ClientEmbed } = require('../..');

const { SaldoPagamento } = require("../../database/saldo")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Exibe os mais ricos do servidor!"),

    async execute(interaction) {

      const findsaldo = await SaldoPagamento.find(
            {
                server_id: interaction.guild.id,
            }
        )

      const push =  findsaldo.map((produto) =>produto.user_id + " | " + produto.valor);

      array = push // array de exemplo
      
      const getIds = (string) => string.split(' |')[0];
      const getPts = (string) => Number(string.split('| ')[1]);
      let valores = {};
      
    array.forEach(val => {
          // Verifica tudo o que tem antes de "|"
          let id = getIds(val);
          let ponto = getPts(val);
          
          // Verifica se tem a mesma string, apagando ids repetidos e somando valores depois de "|"
          if (!valores[id]) valores[id] = ponto
          else valores[id] += ponto
      })

      let data = [];
      for (const key in valores) 
        data.push({ id: key, pontos: valores[key] });
      
      // Priorizando ordem de pontuação
      data = data.sort((a, b) => b.pontos - a.pontos).map((u, index) => `**${index + 1}º** | R$${u.pontos.toFixed()} já depositados no bot: <@${u.id}>\n\n`)

      const replace = data.toString().replace(',', '')

      const embed = new ClientEmbed()
      .setTitle("Ranking dos mais ricos do servidor!")

      if (!replace.length) {
        embed.setDescription("Nenhum user possui saldo no servidor!")
      }

      if (replace.length) {
        embed.setDescription(`${replace}`)
      }

      interaction.reply({
        embeds: [embed]
      })

    
   }
}

