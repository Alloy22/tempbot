const Discord = require("discord.js");
const fs = require('fs');
const bot = new Discord.Client({});
bot.commands = new Discord.Collection();
const prefix = "!" || botSettings.prefix;
const moment = require('moment');
const request = require('request');

fs.readdir("./commands/", (err, files) => {
    if (err) console.error(err);

    let jsfiles = files.filter(f => f.split(".").pop() === "js");
    if (jsfiles.length <= 0) {
        console.log("No commands to load!");
        return;
    }

    console.log(`Loading ${jsfiles.length} commands!`);

    jsfiles.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        console.log(`${i + 1}: ${f} loaded!`);
        bot.commands.set(props.help.name, props);
    });
});

bot.on("message", async message => {
    if (message.author.bot) return;

    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);

    if (!command.startsWith(prefix)) return;

    let cmd = bot.commands.get(command.slice(prefix.length));
    if (cmd) cmd.run(bot, message, args);
})

bot.on("ready", async () => {
    console.log(`Bot is ready! ${bot.user.username}`);

    try {
        let link = await bot.generateInvite(["ADMINISTRATOR"]);
        console.log(link);
    } catch (e) {
        console.log(e.stack);
    }

    temp()
});

function temp() {

    let now = moment().utcOffset(8)

    bot.channels.cache.find(x => x.name === "data").messages.fetch({ limit: 30 }).then(msg => {

        let dataJSON = msg.map(x => JSON.parse(x.content))


        let nowHR = now.format("H")
        let nowDay = now.format("D")
        let meridies = nowHR <= 11 ? "AM" :
            "PM"


        for (let i in dataJSON) {

            //console.log(2,dataJSON[i]["TIMING"]["AM"],dataJSON[i]["TIMING"]["PM"], dataJSON[i]["UPDATE"]["AM"], dataJSON[i]["UPDATE"]["PM"],dataJSON[i]["UPDATE"]["PM"] != nowDay)
            if (!dataJSON[i]["APPROVED"]) continue;
            if (dataJSON[i]["TIMING"][meridies] == nowHR && dataJSON[i]["UPDATE"][meridies] != nowDay) {
                let randoTemp = ((Math.floor(Math.random() * ((dataJSON[i]["TEMPERATURE"]["MAX"] * 10) - (dataJSON[i]["TEMPERATURE"]["MIN"] * 10) + 1)) + (dataJSON[i]["TEMPERATURE"]["MIN"] * 10)) / 10).toFixed(1)
                let payload = {
                    'groupCode': "6391aac7eed11e1993aa0e708be4f84f",
                    'date': now.format("DD/MM/YYYY"),
                    'meridies': meridies,
                    'memberId': dataJSON[i]["ID"],
                    'temperature': randoTemp,
                    'pin': dataJSON[i]["PASSWORD"]
                }
                request.post({ url: "https://temptaking.ado.sg/group/MemberSubmitTemperature", form: payload }, function (err, httpResponse, body) {
                    bot.channels.cache.find(x => x.id === "755009681306419202").send(`${now.format()}: ${dataJSON[i]["NAME"]}\'s ${meridies} temperature got updated to ${randoTemp}. Status: ${body} <@${dataJSON[i]["DISCORDID"]}>`)
                    console.log(`Error: ${err} - ${httpResponse}`)
                })
                dataJSON[i]["UPDATE"][meridies] = nowDay
                msg.filter(x => x.content.startsWith(`{"NAME":"${dataJSON[i]["NAME"]}"`)).first().edit(JSON.stringify(dataJSON[i]))
            }
        }
    })

    bot.channels.cache.find(x => x.id === "755009681306419202").send(`${now.format()}: Attempted`)
    resetTempTimer(15 * 60 * 1000)
}

function resetTempTimer(timeSet) {
    setTimeout(temp, timeSet)
}
bot.login(process.env.token);//
