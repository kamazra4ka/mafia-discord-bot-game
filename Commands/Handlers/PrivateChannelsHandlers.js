import {
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import gameState from "../../src/gameState.js";

export const createPrivateChannelForUsers = async (guild, channelName, userIds) => {
    try {
        let permissionOverwrites = [{
            id: guild.id, // Default role (everyone)
            deny: [PermissionFlagsBits.ViewChannel], // Deny view permission for everyone
        },
            ...userIds.map(userId => ({
                id: userId,
                allow: [PermissionFlagsBits.ViewChannel] // Allow view permission for this user
            })),
        ];

        console.log('Perms: ', permissionOverwrites);

        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: permissionOverwrites,
            parent: '1174697661539025098'
        });

        console.log(`Created new channel: ${channel.name}`);
        return channel;
    } catch (error) {
        console.error('Error creating channel:', error);
    }
};

// send a mafia's vote.
export const sendMafiaVote = async (channel, gameId) => {
    try {

        // mention all mafia members
        const mafiaMembers = await gameState.getUsersByRole(gameId, 'mafia');
        let mafiaMentions = mafiaMembers.map(member => `<@${member}>`).join(' ');

        if (!mafiaMentions) {
            mafiaMentions = 'No alive mafia members found.';
        } else {
            try {
                channel.send(`${mafiaMentions}`)
            } catch (error) {
                console.error('Error sending mafia mentions:', error);
            }
        }

        const players = await gameState.getUsersByRole(gameId, 'civilian');

        // add detectives and doctors to the list
        const detectives = await gameState.getUsersByRole(gameId, 'detective');
        players.push(...detectives);

        const doctors = await gameState.getUsersByRole(gameId, 'doctor');
        players.push(...doctors);

        // add mafias to the list
        const mafias = await gameState.getUsersByRole(gameId, 'mafia');
        players.push(...mafias);


        // get users nicknames by userid
        const messages = await Promise.all(players.map(async userId => {
            const user = await channel.guild.members.fetch(userId);

            // get user's avatar
            const avatar = user.user.avatarURL();

            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle(`${user.nickname || user.user.username}`)
                .setDescription('Do you want to kill this person? Click the button below to confirm.')
                .setImage(avatar)
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            const mafiaVoteMessage = {
                embeds: [embed],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: `🔪 ${user.nickname || user.user.username}`,
                        // 1 is blue
                        // 2 is gray
                        // 3 is green
                        // 4 is red
                        style: 4,
                        custom_id: `mafia_vote_${userId}`,
                    }, ],
                }, ],
            };

            if (mafiaVoteMessage) {
                try {
                    const message = await channel.send(mafiaVoteMessage).then(message => {
                        // delete after 30 seconds
                        setTimeout(() => {
                            message.delete();
                        }, 60000);
                    });

                    return message;
                } catch (e) {
                    console.log(e)
                }
            }
        }));

    } catch (error) {
        console.error('Error sending mafia vote message:', error);
    }
}

// send a maniac's vote.
export const sendManiacVote = async (channel, gameId) => {
    try {

        // mention the maniac
        const maniac = await gameState.getUsersByRole(gameId, 'maniac');
        let maniacMention = maniac.map(member => `<@${member}>`).join(' ');

        if (!maniacMention) {
            maniacMention = 'No alive maniacs were found.';
        } else {
            channel.send(`${maniacMention}`)
        }

        const players = await gameState.getUsersByRole(gameId, 'civilian');

        // add detectives and doctors to the list
        const detectives = await gameState.getUsersByRole(gameId, 'detective');
        players.push(...detectives);

        // add mafias to the list
        const mafias = await gameState.getUsersByRole(gameId, 'mafia');
        players.push(...mafias);

        // add doctors to the list
        const doctors = await gameState.getUsersByRole(gameId, 'doctor');
        players.push(...doctors);

        // get users nicknames by userid
        const messages = await Promise.all(players.map(async userId => {
            const user = await channel.guild.members.fetch(userId);

            // get user's avatar
            const avatar = user.user.avatarURL();

            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle(`${user.nickname || user.user.username}`)
                .setDescription('Do you want to visit and kill this person? Click the button below to confirm.')
                .setImage(avatar)
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            const maniacVoteMessage = {
                embeds: [embed],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: `🗡️ ${user.nickname || user.user.username}`,
                        // 1 is blue
                        // 2 is gray
                        // 3 is green
                        // 4 is red
                        style: 4,
                        custom_id: `maniac_vote_${userId}`,
                    }, ],
                }, ],
            };

            if (maniacVoteMessage) {
                try {
                    const message = await channel.send(maniacVoteMessage).then(message => {
                        // delete after 30 seconds
                        setTimeout(() => {
                            message.delete();
                        }, 60000);
                    });

                    return message;
                } catch (e) {
                    console.log(e)
                }
            }
        }));

    } catch (error) {
        console.error('Error sending doctor vote message:', error);
    }
}

