// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, Collection, ButtonInteraction } = require('discord.js');
const { ClientEmbed } = require('..');

/**
 * Função que atualiza o status do carrinho
 * @param {{ nome: String, valor: Number }[]} dados
 * @param {ButtonInteraction} interaction
 */
const gerarEmbedCarrinhoDetalhes = (dados, interaction) => {

    const calcularValor = (quantidade, valorUnidade) => (quantidade * (valorUnidade * 100)) / 100;

    const embed = new ClientEmbed()
        .setAuthor({ name: 'Seu carrinho', iconURL: interaction.member.displayAvatarURL({ dynamic: true }) });

    console.log(dados);

    if (!dados || !dados[0]) return embed;

    const cont = {};

    dados.forEach(e => {
        cont[e.nome] = (cont[e.nome] || 0) + 1;
    });

    const dadosCollection = new Collection();
    dados.forEach(i => dadosCollection.set(i.nome, i));

    const total = dadosCollection
        .map(item => calcularValor(cont[item.nome], item.valor))
        .reduce((acc, curr) => acc + curr);



    dadosCollection.forEach(item => embed.addFields(
        {name: "Produto:", value: `${item.nome}`, inline: true},
        {name: `Quantidade:`,  value: `${cont[item.nome]}`, inline: true}
        ));

    return embed
        .addFields({name: "Total:", value: `R$${total}`, inline: true});
};

module.exports = { gerarEmbedCarrinhoDetalhes };
