//get libarys
require("dotenv").config()
const { Client, RichEmbed } = require('discord.js');
const fetch = require("node-fetch")
const fs = require("fs")


//setup wetterbot instance
let wetterBot = new Client();

wetterBot.on("ready", () => {
    //runs if the Bot has started
    console.log(`[WETTERBOT] Bot is online with the Name: ${wetterBot.user.username}#${wetterBot.user.discriminator}`)
    console.log(`[WETTERBOT] add me with this link: https://discordapp.com/api/oauth2/authorize?client_id=${wetterBot.user.id}&scope=bot&permissions=8`)
})

if (process.argv[0] == "true") {
    console.log("[WETTERBOT] DEBUGMODE ON")

    wetterBot.on("error", (error) => {
        //runs if the bot has an error
        console.error(`[WETTERBOT] Bot has an Error: ${error.name},${error.message}`);
    })

    wetterBot.on("warn", (info) => {
        //runs if the bot has an warn
        console.warn(`[WETTERBOT] Bot has a warn: ${info}`)
    })
} else {
    console.log("[WETTERBOT] DEBUGMODE OFF")
}

wetterBot.on("guildCreate", guild => {
    guild.owner.send(`Thanks for adding me to your server(${guild.name})`);

    guild.createRole({
        name: "WETTERBOT",
        color: "BLUE",
        mentionable: false,
        hoist: false
    }, "If you have this Role you can change the settings of this Bot")
        .then(role => {
            guild.owner.addRole(role)
            let servers = JSON.parse(fs.readFileSync("servers.json", "utf8"));
            let config = {
                prefix: "!",
                role: role.id,
                joined: new Date().toLocaleDateString()
            };
            servers[guild.id] = config;
            fs.writeFileSync("servers.json", JSON.stringify(servers), "utf8");
        }).catch(error => {
            console.error(error)
        })
})

wetterBot.on("message", (msg) => {
    //get Server infos
    let prefix = JSON.parse(fs.readFileSync("servers.json", "utf8"))[msg.guild.id].prefix

    //runs if he reads an Message
    if (msg.author.bot || !msg.content.startsWith(prefix) || msg.type == "dm") {
        return;
    }


    //creat Commarnd / args
    const args = msg.content.toLowerCase().slice(prefix.split("").length).split(' ');
    const com = args.shift().toLowerCase();

    if (com == "help") {
        const embed = new RichEmbed()
            .setColor(0x44ff44)
            .setTitle(`--------HELP--------`)
            .setAuthor(`${wetterBot.user.username}`, wetterBot.user.avatarURL)
            .setDescription(`${wetterBot.user.username}#${wetterBot.user.discriminator} zeigt dir das Wetter`)
            .addField(`${prefix}help`, `Zeigt dir dieses Feld`)
            .addField(`${prefix}wetter [city]`, `Zeigt dir das Wetter \n z.b(${prefix}wetter london,gb)`);
        msg.channel.send(embed);
        return true;
    }

    if (com == "info") {
        const embed = new RichEmbed()
            .setFooter(`Author: ${JSON.parse(fs.readFileSync("package.json", "UTF8")).author}`)
            .setColor(0x55ff55)
            .setTitle(`Infos: ${wetterBot.user.username}`)
            .setThumbnail(wetterBot.user.avatarURL)
            .addField("Verison", JSON.parse(fs.readFileSync("package.json", "UTF8")).version);
        msg.channel.send(embed)
        return true;
    }


    if (com == "settings") {
        hasPermison = false;
        msg.guild.roles.array().forEach(role => {
            if (role.id == JSON.parse(fs.readFileSync("servers.json", "utf8"))[msg.guild.id].role) {
                role.members.forEach(user => {
                    if (user.id == msg.author.id) {
                        hasPermison = true;
                    }
                })
            }
        })

        if (!hasPermison) {
            return
        }

        if (args.length == 0) {
            const embed = new RichEmbed()
            msg.channel.send(embed)
            return;
        }

        if (args.length == 2) {
            if (args[0] == "prefix") {
                let newPrefix = args[1];
                let config = JSON.parse(fs.readFileSync("servers.json", "utf8"))
                let oldPrefix = config[msg.guild.id].prefix
                config[msg.guild.id].prefix = newPrefix;
                fs.writeFileSync("servers.json", JSON.stringify(config), "utf8");
                msg.channel.send(`[@everyone] Prefix has change from "${oldPrefix}" to "${newPrefix}"`)
            }
        }
    }


    if (com == "wetter") {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${args[0] || "damme,de"}&APPID=${process.env.WETTERBOT_API_KEY}&units=metric&lang=de`)
            .then(res => res.json())
            .then(json => {

                if (json.cod == 404) {
                    message.reply(`City: ${args[0]} nicht gefunden!`)
                    return
                }
                let sunrise = {
                    "h": new Date(json.sys.sunrise * 1000).getHours() + 1,
                    "m": new Date(json.sys.sunrise * 1000).getMinutes()
                }
                if (sunrise.h < 10) {
                    sunrise.h = "0" + sunrise.h
                }
                if (sunrise.m < 10) {
                    sunrise.m = "0" + sunrise.m
                }
                let sunset = {
                    "h": new Date(json.sys.sunset * 1000).getHours() + 1,
                    "m": new Date(json.sys.sunset * 1000).getMinutes()
                }
                if (sunset.h < 10) {
                    sunset.h = "0" + sunset.h
                }
                if (sunset.m < 10) {
                    sunset.m = "0" + sunset.m
                }
                const embed = new RichEmbed()
                    .setColor(0x2222ff)
                    .setTitle(`Wetter in ${json.name},${json.sys.country}`)
                    .setDescription(`${json.weather[0].description}`)
                    //.setAuthor("openweathermap.org","","https://openweathermap.org")
                    .setThumbnail(`https://openweathermap.org/img/w/${json.weather[0].icon}.png`)
                    .addField("----------Temperatur----------", "Temperatur")
                    .addField("Temp:", json.main.temp + "°C")
                    .addField("Min-Temp:", json.main.temp_min + "°C", true)
                    .addField("Max-Temp:", json.main.temp_max + "°C", true)
                    .addBlankField()
                    .addField("----------Wind----------", "Infos über Windrichtung/geschwindigkeit")
                    .addField("Wind-Richtung", json.wind.deg + "°", true)
                    .addField("Wind-Geschwindigkeit", json.wind.speed + " m/s", true)
                    .addBlankField()
                    .addField("----------Sonne-infos----------", " Infos über Sonnenaufgang/untergang")
                    .addField("Wolken", json.clouds.all + "%")
                    .addField("Sonneaufgang", `${sunrise.h}:${sunrise.m}`, true)
                    .addField("Sonneuntergang", `${sunset.h}:${sunset.m}`, true)
                    .setFooter("openweathermap.org")
                    .setTimestamp()
                msg.channel.send(embed);
            });

        return true;
    }
})




wetterBot.login(process.env.WETTERBOT_TOKEN)//token