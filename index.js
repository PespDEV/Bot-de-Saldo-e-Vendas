//--------BOT----------\\
const {Client, ActivityType, GatewayIntentBits, Partials, Collection, ChannelType , PermissionsBitField } = require('discord.js');
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessageReactions, DirectMessages, DirectMessageTyping } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel } = Partials;
const client = new Client({ 
    intents: [Guilds, GuildMembers , GuildMessages, MessageContent,DirectMessages, DirectMessageReactions, DirectMessageTyping ], 
    partials: [User, Message, GuildMember, ThreadMember, Channel ] 
});
require('dotenv').config();

const { loadEvents } = require("./src/Handlers/eventHandler")

client.events = new Collection();
client.commands = new Collection(); 
const commands = [];

const { connect } = require("mongoose");
connect(process.env.MONGO, {
}).then(() => console.log("Conectado a database"));

loadEvents(client);

client.login(process.env.TOKEN)

client.once('ready', async() => {	
	
	client.user.setActivity({ name: 'gbstore.net', type: ActivityType.Playing})
  });

process.on('uncaughtException', err => console.log(err))

.on('unhandledRejection', err => console.log(err));

process.removeAllListeners('warning');