// send a doctor's vote.
export const sendDoctorVote = async (channel, gameId) => {
    try {

        // mention the doctor
        const doctor = await gameState.getUsersByRole(gameId, 'doctor');
        let doctorMention = doctor.map(member => `<@${member}>`).join(' ');

        if (!doctorMention) {
            doctorMention = 'No alive doctors were found.';
        } else {
            channel.send(`${doctorMention}`)
        }

        const players = await gameState.getUsersByRole(gameId, 'civilian');

        // add detectives and doctors to the list
        const detectives = await gameState.getUsersByRole(gameId, 'detective');
        players.push(...detectives);

        // add mafias to the list
        const mafias = await gameState.getUsersByRole(gameId, 'mafia');
        players.push(...mafias);

        // get users nicknames by userid
        const messages = await Promise.all(players.map(async userId => {
            const user = await channel.guild.members.fetch(userId);

            // get user's avatar
            const avatar = user.user.avatarURL();

            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle(`${user.nickname || user.user.username}`)
                .setDescription('Do you want to visit and heal this person? Click the button below to confirm.')
                .setImage(avatar)
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            const doctorVoteMessage = {
                embeds: [embed],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: `💊 ${user.nickname || user.user.username}`,
                        // 1 is blue
                        // 2 is gray
                        // 3 is green
                        // 4 is red
                        style: 3,
                        custom_id: `doctor_vote_${userId}`,
                    }, ],
                }, ],
            };

            if (doctorVoteMessage) {
                try {
                    const message = await channel.send(doctorVoteMessage).then(message => {
                        // delete after 30 seconds
                        setTimeout(() => {
                            message.delete();
                        }, 60000);
                    });

                    return message;
                } catch (e) {
                    console.log(e)
                }
            }
        }));

    } catch (error) {
        console.error('Error sending doctor vote message:', error);
    }
}

// send a detective's vote.
export const sendDetectiveVote = async (channel, gameId) => {
    try {

        // mention the detective
        const detective = await gameState.getUsersByRole(gameId, 'detective');
        let detectiveMention = detective.map(member => `<@${member}>`).join(' ');

        if (!detectiveMention) {
            detectiveMention = 'No alive doctors were found.';
        } else {
            channel.send(`${detectiveMention}`)
        }

        const players = await gameState.getUsersByRole(gameId, 'civilian');

        // add detectives and doctors to the list
        const doctors = await gameState.getUsersByRole(gameId, 'doctor');
        players.push(...doctors);

        // add mafias to the list
        const mafias = await gameState.getUsersByRole(gameId, 'mafia');
        players.push(...mafias);

        // get users nicknames by userid
        const messages = await Promise.all(players.map(async userId => {
            const user = await channel.guild.members.fetch(userId);

            // get user's avatar
            const avatar = user.user.avatarURL();

            const embed = new EmbedBuilder()
                .setColor('3a3a3a')
                .setTitle(`${user.nickname || user.user.username}`)
                .setDescription('Do you want to visit and check the role of this person? Click the button below to confirm.')
                .setImage(avatar)
                .setTimestamp()
                .setFooter({
                    text: 'MafiaBot',
                    iconURL: 'https://media.discordapp.net/attachments/669834222051262465/1180881505329873066/Mafia-PP.png?ex=657f089a&is=656c939a&hm=bef4f23be7eba86978e602cd098a55534f069e32d7dbad07c997b1b17221a738&=&format=webp&quality=lossless&width=969&height=969'
                });

            const doctorVoteMessage = {
                embeds: [embed],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: `🔎 ${user.nickname || user.user.username}`,
                        // 1 is blue
                        // 2 is gray
                        // 3 is green
                        // 4 is red
                        style: 2,
                        custom_id: `detective_vote_${userId}`,
                    }, ],
                }, ],
            };

            if (doctorVoteMessage) {
                const message = await channel.send(doctorVoteMessage).then(message => {
                    // delete after 30 seconds
                    setTimeout(() => {
                        message.delete();
                    }, 60000);
                });

                return message;
            }


        }));

    } catch (error) {
        console.error('Error sending doctor vote message:', error);
    }
}


// disable all mafia vote buttons
export const disableMafiaVoteButtons = async (interaction) => {
    try {
        const channel = interaction.channel;
        const messages = await channel.messages.fetch();
    } catch (error) {
        console.error('Error disabling mafia vote buttons:', error);
    }
}

export const checkIfDead = async (userId, gameId) => {
    try {
        // if user's role is dead then return true
        const user = await gameState.getRole(gameId, userId);
        if (user === 'dead' || !user) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking if dead:', error);
    }
}