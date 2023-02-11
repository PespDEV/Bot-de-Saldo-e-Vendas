const {SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, EmbedBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Limpar mensagens de um canal ou de um usuário específico.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
        option.setName('quantidade')
        .setDescription('Quantidade de mensagens para apagar(Max: 99).')
        .setRequired(true)
        )
    .addUserOption(option =>
        option.setName('usuário')
        .setDescription('Selecionar um usuário específico para apagar a mensagem.')
        .setRequired(false)
        ),

    async execute(interaction) {
        const {channel, options} = interaction;

        const quantidade = options.getInteger('quantidade');
        const usuário = options.getUser("usuário");

        const messages = await channel.messages.fetch({
            limit: quantidade +1,
        });

        const res = new EmbedBuilder()

        if(usuário) {
            let i = 0;
            const filtered = [];

            (await messages).filter((msg) =>{
                if(msg.author.id === usuário.id && quantidade > i) {
                    filtered.push(msg);
                    i++;
                }
            });

            await channel.bulkDelete(filtered).then(messages => {
                res.setDescription(`Foram deletadas ${messages.size} mensagens do usuário ${usuário}.`);
                interaction.reply({embeds: [res], ephemeral: true}); // you can use ephemeral if you desire
            });
        } else {
            await channel.bulkDelete(quantidade, true).then(messages => {
                res.setDescription(`Foram deletadas ${messages.size} mensagens desse canal.`);
                interaction.reply({embeds: [res], ephemeral: true});
            });
        }
    }
}