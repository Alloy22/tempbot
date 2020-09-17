const Discord = require("discord.js");
const fs = require('fs');
const rawData = require('../rawData.json');

module.exports.run = async (bot, message, args) => {



    switch (args[0]) {
        case "new":
            let _11b = {}
            let answers = ["⠀", "⠀", "⠀", "⠀", "⠀", "⠀"];

            let questions = [
                "Name on the Temptaking App:",
                "4 digit password on the App:",
                "Range of Temperature [Format: XX.X Eg: 36.0]\nMINIMUM:",
                "Range of Temperature [Format: XX.X Eg: 37.0]\nMAXIMUM:",
                "Timing in HRS [Eg: 9 would mean 0900HRS, 11 would mean 1100HRS]\nAM:",
                "Timing in HRS [Eg: 15 would mean 1500HRS, 18 would mean 1800HRS]\nPM:"
            ]

            const userName = message.author.username

            const embedMsg = await message.author.send({ embed: getEMB(answers, userName) }).catch((e) => {
                return console.log('Failed to send!', e);
              });
            const question = await message.author.send('`' + questions[0] + '`').catch((e) => {
                return console.log('Failed to send!', e);
              }); // store the question message object to a constant to be used later

            const filter = msg => msg.author.id === message.author.id; // creates the filter where it will only look for messages sent by the message author
            const collector = question.channel.createMessageCollector(filter, { time: 180 * 1000 }); // creates a message collector with a time limit of 60 seconds - upon that, it'll emit the 'end' event
            let qNum = 1

            collector.on('collect', msg => { // when the collector finds a new message
                if (checkAnswerValidity(msg.content, qNum, question.channel)) {
                    answers[qNum - 1] = msg.content;
                    questions.shift();
                    bot.channels.cache.find(x => x.name === "admin-console").send(`User answering question ${qNum}`)
                    qNum++;                    
                    embedMsg.edit({ embed: getEMB(answers, userName) });
                } else bot.channels.cache.find(x => x.name === "admin-console").send(`User failed to answer question ${qNum}. Input: ${msg.content}`)
                if (questions.length <= 0) return collector.stop('done'); // sends a string so we know the collector is done with the answers
                question.edit('`' + questions[0] + '`').catch(error => { // catch the error if the question message was deleted - or you could create a new question message
                    console.error("Timeout!");
                    collector.stop('stop');
                });
            });

            collector.on('end', (collected, reason) => {

                if (reason && reason === 'done') {

                    if (answers[2] > answers[3]) {
                        return displayErrorMsg("⚠️: Min Temperature cannot be higher than Max Temperature. Please Restart", question.channel)
                    }

                    message.author.send({ embed: getEMB(answers, userName) })
                    message.author.send("```Your information will be sent over to an admin to validate. Only after the admin has approved your entry then the bot will start working for you.\nAre you sure the information provided are correct? [Yes/No]```")

                    const collectorFinal = question.channel.createMessageCollector(filter, { time: 180 * 1000 });
                    collectorFinal.on('collect', msg => {
                        if (msg.content.toUpperCase() == "YES") {
                            message.author.send("`✅: Your information has been successfully saved. Awaiting approval.`")
                            bot.channels.cache.find(x => x.name === "admin-console").send(`${answers[0].toUpperCase()} awaiting approval`)
                            collectorFinal.stop();
                        }
                        else if (msg.content.toUpperCase() == "NO") {
                            message.author.send("`Please enter !t to start again`")
                            collectorFinal.stop();
                        }
                    })
                    collectorFinal.on('end', (collected, reason) => {
                        if (collected.map(x => x.content)[0].toUpperCase() == "YES") {

                            _11b["NAME"] = answers[0].toUpperCase()
                            for (let x in rawData.members) {
                                if (rawData.members[x].identifier.toUpperCase() == answers[0].toUpperCase()) {
                                    _11b["ID"] = rawData.members[x].id
                                }
                            }
                            _11b["PASSWORD"] = answers[1]

                            _11b["TEMPERATURE"] = {}
                            _11b["TEMPERATURE"]["MAX"] = answers[2]
                            _11b["TEMPERATURE"]["MIN"] = answers[3]

                            _11b["TIMING"] = {}
                            _11b["TIMING"]["AM"] = answers[4] - 0
                            _11b["TIMING"]["PM"] = answers[5] - 0

                            _11b["UPDATE"] = {}
                            _11b["UPDATE"]["AM"] = ""
                            _11b["UPDATE"]["PM"] = ""

                            _11b["APPROVED"] = false
                            _11b["ACTIVE"] = true
                            _11b["DISCORDID"] = message.author.id

                            bot.channels.cache.find(x => x.name === "data").send(JSON.stringify(_11b))
                        }
                    })
                }
                else {
                    displayErrorMsg("⚠️: Timeout!. Please Try Again", question.channel)
                    bot.channels.cache.find(x => x.name === "admin-console").send(`User timeout!`)
                }
            });
            break;
        case "approve":
        case "unapprove":
            if (message.author.id != 217655330014756865) {
                return displayErrorMsg("`⚠️: Nice try!`", message.channel)
            }
            bot.channels.cache.find(x => x.name === "data").messages.fetch({ limit: 30 }).then(msg => {

                let user = msg.filter(x => x.content.startsWith(`{"NAME":"${args.splice(1).join(" ").toUpperCase()}"`))
                let userJSON = user.map(x => JSON.parse(x.content))

                userJSON[0]["APPROVED"] = args[0] == "approve" ? true :
                    false

                user.first().edit(JSON.stringify(userJSON[0]))
                message.channel.send(`${args.splice(1).join(" ").toUpperCase()} successfully approved!`)
            })
            break;
    }


}

