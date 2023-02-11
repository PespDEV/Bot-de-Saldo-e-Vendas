const { EmbedBuilder } = require('discord.js');

module.exports = class ClientEmbed extends EmbedBuilder {
  constructor(data = {}) {
    super(data);
    this.setColor(0x9003fc)
    this.setAuthor({
      name: "PesP Saldo",
      iconURL: "https://media.discordapp.net/attachments/1049062492631990424/1061435099415064596/pesp.png"
  })
  this.setFooter({ text: "PesP Saldo", iconURL: "https://media.discordapp.net/attachments/1049062492631990424/1061435099415064596/pesp.png"})
  }
};
