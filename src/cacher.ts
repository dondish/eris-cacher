import { Cache } from "./cache";
import { Client, User, Channel, AnyChannel, Role, Member, Guild } from "eris";

/**
 * The middleman between Eris and the cache.
 * 
 * @remarks
 * The cacher's job is to update the cache when the client fires specific events.
 * A cacher can work with any cache that supports its generic value.
 * 
 * The developer usually shouldn't create their own cacher but uses one of the cachers defined in this file.
 */
export interface Cacher<V, T extends Cache<V>> {
    cache: T;
    client: Client;

    /**
     * Closes the cache.
     * 
     * @remarks
     * Developers should put here the code to close all types of connectors.
     */
    close(): void | Promise<void>;
}

/**
 * Internal utility class to clean resources for the implemented cachers below after they have been closed.
 */
abstract class SimpleCacher<V, T extends Cache<V>> implements Cacher<V, T> {
    abstract cache: T;
    abstract client: Client;

    close(): void | Promise<void> {
        return this.cache.close();
    }
}

/**
 * A cacher that caches users.
 * 
 * {@inheritdoc Cacher}
 */
export class UserCacher<T extends Cache<User>> extends SimpleCacher<User, T> {
    cache: T;
    client: Client;

    private userset(user: User) {
        this.cache.set(user.id, user);
    }

    private setupEvents() {
        this.client.on("userUpdate", this.userset);
    }

    constructor(cache: T, client: Client) {
        super();
        this.cache = cache;
        this.client = client;
        this.setupEvents();
    }
    close(): void | Promise<void> {
        this.client.off("userUpdate", this.userset);
        return super.close();
    }
}

/**
 * A cacher that caches channels.
 * 
 * {@inheritdoc Cacher}
 */
export class ChannelCacher<T extends Cache<Channel>> extends SimpleCacher<Channel, T> {
    cache: T;
    client: Client;
    allowedtypes?: number[];

    cacheset(channel: AnyChannel) {
        if (!this.allowedtypes || this.allowedtypes.indexOf(channel.type) !== -1) {
            this.cache.set(channel.id, channel);
        }
    }

    cachedel(channel: AnyChannel) {
        if (!this.allowedtypes || this.allowedtypes.indexOf(channel.type) !== -1) {
            this.cache.delete(channel.id);
        }
    }

    private setupEvents() {
        this.client.on("channelCreate", this.cacheset);
        this.client.on("channelUpdate", this.cacheset);
        this.client.on("channelDelete", this.cachedel);
    }

    /**
     * The constructor
     * @param cache the cache to use
     * @param client the eris client
     * @param allowedtypes the channel types to be cached (0 for text, 1 for voice, 2 for ). 
     */
    constructor(cache: T, client: Client, allowedtypes?: number[]) {
        super();
        this.cache = cache;
        this.client = client;
        this.allowedtypes = allowedtypes;
        this.setupEvents();
    }

    close(): void | Promise<void> {
        this.client.off("channelCreate", this.cacheset);
        this.client.off("channelUpdate", this.cacheset);
        this.client.off("channelDelete", this.cachedel);
        return super.close();
    }
}

/**
 * A cacher that caches members.
 * 
 * @remarks
 * 
 * When trying to read the underlying value use 
 * ```ts
 * memcacher.cache.get(`${guild.id}:${member.id}`);
 * ```
 * since members don't have any special snowflake but it uses the guild's and the user's.
 */
export class MemberCacher<T extends Cache<Member>> extends SimpleCacher<Member, T> {
    cache: T;
    client: Client;

    private memberset(guild: Guild, member: Member) {
        this.cache.set(`${guild.id}:${member.id}`, member);
    }

    private memberchunk(guild: Guild, members: Member[]) {
        for (const member of members) {
            this.cache.set(`${guild.id}:${member.id}`, member);
        }
    }

    private memberdel(guild: Guild, member: Member) {
        this.cache.delete(`${guild.id}:${member.id}`);
    }

    private setupEvents() {
        this.client.on("guildMemberAdd", this.memberset);
        this.client.on("guildMemberUpdate", this.memberset);
        this.client.on("guildMemberChunk", this.memberchunk);
        this.client.on("guildMemberRemove", this.memberdel);
    }

    constructor(cache: T, client: Client) {
        super();
        this.cache = cache;
        this.client = client;
        this.setupEvents();
    }

    close(): void | Promise<void> {
        this.client.off("guildMemberAdd", this.memberset);
        this.client.off("guildMemberUpdate", this.memberset);
        this.client.off("guildMemberChunk", this.memberchunk);
        this.client.off("guildMemberRemove", this.memberdel);
        return super.close()
    }
}

/**
 * A cacher that caches guilds.
 * 
 * {@inheritdoc Cacher}
 */
export class GuildCacher<T extends Cache<Guild>> extends SimpleCacher<Guild, T> {
    cache: T;
    client: Client;

    private guildset(guild: Guild) {
        this.cache.set(guild.id, guild);
    }

    private guilddel(guild: Guild) {
        this.cache.delete(guild.id);
    }

    private setupEvents() {
        this.client.on("guildCreate", this.guildset);
        this.client.on("guildUpdate", this.guildset);
        this.client.on("guildDelete", this.guilddel);
    }

    constructor(cache: T, client: Client) {
        super();
        this.cache = cache;
        this.client = client;
        this.setupEvents();
    }

    close(): void | Promise<void> {
        this.client.off("guildCreate", this.guildset);
        this.client.off("guildUpdate", this.guildset);
        this.client.off("guildDelete", this.guilddel);
        return super.close()
    }
}

/**
 * A cacher that caches roles.
 * 
 * {@inheritdoc Cacher}
 */
export class RoleCacher<T extends Cache<Role>> extends SimpleCacher<Role, T> {
    cache: T;
    client: Client;

    private roleset(_, role: Role) {
        this.cache.set(role.id, role);
    }

    private roledel(_, role: Role) {
        this.cache.delete(role.id);
    }

    private setupEvents() {
        this.client.on("guildRoleCreate", this.roleset);
        this.client.on("guildRoleUpdate", this.roleset);
        this.client.on("guildRoleDelete", this.roledel);
    }

    constructor(cache: T, client: Client) {
        super();
        this.cache = cache;
        this.client = client;
        this.setupEvents();
    }

    close(): void | Promise<void> {
        this.client.off("guildRoleCreate", this.roleset);
        this.client.off("guildRoleUpdate", this.roleset);
        this.client.off("guildRoleDelete", this.roledel);
        return super.close();
    }
}