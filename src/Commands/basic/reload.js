const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    Client} = require ("discord.js");

const { loadCommands } = require("../../Handlers/commandHandler");
const { loadEvents } = require("../../Handlers/eventHandler");

module.exports = {
    developer: true,
    data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reinicia/Recarrega os comandos/eventos do bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((options) => options
    .setName("events")
    .setDescription("Recarrega/Reinicia os eventos"))
    .addSubcommand((options) => options
    .setName("commands")
    .setDescription("Recarrega/Reinicia os commands")),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client} client 
     */
   execute(interaction, client) { 
    const subCommand = interaction.options.getSubcommand();

    switch(subCommand) {
        case "events" : {
            for( const [key, value] of client.events)
            client.removeListener(`${key}`, value, true);
            loadEvents(client);
            interaction.reply({content: "Eventos Recarregados", ephemeral: true});
        }
        break;
        case "commands" : {
            loadCommands(client);
            interaction.reply({content: "Comandos Recarregados", ephemeral: true});
        }
        break;
    }
   }
}