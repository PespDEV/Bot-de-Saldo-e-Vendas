const { loadCommands } = require("../../Handlers/commandHandler")

module.exports = {
    name: "ready", 
    once: true,
    execute(client) {
        console.log("O Cliente está pronto.")
        
        loadCommands(client)
    }
}