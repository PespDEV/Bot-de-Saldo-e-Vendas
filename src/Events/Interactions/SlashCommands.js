

const { ChatInputCommandInteraction } = require("discord.js");
const { ClientEmbed } = require("../..");

module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction
     */ 
    execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return interaction.reply({
            content: "Esse comando não existe ou está desatualizado!",
            ephemeral: true 
        });

        if (command.developer && interaction.user.id !== "828065459874037761")
        return interaction.reply({
            content: "Esse comando é apenas para o desenvolvedor/dono do bot, Você nao possui permissão!",
            ephemeral: true
        });

        command.execute(interaction, client);
    
    }
}