const Discord = require("discord.js");
const fs = require('fs');
const bot = new Discord.Client({});
bot.commands = new Discord.Collection();
const prefix = "!" || botSettings.prefix;

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

    bot.user.setActivity('Shyam', {type: 'SLAPPING'})

    //temp() 

});

function temp(){

    let guildIs = bot.guilds.cache.find(x => x.name === "Temp")
    guildIs.channels.find(x => x.name === "data").fetchMessage('750342733838942289').then(statusMsg => {

        let parseJson = JSON.parse(statusMsg.content)
        let now = moment().utcOffset(8)
        let meridies
        
        if (now.format("H") == 8) meridies = 'AM'
        else if (now.format("H") == 15) meridies = 'PM'
        
        if (meridies && meridies != parseJson.meridies) {

            parseJson.meridies = meridies
            console.log(now.format("DD/MM/YYYY"))
            let payload = {
                'groupCode': "6391aac7eed11e1993aa0e708be4f84f",
                'date': now.format("DD/MM/YYYY"),
                'meridies': meridies,
                'memberId': 3123767,
                'temperature': "36.1",
                'pin': "2207"
            }
            request.post({url: "https://temptaking.ado.sg/group/MemberSubmitTemperature", form: payload}, function(err,httpResponse,body){ 
                guildIs.channels.find(x => x.name === "test").send(body)
                console.log(err) 
            })
            
            statusMsg.edit(JSON.stringify(parseJson))            
        }
        else guildIs.channels.find(x => x.name === "test").send("Attempted!")
        resetTempTimer(5*60*1000)

    })

    
}

bot.login(process.env.token);