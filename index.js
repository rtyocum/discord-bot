// Includes of the libraries
const Discord = require('discord.js');
require('dotenv').config();
const sqlite3 = require('sqlite3');
const token = process.env.TOKEN;
const config = require('./config.json');
const cmds = require('./cmds.js');


// Create a Discord Client
const dc = new Discord.Client();

// Events

// Ready Event is when it connects to discord and is ready to receive events
dc.once('ready', () => {
	console.log('Ready!');
	// Send hello to the general channel (The IDS are in config.json)
//	dc.channels.cache.get(config.generalId).send('Hello');
});

// This event is fired every time a message is sent
dc.on('message', message => {

	// Look only in the general channel, and ignore the !rank command (This is done later) and if a message starts with the prefix (in config.json)
	if (((message.channel.id == config.generalId) || (message.channel.id == config.otherChannelId)) && (message.content != '!rank') && (message.content.startsWith(config.prefix))) {

		// Removes the prefix from the string so it is easier to deal with
		const msg = message.content.substr(1);

		// Creates a new Message Embed to work with.
		const embed = new Discord.MessageEmbed();

		// Sends to the function cmds in cmds.js
		cmds.cmds(dc, embed, msg, message, config);
	}

	// Handles the !rank command
	else if(message.content == '!rank') {
		// Creates a message embed
		const embed = new Discord.MessageEmbed();

		// Opens the Sqlite database in db.sqlite3
		const db = new sqlite3.Database('./db.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
			if (err) {
				// If error
				return console.error(err.message);
			}
			// If success
			console.log('Connected to the in-memory SQlite database.');
		});

		/* Code for !rank command
		Use MessageEmbed and possibly
		other libraries to display an output.
		*/

		// Close the database
		db.close((err) => {
			if (err) {
				return console.error(err.message);
			}
			console.log('Close the database connection.');
		});
	}


	// If not a discord command
	/* Used to log when a message is  */
	else if ((message.content.startsWith('!') == false) && message.author.id != config.botId) {
		console.log('All others');
		// Queries
		const query = `
		SELECT * FROM ranks
		WHERE user_id=${message.author.id}
		`;

		const create = `
		INSERT INTO ranks (user_id, messages)
		VALUES (${message.author.id}, 0)
		`;

		const add = `
		UPDATE ranks
		SET messages = messages + 1
		WHERE user_id = ${message.author.id}
		`;

		const db = new sqlite3.Database('./db.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
			if (err) {
				return console.error(err.message);
			}
			console.log('Connected to the in-memory SQlite database.');
		});

		db.all(query, (err, row) => {
			if (err) {
				console.log(err);
				return;
			}
			console.log(row);


			if (row[0] == undefined) {
				db.all(create, (err) => {
					if (err) {
						console.log(err);
						return;
					}
					console.log ('Added User');
				});
			}

			db.all(add, (err) => {
				if (err) {
					console.log(err);
					return;
				}
				console.log('Added 1 message');
			});
		});

		db.close((err) => {
			if (err) {
				return console.error(err.message);
			}
			console.log('Close the database connection.');
		});
	}
});

// if a user comes online, the bot will respond 'Hello @user'
/* This may be disabled because it is very annoying This event fires every time a user's status changes */
dc.on('presenceUpdate', (oldPresence, newPresence) => {

	// If the user was previously offline and now online, this runs
	if (newPresence.status == 'online' && oldPresence.status == 'offline') {

		// Finds the user's username and splits it based on # (Discord shows usernames with their 4 digit id such as @someone#1234/ This removes the number)
		const usr = (newPresence.user.tag).split('#');

		// Sets a welcome message. The split command creates an array, so the first element in the array is the username, and the second is the number, which we do not need
		const welmsg = (`Welcome ${usr[0]}`);

		// Sends the welcome message in the general channel
		dc.channels.cache.get(config.generalId).send(welmsg, {

			// Sets the reply attribute so it can mention the user
			'reply': newPresence.user,
		});
	}
});

// This logs the server into discord using the token (Everything is events, so it can run last)
dc.login(token);