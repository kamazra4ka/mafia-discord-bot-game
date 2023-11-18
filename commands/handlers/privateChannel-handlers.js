import { ChannelType, PermissionFlagsBits } from 'discord.js';

export const createPrivateChannelForUsers = async (guild, channelName, userIds) => {
    try {
        let permissionOverwrites = [
            {
                id: guild.id, // Default role (everyone)
                deny: [PermissionFlagsBits.ViewChannel], // Deny view permission for everyone
            },
            ...userIds.map(userId => ({
                id: userId,
                allow: [PermissionFlagsBits.ViewChannel] // Allow view permission for this user
            })),
        ];

        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: permissionOverwrites
        });

        console.log(`Created new channel: ${channel.name}`);
        return channel;
    } catch (error) {
        console.error('Error creating channel:', error);
    }
};