module.exports.help = {
    name: "t"
}

function checkAnswerValidity(answer, qNum, channel) {

    switch (qNum) {

        case 1:
            for (let x in rawData.members) {
                if (rawData.members[x].identifier.toUpperCase() == answer.toUpperCase()) {
                    return true
                }
            }
            displayErrorMsg("`⚠️: Name not found! [Please make sure your name is spelled correctly]`", channel)
            break;

        case 2:
            if (answer.length == 4 && isNaN(answer) === false) {
                return true
            }
            displayErrorMsg("`⚠️: Password in the wrong format!`", channel)
            break;

        case 3:
            if (answer.length == 4 && answer.indexOf(".") === 2) {
                if (answer >= 35.5) {
                    return true
                }
                else {
                    displayErrorMsg("`⚠️: Temperature too low! [MIN: 35.5]`", channel)
                    return false
                }
            }
            displayErrorMsg("`⚠️: Temperature in the wrong format! [Format: XX.X Eg: 37.0]`", channel)
            break;
        case 4:
            if (answer.length == 4 && answer.indexOf(".") === 2) {
                if (answer <= 37.4) {
                    return true
                }
                else {
                    displayErrorMsg("`⚠️: Temperature too high! [MAX: 37.4]`", channel)
                    return false
                }
            }
            displayErrorMsg("`⚠️: Temperature in the wrong format! [Format: XX.X Eg: 37.0]`", channel)
            break;
        case 5:
            if (isNaN(answer) === false && answer >= 0 && answer <= 11) {
                return true
            } else {
                displayErrorMsg("`⚠️: AM timing must be between 0 to 11 HRS. 0000HRS to 1100HRS`", channel)
                return false
            }
            break;
        case 6:
            if (isNaN(answer) === false && answer >= 12 && answer <= 24) {
                return true
            } else {
                displayErrorMsg("`⚠️: PM timing must be between 12 to 24 HRS. 1200HRS to 2400HRS`", channel)
                return false
            }
            break;
        default:
            return false
    }
    return false
}

function getEMB(answers, userName) {
    return eb = {
        title: "New Entry",
        description: `Started by User: ${userName}`,
        fields: [{
            name: "**Name**",
            value: answers[0]
        },
        {
            name: "**Password**",
            value: answers[1]
        },
        {
            name: "**Temperature Range (degrees):**",
            value: answers[2] + " - " + answers[3]
        },
        {
            name: "**Timing Range:**",
            value: `AM:⠀${answers[4]}00HRS\nPM:⠀${answers[5]}00HRS`
        }
        ]
    }
}

function displayErrorMsg(content, channel) {
    channel.send(content)
        .then(msg => {
            msg.delete({ timeout: 3000 })
        })
}
