require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ActivityType
} = require("discord.js");

const { DisTube } = require("distube");
const E = require("./emojis.js");

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Vanta is alive");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Keep alive running on port ${PORT}`);
});

function ok(msg)   { return new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ${msg}`); }
function fail(msg) { return new EmbedBuilder().setColor("#ff5555").setDescription(`${E.deny} : ${msg}`); }
function warn(msg) { return new EmbedBuilder().setColor("#ffaa00").setDescription(`${E.warning} : ${msg}`); }

const PREFIX = "!";
const WELCOME_CHANNEL = "welcome";
const BOOST_CHANNEL = "boost";
const LOG_CHANNEL = "logs";
const AUTO_ROLE = "Member";
const WELCOME_COLOR = "#87ceeb";
const BOOST_COLOR = "#ff69b4";

const warnings = new Map();
const spamMap = new Map();
const tttGames = new Map();
const giveaways = new Map();
const xpData = new Map();
const xpCooldown = new Map();
const snipes = new Map();
const editSnipes = new Map();
const afkUsers = new Map();
const joinTracker = new Map();
const nukeTracker = new Map();
const voicemasterConfig = new Map();
const voicemasterChannels = new Map();
const filters = new Map();
const customCommands = new Map();
const starboardConfig = new Map();
const starredMessages = new Map();
const welcomeConfig = new Map();
const goodbyeConfig = new Map();
const boostConfig = new Map();
const userNotes = new Map();
const loggingConfig = new Map();
const webhookStore = new Map();
const vanityConfig = new Map();
const vanityActive = new Map();
const reactionRoles = new Map();
const pageStore = new Map();
const redditFeeds = new Map();
const youtubeFeeds = new Map();
const twitchFeeds = new Map();
const tiktokFeeds = new Map();
const pinterestFeeds = new Map();
const fakePerms = new Map();     // guildId → Map<roleId, Set<permission>>
const serverSettings = new Map(); // guildId → { jailRoles, customPrefix }
const lastStatus = new Map();
const modCases = new Map(); // guildId → [{ id, type, userId, modId, reason, timestamp }]

// ===== new feature state =====
const inviteCache = new Map();       // guildId → Map<code, { uses, inviterId }>
const inviteLeaderboard = new Map(); // guildId → Map<userId, count>
const antiRaidConfig = new Map();    // guildId → { enabled, threshold, action }
const antiNukeConfig = new Map();    // guildId → { enabled, threshold }
const automodConfig = new Map();     // guildId → { spam, links, caps, capsThreshold }
const statChannels = new Map();      // guildId → { memberCount, botCount, humanCount }
const colorRoleConfig = new Map();   // guildId → { rolePrefix, roles: [{name,color,roleId}] }
const tempbans = new Map();          // guildId → Map<userId, { unbanAt, timerId }>
const ticketConfig = new Map();      // guildId → { categoryId, staffRoleId, logChannelId }
const twentyfourseven = new Map();   // guildId → { channelId, intervalId }

// economy
const ecoWallet = new Map();
const ecoBank = new Map();
const ecoDailyCooldown = new Map();
const ecoWeeklyCooldown = new Map();
const ecoWorkCooldown = new Map();
const ecoRobCooldown = new Map();
const ecoInventory = new Map();

const ECO_SHOP = [
  { id: "lucky_charm",  name: "🍀 Lucky Charm",  price: 200,  desc: "Boosts your next gamble payout by 50%." },
  { id: "shield",       name: "🛡️ Rob Shield",   price: 350,  desc: "Prevents the next rob attempt against you." },
  { id: "boost",        name: "⚡ Work Boost",   price: 150,  desc: "Doubles your next /work payout." },
  { id: "mystery_box",  name: "📦 Mystery Box",  price: 500,  desc: "Open with /use for a random coin reward." },
];

function getWallet(uid) { return ecoWallet.get(uid) || 0; }
function getBank(uid)   { return ecoBank.get(uid)   || 0; }
function setWallet(uid, v) { ecoWallet.set(uid, Math.max(0, v)); }
function setBank(uid, v)   { ecoBank.set(uid, Math.max(0, v)); }
function addWallet(uid, v) { setWallet(uid, getWallet(uid) + v); }
function getInv(uid) { if (!ecoInventory.has(uid)) ecoInventory.set(uid, {}); return ecoInventory.get(uid); }
function addItem(uid, itemId) { const inv = getInv(uid); inv[itemId] = (inv[itemId] || 0) + 1; }
function hasItem(uid, itemId) { return (getInv(uid)[itemId] || 0) > 0; }
function removeItem(uid, itemId) { const inv = getInv(uid); if (inv[itemId]) { inv[itemId]--; if (!inv[itemId]) delete inv[itemId]; } }

const LEVEL_ROLES = {
  5: "Active Member",
  10: "Regular",
  20: "Server Veteran",
  50: "Legend"
};

const TRUTHS = [
  "What's the most embarrassing thing you've done in the last week?",
  "Who was your first crush?",
  "What's a secret you've never told anyone?",
  "What's your biggest fear?",
  "Have you ever lied to a best friend? About what?",
  "What's the weirdest dream you've ever had?",
  "What's the most childish thing you still do?",
  "Have you ever cheated on a test?",
  "What's the worst gift you've ever received?",
  "Who in this server would you trust with your phone for a day?",
  "What's your guiltiest pleasure song?",
  "Have you ever stalked someone on social media? Who?",
  "What's the most embarrassing thing in your search history?",
  "Have you ever pretended to like a gift?",
  "What's a rumor you've spread that wasn't true?"
];

const DARES = [
  "Send the last photo in your camera roll.",
  "Change your nickname to whatever the next person says for 1 hour.",
  "Send a voice note singing the chorus of your favorite song.",
  "Text your crush 'I had a dream about you' and screenshot the reply.",
  "DM someone in this server a compliment.",
  "Post a selfie with a weird face.",
  "Speak only in emojis for the next 10 messages.",
  "Send a screenshot of your home screen.",
  "Type with your eyes closed for the next 5 minutes.",
  "Send the most recent meme you saved.",
  "Change your status to 'I love vanta bot' for 24 hours.",
  "Send a message in all caps for 10 minutes.",
  "Tell the channel your most controversial opinion.",
  "Reveal your phone's battery percentage.",
  "Share your most-used emoji."
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildEmojisAndStickers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const slashCommands = [
  new SlashCommandBuilder().setName("ping").setDescription("test vanta"),
  new SlashCommandBuilder().setName("help").setDescription("show commands"),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("make vanta say something")
    .addStringOption(o => o.setName("text").setDescription("message").setRequired(true)),

  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("send a custom embed using Bleed-style scripting")
    .addStringOption(o => o.setName("code").setDescription("embed code e.g. {title: hello {user}}$v{description: welcome!}").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("channel to send to (defaults to current)").addChannelTypes(ChannelType.GuildText)),

  new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("start a giveaway")
    .addIntegerOption(o => o.setName("time").setDescription("seconds").setRequired(true))
    .addIntegerOption(o => o.setName("winners").setDescription("winner count").setRequired(true))
    .addStringOption(o => o.setName("prize").setDescription("prize").setRequired(true)),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("delete messages")
    .addIntegerOption(o => o.setName("amount").setDescription("1-100").setRequired(true)),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("kick a member")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason")),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("ban a member")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason")),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("timeout a member")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
    .addIntegerOption(o => o.setName("seconds").setDescription("seconds").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason")),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("remove timeout")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("warn a member")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("view warnings")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clearwarns")
    .setDescription("clear warnings")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true)),

  new SlashCommandBuilder()
    .setName("user")
    .setDescription("user info")
    .addUserOption(o => o.setName("user").setDescription("member")),
  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("send announcement")
    .addChannelOption(o => o.setName("channel").setDescription("channel").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("message").setRequired(true)),

  new SlashCommandBuilder().setName("preview").setDescription("preview server messages")
    .addSubcommand(s => s.setName("welcome").setDescription("preview the welcome message"))
    .addSubcommand(s => s.setName("boost").setDescription("preview the boost message")),
  new SlashCommandBuilder().setName("supportpanel").setDescription("send support panel"),

  new SlashCommandBuilder()
    .setName("steal")
    .setDescription("steal a custom emoji into this server")
    .addStringOption(o => o.setName("emoji").setDescription("emoji or image url").setRequired(true))
    .addStringOption(o => o.setName("name").setDescription("name for the new emoji")),

  new SlashCommandBuilder()
    .setName("stealsticker")
    .setDescription("steal a sticker (reply to a message with a sticker first)")
    .addStringOption(o => o.setName("message_id").setDescription("id of the message with the sticker").setRequired(true))
    .addStringOption(o => o.setName("name").setDescription("name for the new sticker")),

  new SlashCommandBuilder().setName("tod")
    .setDescription("truth or dare")
    .addSubcommand(s => s.setName("truth").setDescription("get a random truth question"))
    .addSubcommand(s => s.setName("dare").setDescription("get a random dare"))
    .addSubcommand(s => s.setName("random").setDescription("random truth or dare")),

  new SlashCommandBuilder()
    .setName("confession")
    .setDescription("send an anonymous confession")
    .addStringOption(o => o.setName("message").setDescription("your confession").setRequired(true)),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("set yourself as afk")
    .addStringOption(o => o.setName("reason").setDescription("optional reason")),

  new SlashCommandBuilder().setName("snipe")
    .setDescription("snipe deleted or edited messages")
    .addSubcommand(s => s.setName("get").setDescription("show the last deleted message"))
    .addSubcommand(s => s.setName("edit").setDescription("show the last edited message")),

  new SlashCommandBuilder()
    .setName("rolemenu")
    .setDescription("create a self-assign role menu with buttons")
    .addStringOption(o => o.setName("title").setDescription("menu title").setRequired(true))
    .addStringOption(o => o.setName("description").setDescription("menu description").setRequired(true))
    .addStringOption(o => o.setName("roles").setDescription("@role:Label | @role2:Label2 | ... (up to 5)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("voicemaster")
    .setDescription("set up join-to-create voice channels")
    .addChannelOption(o => o.setName("category").setDescription("category to put temp channels under").addChannelTypes(ChannelType.GuildCategory).setRequired(true)),

  new SlashCommandBuilder()
    .setName("filter")
    .setDescription("manage the word filter")
    .addSubcommand(s => s.setName("add").setDescription("add a word").addStringOption(o => o.setName("word").setDescription("word to filter").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a word").addStringOption(o => o.setName("word").setDescription("word to unfilter").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("list filtered words")),

  new SlashCommandBuilder()
    .setName("cc")
    .setDescription("manage custom commands")
    .addSubcommand(s => s.setName("add").setDescription("add a custom command")
      .addStringOption(o => o.setName("name").setDescription("command name").setRequired(true))
      .addStringOption(o => o.setName("response").setDescription("response text").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a custom command").addStringOption(o => o.setName("name").setDescription("command name").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("list custom commands")),

  // ===== info =====
  new SlashCommandBuilder().setName("userinfo").setDescription("show user info")
    .addUserOption(o => o.setName("user").setDescription("the user")),
  new SlashCommandBuilder().setName("serverinfo").setDescription("show server info"),
  new SlashCommandBuilder().setName("avatar").setDescription("show a user's avatar")
    .addUserOption(o => o.setName("user").setDescription("the user")),
  new SlashCommandBuilder().setName("banner").setDescription("show a user's banner")
    .addUserOption(o => o.setName("user").setDescription("the user")),
  new SlashCommandBuilder().setName("roleinfo").setDescription("show role info")
    .addRoleOption(o => o.setName("role").setDescription("the role").setRequired(true)),
  new SlashCommandBuilder().setName("membercount").setDescription("show member counts"),

  // ===== channel control =====
  new SlashCommandBuilder().setName("lock").setDescription("lock or unlock a channel")
    .addSubcommand(s => s.setName("channel").setDescription("lock this channel (no one can send)"))
    .addSubcommand(s => s.setName("unlock").setDescription("unlock this channel")),
  new SlashCommandBuilder().setName("slowmode").setDescription("set channel slowmode in seconds (0 to disable)")
    .addIntegerOption(o => o.setName("seconds").setDescription("0-21600").setMinValue(0).setMaxValue(21600).setRequired(true)),

  // ===== member mod =====
  new SlashCommandBuilder().setName("nick").setDescription("change a user's nickname")
    .addUserOption(o => o.setName("user").setDescription("the user").setRequired(true))
    .addStringOption(o => o.setName("nickname").setDescription("new nickname (omit to reset)")),
  new SlashCommandBuilder().setName("role").setDescription("role management")
    .addSubcommand(s => s.setName("toggle").setDescription("toggle a role on a user")
      .addUserOption(o => o.setName("user").setDescription("the user").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("the role").setRequired(true)))
    .addSubcommand(s => s.setName("add").setDescription("add a role to a member")
      .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("role").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a role from a member")
      .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("role").setRequired(true)))
    .addSubcommand(s => s.setName("create").setDescription("create a new role")
      .addStringOption(o => o.setName("name").setDescription("role name").setRequired(true))
      .addStringOption(o => o.setName("color").setDescription("hex color e.g. #ff69b4")))
    .addSubcommand(s => s.setName("delete").setDescription("delete an existing role")
      .addRoleOption(o => o.setName("role").setDescription("role to delete").setRequired(true))),

  // ===== utility =====
  new SlashCommandBuilder().setName("poll").setDescription("create a poll (up to 10 options)")
    .addStringOption(o => o.setName("question").setDescription("the question").setRequired(true))
    .addStringOption(o => o.setName("options").setDescription("options separated by | (max 10)").setRequired(true)),
  new SlashCommandBuilder().setName("remind").setDescription("DM you a reminder later")
    .addStringOption(o => o.setName("duration").setDescription("e.g. 10m, 2h, 1d").setRequired(true))
    .addStringOption(o => o.setName("text").setDescription("what to remind you about").setRequired(true)),
  new SlashCommandBuilder().setName("suggest").setDescription("post a suggestion with vote reactions")
    .addStringOption(o => o.setName("text").setDescription("your suggestion").setRequired(true)),

  // ===== fun =====
  new SlashCommandBuilder().setName("game")
    .setDescription("play a quick game")
    .addSubcommand(s => s.setName("eightball").setDescription("ask the magic 8-ball")
      .addStringOption(o => o.setName("question").setDescription("your question").setRequired(true)))
    .addSubcommand(s => s.setName("coinflip").setDescription("flip a coin"))
    .addSubcommand(s => s.setName("dice").setDescription("roll a dice")
      .addIntegerOption(o => o.setName("sides").setDescription("number of sides (default 6)").setMinValue(2).setMaxValue(1000)))
    .addSubcommand(s => s.setName("choose").setDescription("pick one of several options")
      .addStringOption(o => o.setName("options").setDescription("comma separated options").setRequired(true)))
    .addSubcommand(s => s.setName("rps").setDescription("rock paper scissors vs vanta")
      .addStringOption(o => o.setName("choice").setDescription("rock, paper, or scissors").setRequired(true)
        .addChoices({ name: "rock", value: "rock" }, { name: "paper", value: "paper" }, { name: "scissors", value: "scissors" })))
    .addSubcommand(s => s.setName("tictactoe").setDescription("challenge someone to tic-tac-toe")
      .addUserOption(o => o.setName("opponent").setDescription("who to play against").setRequired(true))),

  // ===== mod notes =====
  new SlashCommandBuilder().setName("note").setDescription("manage mod notes on a user")
    .addSubcommand(s => s.setName("add").setDescription("add a note")
      .addUserOption(o => o.setName("user").setDescription("the user").setRequired(true))
      .addStringOption(o => o.setName("text").setDescription("note text").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("list notes on a user")
      .addUserOption(o => o.setName("user").setDescription("the user").setRequired(true)))
    .addSubcommand(s => s.setName("clear").setDescription("clear all notes on a user")
      .addUserOption(o => o.setName("user").setDescription("the user").setRequired(true))),

  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("manage the welcome system")
    .addSubcommand(s => s.setName("setup").setDescription("set the welcome channel + message")
      .addChannelOption(o => o.setName("channel").setDescription("welcome channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("supports {user} {server} {membercount}")))
    .addSubcommand(s => s.setName("test").setDescription("preview the welcome message"))
    .addSubcommand(s => s.setName("view").setDescription("view current welcome config"))
    .addSubcommand(s => s.setName("disable").setDescription("disable the welcome system")),

  new SlashCommandBuilder()
    .setName("goodbye")
    .setDescription("manage the goodbye system")
    .addSubcommand(s => s.setName("setup").setDescription("set the goodbye channel + message")
      .addChannelOption(o => o.setName("channel").setDescription("goodbye channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("supports {user.tag} {server} {membercount}")))
    .addSubcommand(s => s.setName("test").setDescription("preview the goodbye message"))
    .addSubcommand(s => s.setName("view").setDescription("view current goodbye config"))
    .addSubcommand(s => s.setName("disable").setDescription("disable the goodbye system")),

  new SlashCommandBuilder()
    .setName("boost")
    .setDescription("manage the booster announcement system")
    .addSubcommand(s => s.setName("setup").setDescription("set the boost channel + message")
      .addChannelOption(o => o.setName("channel").setDescription("boost channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("supports {user} {server} {boostcount}")))
    .addSubcommand(s => s.setName("test").setDescription("preview the boost message"))
    .addSubcommand(s => s.setName("view").setDescription("view current boost config"))
    .addSubcommand(s => s.setName("disable").setDescription("disable the boost system")),

  new SlashCommandBuilder()
    .setName("starboard")
    .setDescription("manage the starboard")
    .addSubcommand(s => s.setName("setup").setDescription("set the starboard channel + threshold")
      .addChannelOption(o => o.setName("channel").setDescription("starboard channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addIntegerOption(o => o.setName("threshold").setDescription("number of ⭐ needed").setMinValue(1).setMaxValue(50).setRequired(true)))
    .addSubcommand(s => s.setName("disable").setDescription("disable the starboard")),

  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("show your level and xp")
    .addUserOption(o => o.setName("user").setDescription("whose rank to show")),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("top 10 most active members"),

  new SlashCommandBuilder()
    .setName("setlevel")
    .setDescription("admin: set a user's level")
    .addUserOption(o => o.setName("user").setDescription("user").setRequired(true))
    .addIntegerOption(o => o.setName("level").setDescription("new level").setRequired(true)),

  new SlashCommandBuilder()
    .setName("gstart")
    .setDescription("start a giveaway with a join button")
    .addStringOption(o => o.setName("duration").setDescription("e.g. 30s, 10m, 2h, 1d").setRequired(true))
    .addIntegerOption(o => o.setName("winners").setDescription("number of winners").setRequired(true))
    .addStringOption(o => o.setName("prize").setDescription("what's being given away").setRequired(true)),

  new SlashCommandBuilder()
    .setName("greroll")
    .setDescription("reroll a finished giveaway")
    .addStringOption(o => o.setName("message_id").setDescription("id of the giveaway message").setRequired(true)),

  new SlashCommandBuilder()
    .setName("event")
    .setDescription("post a styled event announcement")
    .addStringOption(o => o.setName("title").setDescription("event title").setRequired(true))
    .addStringOption(o => o.setName("description").setDescription("event details").setRequired(true))
    .addStringOption(o => o.setName("when").setDescription("date / time"))
    .addStringOption(o => o.setName("where").setDescription("location or channel"))
    .addStringOption(o => o.setName("color").setDescription("hex or color name"))
    .addStringOption(o => o.setName("image").setDescription("image url")),

  // ===== logging =====
  new SlashCommandBuilder().setName("log").setDescription("server event logging")
    .addSubcommand(s => s.setName("add").setDescription("log an event type to a channel")
      .addChannelOption(o => o.setName("channel").setDescription("log channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("event").setDescription("event").setRequired(true)
        .addChoices(
          { name: "messages", value: "messages" },
          { name: "members", value: "members" },
          { name: "roles", value: "roles" },
          { name: "channels", value: "channels" },
          { name: "invites", value: "invites" },
          { name: "emojis", value: "emojis" },
          { name: "voice", value: "voice" },
          { name: "all", value: "all" }
        )))
    .addSubcommand(s => s.setName("remove").setDescription("stop logging an event")
      .addStringOption(o => o.setName("event").setDescription("event or 'all'").setRequired(true)))
    .addSubcommand(s => s.setName("ignore").setDescription("ignore a user or channel from logs")
      .addStringOption(o => o.setName("target_id").setDescription("user id or channel id").setRequired(true)))
    .addSubcommand(s => s.setName("unignore").setDescription("unignore an id")
      .addStringOption(o => o.setName("target_id").setDescription("user id or channel id").setRequired(true)))
    .addSubcommand(s => s.setName("ignorelist").setDescription("show the ignore list"))
    .addSubcommand(s => s.setName("color").setDescription("set color for a logged event")
      .addStringOption(o => o.setName("event").setDescription("event").setRequired(true))
      .addStringOption(o => o.setName("hex").setDescription("hex color e.g. #87ceeb").setRequired(true)))
    .addSubcommand(s => s.setName("view").setDescription("view current log config")),

  // ===== webhook =====
  new SlashCommandBuilder().setName("webhook").setDescription("create + send via webhooks")
    .addSubcommand(s => s.setName("create").setDescription("create a webhook in this channel"))
    .addSubcommand(s => s.setName("send").setDescription("send a message via a saved webhook")
      .addStringOption(o => o.setName("identifier").setDescription("the id you got back from create").setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("plain text or embed code").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("list saved webhook identifiers"))
    .addSubcommand(s => s.setName("delete").setDescription("delete a saved webhook")
      .addStringOption(o => o.setName("identifier").setDescription("identifier").setRequired(true))),

  // ===== vanity =====
  new SlashCommandBuilder().setName("vanity").setDescription("vanity status role")
    .addSubcommand(s => s.setName("set").setDescription("set the substring to look for in custom statuses")
      .addStringOption(o => o.setName("substring").setDescription("e.g. /vanta").setRequired(true)))
    .addSubcommand(s => s.setName("role").setDescription("set the role to give")
      .addRoleOption(o => o.setName("role").setDescription("role").setRequired(true)))
    .addSubcommand(s => s.setName("log").setDescription("set the log channel")
      .addChannelOption(o => o.setName("channel").setDescription("channel").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("message").setDescription("set the thank-you message")
      .addStringOption(o => o.setName("text").setDescription("supports {user}, {server}").setRequired(true)))
    .addSubcommand(s => s.setName("award").setDescription("set channel where thank-you is sent")
      .addChannelOption(o => o.setName("channel").setDescription("channel").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("view").setDescription("show current vanity config"))
    .addSubcommand(s => s.setName("disable").setDescription("disable the vanity system")),

  // ===== reaction roles =====
  new SlashCommandBuilder().setName("rr").setDescription("reaction roles")
    .addSubcommand(s => s.setName("add").setDescription("add a reaction role")
      .addStringOption(o => o.setName("message_id").setDescription("message id").setRequired(true))
      .addStringOption(o => o.setName("emoji").setDescription("emoji").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("role").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a reaction role")
      .addStringOption(o => o.setName("message_id").setDescription("message id").setRequired(true))
      .addStringOption(o => o.setName("emoji").setDescription("emoji").setRequired(true)))
    .addSubcommand(s => s.setName("removeall").setDescription("remove all reaction roles from a message")
      .addStringOption(o => o.setName("message_id").setDescription("message id").setRequired(true)))
    .addSubcommand(s => s.setName("clear").setDescription("clear all reaction roles in this server"))
    .addSubcommand(s => s.setName("list").setDescription("list reaction roles in this server")),

  // ===== pagination =====
  new SlashCommandBuilder().setName("pagination").setDescription("paginated embeds")
    .addSubcommand(s => s.setName("create").setDescription("create a paginated embed (pages separated by ---)")
      .addStringOption(o => o.setName("pages").setDescription("page1 --- page2 --- page3").setRequired(true))
      .addStringOption(o => o.setName("title").setDescription("optional title")))
    .addSubcommand(s => s.setName("addpage").setDescription("add a page to an existing pagination")
      .addStringOption(o => o.setName("message_id").setDescription("first message id").setRequired(true))
      .addStringOption(o => o.setName("text").setDescription("page content").setRequired(true)))
    .addSubcommand(s => s.setName("update").setDescription("update an existing page")
      .addStringOption(o => o.setName("message_id").setDescription("first message id").setRequired(true))
      .addIntegerOption(o => o.setName("page").setDescription("page number (1-based)").setRequired(true))
      .addStringOption(o => o.setName("text").setDescription("new content").setRequired(true))),

  // ===== reddit feed =====
  new SlashCommandBuilder().setName("subreddit").setDescription("subreddit feeds")
    .addSubcommand(s => s.setName("lookup").setDescription("look up a subreddit's latest post")
      .addStringOption(o => o.setName("name").setDescription("subreddit name (no r/)").setRequired(true)))
    .addSubcommand(s => s.setName("add").setDescription("stream new posts from a subreddit")
      .addChannelOption(o => o.setName("channel").setDescription("destination channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("name").setDescription("subreddit name").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a subreddit feed")
      .addStringOption(o => o.setName("name").setDescription("subreddit name").setRequired(true)))
    .addSubcommand(s => s.setName("message").setDescription("set custom prefix message for posts")
      .addStringOption(o => o.setName("name").setDescription("subreddit name").setRequired(true))
      .addStringOption(o => o.setName("text").setDescription("message text").setRequired(true)))
    .addSubcommand(s => s.setName("color").setDescription("set embed color for a subreddit feed")
      .addStringOption(o => o.setName("name").setDescription("subreddit name").setRequired(true))
      .addStringOption(o => o.setName("hex").setDescription("hex color").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("list subreddit feeds")),

  // ===== youtube feed =====
  new SlashCommandBuilder().setName("youtube").setDescription("youtube channel feeds")
    .addSubcommand(s => s.setName("add").setDescription("stream new uploads from a youtube channel")
      .addChannelOption(o => o.setName("channel").setDescription("destination channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("youtube_id").setDescription("youtube channel id (UC...) or @handle").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a youtube feed")
      .addStringOption(o => o.setName("youtube_id").setDescription("youtube channel id or @handle").setRequired(true)))
    .addSubcommand(s => s.setName("message").setDescription("set custom message text for new uploads")
      .addStringOption(o => o.setName("youtube_id").setDescription("youtube channel id or @handle").setRequired(true))
      .addStringOption(o => o.setName("text").setDescription("message text").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("list youtube feeds")),

  // ===== voicemaster extras =====
  new SlashCommandBuilder().setName("vm").setDescription("voicemaster controls")
    .addSubcommand(s => s.setName("bitrate").setDescription("set default bitrate for new vm channels (kbps)")
      .addIntegerOption(o => o.setName("kbps").setDescription("8-96").setMinValue(8).setMaxValue(96).setRequired(true)))
    .addSubcommand(s => s.setName("joinrole").setDescription("role given when someone joins a vm channel")
      .addRoleOption(o => o.setName("role").setDescription("role").setRequired(true)))
    .addSubcommand(s => s.setName("defaultname").setDescription("default name for new vm channels (use {user})")
      .addStringOption(o => o.setName("name").setDescription("template").setRequired(true)))
    .addSubcommand(s => s.setName("category").setDescription("category for new vm channels")
      .addChannelOption(o => o.setName("category").setDescription("category").addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
    .addSubcommand(s => s.setName("sendinterface").setDescription("send the vm control panel here")),

  // ===== case system =====
  new SlashCommandBuilder().setName("case").setDescription("mod case management")
    .addSubcommand(s => s.setName("lookup").setDescription("view all cases for a user")
      .addUserOption(o => o.setName("user").setDescription("the user").setRequired(true)))
    .addSubcommand(s => s.setName("view").setDescription("view a specific case by number")
      .addIntegerOption(o => o.setName("number").setDescription("case number").setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName("reason").setDescription("update the reason on a case")
      .addIntegerOption(o => o.setName("number").setDescription("case number").setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName("reason").setDescription("new reason").setRequired(true)))
    .addSubcommand(s => s.setName("delete").setDescription("delete a case (admin only)")
      .addIntegerOption(o => o.setName("number").setDescription("case number").setRequired(true).setMinValue(1))),

  // ===== MODERATION EXTRAS =====
  new SlashCommandBuilder().setName("unban")
    .setDescription("unban a user by ID")
    .addStringOption(o => o.setName("userid").setDescription("user ID").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason")),

  new SlashCommandBuilder().setName("jail")
    .setDescription("jail or unjail a member")
    .addSubcommand(s => s.setName("add").setDescription("assign the jailed role")
      .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("reason")))
    .addSubcommand(s => s.setName("remove").setDescription("remove the jailed role")
      .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))),

  new SlashCommandBuilder().setName("softban")
    .setDescription("ban then immediately unban to wipe recent messages")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason")),

  new SlashCommandBuilder().setName("massban")
    .setDescription("ban multiple users by ID at once")
    .addStringOption(o => o.setName("userids").setDescription("space-separated user IDs").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason")),

  new SlashCommandBuilder().setName("hide")
    .setDescription("hide or unhide a channel")
    .addSubcommand(s => s.setName("channel").setDescription("hide a channel from regular members")
      .addChannelOption(o => o.setName("channel").setDescription("channel (defaults to current)").addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s => s.setName("unhide").setDescription("unhide a channel for regular members")
      .addChannelOption(o => o.setName("channel").setDescription("channel (defaults to current)").addChannelTypes(ChannelType.GuildText))),

  new SlashCommandBuilder().setName("nuke")
    .setDescription("clone and delete this channel to wipe all messages"),

  // ===== INFO EXTRAS =====
  new SlashCommandBuilder().setName("bot")
    .setDescription("bot info and status")
    .addSubcommand(s => s.setName("info").setDescription("show info about vanta"))
    .addSubcommand(s => s.setName("uptime").setDescription("show how long vanta has been online")),

  new SlashCommandBuilder().setName("roles").setDescription("list all roles in the server"),

  new SlashCommandBuilder().setName("channelinfo")
    .setDescription("show info about a channel")
    .addChannelOption(o => o.setName("channel").setDescription("channel (defaults to current)")),

  new SlashCommandBuilder().setName("firstmessage")
    .setDescription("link to the first message in a channel")
    .addChannelOption(o => o.setName("channel").setDescription("channel (defaults to current)")),

  new SlashCommandBuilder().setName("permissions")
    .setDescription("show a user's permissions in a channel")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("channel (defaults to current)")),

  // ===== ECONOMY =====
  new SlashCommandBuilder().setName("balance")
    .setDescription("check coin balance")
    .addUserOption(o => o.setName("user").setDescription("user to check")),

  new SlashCommandBuilder().setName("daily").setDescription("claim your daily coins (24hr cooldown)"),
  new SlashCommandBuilder().setName("weekly").setDescription("claim your weekly coins (7 day cooldown)"),

  new SlashCommandBuilder().setName("pay")
    .setDescription("send coins to another user")
    .addUserOption(o => o.setName("user").setDescription("recipient").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("amount").setRequired(true).setMinValue(1)),

  new SlashCommandBuilder().setName("ecoboard").setDescription("top 10 richest users"),

  new SlashCommandBuilder().setName("gamble")
    .setDescription("gamble coins for a chance to double up")
    .addIntegerOption(o => o.setName("amount").setDescription("amount to gamble").setRequired(true).setMinValue(1)),

  new SlashCommandBuilder().setName("slots")
    .setDescription("play the slot machine")
    .addIntegerOption(o => o.setName("amount").setDescription("amount to bet").setRequired(true).setMinValue(1)),

  new SlashCommandBuilder().setName("rob")
    .setDescription("attempt to steal coins from another user")
    .addUserOption(o => o.setName("user").setDescription("target").setRequired(true)),

  new SlashCommandBuilder().setName("work").setDescription("work for coins (1hr cooldown)"),

  new SlashCommandBuilder().setName("bank")
    .setDescription("deposit or withdraw coins from your bank")
    .addSubcommand(s => s.setName("deposit").setDescription("deposit coins into your bank")
      .addStringOption(o => o.setName("amount").setDescription("amount or 'all'").setRequired(true)))
    .addSubcommand(s => s.setName("withdraw").setDescription("withdraw coins from your bank")
      .addStringOption(o => o.setName("amount").setDescription("amount or 'all'").setRequired(true))),

  new SlashCommandBuilder().setName("shop").setDescription("view the item shop"),

  new SlashCommandBuilder().setName("buy")
    .setDescription("buy an item from the shop")
    .addStringOption(o => o.setName("item").setDescription("item name or id").setRequired(true)),

  new SlashCommandBuilder().setName("inventory")
    .setDescription("view your inventory")
    .addUserOption(o => o.setName("user").setDescription("user to check")),

  new SlashCommandBuilder().setName("use")
    .setDescription("use an item from your inventory")
    .addStringOption(o => o.setName("item").setDescription("item name or id").setRequired(true)),

  // ===== FUN EXTRAS =====
  new SlashCommandBuilder().setName("fun")
    .setDescription("fun commands")
    .addSubcommand(s => s.setName("joke").setDescription("get a random joke"))
    .addSubcommand(s => s.setName("meme").setDescription("get a random meme"))
    .addSubcommand(s => s.setName("fact").setDescription("get a random fun fact"))
    .addSubcommand(s => s.setName("wyr").setDescription("get a would you rather question"))
    .addSubcommand(s => s.setName("roast").setDescription("roast a user")
      .addUserOption(o => o.setName("user").setDescription("who to roast").setRequired(true)))
    .addSubcommand(s => s.setName("compliment").setDescription("compliment a user")
      .addUserOption(o => o.setName("user").setDescription("who to compliment").setRequired(true)))
    .addSubcommand(s => s.setName("ship").setDescription("calculate love compatibility")
      .addUserOption(o => o.setName("user1").setDescription("first user").setRequired(true))
      .addUserOption(o => o.setName("user2").setDescription("second user").setRequired(true))),

  new SlashCommandBuilder().setName("text")
    .setDescription("text manipulation")
    .addSubcommand(s => s.setName("ascii").setDescription("convert text to ASCII art")
      .addStringOption(o => o.setName("text").setDescription("text to convert").setRequired(true)))
    .addSubcommand(s => s.setName("reverse").setDescription("reverse a piece of text")
      .addStringOption(o => o.setName("text").setDescription("text to reverse").setRequired(true)))
    .addSubcommand(s => s.setName("mock").setDescription("MoCk SoMe TeXt")
      .addStringOption(o => o.setName("text").setDescription("text to mock").setRequired(true))),

  // ===== UTILITY EXTRAS =====
  new SlashCommandBuilder().setName("lookup")
    .setDescription("look things up")
    .addSubcommand(s => s.setName("weather").setDescription("get current weather for a city")
      .addStringOption(o => o.setName("city").setDescription("city name").setRequired(true)))
    .addSubcommand(s => s.setName("urban").setDescription("look up a term on Urban Dictionary")
      .addStringOption(o => o.setName("term").setDescription("term to look up").setRequired(true)))
    .addSubcommand(s => s.setName("enlarge").setDescription("show a large version of a custom emoji")
      .addStringOption(o => o.setName("emoji").setDescription("custom emoji").setRequired(true)))
    .addSubcommand(s => s.setName("translate").setDescription("translate text to another language")
      .addStringOption(o => o.setName("language").setDescription("target language code").setRequired(true))
      .addStringOption(o => o.setName("text").setDescription("text to translate").setRequired(true)))
    .addSubcommand(s => s.setName("youtube").setDescription("search YouTube and get the top result")
      .addStringOption(o => o.setName("query").setDescription("what to search for").setRequired(true)))
    .addSubcommand(s => s.setName("tiktok").setDescription("search TikTok and get a link")
      .addStringOption(o => o.setName("query").setDescription("what to search for").setRequired(true)))
    .addSubcommand(s => s.setName("instagram").setDescription("look up an Instagram profile")
      .addStringOption(o => o.setName("username").setDescription("instagram username").setRequired(true)))
    .addSubcommand(s => s.setName("twitter").setDescription("look up a Twitter/X profile")
      .addStringOption(o => o.setName("username").setDescription("twitter username").setRequired(true)))
    .addSubcommand(s => s.setName("reddit").setDescription("look up a Reddit user or subreddit")
      .addStringOption(o => o.setName("query").setDescription("username or subreddit name").setRequired(true))),

  // ===== MUSIC =====
  new SlashCommandBuilder().setName("music")
    .setDescription("music controls")
    .addSubcommand(s => s.setName("play").setDescription("play a song or add it to the queue")
      .addStringOption(o => o.setName("song").setDescription("song name or URL").setRequired(true)))
    .addSubcommand(s => s.setName("skip").setDescription("skip the current song"))
    .addSubcommand(s => s.setName("stop").setDescription("stop music and clear the queue"))
    .addSubcommand(s => s.setName("pause").setDescription("pause the current song"))
    .addSubcommand(s => s.setName("resume").setDescription("resume the paused song"))
    .addSubcommand(s => s.setName("queue").setDescription("show the current music queue"))
    .addSubcommand(s => s.setName("nowplaying").setDescription("show what's currently playing"))
    .addSubcommand(s => s.setName("volume").setDescription("set playback volume (1-100)")
      .addIntegerOption(o => o.setName("level").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100)))
    .addSubcommand(s => s.setName("shuffle").setDescription("shuffle the current queue"))
    .addSubcommand(s => s.setName("loop").setDescription("set loop mode")
      .addStringOption(o => o.setName("mode").setDescription("off / song / queue").setRequired(true)
        .addChoices({ name: "off", value: "0" }, { name: "song", value: "1" }, { name: "queue", value: "2" })))
    .addSubcommand(s => s.setName("seek").setDescription("seek to a position in the current song")
      .addIntegerOption(o => o.setName("seconds").setDescription("time in seconds").setRequired(true).setMinValue(0)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a song from the queue by position")
      .addIntegerOption(o => o.setName("position").setDescription("position in queue (1-based)").setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName("autoplay").setDescription("toggle autoplay mode"))
    .addSubcommand(s => s.setName("lyrics").setDescription("search for song lyrics")
      .addStringOption(o => o.setName("song").setDescription("song name").setRequired(true)))
    .addSubcommand(s => s.setName("247").setDescription("toggle 24/7 mode — bot stays in VC permanently")),

  // ===== TEMPBAN =====
  new SlashCommandBuilder().setName("tempban")
    .setDescription("temporarily ban a user")
    .addUserOption(o => o.setName("user").setDescription("member").setRequired(true))
    .addStringOption(o => o.setName("duration").setDescription("e.g. 1h, 2d, 30m").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("reason")),

  // ===== INVITE TRACKING =====
  new SlashCommandBuilder().setName("invites")
    .setDescription("invite tracking")
    .addSubcommand(s => s.setName("check").setDescription("check how many invites a user has")
      .addUserOption(o => o.setName("user").setDescription("user (defaults to you)")))
    .addSubcommand(s => s.setName("leaderboard").setDescription("top inviters in this server"))
    .addSubcommand(s => s.setName("reset").setDescription("reset invite count for a user (admin)")
      .addUserOption(o => o.setName("user").setDescription("user").setRequired(true))),

  // ===== ANTI-RAID CONFIG =====
  new SlashCommandBuilder().setName("antiraid")
    .setDescription("configure anti-raid protection")
    .addSubcommand(s => s.setName("enable").setDescription("enable anti-raid")
      .addIntegerOption(o => o.setName("threshold").setDescription("joins per 10s to trigger (default 5)").setMinValue(2).setMaxValue(20))
      .addStringOption(o => o.setName("action").setDescription("action on raid").addChoices(
        { name: "log", value: "log" },
        { name: "timeout", value: "timeout" },
        { name: "kick", value: "kick" }
      )))
    .addSubcommand(s => s.setName("disable").setDescription("disable anti-raid"))
    .addSubcommand(s => s.setName("view").setDescription("view current anti-raid config")),

  // ===== ANTI-NUKE CONFIG =====
  new SlashCommandBuilder().setName("antinuke")
    .setDescription("configure anti-nuke protection")
    .addSubcommand(s => s.setName("enable").setDescription("enable anti-nuke")
      .addIntegerOption(o => o.setName("threshold").setDescription("actions per 60s before punishment (default 3)").setMinValue(1).setMaxValue(10)))
    .addSubcommand(s => s.setName("disable").setDescription("disable anti-nuke"))
    .addSubcommand(s => s.setName("view").setDescription("view current anti-nuke config")),

  // ===== AUTO-MOD CONFIG =====
  new SlashCommandBuilder().setName("automod")
    .setDescription("configure auto-moderation")
    .addSubcommand(s => s.setName("spam").setDescription("toggle spam detection").addStringOption(o => o.setName("toggle").setDescription("on or off").setRequired(true).addChoices({ name: "on", value: "on" }, { name: "off", value: "off" })))
    .addSubcommand(s => s.setName("links").setDescription("toggle link blocking").addStringOption(o => o.setName("toggle").setDescription("on or off").setRequired(true).addChoices({ name: "on", value: "on" }, { name: "off", value: "off" })))
    .addSubcommand(s => s.setName("caps").setDescription("toggle caps filter").addStringOption(o => o.setName("toggle").setDescription("on or off").setRequired(true).addChoices({ name: "on", value: "on" }, { name: "off", value: "off" })).addIntegerOption(o => o.setName("percent").setDescription("caps % to trigger (default 70)").setMinValue(10).setMaxValue(100)))
    .addSubcommand(s => s.setName("view").setDescription("view current automod config")),

  // ===== SERVER STATS CHANNELS =====
  new SlashCommandBuilder().setName("statschannels")
    .setDescription("auto-updating stat voice channels")
    .addSubcommand(s => s.setName("setup").setDescription("create stat channels in a category")
      .addChannelOption(o => o.setName("category").setDescription("category to put them in").addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove stat channels")),

  // ===== COLOR ROLES =====
  new SlashCommandBuilder().setName("color")
    .setDescription("self-assign a color role")
    .addSubcommand(s => s.setName("set").setDescription("give yourself a color role")
      .addStringOption(o => o.setName("color").setDescription("hex color e.g. #ff69b4 or a name like pink").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove your color role"))
    .addSubcommand(s => s.setName("list").setDescription("list available preset colors")),

  // ===== ANIMAL / GIF COMMANDS =====
  new SlashCommandBuilder().setName("img")
    .setDescription("get a random image")
    .addSubcommand(s => s.setName("dog").setDescription("random dog picture"))
    .addSubcommand(s => s.setName("cat").setDescription("random cat picture"))
    .addSubcommand(s => s.setName("fox").setDescription("random fox picture"))
    .addSubcommand(s => s.setName("duck").setDescription("random duck picture"))
    .addSubcommand(s => s.setName("panda").setDescription("random panda picture")),

  // ===== TICKET MANAGEMENT =====
  new SlashCommandBuilder().setName("ticket")
    .setDescription("ticket management")
    .addSubcommand(s => s.setName("setup").setDescription("configure the ticket system")
      .addChannelOption(o => o.setName("category").setDescription("category for tickets").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
      .addRoleOption(o => o.setName("staffrole").setDescription("role that can see all tickets"))
      .addChannelOption(o => o.setName("logchannel").setDescription("channel to log ticket events").addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s => s.setName("add").setDescription("add a user to the current ticket")
      .addUserOption(o => o.setName("user").setDescription("user to add").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("remove a user from the current ticket")
      .addUserOption(o => o.setName("user").setDescription("user to remove").setRequired(true)))
    .addSubcommand(s => s.setName("rename").setDescription("rename the current ticket channel")
      .addStringOption(o => o.setName("name").setDescription("new name").setRequired(true)))
    .addSubcommand(s => s.setName("close").setDescription("close the current ticket"))
    .addSubcommand(s => s.setName("view").setDescription("view ticket config")),

  // ===== INTERACTION / ACTION COMMANDS =====
  new SlashCommandBuilder().setName("action")
    .setDescription("perform an action on someone")
    .addStringOption(o => o.setName("type").setDescription("action type").setRequired(true).addChoices(
      { name: "hug", value: "hug" },
      { name: "kiss", value: "kiss" },
      { name: "slap", value: "slap" },
      { name: "pat", value: "pat" },
      { name: "poke", value: "poke" },
      { name: "cuddle", value: "cuddle" },
      { name: "bite", value: "bite" },
      { name: "highfive", value: "highfive" },
      { name: "punch", value: "punch" },
      { name: "stare", value: "stare" },
      { name: "wave", value: "wave" },
      { name: "wink", value: "wink" },
      { name: "lick", value: "lick" },
      { name: "bonk", value: "bonk" },
      { name: "yeet", value: "yeet" },
      { name: "blush", value: "blush" },
      { name: "smile", value: "smile" },
      { name: "nom", value: "nom" },
      { name: "cry", value: "cry" },
      { name: "dance", value: "dance" }
    ))
    .addUserOption(o => o.setName("user").setDescription("target user")),
];


// ================= READY + REGISTER SLASH =================

async function registerGuildCommands(guild) {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guild.id),
      { body: slashCommands.map(c => c.toJSON()) }
    );
    console.log(`slash commands registered in ${guild.name}`);
  } catch (e) {
    console.error(`failed to register in ${guild.name}:`, e.message);
  }
}

function getTotalMembers() {
  let total = 0;
  for (const g of client.guilds.cache.values()) total += g.memberCount;
  return total;
}

const READY_AT = Date.now();

// Upload an image to your bot's Discord Developer Portal under
// "Rich Presence" -> "Art Assets" with the name "vanta_logo",
// then it will show automatically next to every status below.
const RP_ASSET_NAME = "vanta_logo";

const PRESENCES = [
  { type: 3, text: () => `over ${getTotalMembers().toLocaleString()} members` },          // Watching
  { type: 2, text: () => `${client.guilds.cache.size} server${client.guilds.cache.size === 1 ? "" : "s"}` }, // Listening
  { type: 0, text: () => `/help · vanta.gg` },                                              // Playing
  { type: 3, text: () => `the gates 👁️` },                                                // Watching
  { type: 5, text: () => `mod of the year` },                                               // Competing
  { type: 0, text: () => `with ${getTotalMembers().toLocaleString()} souls` }              // Playing
];

let presenceIndex = 0;
function rotatePresence() {
  const p = PRESENCES[presenceIndex % PRESENCES.length];
  presenceIndex++;
  const shard = client.ws.shards.first();
  if (!shard) return;
  shard.send({
    op: 3,
    d: {
      since: null,
      activities: [{
        name: p.text(),
        type: p.type,
        timestamps: { start: READY_AT },
        assets: {
          large_image: RP_ASSET_NAME,
          large_text: "vanta",
          small_image: RP_ASSET_NAME,
          small_text: "online"
        }
      }],
      status: "online",
      afk: false
    }
  });
}

client.once("ready", async () => {
  console.log(`vanta online as ${client.user.tag}`);

  rotatePresence();
  setInterval(rotatePresence, 30_000);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  // clear global commands so only the fresh per-guild ones show
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: [] }
    );
    console.log("cleared global slash commands");
  } catch (e) {
    console.error("failed clearing global commands:", e.message);
  }

  // register per-guild for instant updates
  for (const guild of client.guilds.cache.values()) {
    await registerGuildCommands(guild);
  }
});

client.on("guildCreate", guild => {
  registerGuildCommands(guild);
});


// ================= HELPERS =================

function findChannel(guild, name) {
  return guild.channels.cache.find(ch => ch.name === name);
}

function sendLog(guild, text) {
  const ch = findChannel(guild, LOG_CHANNEL);
  if (ch) ch.send(text).catch(() => {});
}

function addCase(guildId, type, userId, modId, reason) {
  if (!modCases.has(guildId)) modCases.set(guildId, []);
  const list = modCases.get(guildId);
  const id = list.length + 1;
  list.push({ id, type, userId, modId, reason, timestamp: Date.now() });
  return id;
}

const COLOR_NAMES = {
  red: "#ff4444",
  orange: "#ff8c00",
  yellow: "#ffd700",
  green: "#22c55e",
  blue: "#3b82f6",
  skyblue: "#87ceeb",
  sky: "#87ceeb",
  purple: "#a855f7",
  pink: "#ff69b4",
  white: "#ffffff",
  black: "#000000",
  gold: "#ffd700"
};

function parseColor(input) {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (COLOR_NAMES[trimmed]) return COLOR_NAMES[trimmed];
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  return null;
}

// resolves :emoji_name: into <:name:id> using any emoji from any server vanta is in
function resolveEmojis(text) {
  if (!text) return text;
  // already-formatted custom emojis stay as-is
  return text.replace(/(?<!<a?):([a-zA-Z0-9_]+):(?!\d+>)/g, (match, name) => {
    const emoji = client.emojis.cache.find(e => e.name === name);
    if (emoji) return emoji.toString();
    return match;
  });
}

// extracts a downloadable url + name from emoji input (custom syntax or url)
function getEmojiSource(input) {
  if (!input) return null;
  const m = input.match(/<(a?):([a-zA-Z0-9_]+):(\d+)>/);
  if (m) {
    const ext = m[1] === "a" ? "gif" : "png";
    return { url: `https://cdn.discordapp.com/emojis/${m[3]}.${ext}`, name: m[2] };
  }
  if (/^https?:\/\//i.test(input.trim())) return { url: input.trim(), name: null };
  return null;
}

// builds a 3-row ActionRow set for a tic-tac-toe board
function buildTttRows(gameId, board, finished) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      const cell = board[i];
      const btn = new ButtonBuilder()
        .setCustomId(`ttt:${gameId}:${i}`)
        .setDisabled(!!cell || finished);
      if (cell === "X") {
        btn.setEmoji("❌").setStyle(ButtonStyle.Danger);
      } else if (cell === "O") {
        btn.setEmoji("⭕").setStyle(ButtonStyle.Primary);
      } else {
        btn.setLabel("\u2003").setStyle(ButtonStyle.Secondary);
      }
      row.addComponents(btn);
    }
    rows.push(row);
  }
  return rows;
}

function drawTttBoard(board, winningCells) {
  const size = 300;
  const cell = size / 3;
  const pad = 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`;

  // highlight winning cells
  if (winningCells) {
    for (const i of winningCells) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const fill = board[i] === "X" ? "#ff555533" : "#5555ff33";
      svg += `<rect x="${col*cell+2}" y="${row*cell+2}" width="${cell-4}" height="${cell-4}" fill="${fill}" rx="8"/>`;
    }
  }

  // grid lines
  for (let i = 1; i < 3; i++) {
    svg += `<line x1="${i*cell}" y1="${pad}" x2="${i*cell}" y2="${size-pad}" stroke="#87ceeb" stroke-width="4" stroke-linecap="round"/>`;
    svg += `<line x1="${pad}" y1="${i*cell}" x2="${size-pad}" y2="${i*cell}" stroke="#87ceeb" stroke-width="4" stroke-linecap="round"/>`;
  }

  // pieces
  for (let i = 0; i < 9; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = col * cell + cell / 2;
    const cy = row * cell + cell / 2;
    const r = cell * 0.32;
    const winning = winningCells?.includes(i);

    if (board[i] === "X") {
      const color = winning ? "#ff0000" : "#ff5555";
      svg += `<line x1="${cx-r}" y1="${cy-r}" x2="${cx+r}" y2="${cy+r}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`;
      svg += `<line x1="${cx+r}" y1="${cy-r}" x2="${cx-r}" y2="${cy+r}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`;
    } else if (board[i] === "O") {
      const color = winning ? "#0000ff" : "#5599ff";
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="10"/>`;
    }
  }

  svg += `</svg>`;
  return Buffer.from(svg);
}

function buildTttEmbed(game, description, finished, winningCells) {
  return new EmbedBuilder()
    .setColor(finished ? "#ffaa00" : "#87ceeb")
    .setTitle("🎮 Tic-Tac-Toe")
    .setDescription(description)
    .setImage("attachment://ttt.png");
}

function xpForLevel(level) { return 100 * level * level; }
function levelFromXp(xp) { return Math.floor(Math.sqrt(xp / 100)); }

function getXp(guildId, userId) {
  if (!xpData.has(guildId)) xpData.set(guildId, new Map());
  const guildMap = xpData.get(guildId);
  if (!guildMap.has(userId)) guildMap.set(userId, { xp: 0 });
  return guildMap.get(userId);
}

function setXp(guildId, userId, xp) {
  if (!xpData.has(guildId)) xpData.set(guildId, new Map());
  xpData.get(guildId).set(userId, { xp });
}

async function checkLevelRoles(member, level) {
  for (const [lvlStr, roleName] of Object.entries(LEVEL_ROLES)) {
    const lvl = parseInt(lvlStr, 10);
    if (level >= lvl) {
      const role = member.guild.roles.cache.find(r => r.name === roleName);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
      }
    }
  }
}

const EIGHTBALL_REPLIES = [
  "yes.", "no.", "definitely.", "absolutely not.", "ask again later.",
  "the signs point to yes.", "very doubtful.", "without a doubt.",
  "my reply is no.", "outlook good.", "cannot predict now.", "most likely."
];

function getNotes(guildId, userId) {
  const key = `${guildId}-${userId}`;
  if (!userNotes.has(key)) userNotes.set(key, []);
  return userNotes.get(key);
}

function buildUserInfo(member, user) {
  const flags = member?.user?.flags?.toArray?.() || user.flags?.toArray?.() || [];
  const roles = member ? member.roles.cache.filter(r => r.id !== member.guild.id).map(r => `<@&${r.id}>`).slice(0, 20) : [];
  const embed = new EmbedBuilder()
    .setColor("#87ceeb")
    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .addFields(
      { name: "ID", value: user.id, inline: true },
      { name: "Account created", value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true }
    );
  if (member) embed.addFields(
    { name: "Joined server", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : "unknown", inline: true },
    { name: `Roles (${roles.length})`, value: roles.length ? roles.join(" ") : "none" }
  );
  if (flags.length) embed.addFields({ name: "Badges", value: flags.join(", ") });
  return embed;
}

function applyPlaceholders(text, member, extra = {}) {
  const guild = member.guild;
  return (text || "")
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{user.mention}", `<@${member.id}>`)
    .replaceAll("{user.name}", member.user.username)
    .replaceAll("{user.tag}", member.user.tag)
    .replaceAll("{user.id}", member.id)
    .replaceAll("{server}", guild.name)
    .replaceAll("{server.name}", guild.name)
    .replaceAll("{membercount}", String(guild.memberCount))
    .replaceAll("{boostcount}", String(extra.boostCount ?? guild.premiumSubscriptionCount ?? 0));
}

function getFilters(guildId) {
  if (!filters.has(guildId)) filters.set(guildId, new Set());
  return filters.get(guildId);
}
function getCC(guildId) {
  if (!customCommands.has(guildId)) customCommands.set(guildId, new Map());
  return customCommands.get(guildId);
}
function buildRolemenuRows(pairs) {
  const row = new ActionRowBuilder();
  for (const { roleId, label } of pairs) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`rolemenu:${roleId}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Secondary)
    );
  }
  return row;
}

function parseDuration(input) {
  if (!input) return null;
  const m = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return n * mult;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function pickWinners(entrants, count) {
  const arr = [...entrants];
  const winners = [];
  while (winners.length < count && arr.length) {
    const i = Math.floor(Math.random() * arr.length);
    winners.push(arr.splice(i, 1)[0]);
  }
  return winners;
}

function buildGiveawayEmbed(g, status) {
  const embed = new EmbedBuilder()
    .setColor(status === "ended" ? "#888888" : "#87ceeb")
    .setTitle(`🎉 ${g.prize}`)
    .setFooter({ text: `hosted by ${g.hostName} · ${g.entrants.size} entered` });

  if (status === "ended") {
    const winnerText = g.lastWinners && g.lastWinners.length
      ? g.lastWinners.map(id => `<@${id}>`).join(", ")
      : "no one entered 😢";
    embed.setDescription(`**Ended!**\n\nWinners: ${winnerText}\nWinners count: **${g.winnersCount}**`);
  } else {
    embed.setDescription(`Click **Join Giveaway** to enter!\n\nEnds <t:${Math.floor(g.endTime / 1000)}:R>\nWinners: **${g.winnersCount}**`);
  }
  return embed;
}

async function endGiveaway(gameId) {
  const g = giveaways.get(gameId);
  if (!g || g.ended) return;
  g.ended = true;
  const winners = pickWinners(g.entrants, g.winnersCount);
  g.lastWinners = winners;

  try {
    const ch = await client.channels.fetch(g.channelId);
    const msg = await ch.messages.fetch(g.messageId);
    const joinBtn = new ButtonBuilder()
      .setCustomId(`gw_join:${gameId}`)
      .setLabel(`Joined: ${g.entrants.size}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🎉")
      .setDisabled(true);
    await msg.edit({
      embeds: [buildGiveawayEmbed(g, "ended")],
      components: [new ActionRowBuilder().addComponents(joinBtn)]
    });
    if (winners.length) {
      await ch.send({
        content: `🎊 Congrats ${winners.map(id => `<@${id}>`).join(", ")} — you won **${g.prize}**!`,
        allowedMentions: { users: winners }
      });
    } else {
      await ch.send(`no one entered the **${g.prize}** giveaway 😢`);
    }
  } catch {}
}

function checkTttWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b2,c] of lines) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
  }
  if (b.every(x => x)) return "draw";
  return null;
}

// extracts a custom emoji from a string for button labels
// returns { label, emoji } where emoji is { id, name, animated } or null
function extractButtonEmoji(text) {
  if (!text) return { label: text, emoji: null };

  // match <:name:id> or <a:name:id>
  const customMatch = text.match(/<(a?):([a-zA-Z0-9_]+):(\d+)>/);
  if (customMatch) {
    return {
      label: text.replace(customMatch[0], "").trim() || "open link",
      emoji: { id: customMatch[3], name: customMatch[2], animated: customMatch[1] === "a" }
    };
  }

  // match :name: shorthand
  const shortMatch = text.match(/:([a-zA-Z0-9_]+):/);
  if (shortMatch) {
    const found = client.emojis.cache.find(e => e.name === shortMatch[1]);
    if (found) {
      return {
        label: text.replace(shortMatch[0], "").trim() || "open link",
        emoji: { id: found.id, name: found.name, animated: found.animated }
      };
    }
  }

  return { label: text, emoji: null };
}


// ================= WELCOME + AUTO ROLE =================

client.on("guildMemberAdd", async member => {
  // ===== anti-raid: 5+ joins in 10s => warn staff =====
  const arr = joinTracker.get(member.guild.id) || [];
  const now = Date.now();
  arr.push(now);
  while (arr.length && now - arr[0] > 10_000) arr.shift();
  joinTracker.set(member.guild.id, arr);
  if (arr.length >= 5) {
    sendLog(member.guild, `🚨 **anti-raid**: ${arr.length} joins in 10s. Latest: ${member.user.tag}`);
    // timeout very young accounts (< 7 days old) during raid
    const accountAge = now - member.user.createdTimestamp;
    if (accountAge < 7 * 86_400_000) {
      member.timeout(15 * 60_000, "anti-raid: young account during join surge").catch(() => {});
    }
  }

  // auto role
  const role = member.guild.roles.cache.find(r => r.name === AUTO_ROLE);
  if (role) member.roles.add(role).catch(() => {});

  const cfg = welcomeConfig.get(member.guild.id);
  const ch = cfg
    ? member.guild.channels.cache.get(cfg.channelId)
    : findChannel(member.guild, WELCOME_CHANNEL);
  if (!ch) {
    sendLog(member.guild, `join: ${member.user.tag}`);
    return;
  }

  const defaultMsg = `🌟 Welcome {user} to **{server}**!\nWe now have **{membercount}** members.\n\n📜 Read the rules · 💜 Boost for perks · 👥 Invite friends`;
  const text = applyPlaceholders(cfg?.message || defaultMsg, member);

  const embed = new EmbedBuilder()
    .setColor(WELCOME_COLOR)
    .setDescription(text)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `vanta welcome system` });

  ch.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
  sendLog(member.guild, `join: ${member.user.tag}`);
});

client.on("guildMemberRemove", member => {
  sendLog(member.guild, `leave: ${member.user.tag}`);
  const cfg = goodbyeConfig.get(member.guild.id);
  const ch = cfg
    ? member.guild.channels.cache.get(cfg.channelId)
    : findChannel(member.guild, "goodbye") || findChannel(member.guild, WELCOME_CHANNEL);
  if (!ch) return;
  const defaultMsg = `👋 **{user.tag}** has left the server.\n\nWe now have **{membercount}** members.`;
  const text = applyPlaceholders(cfg?.message || defaultMsg, member);
  const embed = new EmbedBuilder()
    .setColor("#888888")
    .setDescription(text)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "vanta goodbye system" });
  ch.send({ embeds: [embed] }).catch(() => {});
});

// ================= MESSAGE SNIPE =================

client.on("messageDelete", message => {
  if (!message.guild || message.author?.bot || !message.content) return;
  snipes.set(message.channel.id, {
    content: message.content,
    author: message.author.tag,
    authorId: message.author.id,
    avatar: message.author.displayAvatarURL({ dynamic: true }),
    time: Date.now()
  });
});

client.on("messageUpdate", (oldMsg, newMsg) => {
  if (!newMsg.guild || newMsg.author?.bot || !oldMsg.content || oldMsg.content === newMsg.content) return;
  editSnipes.set(newMsg.channel.id, {
    before: oldMsg.content,
    after: newMsg.content,
    author: newMsg.author.tag,
    authorId: newMsg.author.id,
    avatar: newMsg.author.displayAvatarURL({ dynamic: true }),
    time: Date.now()
  });
});

// ================= VOICEMASTER =================

client.on("voiceStateUpdate", async (oldState, newState) => {
  const guild = newState.guild;
  const cfg = voicemasterConfig.get(guild.id);

  // user joined the join-to-create channel
  if (cfg && newState.channelId === cfg.createChannelId && oldState.channelId !== cfg.createChannelId) {
    try {
      const ch = await guild.channels.create({
        name: `${newState.member.user.username}'s vc`,
        type: ChannelType.GuildVoice,
        parent: cfg.categoryId,
        permissionOverwrites: [
          {
            id: newState.member.id,
            allow: [
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.MoveMembers,
              PermissionsBitField.Flags.MuteMembers,
              PermissionsBitField.Flags.DeafenMembers
            ]
          }
        ]
      });
      voicemasterChannels.set(ch.id, newState.member.id);
      await newState.setChannel(ch).catch(() => {});
    } catch {}
  }

  // user left a temp vc that's now empty -> delete it
  if (oldState.channelId && voicemasterChannels.has(oldState.channelId)) {
    const ch = guild.channels.cache.get(oldState.channelId);
    if (ch && ch.members.size === 0) {
      voicemasterChannels.delete(ch.id);
      ch.delete("voicemaster: empty").catch(() => {});
    }
  }
});

// ================= ANTI-NUKE =================

async function handleNukeAction(guild, type) {
  try {
    const auditType = type === "channel" ? 12 : 32; // CHANNEL_DELETE / ROLE_DELETE
    const logs = await guild.fetchAuditLogs({ limit: 1, type: auditType });
    const entry = logs.entries.first();
    if (!entry || !entry.executor || entry.executor.bot) return;
    if (entry.executor.id === guild.ownerId) return;
    const exec = entry.executor;
    const key = `${guild.id}-${exec.id}`;
    const now = Date.now();
    const data = nukeTracker.get(key) || { count: 0, time: now };
    if (now - data.time > 60_000) { data.count = 0; data.time = now; }
    data.count++;
    nukeTracker.set(key, data);
    if (data.count >= 3) {
      const member = await guild.members.fetch(exec.id).catch(() => null);
      if (member) {
        const removable = member.roles.cache.filter(r => r.id !== guild.id && r.editable);
        await member.roles.remove(removable).catch(() => {});
        sendLog(guild, `🛡️ **anti-nuke**: stripped roles from ${exec.tag} for mass ${type} deletes.`);
        nukeTracker.delete(key);
      }
    }
  } catch {}
}

client.on("channelDelete", channel => {
  if (channel.guild) handleNukeAction(channel.guild, "channel");
});
client.on("roleDelete", role => {
  if (role.guild) handleNukeAction(role.guild, "role");
});

// ================= STARBOARD =================

async function handleStarReaction(reaction) {
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch { return; }

  const msg = reaction.message;
  if (!msg.guild || reaction.emoji.name !== "⭐") return;
  const cfg = starboardConfig.get(msg.guild.id);
  if (!cfg) return;
  if (msg.channel.id === cfg.channelId) return; // don't star starboard posts
  if (msg.author?.bot) return;

  const count = reaction.count;
  const sbChannel = msg.guild.channels.cache.get(cfg.channelId);
  if (!sbChannel) return;

  const existingId = starredMessages.get(msg.id);

  if (count >= cfg.threshold) {
    const embed = new EmbedBuilder()
      .setColor("#fcd34d")
      .setAuthor({ name: msg.author.tag, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
      .setDescription((msg.content || "*[no text]*").slice(0, 4000))
      .addFields({ name: "source", value: `[jump to message](${msg.url}) in <#${msg.channel.id}>` })
      .setFooter({ text: `⭐ ${count}` })
      .setTimestamp(msg.createdAt);
    const img = msg.attachments.find(a => a.contentType?.startsWith("image/"));
    if (img) embed.setImage(img.url);

    if (existingId) {
      const existing = await sbChannel.messages.fetch(existingId).catch(() => null);
      if (existing) return existing.edit({ content: `⭐ **${count}** | <#${msg.channel.id}>`, embeds: [embed] }).catch(() => {});
    }
    const sent = await sbChannel.send({ content: `⭐ **${count}** | <#${msg.channel.id}>`, embeds: [embed] }).catch(() => null);
    if (sent) starredMessages.set(msg.id, sent.id);
  } else if (existingId) {
    // dropped below threshold (e.g. removed) -> delete starboard post
    const existing = await sbChannel.messages.fetch(existingId).catch(() => null);
    if (existing) await existing.delete().catch(() => {});
    starredMessages.delete(msg.id);
  }
}

client.on("messageReactionAdd", reaction => handleStarReaction(reaction));
client.on("messageReactionRemove", reaction => handleStarReaction(reaction));

// ================= BOOST AUTO-EMBED =================

client.on("guildMemberUpdate", (oldMember, newMember) => {
  // detect new boost
  if (!oldMember.premiumSince && newMember.premiumSince) {
    const cfg = boostConfig.get(newMember.guild.id);
    const ch = cfg
      ? newMember.guild.channels.cache.get(cfg.channelId)
      : findChannel(newMember.guild, BOOST_CHANNEL) || findChannel(newMember.guild, WELCOME_CHANNEL);

    if (!ch) return;

    const boostCount = newMember.guild.premiumSubscriptionCount || 0;
    const defaultMsg = `💖 Thank you {user} for boosting **{server}**!\n\n✨ Pic Perms · ✨ Snipe Perms · ✨ VC Perms · ✨ Custom Role`;
    const text = applyPlaceholders(cfg?.message || defaultMsg, newMember, { boostCount });

    const embed = new EmbedBuilder()
      .setColor(BOOST_COLOR)
      .setTitle("💖 New Boost!")
      .setDescription(text)
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${newMember.guild.name} is now at ${boostCount} boosts!` });

    ch.send({ content: `${newMember}`, embeds: [embed] }).catch(() => {});
    sendLog(newMember.guild, `boost: ${newMember.user.tag} (total: ${boostCount})`);
  }
});


// ================= MESSAGE LOGS =================

client.on("messageDelete", msg => {
  if (!msg.guild || msg.author?.bot) return;
  sendLog(msg.guild, `delete: ${msg.author.tag} -> ${msg.content || "no text"}`);
});

client.on("messageUpdate", (oldMsg, newMsg) => {
  if (!oldMsg.guild || oldMsg.author?.bot) return;
  sendLog(oldMsg.guild, `edit: ${oldMsg.author.tag} -> ${oldMsg.content || "empty"} => ${newMsg.content || "empty"}`);
});


// ================= ANTI-LINK + BASIC ANTI-SPAM =================

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  // ===== AFK: remove your own afk on speak, ping mentioned afk users =====
  const ownAfk = afkUsers.get(`${message.guild.id}-${message.author.id}`);
  if (ownAfk) {
    afkUsers.delete(`${message.guild.id}-${message.author.id}`);
    message.channel.send(`welcome back ${message.author}, removed your AFK.`).catch(() => {});
  }
  if (message.mentions.users.size) {
    const replies = [];
    for (const u of message.mentions.users.values()) {
      const a = afkUsers.get(`${message.guild.id}-${u.id}`);
      if (a) replies.push(`💤 **${u.username}** is AFK: ${a.reason} (since <t:${Math.floor(a.since/1000)}:R>)`);
    }
    if (replies.length) message.channel.send(replies.join("\n")).catch(() => {});
  }

  // ===== word filter =====
  const fset = getFilters(message.guild.id);
  if (fset.size) {
    const lower = message.content.toLowerCase();
    if ([...fset].some(w => lower.includes(w))) {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        await message.delete().catch(() => {});
        return message.channel.send(`${message.author} that word isn't allowed.`).then(m => setTimeout(() => m.delete().catch(()=>{}), 4000));
      }
    }
  }

  // anti-link (allow staff)
  if (message.content.includes("http")) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await message.delete().catch(() => {});
      return message.channel.send(`${message.author} links are not allowed.`);
    }
  }

  // basic anti-spam (6 msgs / 5s => 60s timeout)
  const key = `${message.guild.id}-${message.author.id}`;
  const now = Date.now();
  const data = spamMap.get(key) || { count: 0, time: now };

  if (now - data.time < 5000) {
    data.count++;
  } else {
    data.count = 1;
    data.time = now;
  }

  spamMap.set(key, data);

  if (data.count >= 6) {
    await message.member.timeout(60_000, "anti-spam").catch(() => {});
    message.channel.send(`${message.author} slow down.`);
    sendLog(message.guild, `spam-timeout: ${message.author.tag}`);
    spamMap.delete(key);
  }

  // ===== XP / leveling =====
  const cdKey = `${message.guild.id}-${message.author.id}`;
  const lastXp = xpCooldown.get(cdKey) || 0;
  if (now - lastXp >= 60_000) {
    xpCooldown.set(cdKey, now);
    const entry = getXp(message.guild.id, message.author.id);
    const oldLevel = levelFromXp(entry.xp);
    entry.xp += Math.floor(Math.random() * 11) + 15; // 15-25 xp
    const newLevel = levelFromXp(entry.xp);
    if (newLevel > oldLevel) {
      const lvlEmbed = new EmbedBuilder()
        .setColor("#87ceeb")
        .setDescription(`🎉 ${message.author}, you leveled up to **level ${newLevel}**!`);
      message.channel.send({ embeds: [lvlEmbed] }).catch(() => {});
      checkLevelRoles(message.member, newLevel);
    }
  }
});


// ================= SLASH COMMAND HANDLER =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction.commandName;
  const guild = interaction.guild;
  const member = interaction.member;

  if (cmd === "ping") {
    return interaction.reply({ embeds: [ok(`pong`)] });
  }

  if (cmd === "help") {
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("vanta commands")
      .setDescription(`
/ping
/say
/embed
/giveaway
/purge
/kick
/ban
/timeout
/untimeout
/warn
/warnings
/clearwarns
/lock
/unlock
/slowmode
/server
/user
/avatar
/announce
/poll
/welcomepreview
/boostpreview
/supportpanel
/steal · /stealsticker
/tictactoe · /truth · /dare · /tod
/confession · /event
/gstart · /greroll
/rank · /leaderboard · /setlevel
/afk · /snipe · /editsnipe
/rolemenu · /voicemaster
/filter · /cc · /starboard
/welcome · /goodbye · /boost
/userinfo · /serverinfo · /avatar · /banner · /roleinfo · /membercount
/lock · /unlock · /slowmode
/nick · /role
/poll · /remind · /suggest · /note
/8ball · /coinflip · /dice · /choose · /rps
      `)
      .setFooter({ text: "vanta" });

    return interaction.reply({ embeds: [embed] });
  }

  if (cmd === "say") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }

    const text = interaction.options.getString("text");
    await interaction.reply({ embeds: [ok(`sent.`)], ephemeral: true });
    return interaction.channel.send(text);
  }

  if (cmd === "embed") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return interaction.reply({ embeds: [fail("you need manage messages.")], ephemeral: true });

    let code = interaction.options.getString("code");
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    // strip {embed}$v prefix (Bleed compat)
    code = code.replace(/^\{embed\}\$v/i, "").trim();

    // resolve variables
    const vars = {
      "{user}": member.displayName,
      "{user.mention}": `<@${user.id}>`,
      "{user.tag}": user.tag,
      "{user.id}": user.id,
      "{user.avatar}": user.displayAvatarURL(),
      "{guild.name}": guild.name,
      "{guild.id}": guild.id,
      "{guild.membercount}": String(guild.memberCount),
      "{guild.icon}": guild.iconURL() || "",
    };
    for (const [k, v] of Object.entries(vars)) {
      code = code.replaceAll(k, v);
    }

    // split parameters by $v
    const parts = code.split("$v").map(p => p.trim());

    const embed = new EmbedBuilder().setColor("#87ceeb");
    const buttons = [];
    let plainContent = null;

    for (const part of parts) {
      // must start with { and end with }
      const match = part.match(/^\{(\w+):([\s\S]*)\}$/) || part.match(/^\{(\w+)\}$/);
      if (!match) {
        // plain text content
        if (part && !part.startsWith("{")) plainContent = part;
        continue;
      }
      const key = match[1].toLowerCase();
      const val = (match[2] || "").trim();
      const args = val.split("&&").map(a => a.trim());

      switch (key) {
        case "title":       embed.setTitle(val.slice(0, 256)); break;
        case "description": embed.setDescription(val.slice(0, 4096)); break;
        case "color":       try { embed.setColor(val); } catch {} break;
        case "url":         embed.setURL(val); break;
        case "image":       embed.setImage(val); break;
        case "thumbnail":   embed.setThumbnail(val); break;
        case "timestamp":   embed.setTimestamp(); break;
        case "author": {
          const [name = "", icon = "", url = ""] = args;
          const ao = { name: name.slice(0, 256) };
          if (icon && icon.startsWith("http")) ao.iconURL = icon;
          if (url && url.startsWith("http")) ao.url = url;
          embed.setAuthor(ao);
          break;
        }
        case "footer": {
          const [text = "", icon = ""] = args;
          const fo = { text: text.slice(0, 2048) };
          if (icon && icon.startsWith("http")) fo.iconURL = icon;
          embed.setFooter(fo);
          break;
        }
        case "field": {
          const isInline = args[args.length - 1]?.toLowerCase() === "inline";
          const fieldArgs = isInline ? args.slice(0, -1) : args;
          const [name = "\u200b", value = "\u200b"] = fieldArgs;
          embed.addFields({ name: name.slice(0, 256), value: value.slice(0, 1024), inline: isInline });
          break;
        }
        case "button": {
          const [type = "Blurple", label = "button", urlOrEmoji = ""] = args;
          const styleMap = { link: ButtonStyle.Link, blurple: ButtonStyle.Primary, green: ButtonStyle.Success, grey: ButtonStyle.Secondary, gray: ButtonStyle.Secondary, red: ButtonStyle.Danger };
          const style = styleMap[type.toLowerCase()] ?? ButtonStyle.Primary;
          const btn = new ButtonBuilder().setLabel(label.slice(0, 80));
          if (style === ButtonStyle.Link) {
            if (urlOrEmoji.startsWith("http")) btn.setURL(urlOrEmoji);
            else btn.setURL("https://discord.com");
          } else {
            btn.setStyle(style).setCustomId(`embed_btn_${buttons.length}_${Date.now()}`);
          }
          btn.setStyle(style);
          if (urlOrEmoji && !urlOrEmoji.startsWith("http") && style !== ButtonStyle.Link) {
            try { btn.setEmoji(urlOrEmoji); } catch {}
          }
          buttons.push(btn);
          break;
        }
        case "message": plainContent = val; break;
      }
    }

    // build payload
    const payload = { embeds: [embed] };
    if (plainContent) payload.content = plainContent;
    if (buttons.length) {
      const rows = [];
      for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
      }
      payload.components = rows.slice(0, 5);
    }

    try {
      await channel.send(payload);
      return interaction.reply({ embeds: [ok(`embed sent to ${channel}.`)], ephemeral: true });
    } catch (e) {
      return interaction.reply({ embeds: [fail(`failed to send embed: ${e.message}`)], ephemeral: true });
    }
  }

  if (cmd === "giveaway") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }

    const time = interaction.options.getInteger("time");
    const winnersCount = interaction.options.getInteger("winners");
    const prize = interaction.options.getString("prize");

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("giveaway")
      .setDescription(`
react with 🎉 to enter

prize: **${prize}**
winners: **${winnersCount}**
ends in: **${time}s**
      `)
      .setFooter({ text: "vanta giveaways" });

    const msg = await interaction.channel.send({ embeds: [embed] });
    await msg.react("🎉");

    await interaction.reply({ embeds: [ok(`giveaway started.`)], ephemeral: true });

    setTimeout(async () => {
      const reaction = msg.reactions.cache.get("🎉");
      if (!reaction) return interaction.channel.send("no entries.");

      const users = await reaction.users.fetch();
      const valid = users.filter(u => !u.bot).map(u => u);

      if (valid.length === 0) {
        return interaction.channel.send("no valid entries.");
      }

      const winners = [];
      while (winners.length < winnersCount && valid.length > 0) {
        const pick = valid.splice(Math.floor(Math.random() * valid.length), 1)[0];
        winners.push(pick);
      }

      return interaction.channel.send(`🎉 congrats ${winners.map(w => `<@${w.id}>`).join(", ")} — you won **${prize}**`);
    }, time * 1000);
  }

  if (cmd === "purge") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }

    const amount = interaction.options.getInteger("amount");
    if (amount < 1 || amount > 100) {
      return interaction.reply({ embeds: [fail(`use 1-100.`)], ephemeral: true });
    }

    await interaction.channel.bulkDelete(amount, true);
    return interaction.reply({ content: `deleted ${amount} messages.`, ephemeral: true });
  }

  if (cmd === "kick") {
    if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({ embeds: [fail(`you need kick members.`)], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const target = await guild.members.fetch(user.id).catch(() => null);
    const reason = interaction.options.getString("reason") || "no reason given";

    if (!target || !target.kickable) {
      return interaction.reply({ embeds: [fail(`i cannot kick that user.`)], ephemeral: true });
    }

    await target.kick(reason);
    const caseId = addCase(guild.id, "kick", user.id, interaction.user.id, reason);
    sendLog(guild, `${interaction.user.tag} kicked ${user.tag}: ${reason}`);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`${E.approve} : kicked **${user.tag}** | case #${caseId}`).addFields({ name: "reason", value: reason })] });
  }

  if (cmd === "ban") {
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ embeds: [fail(`you need ban members.`)], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const target = await guild.members.fetch(user.id).catch(() => null);
    const reason = interaction.options.getString("reason") || "no reason given";

    if (!target || !target.bannable) {
      return interaction.reply({ embeds: [fail(`i cannot ban that user.`)], ephemeral: true });
    }

    await target.ban({ reason });
    const caseId = addCase(guild.id, "ban", user.id, interaction.user.id, reason);
    sendLog(guild, `${interaction.user.tag} banned ${user.tag}: ${reason}`);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff5555").setDescription(`${E.approve} : banned **${user.tag}** | case #${caseId}`).addFields({ name: "reason", value: reason })] });
  }

  if (cmd === "timeout") {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ embeds: [fail(`you need moderate members.`)], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const target = await guild.members.fetch(user.id).catch(() => null);
    const seconds = interaction.options.getInteger("seconds");
    const reason = interaction.options.getString("reason") || "no reason given";

    if (!target || !target.moderatable) {
      return interaction.reply({ embeds: [fail(`i cannot timeout that user.`)], ephemeral: true });
    }

    await target.timeout(seconds * 1000, reason);
    const caseId = addCase(guild.id, "timeout", user.id, interaction.user.id, reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`${E.approve} : timed out **${user.tag}** for ${seconds}s | case #${caseId}`).addFields({ name: "reason", value: reason })] });
  }

  if (cmd === "untimeout") {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ embeds: [fail(`you need moderate members.`)], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const target = await guild.members.fetch(user.id).catch(() => null);

    if (!target || !target.moderatable) {
      return interaction.reply({ embeds: [fail(`i cannot remove timeout.`)], ephemeral: true });
    }

    await target.timeout(null);
    return interaction.reply(`removed timeout from ${user.tag}`);
  }

  if (cmd === "warn") {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ embeds: [fail(`you need moderate members.`)], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    const key = `${guild.id}-${user.id}`;
    const list = warnings.get(key) || [];
    list.push({ reason, moderator: interaction.user.tag, date: new Date().toLocaleString() });
    warnings.set(key, list);
    const caseId = addCase(guild.id, "warn", user.id, interaction.user.id, reason);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`${E.warning} : warned **${user.tag}** | case #${caseId}`).addFields({ name: "reason", value: reason })] });
  }

  if (cmd === "warnings") {
    const user = interaction.options.getUser("user");
    const key = `${guild.id}-${user.id}`;
    const list = warnings.get(key) || [];

    if (list.length === 0) return interaction.reply(`${user.tag} has no warnings.`);

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(`warnings for ${user.tag}`)
      .setDescription(list.map((w, i) => `**${i + 1}.** ${w.reason} — ${w.moderator}`).join("\n"));

    return interaction.reply({ embeds: [embed] });
  }

  if (cmd === "clearwarns") {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ embeds: [fail(`you need moderate members.`)], ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    warnings.delete(`${guild.id}-${user.id}`);
    return interaction.reply(`cleared warnings for ${user.tag}`);
  }

  if (cmd === "lock") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    }

    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false
    });

    return interaction.reply({ embeds: [ok(`channel locked.`)] });
  }

  if (cmd === "unlock") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    }

    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: true
    });

    return interaction.reply({ embeds: [ok(`channel unlocked.`)] });
  }

  if (cmd === "slowmode") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    }

    const seconds = interaction.options.getInteger("seconds");
    await interaction.channel.setRateLimitPerUser(seconds);
    return interaction.reply(`slowmode set to ${seconds}s`);
  }

  if (cmd === "server") {
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("server info")
      .addFields(
        { name: "name", value: guild.name, inline: true },
        { name: "members", value: `${guild.memberCount}`, inline: true },
        { name: "id", value: guild.id }
      )
      .setThumbnail(guild.iconURL({ dynamic: true }));

    return interaction.reply({ embeds: [embed] });
  }

  if (cmd === "user") {
    const user = interaction.options.getUser("user") || interaction.user;

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("user info")
      .addFields(
        { name: "username", value: user.tag },
        { name: "id", value: user.id }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    return interaction.reply({ embeds: [embed] });
  }

  if (cmd === "avatar") {
    const user = interaction.options.getUser("user") || interaction.user;
    return interaction.reply(user.displayAvatarURL({ dynamic: true, size: 1024 }));
  }

  if (cmd === "announce") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }

    const channel = interaction.options.getChannel("channel");
    const text = interaction.options.getString("message");

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("announcement")
      .setDescription(text)
      .setFooter({ text: "vanta" });

    await channel.send({ embeds: [embed] });
    return interaction.reply({ embeds: [ok(`announcement sent.`)], ephemeral: true });
  }

  if (cmd === "poll") {
    const question = interaction.options.getString("question");

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("poll")
      .setDescription(question);

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react("✅");
    await msg.react("❌");
  }

  if (cmd === "welcomepreview") {
    const embed = new EmbedBuilder()
      .setColor(WELCOME_COLOR)
      .setDescription(`
🌟 We now have **${guild.memberCount} members**!

📜 Please read our **rules**
💜 Boost for **perks**
👥 Invite your **friends**
      `)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "vanta welcome system" });

    return interaction.reply({ content: `Welcome, ${interaction.user} 💫`, embeds: [embed] });
  }

  if (cmd === "boostpreview") {
    const boostCount = guild.premiumSubscriptionCount || 0;
    const embed = new EmbedBuilder()
      .setColor(BOOST_COLOR)
      .setTitle("💖 Thank you for boosting!")
      .setDescription(`
✨ Pic Perms
✨ Snipe Perms
✨ VC Perms
✨ Custom Role
      `)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${guild.name} is now at ${boostCount} boosts!` });

    return interaction.reply({ content: `${interaction.user}`, embeds: [embed] });
  }

  if (cmd === "supportpanel") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("Help & Support")
      .setDescription("Click below to create a new support ticket 🎫")
      .setFooter({ text: "powered by vanta" });

    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("Create Ticket")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🎫");

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ embeds: [ok(`support panel sent.`)], ephemeral: true });
  }

  if (cmd === "steal") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions)) {
      return interaction.reply({ embeds: [fail(`you need manage emojis & stickers.`)], ephemeral: true });
    }
    const raw = interaction.options.getString("emoji");
    const customName = interaction.options.getString("name");
    const src = getEmojiSource(raw);
    if (!src) return interaction.reply({ embeds: [fail("give a custom emoji like `<:name:id>` or an image url.")], ephemeral: true });
    const finalName = (customName || src.name || "stolen").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
    try {
      const created = await guild.emojis.create({ attachment: src.url, name: finalName });
      return interaction.reply(`stole ${created} as \`:${created.name}:\``);
    } catch (e) {
      return interaction.reply({ content: `couldn't steal that: ${e.message}`, ephemeral: true });
    }
  }

  if (cmd === "stealsticker") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions)) {
      return interaction.reply({ embeds: [fail(`you need manage emojis & stickers.`)], ephemeral: true });
    }
    const msgId = interaction.options.getString("message_id");
    const customName = interaction.options.getString("name");
    let target;
    try { target = await interaction.channel.messages.fetch(msgId); } catch { return interaction.reply({ embeds: [fail(`couldn't find that message in this channel.`)], ephemeral: true }); }
    const sticker = target.stickers.first();
    if (!sticker) return interaction.reply({ embeds: [fail(`that message has no sticker.`)], ephemeral: true });
    const finalName = (customName || sticker.name || "stolen").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);
    try {
      const created = await guild.stickers.create({ file: sticker.url, name: finalName, tags: "stolen", description: "stolen by vanta" });
      return interaction.reply(`stole sticker \`${created.name}\` ✅`);
    } catch (e) {
      return interaction.reply({ content: `couldn't steal that sticker: ${e.message}`, ephemeral: true });
    }
  }

  if (cmd === "tod") {
    const sub = interaction.options.getSubcommand();
    if (sub === "truth") {
      const t = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("💭 Truth").setDescription(t).setFooter({ text: `for ${interaction.user.username}` })] });
    }
    if (sub === "dare") {
      const d = DARES[Math.floor(Math.random() * DARES.length)];
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff69b4").setTitle("🔥 Dare").setDescription(d).setFooter({ text: `for ${interaction.user.username}` })] });
    }
    if (sub === "random") {
      const isTruth = Math.random() < 0.5;
      const pool = isTruth ? TRUTHS : DARES;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(isTruth ? "#87ceeb" : "#ff69b4").setTitle(isTruth ? "💭 Truth" : "🔥 Dare").setDescription(pick).setFooter({ text: `for ${interaction.user.username}` })] });
    }
  }

  if (cmd === "confession") {
    const text = resolveEmojis(interaction.options.getString("message"));
    const ch = findChannel(guild, "confessions") || interaction.channel;
    const embed = new EmbedBuilder()
      .setColor("#a855f7")
      .setTitle("🤫 Anonymous Confession")
      .setDescription(text)
      .setFooter({ text: "sent anonymously via vanta" })
      .setTimestamp();
    await ch.send({ embeds: [embed] });
    return interaction.reply({ embeds: [fail(`your confession was sent anonymously.`)], ephemeral: true });
  }

  if (cmd === "event") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }
    const title = resolveEmojis(interaction.options.getString("title"));
    const desc = resolveEmojis(interaction.options.getString("description"));
    const when = interaction.options.getString("when");
    const where = interaction.options.getString("where");
    const colorRaw = interaction.options.getString("color");
    const image = interaction.options.getString("image");
    const color = parseColor(colorRaw) || "#87ceeb";

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`📅 ${title}`)
      .setDescription(desc)
      .setFooter({ text: `hosted by ${interaction.user.username}` })
      .setTimestamp();
    if (when) embed.addFields({ name: "🕒 When", value: when, inline: true });
    if (where) embed.addFields({ name: "📍 Where", value: where, inline: true });
    if (image) embed.setImage(image);

    return interaction.reply({ content: "@everyone", embeds: [embed], allowedMentions: { parse: ["everyone"] } });
  }

  if (cmd === "afk") {
    const reason = interaction.options.getString("reason") || "AFK";
    afkUsers.set(`${guild.id}-${interaction.user.id}`, { reason, since: Date.now() });
    return interaction.reply(`💤 ${interaction.user}, set you as AFK: ${reason}`);
  }

  if (cmd === "snipe") {
    const sub = interaction.options.getSubcommand();
    if (sub === "get") {
      const s = snipes.get(interaction.channel.id);
      if (!s) return interaction.reply({ embeds: [fail(`nothing to snipe.`)], ephemeral: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setAuthor({ name: s.author, iconURL: s.avatar }).setDescription(s.content).setFooter({ text: "deleted message" }).setTimestamp(s.time)] });
    }
    if (sub === "edit") {
      const s = editSnipes.get(interaction.channel.id);
      if (!s) return interaction.reply({ embeds: [fail(`nothing to edit-snipe.`)], ephemeral: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setAuthor({ name: s.author, iconURL: s.avatar }).addFields({ name: "before", value: s.before }, { name: "after", value: s.after }).setFooter({ text: "edited message" }).setTimestamp(s.time)] });
    }
  }

  if (cmd === "rolemenu") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ embeds: [fail(`you need manage roles.`)], ephemeral: true });
    }
    const title = interaction.options.getString("title");
    const desc = interaction.options.getString("description");
    const rolesRaw = interaction.options.getString("roles");
    const pairs = [];
    for (const part of rolesRaw.split("|").map(p => p.trim()).filter(Boolean)) {
      const m = part.match(/<@&(\d+)>\s*:\s*(.+)/);
      if (!m) continue;
      pairs.push({ roleId: m[1], label: m[2].slice(0, 80) });
      if (pairs.length === 5) break;
    }
    if (!pairs.length) return interaction.reply({ embeds: [fail(`format: @role:Label | @role2:Label2 (mention real roles)`)], ephemeral: true });
    const embed = new EmbedBuilder().setColor("#87ceeb").setTitle(title).setDescription(desc).setFooter({ text: "click a button to toggle the role" });
    return interaction.reply({ embeds: [embed], components: [buildRolemenuRows(pairs)] });
  }

  if (cmd === "voicemaster") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    }
    const category = interaction.options.getChannel("category");
    try {
      const createCh = await guild.channels.create({
        name: "➕ Create VC",
        type: ChannelType.GuildVoice,
        parent: category.id
      });
      voicemasterConfig.set(guild.id, { createChannelId: createCh.id, categoryId: category.id });
      return interaction.reply(`voicemaster ready! Join **${createCh.name}** to spawn your own private VC.`);
    } catch (e) {
      return interaction.reply({ content: `couldn't set up: ${e.message}`, ephemeral: true });
    }
  }

  if (cmd === "filter") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const fset = getFilters(guild.id);
    if (sub === "add") {
      const w = interaction.options.getString("word").toLowerCase();
      fset.add(w);
      return interaction.reply(`added \`${w}\` to filter (${fset.size} total).`);
    }
    if (sub === "remove") {
      const w = interaction.options.getString("word").toLowerCase();
      fset.delete(w);
      return interaction.reply(`removed \`${w}\` from filter.`);
    }
    if (sub === "list") {
      if (!fset.size) return interaction.reply({ embeds: [ok(`no filtered words.`)] });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("filtered words").setDescription([...fset].map(w => `\`${w}\``).join(", "))] });
    }
  }

  if (cmd === "cc") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const cc = getCC(guild.id);
    if (sub === "add") {
      const name = interaction.options.getString("name").toLowerCase().replace(/\s/g, "");
      const response = interaction.options.getString("response");
      cc.set(name, response);
      return interaction.reply(`added \`!${name}\` → ${response.slice(0, 200)}`);
    }
    if (sub === "remove") {
      const name = interaction.options.getString("name").toLowerCase();
      cc.delete(name);
      return interaction.reply(`removed \`!${name}\`.`);
    }
    if (sub === "list") {
      if (!cc.size) return interaction.reply({ embeds: [ok(`no custom commands yet.`)] });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("custom commands").setDescription([...cc.keys()].map(k => `\`!${k}\``).join(", "))] });
    }
  }

  // ===== INFO =====
  if (cmd === "userinfo") {
    const target = interaction.options.getUser("user") || interaction.user;
    const m = await guild.members.fetch(target.id).catch(() => null);
    return interaction.reply({ embeds: [buildUserInfo(m, target)] });
  }
  if (cmd === "serverinfo") {
    const owner = await guild.fetchOwner().catch(() => null);
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "ID", value: guild.id, inline: true },
        { name: "Owner", value: owner ? `${owner.user.tag}` : "unknown", inline: true },
        { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp/1000)}:R>`, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Boosts", value: `${guild.premiumSubscriptionCount || 0} (tier ${guild.premiumTier})`, inline: true },
        { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        { name: "Emojis", value: `${guild.emojis.cache.size}`, inline: true }
      );
    return interaction.reply({ embeds: [embed] });
  }
  if (cmd === "avatar") {
    const target = interaction.options.getUser("user") || interaction.user;
    const url = target.displayAvatarURL({ dynamic: true, size: 1024 });
    const embed = new EmbedBuilder().setColor("#87ceeb").setTitle(`${target.tag}'s avatar`).setURL(url).setImage(url);
    return interaction.reply({ embeds: [embed] });
  }
  if (cmd === "banner") {
    const target = interaction.options.getUser("user") || interaction.user;
    const u = await target.fetch();
    const url = u.bannerURL({ dynamic: true, size: 1024 });
    if (!url) return interaction.reply({ content: `${u.tag} has no banner.`, ephemeral: true });
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`${u.tag}'s banner`).setImage(url)] });
  }
  if (cmd === "roleinfo") {
    const r = interaction.options.getRole("role");
    const embed = new EmbedBuilder()
      .setColor(r.color || "#87ceeb")
      .setTitle(r.name)
      .addFields(
        { name: "ID", value: r.id, inline: true },
        { name: "Color", value: r.hexColor, inline: true },
        { name: "Position", value: `${r.position}`, inline: true },
        { name: "Members", value: `${r.members.size}`, inline: true },
        { name: "Hoisted", value: `${r.hoist}`, inline: true },
        { name: "Mentionable", value: `${r.mentionable}`, inline: true },
        { name: "Created", value: `<t:${Math.floor(r.createdTimestamp/1000)}:R>` }
      );
    return interaction.reply({ embeds: [embed] });
  }
  if (cmd === "membercount") {
    await guild.members.fetch().catch(() => {});
    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`${guild.name} member count`)
      .addFields({ name: "Total", value: `${total}`, inline: true }, { name: "Humans", value: `${humans}`, inline: true }, { name: "Bots", value: `${bots}`, inline: true })] });
  }

  // ===== CHANNEL CONTROL =====
  if (cmd === "lock") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
    return interaction.reply({ embeds: [ok(`🔒 channel locked.`)] });
  }
  if (cmd === "unlock") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => {});
    return interaction.reply({ embeds: [ok(`🔓 channel unlocked.`)] });
  }
  if (cmd === "slowmode") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    const sec = interaction.options.getInteger("seconds");
    await interaction.channel.setRateLimitPerUser(sec).catch(() => {});
    return interaction.reply(sec === 0 ? "slowmode disabled." : `slowmode set to **${sec}s**.`);
  }

  // ===== MEMBER MOD =====
  if (cmd === "nick") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) return interaction.reply({ embeds: [fail(`you need manage nicknames.`)], ephemeral: true });
    const u = interaction.options.getUser("user");
    const nick = interaction.options.getString("nickname") || null;
    const m = await guild.members.fetch(u.id).catch(() => null);
    if (!m) return interaction.reply({ embeds: [fail(`user not in server.`)], ephemeral: true });
    await m.setNickname(nick).catch(e => null);
    return interaction.reply(nick ? `set ${u}'s nickname to **${nick}**.` : `reset ${u}'s nickname.`);
  }
  if (cmd === "role") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({ embeds: [fail(`you need manage roles.`)], ephemeral: true });
    const u = interaction.options.getUser("user");
    const r = interaction.options.getRole("role");
    const m = await guild.members.fetch(u.id).catch(() => null);
    if (!m) return interaction.reply({ embeds: [fail(`user not in server.`)], ephemeral: true });
    if (m.roles.cache.has(r.id)) {
      await m.roles.remove(r).catch(() => {});
      return interaction.reply(`removed ${r} from ${u}.`);
    } else {
      await m.roles.add(r).catch(() => {});
      return interaction.reply(`gave ${r} to ${u}.`);
    }
  }

  // ===== UTILITY =====
  if (cmd === "poll") {
    const q = interaction.options.getString("question");
    const opts = interaction.options.getString("options").split("|").map(s => s.trim()).filter(Boolean).slice(0, 10);
    if (opts.length < 2) return interaction.reply({ embeds: [fail("need at least 2 options separated by `|`.")], ephemeral: true });
    const nums = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    const desc = opts.map((o, i) => `${nums[i]} ${o}`).join("\n");
    const embed = new EmbedBuilder().setColor("#87ceeb").setTitle(`📊 ${q}`).setDescription(desc).setFooter({ text: `poll by ${interaction.user.tag}` });
    await interaction.reply({ embeds: [embed] });
    const sent = await interaction.fetchReply();
    for (let i = 0; i < opts.length; i++) await sent.react(nums[i]).catch(() => {});
    return;
  }
  if (cmd === "remind") {
    const ms = parseDuration(interaction.options.getString("duration"));
    if (!ms || ms < 5000) return interaction.reply({ embeds: [fail("duration must be like `30s`, `10m`, `2h`, `1d` (min 5s).")], ephemeral: true });
    const text = interaction.options.getString("text");
    await interaction.reply(`⏰ ok, I'll DM you in ${interaction.options.getString("duration")}.`);
    setTimeout(() => {
      interaction.user.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("⏰ reminder").setDescription(text)] }).catch(() => {});
    }, ms);
    return;
  }
  if (cmd === "suggest") {
    const text = interaction.options.getString("text");
    const ch = findChannel(guild, "suggestions") || interaction.channel;
    const embed = new EmbedBuilder().setColor("#87ceeb").setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }).setDescription(text).setFooter({ text: "vote with 👍 / 👎" });
    const sent = await ch.send({ embeds: [embed] });
    await sent.react("👍").catch(() => {});
    await sent.react("👎").catch(() => {});
    return interaction.reply({ content: `suggestion sent in ${ch}.`, ephemeral: true });
  }

  // ===== FUN =====
  if (cmd === "game") {
    const sub = interaction.options.getSubcommand();
    if (sub === "eightball") {
      const q = interaction.options.getString("question");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🎱 magic 8-ball").addFields({ name: "question", value: q }, { name: "answer", value: EIGHTBALL_REPLIES[Math.floor(Math.random() * EIGHTBALL_REPLIES.length)] })] });
    }
    if (sub === "coinflip") return interaction.reply(`🪙 ${Math.random() < 0.5 ? "heads!" : "tails!"}`);
    if (sub === "dice") {
      const sides = interaction.options.getInteger("sides") || 6;
      return interaction.reply(`🎲 rolled a **${Math.floor(Math.random() * sides) + 1}** (d${sides})`);
    }
    if (sub === "choose") {
      const opts = interaction.options.getString("options").split(",").map(s => s.trim()).filter(Boolean);
      if (opts.length < 2) return interaction.reply({ embeds: [fail(`give at least 2 options separated by commas.`)], ephemeral: true });
      return interaction.reply(`🤔 I pick: **${opts[Math.floor(Math.random() * opts.length)]}**`);
    }
    if (sub === "rps") {
      const choice = interaction.options.getString("choice");
      const picks = ["rock", "paper", "scissors"];
      const botPick = picks[Math.floor(Math.random() * 3)];
      let result = "tie!";
      if ((choice === "rock" && botPick === "scissors") || (choice === "paper" && botPick === "rock") || (choice === "scissors" && botPick === "paper")) result = "you win! 🎉";
      else if (choice !== botPick) result = "you lose 😈";
      return interaction.reply(`you: **${choice}** · vanta: **${botPick}** · ${result}`);
    }
    if (sub === "tictactoe") {
      const opponent = interaction.options.getUser("opponent");
      if (opponent.bot || opponent.id === interaction.user.id) return interaction.reply({ embeds: [fail(`pick a real opponent that isn't yourself.`)], ephemeral: true });
      const gameId = Date.now().toString(36);
      const board = Array(9).fill(null);
      tttGames.set(gameId, { board, players: [interaction.user.id, opponent.id], turn: 0, marks: ["X", "O"] });
      const game = tttGames.get(gameId);
      const desc = `<@${interaction.user.id}> ❌ vs <@${opponent.id}> ⭕\n\n❌ **<@${interaction.user.id}>**, your move.`;
      const img = drawTttBoard(board, null);
      return interaction.reply({ embeds: [buildTttEmbed(game, desc, false, null)], files: [{ attachment: img, name: "ttt.png" }], components: buildTttRows(gameId, board, false) });
    }
  }

  // ===== MOD NOTES =====
  if (cmd === "note") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const u = interaction.options.getUser("user");
    const notes = getNotes(guild.id, u.id);
    if (sub === "add") {
      const text = interaction.options.getString("text");
      notes.push({ text, by: interaction.user.tag, at: Date.now() });
      return interaction.reply(`📝 added note on ${u} (${notes.length} total).`);
    }
    if (sub === "list") {
      if (!notes.length) return interaction.reply(`no notes on ${u}.`);
      const desc = notes.map((n, i) => `**${i + 1}.** ${n.text}\n— *${n.by} <t:${Math.floor(n.at/1000)}:R>*`).join("\n\n");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`notes on ${u.tag}`).setDescription(desc)] });
    }
    if (sub === "clear") {
      userNotes.delete(`${guild.id}-${u.id}`);
      return interaction.reply(`cleared all notes on ${u}.`);
    }
  }

  if (cmd === "welcome" || cmd === "goodbye" || cmd === "boost") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ embeds: [fail(`you need manage server.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const map = cmd === "welcome" ? welcomeConfig : cmd === "goodbye" ? goodbyeConfig : boostConfig;
    const label = cmd;

    if (sub === "setup") {
      const ch = interaction.options.getChannel("channel");
      const message = interaction.options.getString("message") || null;
      map.set(guild.id, { channelId: ch.id, message });
      return interaction.reply(`✅ ${label} system set to ${ch}${message ? " with custom message" : " (using default message)"}.\nUse \`/${label} test\` to preview.`);
    }
    if (sub === "disable") {
      map.delete(guild.id);
      return interaction.reply(`${label} system disabled.`);
    }
    if (sub === "view") {
      const cfg = map.get(guild.id);
      if (!cfg) return interaction.reply(`${label} system isn't configured.`);
      const ch = guild.channels.cache.get(cfg.channelId);
      const embed = new EmbedBuilder()
        .setColor("#87ceeb")
        .setTitle(`${label} config`)
        .addFields(
          { name: "channel", value: ch ? `${ch}` : "*missing channel*" },
          { name: "message", value: `\`\`\`\n${cfg.message || "(default)"}\n\`\`\`` }
        );
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === "test") {
      const cfg = map.get(guild.id);
      if (!cfg) return interaction.reply({ content: `${label} system isn't configured. Use \`/${label} setup\` first.`, ephemeral: true });
      const ch = guild.channels.cache.get(cfg.channelId);
      if (!ch) return interaction.reply({ embeds: [fail(`configured channel no longer exists.`)], ephemeral: true });
      const me = await guild.members.fetch(interaction.user.id);
      const defaults = {
        welcome: `🌟 Welcome {user} to **{server}**!\nWe now have **{membercount}** members.\n\n📜 Read the rules · 💜 Boost for perks · 👥 Invite friends`,
        goodbye: `👋 **{user.tag}** has left the server.\n\nWe now have **{membercount}** members.`,
        boost: `💖 Thank you {user} for boosting **{server}**!\n\n✨ Pic Perms · ✨ Snipe Perms · ✨ VC Perms · ✨ Custom Role`
      };
      const colors = { welcome: WELCOME_COLOR, goodbye: "#888888", boost: BOOST_COLOR };
      const text = applyPlaceholders(cfg.message || defaults[label], me, { boostCount: guild.premiumSubscriptionCount || 0 });
      const embed = new EmbedBuilder()
        .setColor(colors[label])
        .setDescription(text)
        .setThumbnail(me.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `vanta ${label} system (test)` });
      await ch.send({ content: `${me}`, embeds: [embed] }).catch(() => {});
      return interaction.reply({ content: `sent test ${label} message in ${ch}.`, ephemeral: true });
    }
  }

  if (cmd === "starboard") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === "setup") {
      const ch = interaction.options.getChannel("channel");
      const threshold = interaction.options.getInteger("threshold");
      starboardConfig.set(guild.id, { channelId: ch.id, threshold });
      return interaction.reply(`⭐ starboard set to ${ch} with threshold **${threshold}**.`);
    }
    if (sub === "disable") {
      starboardConfig.delete(guild.id);
      return interaction.reply({ embeds: [ok(`starboard disabled.`)] });
    }
  }

  if (cmd === "rank") {
    const target = interaction.options.getUser("user") || interaction.user;
    const entry = getXp(guild.id, target.id);
    const lvl = levelFromXp(entry.xp);
    const next = xpForLevel(lvl + 1);
    const cur = xpForLevel(lvl);
    const progress = entry.xp - cur;
    const span = next - cur;
    const filled = Math.floor((progress / span) * 20);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(`${target.username}'s rank`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Level", value: `**${lvl}**`, inline: true },
        { name: "XP", value: `**${entry.xp}** / ${next}`, inline: true },
        { name: "Progress", value: `\`${bar}\`` }
      )
      .setFooter({ text: "vanta xp system" });
    return interaction.reply({ embeds: [embed] });
  }

  if (cmd === "leaderboard") {
    const guildMap = xpData.get(guild.id) || new Map();
    const sorted = [...guildMap.entries()].sort((a, b) => b[1].xp - a[1].xp).slice(0, 10);
    if (!sorted.length) return interaction.reply({ embeds: [ok(`no one has any xp yet — chat to earn some!`)] });
    const lines = sorted.map(([uid, e], i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
      return `${medal} <@${uid}> — level **${levelFromXp(e.xp)}** · ${e.xp} xp`;
    });
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(`🏆 ${guild.name} leaderboard`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: "vanta xp system" });
    return interaction.reply({ embeds: [embed] });
  }

  if (cmd === "setlevel") {
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ embeds: [fail(`admin only.`)], ephemeral: true });
    }
    const target = interaction.options.getUser("user");
    const lvl = interaction.options.getInteger("level");
    if (lvl < 0) return interaction.reply({ embeds: [fail(`level must be 0 or higher.`)], ephemeral: true });
    setXp(guild.id, target.id, xpForLevel(lvl));
    const m = await guild.members.fetch(target.id).catch(() => null);
    if (m) checkLevelRoles(m, lvl);
    return interaction.reply(`set ${target}'s level to **${lvl}**.`);
  }

  if (cmd === "gstart") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }
    const durRaw = interaction.options.getString("duration");
    const winnersCount = interaction.options.getInteger("winners");
    const prize = interaction.options.getString("prize");
    const ms = parseDuration(durRaw);
    if (!ms || ms < 5000) return interaction.reply({ embeds: [fail("duration must be like `30s`, `10m`, `2h`, `1d` (min 5s).")], ephemeral: true });
    if (winnersCount < 1) return interaction.reply({ embeds: [fail("winners must be at least 1.")], ephemeral: true });

    const gameId = Date.now().toString(36);
    const g = {
      prize, winnersCount, hostId: interaction.user.id, hostName: interaction.user.username,
      channelId: interaction.channel.id, messageId: null,
      entrants: new Set(), endTime: Date.now() + ms, ended: false, lastWinners: []
    };
    giveaways.set(gameId, g);

    const joinBtn = new ButtonBuilder()
      .setCustomId(`gw_join:${gameId}`)
      .setLabel("Join Giveaway")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🎉");

    await interaction.reply({ embeds: [buildGiveawayEmbed(g, "live")], components: [new ActionRowBuilder().addComponents(joinBtn)] });
    const sent = await interaction.fetchReply();
    g.messageId = sent.id;
    setTimeout(() => endGiveaway(gameId), ms);
    return;
  }

  if (cmd === "greroll") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }
    const msgId = interaction.options.getString("message_id");
    const entry = [...giveaways.entries()].find(([, g]) => g.messageId === msgId);
    if (!entry) return interaction.reply({ embeds: [fail(`no giveaway found with that message id (may have expired since restart).`)], ephemeral: true });
    const [, g] = entry;
    if (!g.ended) return interaction.reply({ embeds: [fail(`that giveaway hasn't ended yet.`)], ephemeral: true });
    if (g.entrants.size === 0) return interaction.reply({ embeds: [fail(`no one entered, can't reroll.`)], ephemeral: true });
    const winners = pickWinners(g.entrants, g.winnersCount);
    g.lastWinners = winners;
    return interaction.reply({
      content: `🎊 Reroll! New winner${winners.length > 1 ? "s" : ""}: ${winners.map(id => `<@${id}>`).join(", ")} — you won **${g.prize}**!`,
      allowedMentions: { users: winners }
    });
  }
});


// ================= PREFIX COMMANDS =================

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  if (cmd === "ping") return message.reply("pong");

  if (cmd === "help" || cmd === "vanta") {
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("vanta commands")
      .setDescription(`
!ping
!help
!say <message>
!embed <title> | <message>
!giveaway <seconds> <winners> <prize>
!purge <amount>
!kick @user <reason>
!ban @user <reason>
!timeout @user <seconds> <reason>
!untimeout @user
!warn @user <reason>
!warnings @user
!clearwarns @user
!lock
!unlock
!slowmode <seconds>
!server
!user @user
!avatar @user
!announce #channel <message>
!poll <question>
!welcomepreview
!boostpreview
!supportpanel
      `)
      .setFooter({ text: "vanta" });

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "say") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }

    const text = args.join(" ");
    if (!text) return message.reply("type something.");

    await message.delete().catch(() => {});
    return message.channel.send(text);
  }

  if (cmd === "embed") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }

    const parts = args.join(" ").split("|").map(p => p.trim());
    const title = resolveEmojis(parts[0]);
    const desc = resolveEmojis(parts[1]);
    const colorRaw = parts[2];
    const image = parts[3];
    const link = parts[4];
    const footer = resolveEmojis(parts[5] || "vanta");

    if (!title || !desc) {
      return message.reply("use: !embed title | message | color | image_url | link | footer (only title and message are required)");
    }

    const color = parseColor(colorRaw) || "#87ceeb";

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(desc)
      .setFooter({ text: footer });

    if (image) embed.setThumbnail(image);

    const payload = { embeds: [embed] };

    if (link && /^https?:\/\//i.test(link)) {
      const linkButton = new ButtonBuilder()
        .setLabel("open link")
        .setStyle(ButtonStyle.Link)
        .setURL(link);
      payload.components = [new ActionRowBuilder().addComponents(linkButton)];
    } else if (link) {
      return message.reply("the link must start with http:// or https://");
    }

    await message.delete().catch(() => {});
    return message.channel.send(payload);
  }

  if (cmd === "giveaway") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }

    const time = parseInt(args[0]);
    const winnersCount = parseInt(args[1]);
    const prize = args.slice(2).join(" ");

    if (!time || !winnersCount || !prize) {
      return message.reply("use: !giveaway 30 1 Nitro");
    }

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("giveaway")
      .setDescription(`
react with 🎉 to enter

prize: **${prize}**
winners: **${winnersCount}**
ends in: **${time}s**
      `)
      .setFooter({ text: "vanta giveaways" });

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react("🎉");

    setTimeout(async () => {
      const reaction = msg.reactions.cache.get("🎉");
      if (!reaction) return message.channel.send("no entries.");

      const users = await reaction.users.fetch();
      const valid = users.filter(u => !u.bot).map(u => u);

      if (valid.length === 0) return message.channel.send("no valid entries.");

      const winners = [];
      while (winners.length < winnersCount && valid.length > 0) {
        const pick = valid.splice(Math.floor(Math.random() * valid.length), 1)[0];
        winners.push(pick);
      }

      return message.channel.send(`🎉 congrats ${winners.map(w => `<@${w.id}>`).join(", ")} — you won **${prize}**`);
    }, time * 1000);
  }

  if (cmd === "purge") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return message.reply("use: !purge 1-100");

    await message.channel.bulkDelete(amount, true).catch(() => {
      return message.reply("i couldn't delete those messages.");
    });

    return;
  }

  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply("you need kick members.");
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "no reason given";

    if (!target) return message.reply("mention someone.");
    if (!target.kickable) return message.reply("i cannot kick that user.");

    await target.kick(reason);
    sendLog(message.guild, `${message.author.tag} kicked ${target.user.tag}: ${reason}`);
    return message.reply(`kicked ${target.user.tag}`);
  }

  if (cmd === "ban") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply("you need ban members.");
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(" ") || "no reason given";

    if (!target) return message.reply("mention someone.");
    if (!target.bannable) return message.reply("i cannot ban that user.");

    await target.ban({ reason });
    sendLog(message.guild, `${message.author.tag} banned ${target.user.tag}: ${reason}`);
    return message.reply(`banned ${target.user.tag}`);
  }

  if (cmd === "timeout") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("you need moderate members.");
    }

    const target = message.mentions.members.first();
    const seconds = parseInt(args[1]);
    const reason = args.slice(2).join(" ") || "no reason given";

    if (!target) return message.reply("mention someone.");
    if (!seconds) return message.reply("use: !timeout @user 60 reason");
    if (!target.moderatable) return message.reply("i cannot timeout that user.");

    await target.timeout(seconds * 1000, reason);
    return message.reply(`timed out ${target.user.tag} for ${seconds}s`);
  }

  if (cmd === "untimeout") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("you need moderate members.");
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply("mention someone.");
    if (!target.moderatable) return message.reply("i cannot remove timeout.");

    await target.timeout(null);
    return message.reply(`removed timeout from ${target.user.tag}`);
  }

  if (cmd === "warn") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("you need moderate members.");
    }

    const user = message.mentions.users.first();
    const reason = args.slice(1).join(" ");

    if (!user || !reason) return message.reply("use: !warn @user reason");

    const key = `${message.guild.id}-${user.id}`;
    const list = warnings.get(key) || [];
    list.push({ reason, moderator: message.author.tag, date: new Date().toLocaleString() });
    warnings.set(key, list);

    return message.reply(`warned ${user.tag}: ${reason}`);
  }

  if (cmd === "warnings") {
    const user = message.mentions.users.first() || message.author;
    const list = warnings.get(`${message.guild.id}-${user.id}`) || [];

    if (list.length === 0) return message.reply(`${user.tag} has no warnings.`);

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(`warnings for ${user.tag}`)
      .setDescription(list.map((w, i) => `**${i + 1}.** ${w.reason} — ${w.moderator}`).join("\n"));

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "clearwarns") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply("you need moderate members.");
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply("mention someone.");

    warnings.delete(`${message.guild.id}-${user.id}`);
    return message.reply(`cleared warnings for ${user.tag}`);
  }

  if (cmd === "lock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply("you need manage channels.");
    }

    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });

    return message.reply("channel locked.");
  }

  if (cmd === "unlock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply("you need manage channels.");
    }

    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: true
    });

    return message.reply("channel unlocked.");
  }

  if (cmd === "slowmode") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply("you need manage channels.");
    }

    const seconds = parseInt(args[0]);
    if (seconds < 0 || seconds > 21600) return message.reply("use 0-21600 seconds.");

    await message.channel.setRateLimitPerUser(seconds);
    return message.reply(`slowmode set to ${seconds}s`);
  }

  if (cmd === "server") {
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("server info")
      .addFields(
        { name: "name", value: message.guild.name, inline: true },
        { name: "members", value: `${message.guild.memberCount}`, inline: true },
        { name: "id", value: message.guild.id }
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }));

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "user") {
    const user = message.mentions.users.first() || message.author;

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("user info")
      .addFields(
        { name: "username", value: user.tag },
        { name: "id", value: user.id }
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "avatar") {
    const user = message.mentions.users.first() || message.author;
    return message.reply(user.displayAvatarURL({ dynamic: true, size: 1024 }));
  }

  if (cmd === "announce") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }

    const channel = message.mentions.channels.first();
    const text = args.slice(1).join(" ");

    if (!channel || !text) return message.reply("use: !announce #channel message");

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("announcement")
      .setDescription(text)
      .setFooter({ text: "vanta" });

    await channel.send({ embeds: [embed] });
    return message.reply("announcement sent.");
  }

  if (cmd === "poll") {
    const question = args.join(" ");
    if (!question) return message.reply("use: !poll question");

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("poll")
      .setDescription(question);

    const poll = await message.channel.send({ embeds: [embed] });
    await poll.react("✅");
    await poll.react("❌");
    return;
  }

  if (cmd === "welcomepreview") {
    const embed = new EmbedBuilder()
      .setColor(WELCOME_COLOR)
      .setDescription(`
🌟 We now have **${message.guild.memberCount} members**!

📜 Please read our **rules**
💜 Boost for **perks**
👥 Invite your **friends**
      `)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "vanta welcome system" });

    return message.channel.send({ content: `Welcome, ${message.author} 💫`, embeds: [embed] });
  }

  if (cmd === "boostpreview") {
    const boostCount = message.guild.premiumSubscriptionCount || 0;
    const embed = new EmbedBuilder()
      .setColor(BOOST_COLOR)
      .setTitle("💖 Thank you for boosting!")
      .setDescription(`
✨ Pic Perms
✨ Snipe Perms
✨ VC Perms
✨ Custom Role
      `)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${message.guild.name} is now at ${boostCount} boosts!` });

    return message.channel.send({ content: `${message.author}`, embeds: [embed] });
  }

  if (cmd === "supportpanel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }

    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("Help & Support")
      .setDescription("Click below to create a new support ticket 🎫")
      .setFooter({ text: "powered by vanta" });

    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("Create Ticket")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🎫");

    const row = new ActionRowBuilder().addComponents(button);

    await message.delete().catch(() => {});
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  if (cmd === "steal") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions)) {
      return message.reply("you need manage emojis & stickers.");
    }
    const raw = args[0];
    const customName = args[1];
    const src = getEmojiSource(raw);
    if (!src) return message.reply("use: !steal <:name:id> [new_name] OR !steal <image_url> <new_name>");
    const finalName = (customName || src.name || "stolen").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
    try {
      const created = await message.guild.emojis.create({ attachment: src.url, name: finalName });
      return message.reply(`stole ${created} as \`:${created.name}:\``);
    } catch (e) {
      return message.reply(`couldn't steal that: ${e.message}`);
    }
  }

  if (cmd === "stealsticker") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions)) {
      return message.reply("you need manage emojis & stickers.");
    }
    let target;
    if (message.reference) {
      try { target = await message.channel.messages.fetch(message.reference.messageId); } catch {}
    }
    if (!target) return message.reply("reply to a message that has a sticker, then run !stealsticker [name]");
    const sticker = target.stickers.first();
    if (!sticker) return message.reply("that message has no sticker.");
    const finalName = (args[0] || sticker.name || "stolen").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);
    try {
      const created = await message.guild.stickers.create({ file: sticker.url, name: finalName, tags: "stolen", description: "stolen by vanta" });
      return message.reply(`stole sticker \`${created.name}\` ✅`);
    } catch (e) {
      return message.reply(`couldn't steal that sticker: ${e.message}`);
    }
  }

  if (cmd === "tictactoe" || cmd === "ttt") {
    const opponent = message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === message.author.id) {
      return message.reply("mention a real opponent: !ttt @user");
    }
    const gameId = Date.now().toString(36);
    const board = Array(9).fill(null);
    tttGames.set(gameId, { board, players: [message.author.id, opponent.id], turn: 0, marks: ["X", "O"] });
    const game = tttGames.get(gameId);
    const desc = `<@${message.author.id}> ❌ vs <@${opponent.id}> ⭕\n\n❌ **<@${message.author.id}>**, your move.`;
    const img = drawTttBoard(board, null);
    return message.channel.send({ embeds: [buildTttEmbed(game, desc, false, null)], files: [{ attachment: img, name: "ttt.png" }], components: buildTttRows(gameId, board, false) });
  }

  if (cmd === "truth") {
    const t = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    const embed = new EmbedBuilder().setColor("#87ceeb").setTitle("💭 Truth").setDescription(t).setFooter({ text: `for ${message.author.username}` });
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "dare") {
    const d = DARES[Math.floor(Math.random() * DARES.length)];
    const embed = new EmbedBuilder().setColor("#ff69b4").setTitle("🔥 Dare").setDescription(d).setFooter({ text: `for ${message.author.username}` });
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "tod") {
    const isTruth = Math.random() < 0.5;
    const pool = isTruth ? TRUTHS : DARES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const embed = new EmbedBuilder()
      .setColor(isTruth ? "#87ceeb" : "#ff69b4")
      .setTitle(isTruth ? "💭 Truth" : "🔥 Dare")
      .setDescription(pick)
      .setFooter({ text: `for ${message.author.username}` });
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "confession") {
    const text = resolveEmojis(args.join(" "));
    if (!text) return message.reply("use: !confession <your message>");
    await message.delete().catch(() => {});
    const ch = findChannel(message.guild, "confessions") || message.channel;
    const embed = new EmbedBuilder()
      .setColor("#a855f7")
      .setTitle("🤫 Anonymous Confession")
      .setDescription(text)
      .setFooter({ text: "sent anonymously via vanta" })
      .setTimestamp();
    return ch.send({ embeds: [embed] });
  }

  if (cmd === "event") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }
    const parts = args.join(" ").split("|").map(p => p.trim());
    const title = resolveEmojis(parts[0]);
    const desc = resolveEmojis(parts[1]);
    const when = parts[2];
    const where = parts[3];
    const colorRaw = parts[4];
    const image = parts[5];
    if (!title || !desc) return message.reply("use: !event title | description | when | where | color | image");
    const color = parseColor(colorRaw) || "#87ceeb";
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`📅 ${title}`)
      .setDescription(desc)
      .setFooter({ text: `hosted by ${message.author.username}` })
      .setTimestamp();
    if (when) embed.addFields({ name: "🕒 When", value: when, inline: true });
    if (where) embed.addFields({ name: "📍 Where", value: where, inline: true });
    if (image) embed.setImage(image);
    await message.delete().catch(() => {});
    return message.channel.send({ content: "@everyone", embeds: [embed], allowedMentions: { parse: ["everyone"] } });
  }

  if (cmd === "afk") {
    const reason = args.join(" ") || "AFK";
    afkUsers.set(`${message.guild.id}-${message.author.id}`, { reason, since: Date.now() });
    return message.reply(`💤 set you as AFK: ${reason}`);
  }

  if (cmd === "snipe" || cmd === "s") {
    const s = snipes.get(message.channel.id);
    if (!s) return message.reply("nothing to snipe.");
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setAuthor({ name: s.author, iconURL: s.avatar })
      .setDescription(s.content)
      .setFooter({ text: "deleted message" })
      .setTimestamp(s.time);
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "editsnipe" || cmd === "es") {
    const s = editSnipes.get(message.channel.id);
    if (!s) return message.reply("nothing to edit-snipe.");
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setAuthor({ name: s.author, iconURL: s.avatar })
      .addFields({ name: "before", value: s.before }, { name: "after", value: s.after })
      .setFooter({ text: "edited message" })
      .setTimestamp(s.time);
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "filter") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }
    const sub = args[0];
    const fset = getFilters(message.guild.id);
    if (sub === "add") {
      const w = args.slice(1).join(" ").toLowerCase();
      if (!w) return message.reply("use: !filter add <word>");
      fset.add(w);
      return message.reply(`added \`${w}\` to filter.`);
    }
    if (sub === "remove") {
      const w = args.slice(1).join(" ").toLowerCase();
      fset.delete(w);
      return message.reply(`removed \`${w}\`.`);
    }
    if (sub === "list" || !sub) {
      if (!fset.size) return message.reply("no filtered words.");
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("filtered words").setDescription([...fset].map(w => `\`${w}\``).join(", "))] });
    }
    return message.reply("use: !filter add|remove|list");
  }

  if (cmd === "cc") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }
    const sub = args[0];
    const cc = getCC(message.guild.id);
    if (sub === "add") {
      const name = (args[1] || "").toLowerCase().replace(/\s/g, "");
      const response = args.slice(2).join(" ");
      if (!name || !response) return message.reply("use: !cc add <name> <response>");
      cc.set(name, response);
      return message.reply(`added \`!${name}\`.`);
    }
    if (sub === "remove") {
      const name = (args[1] || "").toLowerCase();
      cc.delete(name);
      return message.reply(`removed \`!${name}\`.`);
    }
    if (sub === "list" || !sub) {
      if (!cc.size) return message.reply("no custom commands yet.");
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("custom commands").setDescription([...cc.keys()].map(k => `\`!${k}\``).join(", "))] });
    }
    return message.reply("use: !cc add|remove|list");
  }

  if (cmd === "rank") {
    const target = message.mentions.users.first() || message.author;
    const entry = getXp(message.guild.id, target.id);
    const lvl = levelFromXp(entry.xp);
    const next = xpForLevel(lvl + 1);
    const cur = xpForLevel(lvl);
    const progress = entry.xp - cur;
    const span = next - cur;
    const filled = Math.floor((progress / span) * 20);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(`${target.username}'s rank`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Level", value: `**${lvl}**`, inline: true },
        { name: "XP", value: `**${entry.xp}** / ${next}`, inline: true },
        { name: "Progress", value: `\`${bar}\`` }
      )
      .setFooter({ text: "vanta xp system" });
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "leaderboard" || cmd === "lb") {
    const guildMap = xpData.get(message.guild.id) || new Map();
    const sorted = [...guildMap.entries()].sort((a, b) => b[1].xp - a[1].xp).slice(0, 10);
    if (!sorted.length) return message.reply("no one has any xp yet — chat to earn some!");
    const lines = sorted.map(([uid, e], i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
      return `${medal} <@${uid}> — level **${levelFromXp(e.xp)}** · ${e.xp} xp`;
    });
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(`🏆 ${message.guild.name} leaderboard`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: "vanta xp system" });
    return message.channel.send({ embeds: [embed] });
  }

  if (cmd === "setlevel") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("admin only.");
    }
    const target = message.mentions.users.first();
    const lvl = parseInt(args[1], 10);
    if (!target || isNaN(lvl) || lvl < 0) return message.reply("use: !setlevel @user <level>");
    setXp(message.guild.id, target.id, xpForLevel(lvl));
    const m = await message.guild.members.fetch(target.id).catch(() => null);
    if (m) checkLevelRoles(m, lvl);
    return message.reply(`set ${target}'s level to **${lvl}**.`);
  }

  if (cmd === "gstart") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }
    const durRaw = args[0];
    const winnersCount = parseInt(args[1], 10);
    const prize = args.slice(2).join(" ");
    const ms = parseDuration(durRaw);
    if (!ms || ms < 5000) return message.reply("use: !gstart <duration> <winners> <prize>  (e.g. !gstart 10m 2 Nitro)");
    if (!winnersCount || winnersCount < 1) return message.reply("winners must be at least 1.");
    if (!prize) return message.reply("missing prize.");

    const gameId = Date.now().toString(36);
    const g = {
      prize, winnersCount, hostId: message.author.id, hostName: message.author.username,
      channelId: message.channel.id, messageId: null,
      entrants: new Set(), endTime: Date.now() + ms, ended: false, lastWinners: []
    };
    giveaways.set(gameId, g);

    const joinBtn = new ButtonBuilder()
      .setCustomId(`gw_join:${gameId}`)
      .setLabel("Join Giveaway")
      .setStyle(ButtonStyle.Success)
      .setEmoji("🎉");

    await message.delete().catch(() => {});
    const sent = await message.channel.send({ embeds: [buildGiveawayEmbed(g, "live")], components: [new ActionRowBuilder().addComponents(joinBtn)] });
    g.messageId = sent.id;
    setTimeout(() => endGiveaway(gameId), ms);
    return;
  }

  if (cmd === "greroll") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("you need manage messages.");
    }
    const msgId = args[0];
    const entry = [...giveaways.entries()].find(([, g]) => g.messageId === msgId);
    if (!entry) return message.reply("no giveaway found with that message id.");
    const [, g] = entry;
    if (!g.ended) return message.reply("that giveaway hasn't ended yet.");
    if (g.entrants.size === 0) return message.reply("no one entered, can't reroll.");
    const winners = pickWinners(g.entrants, g.winnersCount);
    g.lastWinners = winners;
    return message.channel.send({
      content: `🎊 Reroll! New winner${winners.length > 1 ? "s" : ""}: ${winners.map(id => `<@${id}>`).join(", ")} — you won **${g.prize}**!`,
      allowedMentions: { users: winners }
    });
  }

  // ===== INFO (prefix) =====
  if (cmd === "userinfo" || cmd === "whois") {
    const target = message.mentions.users.first() || message.author;
    const m = await message.guild.members.fetch(target.id).catch(() => null);
    return message.channel.send({ embeds: [buildUserInfo(m, target)] });
  }
  if (cmd === "serverinfo") {
    const owner = await message.guild.fetchOwner().catch(() => null);
    const embed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle(message.guild.name)
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "ID", value: message.guild.id, inline: true },
        { name: "Owner", value: owner ? `${owner.user.tag}` : "unknown", inline: true },
        { name: "Created", value: `<t:${Math.floor(message.guild.createdTimestamp/1000)}:R>`, inline: true },
        { name: "Members", value: `${message.guild.memberCount}`, inline: true },
        { name: "Boosts", value: `${message.guild.premiumSubscriptionCount || 0}`, inline: true },
        { name: "Channels", value: `${message.guild.channels.cache.size}`, inline: true }
      );
    return message.channel.send({ embeds: [embed] });
  }
  if (cmd === "avatar" || cmd === "av") {
    const target = message.mentions.users.first() || message.author;
    const url = target.displayAvatarURL({ dynamic: true, size: 1024 });
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`${target.tag}'s avatar`).setURL(url).setImage(url)] });
  }
  if (cmd === "banner") {
    const target = message.mentions.users.first() || message.author;
    const u = await target.fetch();
    const url = u.bannerURL({ dynamic: true, size: 1024 });
    if (!url) return message.reply(`${u.tag} has no banner.`);
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`${u.tag}'s banner`).setImage(url)] });
  }
  if (cmd === "membercount" || cmd === "mc") {
    await message.guild.members.fetch().catch(() => {});
    const total = message.guild.memberCount;
    const bots = message.guild.members.cache.filter(m => m.user.bot).size;
    return message.channel.send(`👥 **${total}** members · **${total - bots}** humans · **${bots}** bots`);
  }

  // ===== CHANNEL CONTROL (prefix) =====
  if (cmd === "lock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("you need manage channels.");
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }).catch(() => {});
    return message.channel.send("🔒 channel locked.");
  }
  if (cmd === "unlock") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("you need manage channels.");
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }).catch(() => {});
    return message.channel.send("🔓 channel unlocked.");
  }
  if (cmd === "slowmode") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply("you need manage channels.");
    const sec = parseInt(args[0], 10);
    if (isNaN(sec) || sec < 0 || sec > 21600) return message.reply("use: !slowmode <0-21600>");
    await message.channel.setRateLimitPerUser(sec).catch(() => {});
    return message.channel.send(sec === 0 ? "slowmode disabled." : `slowmode set to **${sec}s**.`);
  }

  // ===== MEMBER MOD (prefix) =====
  if (cmd === "nick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) return message.reply("you need manage nicknames.");
    const u = message.mentions.users.first();
    if (!u) return message.reply("use: !nick @user [nickname]");
    const m = await message.guild.members.fetch(u.id).catch(() => null);
    if (!m) return message.reply("user not in server.");
    const nick = args.slice(1).join(" ") || null;
    await m.setNickname(nick).catch(() => {});
    return message.reply(nick ? `set ${u}'s nickname to **${nick}**.` : `reset ${u}'s nickname.`);
  }
  if (cmd === "role") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply("you need manage roles.");
    const u = message.mentions.users.first();
    const r = message.mentions.roles.first();
    if (!u || !r) return message.reply("use: !role @user @role");
    const m = await message.guild.members.fetch(u.id).catch(() => null);
    if (!m) return message.reply("user not in server.");
    if (m.roles.cache.has(r.id)) {
      await m.roles.remove(r).catch(() => {});
      return message.reply(`removed ${r} from ${u}.`);
    } else {
      await m.roles.add(r).catch(() => {});
      return message.reply(`gave ${r} to ${u}.`);
    }
  }

  // ===== UTILITY (prefix) =====
  if (cmd === "poll") {
    const parts = args.join(" ").split("|").map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) return message.reply("use: !poll question | option1 | option2 | ...");
    const q = parts[0];
    const opts = parts.slice(1, 11);
    const nums = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    const desc = opts.map((o, i) => `${nums[i]} ${o}`).join("\n");
    const embed = new EmbedBuilder().setColor("#87ceeb").setTitle(`📊 ${q}`).setDescription(desc).setFooter({ text: `poll by ${message.author.tag}` });
    const sent = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < opts.length; i++) await sent.react(nums[i]).catch(() => {});
    return;
  }
  if (cmd === "remind") {
    const ms = parseDuration(args[0]);
    if (!ms || ms < 5000) return message.reply("use: !remind <duration> <text>  (e.g. !remind 30m drink water)");
    const text = args.slice(1).join(" ");
    if (!text) return message.reply("give me something to remind you about.");
    message.reply(`⏰ ok, I'll DM you in ${args[0]}.`);
    setTimeout(() => {
      message.author.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("⏰ reminder").setDescription(text)] }).catch(() => {});
    }, ms);
    return;
  }
  if (cmd === "suggest") {
    const text = args.join(" ");
    if (!text) return message.reply("use: !suggest <your suggestion>");
    const ch = findChannel(message.guild, "suggestions") || message.channel;
    const embed = new EmbedBuilder().setColor("#87ceeb").setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setDescription(text).setFooter({ text: "vote with 👍 / 👎" });
    const sent = await ch.send({ embeds: [embed] });
    await sent.react("👍").catch(() => {});
    await sent.react("👎").catch(() => {});
    if (ch.id !== message.channel.id) message.reply(`suggestion sent in ${ch}.`);
    return;
  }

  // ===== FUN (prefix) =====
  if (cmd === "8ball") {
    const q = args.join(" ");
    if (!q) return message.reply("ask a question.");
    return message.channel.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🎱 magic 8-ball").addFields({ name: "question", value: q }, { name: "answer", value: EIGHTBALL_REPLIES[Math.floor(Math.random() * EIGHTBALL_REPLIES.length)] })] });
  }
  if (cmd === "coinflip" || cmd === "cf") {
    return message.channel.send(`🪙 ${Math.random() < 0.5 ? "heads!" : "tails!"}`);
  }
  if (cmd === "dice" || cmd === "roll") {
    const sides = parseInt(args[0], 10) || 6;
    if (sides < 2 || sides > 1000) return message.reply("sides must be 2-1000.");
    return message.channel.send(`🎲 rolled a **${Math.floor(Math.random() * sides) + 1}** (d${sides})`);
  }
  if (cmd === "choose") {
    const opts = args.join(" ").split(",").map(s => s.trim()).filter(Boolean);
    if (opts.length < 2) return message.reply("use: !choose option1, option2, ...");
    return message.channel.send(`🤔 I pick: **${opts[Math.floor(Math.random() * opts.length)]}**`);
  }
  if (cmd === "rps") {
    const choice = (args[0] || "").toLowerCase();
    if (!["rock","paper","scissors"].includes(choice)) return message.reply("use: !rps rock|paper|scissors");
    const picks = ["rock", "paper", "scissors"];
    const bot = picks[Math.floor(Math.random() * 3)];
    let result = "tie!";
    if ((choice === "rock" && bot === "scissors") || (choice === "paper" && bot === "rock") || (choice === "scissors" && bot === "paper")) result = "you win! 🎉";
    else if (choice !== bot) result = "you lose 😈";
    return message.channel.send(`you: **${choice}** · vanta: **${bot}** · ${result}`);
  }

  // ===== MOD NOTES (prefix) =====
  if (cmd === "note") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("you need manage messages.");
    const sub = args[0];
    const u = message.mentions.users.first();
    if (!u) return message.reply("use: !note add|list|clear @user [text]");
    const notes = getNotes(message.guild.id, u.id);
    if (sub === "add") {
      const text = args.slice(2).join(" ");
      if (!text) return message.reply("use: !note add @user <text>");
      notes.push({ text, by: message.author.tag, at: Date.now() });
      return message.reply(`📝 added note on ${u} (${notes.length} total).`);
    }
    if (sub === "list") {
      if (!notes.length) return message.reply(`no notes on ${u}.`);
      const desc = notes.map((n, i) => `**${i + 1}.** ${n.text}\n— *${n.by} <t:${Math.floor(n.at/1000)}:R>*`).join("\n\n");
      return message.channel.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`notes on ${u.tag}`).setDescription(desc)] });
    }
    if (sub === "clear") {
      userNotes.delete(`${message.guild.id}-${u.id}`);
      return message.reply(`cleared all notes on ${u}.`);
    }
    return message.reply("use: !note add|list|clear @user");
  }

  // ===== custom command fallback =====
  const cc = getCC(message.guild.id);
  if (cc.has(cmd)) {
    return message.channel.send(cc.get(cmd));
  }
});


// ================= TICKET BUTTON HANDLER =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;

  if (interaction.customId.startsWith("rolemenu:")) {
    const roleId = interaction.customId.split(":")[1];
    const role = guild.roles.cache.get(roleId);
    if (!role) return interaction.reply({ embeds: [fail(`that role no longer exists.`)], ephemeral: true });
    const m = await guild.members.fetch(interaction.user.id).catch(() => null);
    if (!m) return interaction.reply({ embeds: [fail(`couldn't find you in this server.`)], ephemeral: true });
    if (m.roles.cache.has(role.id)) {
      await m.roles.remove(role).catch(() => {});
      return interaction.reply({ content: `removed **${role.name}** from you.`, ephemeral: true });
    } else {
      await m.roles.add(role).catch(() => {});
      return interaction.reply({ content: `gave you **${role.name}**.`, ephemeral: true });
    }
  }

  if (interaction.customId.startsWith("gw_join:")) {
    const gameId = interaction.customId.split(":")[1];
    const g = giveaways.get(gameId);
    if (!g) return interaction.reply({ embeds: [fail(`this giveaway has expired.`)], ephemeral: true });
    if (g.ended) return interaction.reply({ embeds: [fail(`this giveaway has already ended.`)], ephemeral: true });

    let action;
    if (g.entrants.has(interaction.user.id)) {
      g.entrants.delete(interaction.user.id);
      action = "left";
    } else {
      g.entrants.add(interaction.user.id);
      action = "joined";
    }

    const joinBtn = new ButtonBuilder()
      .setCustomId(`gw_join:${gameId}`)
      .setLabel(`Join Giveaway · ${g.entrants.size}`)
      .setStyle(ButtonStyle.Success)
      .setEmoji("🎉");

    await interaction.update({
      embeds: [buildGiveawayEmbed(g, "live")],
      components: [new ActionRowBuilder().addComponents(joinBtn)]
    });
    return interaction.followUp({ content: action === "joined" ? "🎉 you're in!" : "you left the giveaway.", ephemeral: true });
  }

  if (interaction.customId.startsWith("ttt:")) {
    const [, gameId, idxStr] = interaction.customId.split(":");
    const idx = parseInt(idxStr, 10);
    const game = tttGames.get(gameId);
    if (!game) return interaction.reply({ embeds: [fail(`this game has expired.`)], ephemeral: true });
    const expectedPlayer = game.players[game.turn];
    if (interaction.user.id !== expectedPlayer) {
      return interaction.reply({ embeds: [fail(`it's not your turn.`)], ephemeral: true });
    }
    if (game.board[idx]) return interaction.reply({ embeds: [fail(`that cell is taken.`)], ephemeral: true });

    game.board[idx] = game.marks[game.turn];
    const winner = checkTttWinner(game.board);
    let description;
    let finished = false;
    let winningCells = null;

    if (winner === "draw") {
      description = "🤝 **It's a draw!**";
      finished = true;
    } else if (winner) {
      const winnerId = game.players[game.marks.indexOf(winner)];
      description = `🏆 <@${winnerId}> wins!`;
      finished = true;
      // find winning cells
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const line of lines) {
        if (line.every(i => game.board[i] === winner)) { winningCells = line; break; }
      }
    } else {
      game.turn = 1 - game.turn;
      const nextId = game.players[game.turn];
      const mark = game.marks[game.turn];
      description = `<@${game.players[0]}> ❌ vs <@${game.players[1]}> ⭕\n\n${mark === "X" ? "❌" : "⭕"} **<@${nextId}>**, your move.`;
    }

    const embed = buildTttEmbed(game, description, finished, winningCells);
    const img = drawTttBoard(game.board, winningCells);
    if (finished) tttGames.delete(gameId);
    return interaction.update({ embeds: [embed], files: [{ attachment: img, name: "ttt.png" }], components: buildTttRows(gameId, game.board, finished) });
  }

  if (interaction.customId === "create_ticket") {
    const user = interaction.user;

    const existing = guild.channels.cache.find(
      c => c.topic && c.topic.includes(`ticket-owner:${user.id}`)
    );

    if (existing) {
      return interaction.reply({
        content: `you already have an open ticket: ${existing}`,
        ephemeral: true
      });
    }

    const safeName = user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 80) || "user";
    const channelName = `ticket-${safeName}`;

    const overwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles
        ]
      }
    ];

    // grant access to anyone with manage channels
    guild.roles.cache.forEach(role => {
      if (role.permissions.has(PermissionsBitField.Flags.ManageChannels) && !role.managed) {
        overwrites.push({
          id: role.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ManageMessages
          ]
        });
      }
    });

    let channel;
    try {
      const category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "tickets"
      );

      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category?.id,
        topic: `ticket-owner:${user.id}`,
        permissionOverwrites: overwrites
      });
    } catch (err) {
      return interaction.reply({ embeds: [fail(`i couldn't create your ticket. make sure i have manage channels permission.`)], ephemeral: true });
    }

    const ticketEmbed = new EmbedBuilder()
      .setColor("#87ceeb")
      .setTitle("ticket opened")
      .setDescription(`${user}, staff will be with you shortly. describe your issue below.`)
      .setFooter({ text: "vanta tickets" });

    const closeButton = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒");

    const row = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({
      content: `${user}`,
      embeds: [ticketEmbed],
      components: [row]
    });

    sendLog(guild, `ticket opened by ${user.tag} -> ${channel.name}`);

    return interaction.reply({
      content: `your ticket has been created: ${channel}`,
      ephemeral: true
    });
  }

  if (interaction.customId === "close_ticket") {
    const channel = interaction.channel;
    const ownerMatch = channel.topic?.match(/ticket-owner:(\d+)/);
    const ownerId = ownerMatch?.[1];

    const isOwner = ownerId === interaction.user.id;
    const isStaff = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);

    if (!ownerId) {
      return interaction.reply({ embeds: [fail(`this doesn't look like a ticket channel.`)], ephemeral: true });
    }

    if (!isOwner && !isStaff) {
      return interaction.reply({ embeds: [fail(`only the ticket owner or staff can close this ticket.`)], ephemeral: true });
    }

    await interaction.reply(`ticket closing in 5 seconds (closed by ${interaction.user})...`);
    sendLog(guild, `ticket ${channel.name} closed by ${interaction.user.tag}`);
    setTimeout(() => channel.delete().catch(() => {}), 5000);
  }
});


// ================= LOGGING SYSTEM =================

function getLogCfg(guildId) {
  if (!loggingConfig.has(guildId)) {
    loggingConfig.set(guildId, { events: {}, ignored: new Set() });
  }
  return loggingConfig.get(guildId);
}

function logEvent(guild, eventType, embed) {
  if (!guild) return;
  const cfg = getLogCfg(guild.id);
  const ev = cfg.events[eventType];
  if (!ev || !ev.channelId) return;
  const ch = guild.channels.cache.get(ev.channelId);
  if (!ch) return;
  if (ev.color) embed.setColor(ev.color);
  ch.send({ embeds: [embed] }).catch(() => {});
}

function isIgnored(guildId, ...ids) {
  const cfg = getLogCfg(guildId);
  return ids.some(id => id && cfg.ignored.has(id));
}

client.on("messageDelete", msg => {
  if (!msg.guild || msg.author?.bot) return;
  if (isIgnored(msg.guild.id, msg.author?.id, msg.channel?.id)) return;
  const e = new EmbedBuilder()
    .setColor("#ff5555")
    .setTitle("🗑️ message deleted")
    .setDescription((msg.content || "*no text*").slice(0, 1024))
    .addFields(
      { name: "author", value: msg.author ? `${msg.author} (${msg.author.tag})` : "unknown", inline: true },
      { name: "channel", value: `${msg.channel}`, inline: true }
    )
    .setTimestamp();
  logEvent(msg.guild, "messages", e);
});

client.on("messageUpdate", (oldMsg, newMsg) => {
  if (!newMsg.guild || newMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;
  if (isIgnored(newMsg.guild.id, newMsg.author?.id, newMsg.channel?.id)) return;
  const e = new EmbedBuilder()
    .setColor("#ffaa00")
    .setTitle("✏️ message edited")
    .addFields(
      { name: "before", value: (oldMsg.content || "*empty*").slice(0, 1024) },
      { name: "after", value: (newMsg.content || "*empty*").slice(0, 1024) },
      { name: "author", value: `${newMsg.author} (${newMsg.author.tag})`, inline: true },
      { name: "channel", value: `${newMsg.channel}`, inline: true }
    )
    .setTimestamp();
  logEvent(newMsg.guild, "messages", e);
});

client.on("guildMemberAdd", member => {
  if (isIgnored(member.guild.id, member.id)) return;
  const e = new EmbedBuilder()
    .setColor("#55ff55")
    .setTitle("📥 member joined")
    .setDescription(`${member} (${member.user.tag})`)
    .addFields({ name: "account created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true })
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
  logEvent(member.guild, "members", e);
});

client.on("guildMemberRemove", member => {
  if (isIgnored(member.guild.id, member.id)) return;
  const e = new EmbedBuilder()
    .setColor("#ff5555")
    .setTitle("📤 member left")
    .setDescription(`${member.user.tag}`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
  logEvent(member.guild, "members", e);
});

client.on("roleCreate", role => {
  const e = new EmbedBuilder().setColor("#55ff55").setTitle("➕ role created").setDescription(`${E.approve} : ${role} (\`${role.name}\`)`).setTimestamp();
  logEvent(role.guild, "roles", e);
});
client.on("roleDelete", role => {
  const e = new EmbedBuilder().setColor("#ff5555").setTitle("➖ role deleted").setDescription(`${E.deny} : \`${role.name}\``).setTimestamp();
  logEvent(role.guild, "roles", e);
});
client.on("roleUpdate", (oldR, newR) => {
  if (oldR.name === newR.name && oldR.color === newR.color) return;
  const e = new EmbedBuilder().setColor("#ffaa00").setTitle("✏️ role updated")
    .setDescription(`${newR}`)
    .addFields(
      { name: "before", value: `name: ${oldR.name}\ncolor: ${oldR.hexColor}` },
      { name: "after", value: `name: ${newR.name}\ncolor: ${newR.hexColor}` }
    ).setTimestamp();
  logEvent(newR.guild, "roles", e);
});

client.on("channelCreate", ch => {
  if (!ch.guild) return;
  const e = new EmbedBuilder().setColor("#55ff55").setTitle("➕ channel created").setDescription(`${E.approve} : ${ch} (\`${ch.name}\`)`).setTimestamp();
  logEvent(ch.guild, "channels", e);
});
client.on("channelDelete", ch => {
  if (!ch.guild) return;
  const e = new EmbedBuilder().setColor("#ff5555").setTitle("➖ channel deleted").setDescription(`${E.deny} : \`${ch.name}\``).setTimestamp();
  logEvent(ch.guild, "channels", e);
});
client.on("channelUpdate", (oldCh, newCh) => {
  if (!newCh.guild) return;
  if (oldCh.name === newCh.name) return;
  const e = new EmbedBuilder().setColor("#ffaa00").setTitle("✏️ channel renamed").setDescription(`${E.warning} : ${newCh}\n\`${oldCh.name}\` → \`${newCh.name}\``).setTimestamp();
  logEvent(newCh.guild, "channels", e);
});

client.on("inviteCreate", inv => {
  const e = new EmbedBuilder().setColor("#87ceeb").setTitle("🔗 invite created")
    .setDescription(`${inv.url}`)
    .addFields(
      { name: "by", value: inv.inviter ? `${inv.inviter}` : "unknown", inline: true },
      { name: "channel", value: `${inv.channel}`, inline: true },
      { name: "max uses", value: `${inv.maxUses || "∞"}`, inline: true }
    ).setTimestamp();
  logEvent(inv.guild, "invites", e);
});
client.on("inviteDelete", inv => {
  const e = new EmbedBuilder().setColor("#ff5555").setTitle("🔗 invite deleted").setDescription(`${E.deny} : code: \`${inv.code}\``).setTimestamp();
  logEvent(inv.guild, "invites", e);
});

client.on("emojiCreate", emoji => {
  const e = new EmbedBuilder().setColor("#55ff55").setTitle("➕ emoji added").setDescription(`${E.approve} : ${emoji} \`:${emoji.name}:\``).setThumbnail(emoji.imageURL()).setTimestamp();
  logEvent(emoji.guild, "emojis", e);
});
client.on("emojiDelete", emoji => {
  const e = new EmbedBuilder().setColor("#ff5555").setTitle("➖ emoji removed").setDescription(`${E.deny} : \`:${emoji.name}:\``).setTimestamp();
  logEvent(emoji.guild, "emojis", e);
});

client.on("voiceStateUpdate", (oldS, newS) => {
  if (oldS.channelId === newS.channelId) return;
  const guild = newS.guild || oldS.guild;
  const user = newS.member?.user || oldS.member?.user;
  if (!user) return;
  let title, desc;
  if (!oldS.channelId && newS.channelId) {
    title = "🔊 joined voice"; desc = `${user} joined ${newS.channel}`;
  } else if (oldS.channelId && !newS.channelId) {
    title = "🔇 left voice"; desc = `${user} left ${oldS.channel}`;
  } else {
    title = "🔁 moved voice"; desc = `${user} moved from ${oldS.channel} → ${newS.channel}`;
  }
  const e = new EmbedBuilder().setColor("#87ceeb").setTitle(title).setDescription(desc).setTimestamp();
  logEvent(guild, "voice", e);
});

// ================= VANITY (custom status role) =================

client.on("presenceUpdate", async (oldP, newP) => {
  const guild = newP?.guild;
  if (!guild) return;
  const cfg = vanityConfig.get(guild.id);
  if (!cfg || !cfg.substring || !cfg.roleId) return;
  const member = newP.member;
  if (!member || member.user.bot) return;

  const customStatus = (newP.activities || []).find(a => a.type === ActivityType.Custom);
  const text = customStatus?.state || "";
  const has = text.toLowerCase().includes(cfg.substring.toLowerCase());

  const key = `${guild.id}:${member.id}`;
  const wasActive = vanityActive.get(key) || false;

  if (has && !wasActive) {
    vanityActive.set(key, true);
    const role = guild.roles.cache.get(cfg.roleId);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => {});
      if (cfg.logChannelId) {
        const ch = guild.channels.cache.get(cfg.logChannelId);
        ch?.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("vanity granted").setDescription(`${E.approve} : ${member} got ${role} for repping \`${cfg.substring}\``)] }).catch(() => {});
      }
      if (cfg.message && cfg.awardChannelId) {
        const ch = guild.channels.cache.get(cfg.awardChannelId);
        ch?.send(applyPlaceholders(cfg.message, member)).catch(() => {});
      }
    }
  } else if (!has && wasActive) {
    vanityActive.set(key, false);
    const role = guild.roles.cache.get(cfg.roleId);
    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch(() => {});
      if (cfg.logChannelId) {
        const ch = guild.channels.cache.get(cfg.logChannelId);
        ch?.send({ embeds: [new EmbedBuilder().setColor("#ff5555").setTitle("vanity removed").setDescription(`${E.deny} : ${member} no longer reps \`${cfg.substring}\``)] }).catch(() => {});
      }
    }
  }
});

// ================= REACTION ROLES =================

function rrKey(guildId, msgId) { return `${guildId}:${msgId}`; }

function emojiKey(emoji) {
  if (emoji.id) return emoji.id;
  return emoji.name;
}

async function handleRrReaction(reaction, user, add) {
  if (user.bot) return;
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  const guild = reaction.message.guild;
  if (!guild) return;
  const map = reactionRoles.get(rrKey(guild.id, reaction.message.id));
  if (!map) return;
  const k = emojiKey(reaction.emoji);
  const roleId = map.get(k);
  if (!roleId) return;
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;
  const role = guild.roles.cache.get(roleId);
  if (!role) return;
  if (add) await member.roles.add(role).catch(() => {});
  else await member.roles.remove(role).catch(() => {});
}

client.on("messageReactionAdd", (r, u) => handleRrReaction(r, u, true));
client.on("messageReactionRemove", (r, u) => handleRrReaction(r, u, false));

// ================= PAGINATION =================

function buildPageRows(pageId, current, total) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pg:${pageId}:first`).setEmoji("⏮️").setStyle(ButtonStyle.Secondary).setDisabled(current === 0),
    new ButtonBuilder().setCustomId(`pg:${pageId}:prev`).setEmoji("◀️").setStyle(ButtonStyle.Primary).setDisabled(current === 0),
    new ButtonBuilder().setCustomId(`pg:${pageId}:page`).setLabel(`${current + 1} / ${total}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`pg:${pageId}:next`).setEmoji("▶️").setStyle(ButtonStyle.Primary).setDisabled(current === total - 1),
    new ButtonBuilder().setCustomId(`pg:${pageId}:last`).setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(current === total - 1)
  )];
}

function pageEmbed(p, title, current, total) {
  return new EmbedBuilder().setColor("#87ceeb").setTitle(title || "pagination").setDescription(p).setFooter({ text: `page ${current + 1} of ${total}` });
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("pg:")) return;
  const [, pageId, action] = interaction.customId.split(":");
  const data = pageStore.get(pageId);
  if (!data) return interaction.reply({ embeds: [fail(`this pagination expired.`)], ephemeral: true });
  let next = data.current;
  if (action === "first") next = 0;
  else if (action === "last") next = data.pages.length - 1;
  else if (action === "prev") next = Math.max(0, data.current - 1);
  else if (action === "next") next = Math.min(data.pages.length - 1, data.current + 1);
  data.current = next;
  await interaction.update({
    embeds: [pageEmbed(data.pages[next], data.title, next, data.pages.length)],
    components: buildPageRows(pageId, next, data.pages.length)
  });
});

// ================= REDDIT + YOUTUBE FEEDS =================

async function fetchRedditLatest(sub) {
  try {
    const r = await fetch(`https://www.reddit.com/r/${encodeURIComponent(sub)}/new.json?limit=5`, {
      headers: { "User-Agent": "vanta-bot/1.0" }
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.data?.children?.map(c => c.data) || [];
  } catch { return null; }
}

async function fetchYoutubeLatest(channelId) {
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
    if (!r.ok) return null;
    const xml = await r.text();
    const entries = [];
    const re = /<entry>[\s\S]*?<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<published>(.*?)<\/published>[\s\S]*?<\/entry>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      entries.push({ id: m[1], title: m[2], published: m[3] });
    }
    const nameMatch = xml.match(/<author>[\s\S]*?<name>(.*?)<\/name>/);
    return { entries, channelName: nameMatch?.[1] || channelId };
  } catch { return null; }
}

async function resolveYoutubeChannelId(input) {
  if (/^UC[\w-]{20,}$/.test(input)) return input;
  const handle = input.startsWith("@") ? input : `@${input}`;
  try {
    const r = await fetch(`https://www.youtube.com/${encodeURIComponent(handle)}`);
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/"channelId":"(UC[\w-]{20,})"/) || html.match(/channel\/(UC[\w-]{20,})/);
    return m?.[1] || null;
  } catch { return null; }
}

async function pollRedditFeeds() {
  for (const [guildId, feeds] of redditFeeds) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;
    for (const f of feeds) {
      const posts = await fetchRedditLatest(f.name);
      if (!posts) continue;
      const fresh = posts.filter(p => !f.lastSeen || p.created_utc > f.lastSeen).reverse();
      if (fresh.length) f.lastSeen = Math.max(...posts.map(p => p.created_utc));
      const ch = guild.channels.cache.get(f.channelId);
      if (!ch) continue;
      for (const p of fresh.slice(0, 3)) {
        const e = new EmbedBuilder()
          .setColor(f.color || "#ff4500")
          .setTitle(p.title?.slice(0, 256) || "(no title)")
          .setURL(`https://reddit.com${p.permalink}`)
          .setAuthor({ name: `r/${f.name} • u/${p.author}` })
          .setTimestamp(new Date(p.created_utc * 1000));
        if (p.selftext) e.setDescription(p.selftext.slice(0, 500));
        if (p.thumbnail && /^https?:/.test(p.thumbnail)) e.setThumbnail(p.thumbnail);
        if (p.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(p.url)) e.setImage(p.url);
        ch.send({ content: f.message || null, embeds: [e] }).catch(() => {});
      }
    }
  }
}

async function pollYoutubeFeeds() {
  for (const [guildId, feeds] of youtubeFeeds) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;
    for (const f of feeds) {
      const data = await fetchYoutubeLatest(f.channelId);
      if (!data) continue;
      const fresh = data.entries.filter(v => !f.seen?.includes(v.id));
      if (!f.seen) f.seen = data.entries.map(v => v.id);
      else if (fresh.length) f.seen = [...new Set([...data.entries.map(v => v.id), ...f.seen])].slice(0, 30);
      const ch = guild.channels.cache.get(f.channelId);
      if (!ch) continue;
      const initial = !f.initialized;
      f.initialized = true;
      if (initial) continue;
      for (const v of fresh.reverse().slice(0, 2)) {
        const url = `https://youtu.be/${v.id}`;
        ch.send({ content: `${f.message ? f.message + "\n" : ""}**${data.channelName}** uploaded: **${v.title}**\n${url}` }).catch(() => {});
      }
    }
  }
}

setInterval(pollRedditFeeds, 5 * 60 * 1000);
setInterval(pollYoutubeFeeds, 5 * 60 * 1000);

// ================= NEW SLASH COMMAND HANDLER =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction.commandName;
  const guild = interaction.guild;
  const member = interaction.member;
  if (!guild) return;

  // ----- LOG -----
  if (cmd === "log") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ embeds: [fail(`you need manage server.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    const cfg = getLogCfg(guild.id);
    const ALL = ["messages","members","roles","channels","invites","emojis","voice"];

    if (sub === "add") {
      const ch = interaction.options.getChannel("channel");
      const ev = interaction.options.getString("event");
      const targets = ev === "all" ? ALL : [ev];
      for (const t of targets) cfg.events[t] = { channelId: ch.id, color: cfg.events[t]?.color };
      return interaction.reply({ content: `logging \`${targets.join(", ")}\` to ${ch}`, ephemeral: true });
    }
    if (sub === "remove") {
      const ev = interaction.options.getString("event");
      if (ev === "all") cfg.events = {};
      else delete cfg.events[ev];
      return interaction.reply({ content: `removed logging for \`${ev}\``, ephemeral: true });
    }
    if (sub === "ignore") {
      cfg.ignored.add(interaction.options.getString("target_id"));
      return interaction.reply({ embeds: [fail(`added to ignore list.`)], ephemeral: true });
    }
    if (sub === "unignore") {
      cfg.ignored.delete(interaction.options.getString("target_id"));
      return interaction.reply({ embeds: [fail(`removed from ignore list.`)], ephemeral: true });
    }
    if (sub === "ignorelist") {
      const list = [...cfg.ignored];
      return interaction.reply({ content: list.length ? list.map(x => `\`${x}\``).join(", ") : "ignore list is empty.", ephemeral: true });
    }
    if (sub === "color") {
      const ev = interaction.options.getString("event");
      const hex = parseColor(interaction.options.getString("hex"));
      if (!cfg.events[ev]) return interaction.reply({ embeds: [fail(`that event isn't being logged yet.`)], ephemeral: true });
      cfg.events[ev].color = hex;
      return interaction.reply({ content: `color set for \`${ev}\``, ephemeral: true });
    }
    if (sub === "view") {
      const lines = Object.entries(cfg.events).map(([k, v]) => `**${k}** → <#${v.channelId}>${v.color ? ` (${v.color})` : ""}`);
      const e = new EmbedBuilder().setColor("#87ceeb").setTitle("log config").setDescription(lines.length ? lines.join("\n") : "no events configured");
      return interaction.reply({ embeds: [e], ephemeral: true });
    }
  }

  // ----- WEBHOOK -----
  if (cmd === "webhook") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageWebhooks)) {
      return interaction.reply({ embeds: [fail(`you need manage webhooks.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === "create") {
      try {
        const wh = await interaction.channel.createWebhook({ name: "vanta-webhook" });
        const id = Math.random().toString(36).slice(2, 10);
        webhookStore.set(id, { url: wh.url, channelId: interaction.channel.id, guildId: guild.id });
        return interaction.reply({ content: `created. identifier: \`${id}\` (save this — used with /webhook send)`, ephemeral: true });
      } catch {
        return interaction.reply({ embeds: [fail(`couldn't create webhook here.`)], ephemeral: true });
      }
    }
    if (sub === "send") {
      const id = interaction.options.getString("identifier");
      const text = interaction.options.getString("message");
      const w = webhookStore.get(id);
      if (!w || w.guildId !== guild.id) return interaction.reply({ embeds: [fail(`no webhook with that identifier.`)], ephemeral: true });
      try {
        await fetch(w.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text })
        });
        return interaction.reply({ embeds: [ok(`sent.`)], ephemeral: true });
      } catch {
        return interaction.reply({ embeds: [fail(`failed to send.`)], ephemeral: true });
      }
    }
    if (sub === "list") {
      const mine = [...webhookStore.entries()].filter(([, v]) => v.guildId === guild.id);
      const desc = mine.length ? mine.map(([id, v]) => `\`${id}\` → <#${v.channelId}>`).join("\n") : "no webhooks saved.";
      return interaction.reply({ content: desc, ephemeral: true });
    }
    if (sub === "delete") {
      const id = interaction.options.getString("identifier");
      const w = webhookStore.get(id);
      if (!w || w.guildId !== guild.id) return interaction.reply({ embeds: [fail(`no webhook with that identifier.`)], ephemeral: true });
      try { await fetch(w.url, { method: "DELETE" }); } catch {}
      webhookStore.delete(id);
      return interaction.reply({ embeds: [fail(`deleted.`)], ephemeral: true });
    }
  }

  // ----- VANITY -----
  if (cmd === "vanity") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ embeds: [fail(`you need manage server.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (!vanityConfig.has(guild.id)) vanityConfig.set(guild.id, {});
    const cfg = vanityConfig.get(guild.id);
    if (sub === "set") {
      cfg.substring = interaction.options.getString("substring");
      return interaction.reply({ content: `vanity substring set to \`${cfg.substring}\``, ephemeral: true });
    }
    if (sub === "role") {
      cfg.roleId = interaction.options.getRole("role").id;
      return interaction.reply({ embeds: [fail(`vanity role set.`)], ephemeral: true });
    }
    if (sub === "log") {
      cfg.logChannelId = interaction.options.getChannel("channel").id;
      return interaction.reply({ embeds: [fail(`vanity log channel set.`)], ephemeral: true });
    }
    if (sub === "message") {
      cfg.message = interaction.options.getString("text");
      return interaction.reply({ embeds: [fail(`vanity thank-you message saved.`)], ephemeral: true });
    }
    if (sub === "award") {
      cfg.awardChannelId = interaction.options.getChannel("channel").id;
      return interaction.reply({ embeds: [fail(`vanity award channel set.`)], ephemeral: true });
    }
    if (sub === "view") {
      const e = new EmbedBuilder().setColor("#87ceeb").setTitle("vanity config")
        .addFields(
          { name: "substring", value: cfg.substring ? `\`${cfg.substring}\`` : "not set", inline: true },
          { name: "role", value: cfg.roleId ? `<@&${cfg.roleId}>` : "not set", inline: true },
          { name: "log channel", value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : "not set", inline: true },
          { name: "award channel", value: cfg.awardChannelId ? `<#${cfg.awardChannelId}>` : "not set", inline: true },
          { name: "message", value: cfg.message || "not set" }
        );
      return interaction.reply({ embeds: [e], ephemeral: true });
    }
    if (sub === "disable") {
      vanityConfig.delete(guild.id);
      return interaction.reply({ embeds: [fail(`vanity disabled.`)], ephemeral: true });
    }
  }

  // ----- REACTION ROLES -----
  if (cmd === "rr") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ embeds: [fail(`you need manage roles.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === "add") {
      const msgId = interaction.options.getString("message_id");
      const emojiInput = interaction.options.getString("emoji");
      const role = interaction.options.getRole("role");
      const msg = await interaction.channel.messages.fetch(msgId).catch(() => null);
      if (!msg) return interaction.reply({ embeds: [fail(`message not found in this channel.`)], ephemeral: true });
      const customMatch = emojiInput.match(/<a?:\w+:(\d+)>/);
      const k = customMatch ? customMatch[1] : emojiInput.trim();
      try {
        await msg.react(customMatch ? customMatch[1] : emojiInput.trim());
      } catch {
        return interaction.reply({ embeds: [fail(`couldn't react with that emoji.`)], ephemeral: true });
      }
      const key = rrKey(guild.id, msgId);
      if (!reactionRoles.has(key)) reactionRoles.set(key, new Map());
      reactionRoles.get(key).set(k, role.id);
      return interaction.reply({ content: `reaction role set: ${emojiInput} → ${role}`, ephemeral: true });
    }
    if (sub === "remove") {
      const msgId = interaction.options.getString("message_id");
      const emojiInput = interaction.options.getString("emoji");
      const customMatch = emojiInput.match(/<a?:\w+:(\d+)>/);
      const k = customMatch ? customMatch[1] : emojiInput.trim();
      const m = reactionRoles.get(rrKey(guild.id, msgId));
      if (!m || !m.has(k)) return interaction.reply({ embeds: [fail(`no reaction role with that emoji on that message.`)], ephemeral: true });
      m.delete(k);
      return interaction.reply({ embeds: [fail(`removed.`)], ephemeral: true });
    }
    if (sub === "removeall") {
      const msgId = interaction.options.getString("message_id");
      reactionRoles.delete(rrKey(guild.id, msgId));
      return interaction.reply({ embeds: [fail(`removed all reaction roles on that message.`)], ephemeral: true });
    }
    if (sub === "clear") {
      for (const k of [...reactionRoles.keys()]) if (k.startsWith(guild.id + ":")) reactionRoles.delete(k);
      return interaction.reply({ embeds: [fail(`cleared all reaction roles in this server.`)], ephemeral: true });
    }
    if (sub === "list") {
      const mine = [...reactionRoles.entries()].filter(([k]) => k.startsWith(guild.id + ":"));
      if (!mine.length) return interaction.reply({ embeds: [fail(`no reaction roles configured.`)], ephemeral: true });
      const desc = mine.map(([k, m]) => {
        const msgId = k.split(":")[1];
        const lines = [...m.entries()].map(([emk, rid]) => `${/^\d+$/.test(emk) ? `<:e:${emk}>` : emk} → <@&${rid}>`).join(", ");
        return `**msg \`${msgId}\`**: ${lines}`;
      }).join("\n");
      return interaction.reply({ content: desc.slice(0, 1900), ephemeral: true });
    }
  }

  // ----- PAGINATION -----
  if (cmd === "pagination") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ embeds: [fail(`you need manage messages.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (sub === "create") {
      const raw = interaction.options.getString("pages");
      const title = interaction.options.getString("title");
      const pages = raw.split("---").map(s => s.trim()).filter(Boolean);
      if (pages.length < 2) return interaction.reply({ embeds: [fail("give at least 2 pages, separated by `---`.")], ephemeral: true });
      const pageId = Math.random().toString(36).slice(2, 10);
      const data = { pages, title, current: 0 };
      pageStore.set(pageId, data);
      const sent = await interaction.reply({
        embeds: [pageEmbed(pages[0], title, 0, pages.length)],
        components: buildPageRows(pageId, 0, pages.length),
        fetchReply: true
      });
      data.messageId = sent.id;
      return;
    }
    if (sub === "addpage") {
      const msgId = interaction.options.getString("message_id");
      const text = interaction.options.getString("text");
      const entry = [...pageStore.entries()].find(([, v]) => v.messageId === msgId);
      if (!entry) return interaction.reply({ embeds: [fail(`no pagination found with that message id.`)], ephemeral: true });
      entry[1].pages.push(text);
      return interaction.reply({ content: `added page (${entry[1].pages.length} total).`, ephemeral: true });
    }
    if (sub === "update") {
      const msgId = interaction.options.getString("message_id");
      const idx = interaction.options.getInteger("page") - 1;
      const text = interaction.options.getString("text");
      const entry = [...pageStore.entries()].find(([, v]) => v.messageId === msgId);
      if (!entry) return interaction.reply({ embeds: [fail(`no pagination found.`)], ephemeral: true });
      if (idx < 0 || idx >= entry[1].pages.length) return interaction.reply({ embeds: [fail(`page number out of range.`)], ephemeral: true });
      entry[1].pages[idx] = text;
      return interaction.reply({ embeds: [fail(`page updated.`)], ephemeral: true });
    }
  }

  // ----- SUBREDDIT -----
  if (cmd === "subreddit") {
    const sub = interaction.options.getSubcommand();
    if (sub === "lookup") {
      await interaction.deferReply();
      const name = interaction.options.getString("name").replace(/^r\//, "");
      const posts = await fetchRedditLatest(name);
      if (!posts || !posts.length) return interaction.editReply({ embeds: [ok(`subreddit not found or empty.`)] });
      const p = posts[0];
      const e = new EmbedBuilder().setColor("#ff4500")
        .setTitle(p.title.slice(0, 256))
        .setURL(`https://reddit.com${p.permalink}`)
        .setAuthor({ name: `r/${name} • u/${p.author}` })
        .setDescription((p.selftext || "").slice(0, 500))
        .setTimestamp(new Date(p.created_utc * 1000));
      if (p.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(p.url)) e.setImage(p.url);
      return interaction.editReply({ embeds: [e] });
    }
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ embeds: [fail(`you need manage server.`)], ephemeral: true });
    }
    if (!redditFeeds.has(guild.id)) redditFeeds.set(guild.id, []);
    const list = redditFeeds.get(guild.id);
    if (sub === "add") {
      const ch = interaction.options.getChannel("channel");
      const name = interaction.options.getString("name").replace(/^r\//, "");
      list.push({ name, channelId: ch.id, lastSeen: Math.floor(Date.now() / 1000) });
      return interaction.reply({ content: `streaming r/${name} into ${ch}`, ephemeral: true });
    }
    if (sub === "remove") {
      const name = interaction.options.getString("name").replace(/^r\//, "");
      const before = list.length;
      redditFeeds.set(guild.id, list.filter(f => f.name !== name));
      return interaction.reply({ content: before === list.length ? "no such feed." : `removed r/${name}`, ephemeral: true });
    }
    if (sub === "message") {
      const name = interaction.options.getString("name").replace(/^r\//, "");
      const f = list.find(x => x.name === name);
      if (!f) return interaction.reply({ embeds: [fail(`no such feed.`)], ephemeral: true });
      f.message = interaction.options.getString("text");
      return interaction.reply({ embeds: [fail(`message saved.`)], ephemeral: true });
    }
    if (sub === "color") {
      const name = interaction.options.getString("name").replace(/^r\//, "");
      const f = list.find(x => x.name === name);
      if (!f) return interaction.reply({ embeds: [fail(`no such feed.`)], ephemeral: true });
      f.color = parseColor(interaction.options.getString("hex"));
      return interaction.reply({ embeds: [fail(`color saved.`)], ephemeral: true });
    }
    if (sub === "list") {
      const desc = list.length ? list.map(f => `r/${f.name} → <#${f.channelId}>`).join("\n") : "no feeds.";
      return interaction.reply({ content: desc, ephemeral: true });
    }
  }

  // ----- YOUTUBE -----
  if (cmd === "youtube") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ embeds: [fail(`you need manage server.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (!youtubeFeeds.has(guild.id)) youtubeFeeds.set(guild.id, []);
    const list = youtubeFeeds.get(guild.id);
    if (sub === "add") {
      await interaction.deferReply({ ephemeral: true });
      const ch = interaction.options.getChannel("channel");
      const input = interaction.options.getString("youtube_id");
      const channelId = await resolveYoutubeChannelId(input);
      if (!channelId) return interaction.editReply({ embeds: [ok(`couldn't resolve that youtube channel.`)] });
      list.push({ channelId, originalInput: input, channelDestId: ch.id });
      const data = await fetchYoutubeLatest(channelId);
      const f = list[list.length - 1];
      f.channelId = channelId;
      f.channelId_dest = ch.id;
      f.channelId = channelId;
      // restructure for clarity
      list[list.length - 1] = { channelId, channelId_dest: ch.id, channelId_yt: channelId, channelId_target: ch.id, channelId_input: input, channelId_dest_id: ch.id };
      // simpler: store as separate object
      list[list.length - 1] = { ytId: channelId, channelId: ch.id, message: null, seen: data?.entries.map(v => v.id) || [], initialized: true, input };
      return interaction.editReply(`subscribed to **${data?.channelName || channelId}** in ${ch}`);
    }
    if (sub === "remove") {
      const input = interaction.options.getString("youtube_id");
      const ytId = await resolveYoutubeChannelId(input);
      const before = list.length;
      youtubeFeeds.set(guild.id, list.filter(f => f.ytId !== ytId && f.input !== input));
      return interaction.reply({ content: before === youtubeFeeds.get(guild.id).length ? "no such feed." : "removed.", ephemeral: true });
    }
    if (sub === "message") {
      const input = interaction.options.getString("youtube_id");
      const ytId = await resolveYoutubeChannelId(input);
      const f = list.find(x => x.ytId === ytId || x.input === input);
      if (!f) return interaction.reply({ embeds: [fail(`no such feed.`)], ephemeral: true });
      f.message = interaction.options.getString("text");
      return interaction.reply({ embeds: [fail(`message saved.`)], ephemeral: true });
    }
    if (sub === "list") {
      const desc = list.length ? list.map(f => `${f.input || f.ytId} → <#${f.channelId}>`).join("\n") : "no feeds.";
      return interaction.reply({ content: desc, ephemeral: true });
    }
  }

  // ----- VM extras -----
  if (cmd === "vm") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({ embeds: [fail(`you need manage server.`)], ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    if (!voicemasterConfig.has(guild.id)) voicemasterConfig.set(guild.id, {});
    const cfg = voicemasterConfig.get(guild.id);
    if (sub === "bitrate") {
      cfg.bitrate = interaction.options.getInteger("kbps");
      return interaction.reply({ content: `default bitrate: ${cfg.bitrate} kbps`, ephemeral: true });
    }
    if (sub === "joinrole") {
      cfg.joinRoleId = interaction.options.getRole("role").id;
      return interaction.reply({ embeds: [fail(`join role set.`)], ephemeral: true });
    }
    if (sub === "defaultname") {
      cfg.defaultName = interaction.options.getString("name");
      return interaction.reply({ content: `default name: \`${cfg.defaultName}\``, ephemeral: true });
    }
    if (sub === "category") {
      cfg.categoryId = interaction.options.getChannel("category").id;
      return interaction.reply({ embeds: [fail(`category set.`)], ephemeral: true });
    }
    if (sub === "sendinterface") {
      const e = new EmbedBuilder().setColor("#87ceeb").setTitle("voicemaster controls")
        .setDescription("🔒 lock · 🔓 unlock · 👻 hide · 👁️ reveal · ✋ claim\n🚪 disconnect · ℹ️ info · ➕ +limit · ➖ -limit");
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("vm:lock").setEmoji("🔒").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("vm:unlock").setEmoji("🔓").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("vm:hide").setEmoji("👻").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("vm:reveal").setEmoji("👁️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("vm:claim").setEmoji("✋").setStyle(ButtonStyle.Primary)
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("vm:info").setEmoji("ℹ️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("vm:plus").setEmoji("➕").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("vm:minus").setEmoji("➖").setStyle(ButtonStyle.Danger)
      );
      await interaction.reply({ embeds: [e], components: [row1, row2] });
      return;
    }
  }

  // ----- VM BUTTONS handled below -----

  // ----- CASE SYSTEM -----
  if (cmd === "case") {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return interaction.reply({ embeds: [fail(`you need moderate members.`)], ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const list = modCases.get(guild.id) || [];

    if (sub === "lookup") {
      const target = interaction.options.getUser("user");
      const cases = list.filter(c => c.userId === target.id);
      if (!cases.length) return interaction.reply({ embeds: [ok(`no cases found for ${target.tag}.`)], ephemeral: true });
      const typeEmoji = { ban: "🔨", kick: "👢", warn: "⚠️", timeout: "⏱️", unban: "🔓" };
      const desc = cases.slice(-15).map(c => {
        const ts = `<t:${Math.floor(c.timestamp / 1000)}:d>`;
        return `**#${c.id}** ${typeEmoji[c.type] || "📋"} \`${c.type}\` — ${ts} — ${c.reason}`;
      }).join("\n");
      const e = new EmbedBuilder().setColor("#87ceeb")
        .setTitle(`cases for ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setDescription(desc)
        .setFooter({ text: `${cases.length} total case${cases.length !== 1 ? "s" : ""}` });
      return interaction.reply({ embeds: [e] });
    }

    if (sub === "view") {
      const num = interaction.options.getInteger("number");
      const c = list.find(x => x.id === num);
      if (!c) return interaction.reply({ embeds: [fail(`case #${num} not found.`)], ephemeral: true });
      const typeEmoji = { ban: "🔨", kick: "👢", warn: "⚠️", timeout: "⏱️", unban: "🔓" };
      const e = new EmbedBuilder().setColor("#87ceeb")
        .setTitle(`${typeEmoji[c.type] || "📋"} case #${c.id} — ${c.type}`)
        .addFields(
          { name: "user", value: `<@${c.userId}>`, inline: true },
          { name: "moderator", value: `<@${c.modId}>`, inline: true },
          { name: "date", value: `<t:${Math.floor(c.timestamp / 1000)}:f>`, inline: true },
          { name: "reason", value: c.reason }
        );
      return interaction.reply({ embeds: [e] });
    }

    if (sub === "reason") {
      const num = interaction.options.getInteger("number");
      const newReason = interaction.options.getString("reason");
      const c = list.find(x => x.id === num);
      if (!c) return interaction.reply({ embeds: [fail(`case #${num} not found.`)], ephemeral: true });
      c.reason = newReason;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : updated reason on case #${num}`)] });
    }

    if (sub === "delete") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
        return interaction.reply({ embeds: [fail(`admin only.`)], ephemeral: true });
      const num = interaction.options.getInteger("number");
      const idx = list.findIndex(x => x.id === num);
      if (idx === -1) return interaction.reply({ embeds: [fail(`case #${num} not found.`)], ephemeral: true });
      list.splice(idx, 1);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : deleted case #${num}`)] });
    }
  }
});

// ----- VM control buttons -----
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("vm:")) return;
  const action = interaction.customId.split(":")[1];
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  const ch = member?.voice?.channel;
  if (!ch) return interaction.reply({ embeds: [fail(`you must be in a voice channel.`)], ephemeral: true });
  const ownerId = voicemasterChannels.get(ch.id);
  const isOwner = ownerId === interaction.user.id;
  const everyone = interaction.guild.roles.everyone;
  try {
    if (action === "lock") {
      if (!isOwner) return interaction.reply({ embeds: [fail(`only the owner can do that.`)], ephemeral: true });
      await ch.permissionOverwrites.edit(everyone, { Connect: false });
      return interaction.reply({ embeds: [fail(`🔒 locked.`)], ephemeral: true });
    }
    if (action === "unlock") {
      if (!isOwner) return interaction.reply({ embeds: [fail(`only the owner can do that.`)], ephemeral: true });
      await ch.permissionOverwrites.edit(everyone, { Connect: null });
      return interaction.reply({ embeds: [fail(`🔓 unlocked.`)], ephemeral: true });
    }
    if (action === "hide") {
      if (!isOwner) return interaction.reply({ embeds: [fail(`only the owner.`)], ephemeral: true });
      await ch.permissionOverwrites.edit(everyone, { ViewChannel: false });
      return interaction.reply({ embeds: [fail(`👻 hidden.`)], ephemeral: true });
    }
    if (action === "reveal") {
      if (!isOwner) return interaction.reply({ embeds: [fail(`only the owner.`)], ephemeral: true });
      await ch.permissionOverwrites.edit(everyone, { ViewChannel: null });
      return interaction.reply({ embeds: [fail(`👁️ revealed.`)], ephemeral: true });
    }
    if (action === "claim") {
      if (ownerId && ch.members.has(ownerId)) return interaction.reply({ embeds: [fail(`owner is still here.`)], ephemeral: true });
      voicemasterChannels.set(ch.id, interaction.user.id);
      return interaction.reply({ embeds: [fail(`✋ you claimed this channel.`)], ephemeral: true });
    }
    if (action === "info") {
      const e = new EmbedBuilder().setColor("#87ceeb").setTitle(ch.name)
        .addFields(
          { name: "owner", value: ownerId ? `<@${ownerId}>` : "unclaimed", inline: true },
          { name: "members", value: `${ch.members.size}`, inline: true },
          { name: "user limit", value: ch.userLimit ? `${ch.userLimit}` : "∞", inline: true }
        );
      return interaction.reply({ embeds: [e], ephemeral: true });
    }
    if (action === "plus") {
      if (!isOwner) return interaction.reply({ embeds: [fail(`only the owner.`)], ephemeral: true });
      const lim = Math.min(99, (ch.userLimit || 0) + 1);
      await ch.setUserLimit(lim);
      return interaction.reply({ content: `user limit: ${lim}`, ephemeral: true });
    }
    if (action === "minus") {
      if (!isOwner) return interaction.reply({ embeds: [fail(`only the owner.`)], ephemeral: true });
      const lim = Math.max(0, (ch.userLimit || 0) - 1);
      await ch.setUserLimit(lim);
      return interaction.reply({ content: `user limit: ${lim || "∞"}`, ephemeral: true });
    }
  } catch {
    return interaction.reply({ embeds: [fail(`couldn't do that.`)], ephemeral: true });
  }
});

// ================= DISTUBE SETUP =================

const { YtDlpPlugin } = require("@distube/yt-dlp");

const distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [new YtDlpPlugin({ update: false })],
  joinNewVoiceChannel: true,
  emitAddSongWhenCreatingQueue: false,
  nsfw: false,
});

distube.on("playSong", (queue, song) => {
  const e = new EmbedBuilder().setColor("#87ceeb")
    .setTitle("🎵 now playing")
    .setDescription(`**[${song.name}](${song.url})**`)
    .addFields(
      { name: "duration", value: song.formattedDuration, inline: true },
      { name: "requested by", value: `${song.member}`, inline: true }
    )
    .setThumbnail(song.thumbnail);
  queue.textChannel?.send({ embeds: [e] }).catch(() => {});
});

distube.on("addSong", (queue, song) => {
  queue.textChannel?.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ➕ **${song.name}** added to queue (position ${queue.songs.length})`)] }).catch(() => {});
});

distube.on("error", (error, queue) => {
  queue?.textChannel?.send(`music error: ${error.message}`).catch(() => {});
});

distube.on("finish", queue => {
  queue.textChannel?.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : queue finished.`)] }).catch(() => {});
});

// ================= FUN/UTILITY DATA =================

const ROASTS = [
  "You're the human equivalent of a participation trophy.",
  "I'd roast you, but my mom said I'm not allowed to burn trash.",
  "You have the charisma of a damp paper bag.",
  "If brains were gas, you couldn't power a flea's go-kart.",
  "You're like a cloud — when you disappear, it's a beautiful day.",
  "The only thing sharp about you is your smell.",
  "You bring everyone so much joy when you leave the room.",
  "You're proof that even God makes mistakes on Mondays.",
  "I've seen better comebacks on a warranty card.",
  "Your birth certificate is an apology letter from the hospital."
];

const COMPLIMENTS = [
  "You light up every room you walk into.",
  "You make the world a genuinely better place.",
  "Your vibe is completely unmatched.",
  "People are lucky to have you around.",
  "You're more impressive than you think.",
  "Your energy is magnetic.",
  "You're one of the realest people out there.",
  "Everything you touch turns to gold.",
  "You have a rare kind of heart.",
  "The world needs more people like you."
];

const FACTS = [
  "Honey never spoils — edible honey was found in Egyptian tombs.",
  "A group of flamingos is called a flamboyance.",
  "Octopuses have three hearts and blue blood.",
  "The shortest war in history lasted 38–45 minutes (Anglo-Zanzibar War, 1896).",
  "Bananas are technically berries, but strawberries are not.",
  "A day on Venus is longer than a year on Venus.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "The inventor of the Pringles can is buried in one.",
  "Wombat poop is cube-shaped.",
  "There are more possible chess games than atoms in the observable universe."
];

const WYR = [
  "Would you rather fight 100 duck-sized horses or 1 horse-sized duck?",
  "Would you rather be able to fly but only at walking speed, or be invisible but only when alone?",
  "Would you rather always speak your mind or never speak again?",
  "Would you rather live without music or without TV?",
  "Would you rather be rich and ugly or broke and good-looking?",
  "Would you rather know how you'll die or when you'll die?",
  "Would you rather have a pause button or a rewind button for your life?",
  "Would you rather lose all your memories or never make new ones?",
  "Would you rather be famous but hated or unknown but loved?",
  "Would you rather only be able to whisper or only able to shout?"
];

const WORK_JOBS = [
  "You worked a double shift at the diner 🍽️",
  "You delivered packages across the city 📦",
  "You coded a small website for a client 💻",
  "You walked 12 dogs today 🐕",
  "You cleaned office buildings overnight 🧹",
  "You freelanced some graphic design 🎨",
  "You sold handmade candles at the market 🕯️",
  "You drove for a rideshare app all evening 🚗",
  "You tutored students in math 📐",
  "You streamed for 4 hours and got some tips 🎮"
];

function asciiArt(text) {
  const chars = {
    A:"  _  \n / \\ \n/___\\\n|   |\n|   |", B:"|\\ \n| \\\n|__|\n|   |\n|__/", C:" __\n/  \n|  \n\\__", " ": "   \n   \n   \n   \n   "
  };
  return "```\n" + text.toUpperCase().split("").map(c => c).join("  ") + "\n```";
}

// ================= NEW SLASH HANDLERS =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction.commandName;
  const guild = interaction.guild;
  const member = interaction.member;
  const user = interaction.user;
  if (!guild) return;

  // ===== MODERATION EXTRAS =====

  if (cmd === "unban") {
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return interaction.reply({ embeds: [fail(`you need ban members permission.`)], ephemeral: true });
    const userId = interaction.options.getString("userid");
    const reason = interaction.options.getString("reason") || "no reason";
    try {
      await guild.members.unban(userId, reason);
      const caseId = addCase(guild.id, "unban", userId, interaction.user.id, reason);
      const e = new EmbedBuilder().setColor("#87ceeb").setTitle("🔓 unbanned").addFields({ name: "user id", value: userId }, { name: "reason", value: reason }, { name: "case", value: `#${caseId}` });
      return interaction.reply({ embeds: [e] });
    } catch {
      return interaction.reply({ embeds: [fail(`couldn't unban — make sure the ID is valid and they're actually banned.`)], ephemeral: true });
    }
  }

  if (cmd === "jail") {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return interaction.reply({ embeds: [fail(`you need moderate members.`)], ephemeral: true });
    const target = await guild.members.fetch(interaction.options.getUser("user").id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [fail(`user not found.`)], ephemeral: true });
    let jailRole = guild.roles.cache.find(r => r.name.toLowerCase() === "jailed");
    if (!jailRole) {
      jailRole = await guild.roles.create({ name: "Jailed", color: "#555555", reason: "vanta jail system" }).catch(() => null);
      if (!jailRole) return interaction.reply({ embeds: [fail(`no 'Jailed' role found and couldn't create one.`)], ephemeral: true });
    }
    await target.roles.add(jailRole).catch(() => {});
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff5555").setTitle("🔒 jailed").setDescription(`${E.deny} : ${target} has been jailed.`).addFields({ name: "reason", value: interaction.options.getString("reason") || "no reason" })] });
  }

  if (cmd === "unjail") {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
      return interaction.reply({ embeds: [fail(`you need moderate members.`)], ephemeral: true });
    const target = await guild.members.fetch(interaction.options.getUser("user").id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [fail(`user not found.`)], ephemeral: true });
    const jailRole = guild.roles.cache.find(r => r.name.toLowerCase() === "jailed");
    if (!jailRole) return interaction.reply({ embeds: [fail(`no 'Jailed' role exists.`)], ephemeral: true });
    await target.roles.remove(jailRole).catch(() => {});
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#55ff55").setTitle("🔓 unjailed").setDescription(`${E.approve} : ${target} has been released.`)] });
  }

  if (cmd === "softban") {
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return interaction.reply({ embeds: [fail(`you need ban members.`)], ephemeral: true });
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "softban";
    try {
      await guild.members.ban(target.id, { deleteMessageSeconds: 604800, reason });
      await guild.members.unban(target.id, "softban — message wipe");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setTitle("🧹 softbanned").setDescription(`${E.warning} : ${target.tag}'s messages were wiped and they were unbanned.`)] });
    } catch {
      return interaction.reply({ embeds: [fail(`softban failed.`)], ephemeral: true });
    }
  }

  if (cmd === "massban") {
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return interaction.reply({ embeds: [fail(`you need ban members.`)], ephemeral: true });
    await interaction.deferReply();
    const ids = interaction.options.getString("userids").split(/\s+/).filter(Boolean);
    const reason = interaction.options.getString("reason") || "massban";
    let ok = 0, fail = 0;
    for (const id of ids) {
      try { await guild.members.ban(id, { reason }); ok++; }
      catch { fail++; }
    }
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#ff5555").setTitle("🔨 massban").setDescription(`${E.deny} : banned **${ok}** users. failed: **${fail}**.`)] });
  }

  if (cmd === "hide") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    const ch = interaction.options.getChannel("channel") || interaction.channel;
    await ch.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false }).catch(() => {});
    return interaction.reply({ content: `🙈 hidden ${ch}`, ephemeral: true });
  }

  if (cmd === "unhide") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    const ch = interaction.options.getChannel("channel") || interaction.channel;
    await ch.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: null }).catch(() => {});
    return interaction.reply({ content: `👁️ unhidden ${ch}`, ephemeral: true });
  }

  if (cmd === "nuke") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return interaction.reply({ embeds: [fail(`you need manage channels.`)], ephemeral: true });
    const ch = interaction.channel;
    try {
      const clone = await ch.clone({ reason: `nuke by ${user.tag}` });
      await clone.setPosition(ch.position);
      await ch.delete();
      clone.send({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("💣 channel nuked").setDescription(`${E.approve} : This channel was nuked by ${user}. All messages wiped.`)] });
    } catch {
      return interaction.reply({ embeds: [fail(`nuke failed — check my permissions.`)], ephemeral: true });
    }
  }

  if (cmd === "rolecreate") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return interaction.reply({ embeds: [fail(`you need manage roles.`)], ephemeral: true });
    const name = interaction.options.getString("name");
    const color = parseColor(interaction.options.getString("color")) || "#000000";
    try {
      const role = await guild.roles.create({ name, color, reason: `created by ${user.tag}` });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(color).setDescription(`✅ created ${role}`)] });
    } catch {
      return interaction.reply({ embeds: [fail(`couldn't create role.`)], ephemeral: true });
    }
  }

  if (cmd === "roledelete") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return interaction.reply({ embeds: [fail(`you need manage roles.`)], ephemeral: true });
    const role = interaction.options.getRole("role");
    try {
      await role.delete(`deleted by ${user.tag}`);
      return interaction.reply({ content: `🗑️ deleted **${role.name}**` });
    } catch {
      return interaction.reply({ embeds: [fail(`couldn't delete that role.`)], ephemeral: true });
    }
  }

  if (cmd === "roleadd") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return interaction.reply({ embeds: [fail(`you need manage roles.`)], ephemeral: true });
    const target = await guild.members.fetch(interaction.options.getUser("user").id).catch(() => null);
    const role = interaction.options.getRole("role");
    if (!target) return interaction.reply({ embeds: [fail(`member not found.`)], ephemeral: true });
    await target.roles.add(role).catch(() => {});
    return interaction.reply({ content: `✅ gave ${role} to ${target}` });
  }

  if (cmd === "roleremove") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return interaction.reply({ embeds: [fail(`you need manage roles.`)], ephemeral: true });
    const target = await guild.members.fetch(interaction.options.getUser("user").id).catch(() => null);
    const role = interaction.options.getRole("role");
    if (!target) return interaction.reply({ embeds: [fail(`member not found.`)], ephemeral: true });
    await target.roles.remove(role).catch(() => {});
    return interaction.reply({ content: `✅ removed ${role} from ${target}` });
  }

  // ===== INFO EXTRAS =====

  if (cmd === "bot") {
    const sub = interaction.options.getSubcommand();
    if (sub === "info") {
      const upMs = Date.now() - READY_AT;
      const e = new EmbedBuilder().setColor("#87ceeb").setTitle("vanta — bot info")
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "tag", value: client.user.tag, inline: true },
          { name: "id", value: client.user.id, inline: true },
          { name: "servers", value: `${client.guilds.cache.size}`, inline: true },
          { name: "members", value: `${getTotalMembers().toLocaleString()}`, inline: true },
          { name: "uptime", value: formatDuration(upMs), inline: true },
          { name: "commands", value: `${slashCommands.length} slash`, inline: true },
          { name: "library", value: "discord.js v14", inline: true },
          { name: "node", value: process.version, inline: true }
        ).setTimestamp();
      return interaction.reply({ embeds: [e] });
    }
    if (sub === "uptime") {
      const upMs = Date.now() - READY_AT;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ⏱️ vanta has been online for **${formatDuration(upMs)}**`)] });
    }
  }

  if (cmd === "roles") {
    const sorted = [...guild.roles.cache.values()].filter(r => r.id !== guild.roles.everyone.id).sort((a, b) => b.position - a.position);
    const desc = sorted.map(r => `${r} — ${r.members.size} member${r.members.size !== 1 ? "s" : ""}`).join("\n").slice(0, 2000);
    const e = new EmbedBuilder().setColor("#87ceeb").setTitle(`roles in ${guild.name} (${sorted.length})`).setDescription(desc || "none");
    return interaction.reply({ embeds: [e] });
  }

  if (cmd === "channelinfo") {
    const ch = interaction.options.getChannel("channel") || interaction.channel;
    const e = new EmbedBuilder().setColor("#87ceeb").setTitle(`#${ch.name}`)
      .addFields(
        { name: "id", value: ch.id, inline: true },
        { name: "type", value: ch.type.toString(), inline: true },
        { name: "created", value: `<t:${Math.floor(ch.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "category", value: ch.parent?.name || "none", inline: true },
        { name: "nsfw", value: ch.nsfw ? "yes" : "no", inline: true },
        { name: "slowmode", value: ch.rateLimitPerUser ? `${ch.rateLimitPerUser}s` : "none", inline: true }
      );
    return interaction.reply({ embeds: [e] });
  }

  if (cmd === "firstmessage") {
    const ch = interaction.options.getChannel("channel") || interaction.channel;
    try {
      const msgs = await ch.messages.fetch({ limit: 1, after: "0" });
      const first = msgs.first();
      if (!first) return interaction.reply({ embeds: [fail(`couldn't find the first message.`)], ephemeral: true });
      return interaction.reply({ content: `[jump to first message in ${ch}](${first.url})` });
    } catch {
      return interaction.reply({ embeds: [fail(`couldn't fetch messages.`)], ephemeral: true });
    }
  }

  if (cmd === "permissions") {
    const target = await guild.members.fetch(interaction.options.getUser("user").id).catch(() => null);
    if (!target) return interaction.reply({ embeds: [fail(`member not found.`)], ephemeral: true });
    const ch = interaction.options.getChannel("channel") || interaction.channel;
    const perms = ch.permissionsFor(target);
    if (!perms) return interaction.reply({ embeds: [fail(`couldn't compute permissions.`)], ephemeral: true });
    const allowed = Object.keys(PermissionsBitField.Flags).filter(f => perms.has(PermissionsBitField.Flags[f]));
    const e = new EmbedBuilder().setColor("#87ceeb")
      .setTitle(`${target.user.tag} in #${ch.name}`)
      .setDescription(allowed.map(p => `✅ ${p}`).join("\n").slice(0, 2000) || "no permissions");
    return interaction.reply({ embeds: [e] });
  }

  // ===== ECONOMY =====

  if (cmd === "balance") {
    const target = interaction.options.getUser("user") || user;
    const e = new EmbedBuilder().setColor("#87ceeb").setTitle(`💰 ${target.username}'s balance`)
      .addFields(
        { name: "wallet", value: `🪙 ${getWallet(target.id).toLocaleString()}`, inline: true },
        { name: "bank", value: `🏦 ${getBank(target.id).toLocaleString()}`, inline: true },
        { name: "total", value: `💎 ${(getWallet(target.id) + getBank(target.id)).toLocaleString()}`, inline: true }
      ).setThumbnail(target.displayAvatarURL({ dynamic: true }));
    return interaction.reply({ embeds: [e] });
  }

  if (cmd === "daily") {
    const now = Date.now();
    const last = ecoDailyCooldown.get(user.id) || 0;
    const cd = 24 * 60 * 60 * 1000;
    if (now - last < cd) {
      const left = cd - (now - last);
      return interaction.reply({ content: `⏳ daily resets in **${formatDuration(left)}**`, ephemeral: true });
    }
    ecoDailyCooldown.set(user.id, now);
    const amount = Math.floor(Math.random() * 200) + 100;
    addWallet(user.id, amount);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("📅 daily claimed!").setDescription(`${E.approve} : +🪙 **${amount}** added to your wallet.\nNew wallet: **${getWallet(user.id)}**`)] });
  }

  if (cmd === "weekly") {
    const now = Date.now();
    const last = ecoWeeklyCooldown.get(user.id) || 0;
    const cd = 7 * 24 * 60 * 60 * 1000;
    if (now - last < cd) {
      const left = cd - (now - last);
      return interaction.reply({ content: `⏳ weekly resets in **${formatDuration(left)}**`, ephemeral: true });
    }
    ecoWeeklyCooldown.set(user.id, now);
    const amount = Math.floor(Math.random() * 1000) + 500;
    addWallet(user.id, amount);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("📆 weekly claimed!").setDescription(`${E.approve} : +🪙 **${amount}** added to your wallet.\nNew wallet: **${getWallet(user.id)}**`)] });
  }

  if (cmd === "pay") {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    if (target.id === user.id) return interaction.reply({ embeds: [fail(`you can't pay yourself.`)], ephemeral: true });
    if (target.bot) return interaction.reply({ embeds: [fail(`you can't pay a bot.`)], ephemeral: true });
    if (getWallet(user.id) < amount) return interaction.reply({ embeds: [fail(`you don't have enough in your wallet.`)], ephemeral: true });
    setWallet(user.id, getWallet(user.id) - amount);
    addWallet(target.id, amount);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 💸 ${user} sent 🪙 **${amount}** to ${target}`)] });
  }

  if (cmd === "ecoboard") {
    const all = [...ecoWallet.entries()].map(([uid, w]) => ({ uid, total: w + getBank(uid) }))
      .sort((a, b) => b.total - a.total).slice(0, 10);
    const lines = await Promise.all(all.map(async (x, i) => {
      const u = await client.users.fetch(x.uid).catch(() => null);
      return `**${i + 1}.** ${u ? u.username : x.uid} — 🪙 ${x.total.toLocaleString()}`;
    }));
    const e = new EmbedBuilder().setColor("#87ceeb").setTitle("💰 richest members").setDescription(lines.join("\n") || "no economy data yet.");
    return interaction.reply({ embeds: [e] });
  }

  if (cmd === "gamble") {
    const amount = interaction.options.getInteger("amount");
    if (getWallet(user.id) < amount) return interaction.reply({ embeds: [fail(`not enough in wallet.`)], ephemeral: true });
    const bonus = hasItem(user.id, "lucky_charm") ? 1.5 : 1;
    const win = Math.random() > 0.5;
    if (win) {
      const gain = Math.floor(amount * bonus);
      addWallet(user.id, gain);
      if (hasItem(user.id, "lucky_charm")) removeItem(user.id, "lucky_charm");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#55ff55").setTitle("🎰 you won!").setDescription(`${E.approve} : +🪙 **${gain}**\nwallet: **${getWallet(user.id)}**`)] });
    } else {
      setWallet(user.id, getWallet(user.id) - amount);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff5555").setTitle("🎰 you lost!").setDescription(`${E.deny} : -🪙 **${amount}**\nwallet: **${getWallet(user.id)}**`)] });
    }
  }

  if (cmd === "slots") {
    const amount = interaction.options.getInteger("amount");
    if (getWallet(user.id) < amount) return interaction.reply({ embeds: [fail(`not enough in wallet.`)], ephemeral: true });
    const SYMBOLS = ["🍒", "🍋", "🍊", "⭐", "💎", "7️⃣"];
    const spin = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const s = [spin(), spin(), spin()];
    let result, gain;
    if (s[0] === s[1] && s[1] === s[2]) {
      const mult = s[0] === "💎" ? 10 : s[0] === "7️⃣" ? 7 : 3;
      gain = amount * mult;
      addWallet(user.id, gain - amount);
      result = `🎉 **JACKPOT** (${mult}x)! +🪙 ${gain}`;
    } else if (s[0] === s[1] || s[1] === s[2]) {
      gain = Math.floor(amount * 1.5);
      addWallet(user.id, gain - amount);
      result = `✅ match! +🪙 ${gain}`;
    } else {
      setWallet(user.id, getWallet(user.id) - amount);
      result = `-🪙 ${amount}`;
    }
    const e = new EmbedBuilder().setColor("#87ceeb").setTitle("🎰 slots")
      .setDescription(`[ ${s.join(" | ")} ]\n\n${result}\nwallet: **${getWallet(user.id)}**`);
    return interaction.reply({ embeds: [e] });
  }

  if (cmd === "rob") {
    const target = interaction.options.getUser("user");
    if (target.id === user.id) return interaction.reply({ embeds: [fail(`you can't rob yourself.`)], ephemeral: true });
    if (target.bot) return interaction.reply({ embeds: [fail(`you can't rob a bot.`)], ephemeral: true });
    const now = Date.now();
    const last = ecoRobCooldown.get(user.id) || 0;
    if (now - last < 30 * 60 * 1000) {
      return interaction.reply({ content: `⏳ you can rob again in **${formatDuration(30 * 60 * 1000 - (now - last))}**`, ephemeral: true });
    }
    if (hasItem(target.id, "shield")) {
      removeItem(target.id, "shield");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`${E.warning} : 🛡️ ${target.username} had a rob shield — you got nothing!`)] });
    }
    const targetWallet = getWallet(target.id);
    if (targetWallet < 10) return interaction.reply({ embeds: [fail(`they're broke — not worth it.`)], ephemeral: true });
    ecoRobCooldown.set(user.id, now);
    const success = Math.random() > 0.4;
    if (success) {
      const stolen = Math.floor(targetWallet * (Math.random() * 0.3 + 0.1));
      setWallet(target.id, targetWallet - stolen);
      addWallet(user.id, stolen);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff5555").setTitle("🦹 rob successful").setDescription(`${E.deny} : Stole 🪙 **${stolen}** from ${target}`)] });
    } else {
      const fine = Math.floor(getWallet(user.id) * 0.1);
      setWallet(user.id, getWallet(user.id) - fine);
      addWallet(target.id, fine);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff5555").setTitle("🚔 caught!").setDescription(`${E.deny} : You got caught and paid 🪙 **${fine}** as a fine.`)] });
    }
  }

  if (cmd === "work") {
    const now = Date.now();
    const last = ecoWorkCooldown.get(user.id) || 0;
    if (now - last < 60 * 60 * 1000) {
      return interaction.reply({ content: `⏳ you can work again in **${formatDuration(60 * 60 * 1000 - (now - last))}**`, ephemeral: true });
    }
    ecoWorkCooldown.set(user.id, now);
    let amount = Math.floor(Math.random() * 100) + 50;
    const boosted = hasItem(user.id, "boost");
    if (boosted) { amount *= 2; removeItem(user.id, "boost"); }
    addWallet(user.id, amount);
    const job = WORK_JOBS[Math.floor(Math.random() * WORK_JOBS.length)];
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("💼 work").setDescription(`${E.approve} : ${job}\n\n+🪙 **${amount}**${boosted ? " (boosted!)" : ""}\nwallet: **${getWallet(user.id)}**`)] });
  }

  if (cmd === "deposit") {
    const raw = interaction.options.getString("amount");
    const amount = raw.toLowerCase() === "all" ? getWallet(user.id) : parseInt(raw);
    if (isNaN(amount) || amount <= 0) return interaction.reply({ embeds: [fail(`invalid amount.`)], ephemeral: true });
    if (getWallet(user.id) < amount) return interaction.reply({ embeds: [fail(`not enough in wallet.`)], ephemeral: true });
    setWallet(user.id, getWallet(user.id) - amount);
    setBank(user.id, getBank(user.id) + amount);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🏦 deposited 🪙 **${amount}**\nwallet: **${getWallet(user.id)}** · bank: **${getBank(user.id)}**`)] });
  }

  if (cmd === "withdraw") {
    const raw = interaction.options.getString("amount");
    const amount = raw.toLowerCase() === "all" ? getBank(user.id) : parseInt(raw);
    if (isNaN(amount) || amount <= 0) return interaction.reply({ embeds: [fail(`invalid amount.`)], ephemeral: true });
    if (getBank(user.id) < amount) return interaction.reply({ embeds: [fail(`not enough in bank.`)], ephemeral: true });
    setBank(user.id, getBank(user.id) - amount);
    addWallet(user.id, amount);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🏦 withdrew 🪙 **${amount}**\nwallet: **${getWallet(user.id)}** · bank: **${getBank(user.id)}**`)] });
  }

  if (cmd === "shop") {
    const e = new EmbedBuilder().setColor("#87ceeb").setTitle("🛒 item shop")
      .setDescription(ECO_SHOP.map(i => `**${i.name}** — 🪙 ${i.price}\n${i.desc}`).join("\n\n"));
    return interaction.reply({ embeds: [e] });
  }

  if (cmd === "buy") {
    const query = interaction.options.getString("item").toLowerCase();
    const item = ECO_SHOP.find(i => i.id === query || i.name.toLowerCase().includes(query));
    if (!item) return interaction.reply({ embeds: [fail(`item not found. check /shop.`)], ephemeral: true });
    if (getWallet(user.id) < item.price) return interaction.reply({ content: `you need 🪙 ${item.price} but only have 🪙 ${getWallet(user.id)}.`, ephemeral: true });
    setWallet(user.id, getWallet(user.id) - item.price);
    addItem(user.id, item.id);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ✅ bought **${item.name}** for 🪙 ${item.price}`)] });
  }

  if (cmd === "inventory") {
    const target = interaction.options.getUser("user") || user;
    const inv = getInv(target.id);
    const entries = Object.entries(inv);
    if (!entries.length) return interaction.reply({ content: `${target.username}'s inventory is empty.`, ephemeral: true });
    const desc = entries.map(([id, qty]) => {
      const item = ECO_SHOP.find(i => i.id === id);
      return `${item ? item.name : id} x${qty}`;
    }).join("\n");
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`🎒 ${target.username}'s inventory`).setDescription(desc)] });
  }

  if (cmd === "use") {
    const query = interaction.options.getString("item").toLowerCase();
    const item = ECO_SHOP.find(i => i.id === query || i.name.toLowerCase().includes(query));
    if (!item) return interaction.reply({ embeds: [fail(`item not found.`)], ephemeral: true });
    if (!hasItem(user.id, item.id)) return interaction.reply({ content: `you don't have a **${item.name}**.`, ephemeral: true });
    if (item.id === "mystery_box") {
      removeItem(user.id, item.id);
      const prize = Math.floor(Math.random() * 900) + 100;
      addWallet(user.id, prize);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("📦 mystery box").setDescription(`${E.approve} : You opened the box and found 🪙 **${prize}**!`)] });
    }
    if (item.id === "lucky_charm" || item.id === "shield" || item.id === "boost") {
      return interaction.reply({ content: `${item.name} is used automatically — it activates the next time the relevant command is used.`, ephemeral: true });
    }
    return interaction.reply({ embeds: [fail(`this item can't be manually used.`)], ephemeral: true });
  }

  // ===== FUN EXTRAS =====

  if (cmd === "fun") {
    const sub = interaction.options.getSubcommand();
    if (sub === "joke") {
      await interaction.deferReply();
      try {
        const r = await fetch("https://icanhazdadjoke.com/", { headers: { Accept: "application/json" } });
        const j = await r.json();
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("😄 joke").setDescription(j.joke)] });
      } catch { return interaction.editReply({ embeds: [ok(`couldn't fetch a joke right now.`)] }); }
    }
    if (sub === "meme") {
      await interaction.deferReply();
      try {
        const r = await fetch("https://www.reddit.com/r/memes/random.json", { headers: { "User-Agent": "vanta-bot/1.0" } });
        const j = await r.json();
        const post = j[0]?.data?.children?.[0]?.data;
        if (!post) return interaction.editReply({ embeds: [ok(`couldn't fetch a meme.`)] });
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(post.title).setImage(post.url).setURL(`https://reddit.com${post.permalink}`).setFooter({ text: `👍 ${post.ups}` })] });
      } catch { return interaction.editReply({ embeds: [ok(`couldn't fetch a meme.`)] }); }
    }
    if (sub === "fact") {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🧠 fun fact").setDescription(FACTS[Math.floor(Math.random() * FACTS.length)])] });
    }
    if (sub === "wyr") {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🤔 would you rather").setDescription(WYR[Math.floor(Math.random() * WYR.length)])] });
    }
    if (sub === "roast") {
      const target = interaction.options.getUser("user");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff5555").setTitle(`🔥 roasting ${target.username}`).setDescription(ROASTS[Math.floor(Math.random() * ROASTS.length)])] });
    }
    if (sub === "compliment") {
      const target = interaction.options.getUser("user");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff69b4").setTitle(`💖 hey ${target.username}`).setDescription(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)])] });
    }
    if (sub === "ship") {
      const u1 = interaction.options.getUser("user1");
      const u2 = interaction.options.getUser("user2");
      const seed = [...(u1.id + u2.id)].reduce((a, c) => a + c.charCodeAt(0), 0) % 101;
      const bar = "█".repeat(Math.floor(seed / 10)) + "░".repeat(10 - Math.floor(seed / 10));
      const emoji = seed >= 80 ? "💞" : seed >= 50 ? "💛" : seed >= 25 ? "🤍" : "💔";
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff69b4").setTitle("💘 ship").setDescription(`${u1} **+** ${u2}\n\n**${seed}%** ${emoji}\n\`[${bar}]\``)] });
    }
  }

  if (cmd === "text") {
    const sub = interaction.options.getSubcommand();
    if (sub === "ascii") return interaction.reply(asciiArt(interaction.options.getString("text").slice(0, 20)));
    if (sub === "reverse") {
      const text = interaction.options.getString("text");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : **reversed:** ${[...text].reverse().join("")}`)] });
    }
    if (sub === "mock") {
      const text = interaction.options.getString("text");
      const mocked = [...text].map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(mocked)] });
    }
  }

  // ===== UTILITY EXTRAS =====

  if (cmd === "lookup") {
    const sub = interaction.options.getSubcommand();
    if (sub === "weather") {
      await interaction.deferReply();
      const city = interaction.options.getString("city");
      try {
        const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        if (!r.ok) return interaction.editReply({ embeds: [ok(`city not found.`)] });
        const j = await r.json();
        const cur = j.current_condition[0];
        const area = j.nearest_area[0];
        const name = area.areaName[0].value + ", " + area.country[0].value;
        const e = new EmbedBuilder().setColor("#87ceeb").setTitle(`🌤️ weather in ${name}`)
          .addFields(
            { name: "condition", value: cur.weatherDesc[0].value, inline: true },
            { name: "temperature", value: `${cur.temp_C}°C / ${cur.temp_F}°F`, inline: true },
            { name: "feels like", value: `${cur.FeelsLikeC}°C`, inline: true },
            { name: "humidity", value: `${cur.humidity}%`, inline: true },
            { name: "wind speed", value: `${cur.windspeedKmph} km/h`, inline: true }
          );
        return interaction.editReply({ embeds: [e] });
      } catch { return interaction.editReply({ embeds: [ok(`couldn't fetch weather.`)] }); }
    }
    if (sub === "urban") {
      await interaction.deferReply();
      const term = interaction.options.getString("term");
      try {
        const r = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
        const j = await r.json();
        const entry = j.list?.[0];
        if (!entry) return interaction.editReply({ embeds: [ok(`no definition found.`)] });
        const e = new EmbedBuilder().setColor("#87ceeb")
          .setTitle(`📖 ${entry.word}`)
          .setDescription(entry.definition.replace(/\[|\]/g, "").slice(0, 2000))
          .addFields({ name: "example", value: (entry.example || "none").replace(/\[|\]/g, "").slice(0, 1024) })
          .setFooter({ text: `👍 ${entry.thumbs_up} · 👎 ${entry.thumbs_down}` })
          .setURL(entry.permalink);
        return interaction.editReply({ embeds: [e] });
      } catch { return interaction.editReply({ embeds: [ok(`couldn't fetch definition.`)] }); }
    }
    if (sub === "enlarge") {
      const emojiStr = interaction.options.getString("emoji");
      const match = emojiStr.match(/^<a?:(\w+):(\d+)>$/);
      if (!match) return interaction.reply({ embeds: [fail(`that doesn't look like a custom emoji.`)], ephemeral: true });
      const animated = emojiStr.startsWith("<a:");
      const url = `https://cdn.discordapp.com/emojis/${match[2]}.${animated ? "gif" : "png"}?size=256`;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`:${match[1]}:`).setImage(url)] });
    }
    if (sub === "translate") {
      await interaction.deferReply();
      const lang = interaction.options.getString("language");
      const text = interaction.options.getString("text");
      try {
        const r = await fetch("https://libretranslate.de/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: text, source: "auto", target: lang, format: "text" })
        });
        const j = await r.json();
        if (j.error) return interaction.editReply(`error: ${j.error}`);
        const e = new EmbedBuilder().setColor("#87ceeb").setTitle("🌐 translate")
          .addFields(
            { name: "original", value: text.slice(0, 1024) },
            { name: `translated (${lang})`, value: j.translatedText.slice(0, 1024) }
          );
        return interaction.editReply({ embeds: [e] });
      } catch {
        return interaction.editReply({ embeds: [ok(`translation service unavailable right now.`)] });
      }
    }
  }

  // ===== MUSIC =====

  if (cmd === "music") {
    const sub = interaction.options.getSubcommand();
    if (sub === "lyrics") {
      await interaction.deferReply();
      const song = interaction.options.getString("song");
      try {
        const r = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(song.split(" ")[0])}/${encodeURIComponent(song.split(" ").slice(1).join(" ") || song)}`);
        if (!r.ok) return interaction.editReply({ embeds: [ok(`lyrics not found for that song.`)] });
        const j = await r.json();
        const lyrics = j.lyrics?.slice(0, 2000);
        if (!lyrics) return interaction.editReply({ embeds: [ok(`no lyrics found.`)] });
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`🎵 ${song}`).setDescription(lyrics)] });
      } catch { return interaction.editReply({ embeds: [ok(`lyrics service unavailable.`)] }); }
    }
    if (sub === "play") {
      const voiceChannel = member?.voice?.channel;
      if (!voiceChannel) return interaction.reply({ embeds: [fail(`join a voice channel first.`)], ephemeral: true });
      await interaction.deferReply();
      try {
        await distube.play(voiceChannel, interaction.options.getString("song"), { member, textChannel: interaction.channel });
        return interaction.editReply({ embeds: [ok(`🎵 loading...`)] });
      } catch (e) { return interaction.editReply(`error: ${e.message}`); }
    }
    if (sub === "skip") {
      try {
        const q = distube.getQueue(guild);
        if (!q) return interaction.reply({ embeds: [fail(`nothing is playing.`)], ephemeral: true });
        await distube.skip(guild);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ⏭️ skipped.`)] });
      } catch { return interaction.reply({ embeds: [fail(`couldn't skip.`)], ephemeral: true }); }
    }
    if (sub === "stop") {
      try { distube.stop(guild); return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ⏹️ stopped and queue cleared.`)] }); }
      catch { return interaction.reply({ embeds: [fail(`nothing to stop.`)], ephemeral: true }); }
    }
    if (sub === "pause") {
      try { distube.pause(guild); return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ⏸️ paused.`)] }); }
      catch { return interaction.reply({ embeds: [fail(`nothing to pause.`)], ephemeral: true }); }
    }
    if (sub === "resume") {
      try { distube.resume(guild); return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ▶️ resumed.`)] }); }
      catch { return interaction.reply({ embeds: [fail(`nothing to resume.`)], ephemeral: true }); }
    }
    if (sub === "queue") {
      const q = distube.getQueue(guild);
      if (!q || !q.songs.length) return interaction.reply({ embeds: [fail(`queue is empty.`)], ephemeral: true });
      const list = q.songs.map((s, i) => `**${i === 0 ? "▶️" : i + "."}** ${s.name} (${s.formattedDuration})`).slice(0, 15).join("\n");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🎶 queue").setDescription(list)] });
    }
    if (sub === "nowplaying") {
      const q = distube.getQueue(guild);
      if (!q || !q.songs[0]) return interaction.reply({ embeds: [fail(`nothing is playing.`)], ephemeral: true });
      const s = q.songs[0];
      const e = new EmbedBuilder().setColor("#87ceeb").setTitle("🎵 now playing")
        .setDescription(`**[${s.name}](${s.url})**`)
        .addFields({ name: "duration", value: s.formattedDuration, inline: true }, { name: "volume", value: `${q.volume}%`, inline: true }, { name: "loop", value: ["off","song","queue"][q.repeatMode], inline: true })
        .setThumbnail(s.thumbnail);
      return interaction.reply({ embeds: [e] });
    }
    if (sub === "volume") {
      const q = distube.getQueue(guild);
      if (!q) return interaction.reply({ embeds: [fail(`nothing is playing.`)], ephemeral: true });
      const level = interaction.options.getInteger("level");
      distube.setVolume(guild, level);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🔊 volume set to **${level}%**`)] });
    }
    if (sub === "shuffle") {
      const q = distube.getQueue(guild);
      if (!q) return interaction.reply({ embeds: [fail(`nothing in queue.`)], ephemeral: true });
      distube.shuffle(guild);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🔀 queue shuffled.`)] });
    }
    if (sub === "loop") {
      const q = distube.getQueue(guild);
      if (!q) return interaction.reply({ embeds: [fail(`nothing is playing.`)], ephemeral: true });
      const mode = parseInt(interaction.options.getString("mode"));
      distube.setRepeatMode(guild, mode);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🔁 loop: **${["off","song","queue"][mode]}**`)] });
    }
    if (sub === "seek") {
      const q = distube.getQueue(guild);
      if (!q) return interaction.reply({ embeds: [fail(`nothing is playing.`)], ephemeral: true });
      const secs = interaction.options.getInteger("seconds");
      distube.seek(guild, secs);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : ⏩ seeked to **${secs}s**`)] });
    }
    if (sub === "remove") {
      const q = distube.getQueue(guild);
      if (!q) return interaction.reply({ embeds: [fail(`queue is empty.`)], ephemeral: true });
      const pos = interaction.options.getInteger("position");
      if (pos < 1 || pos >= q.songs.length) return interaction.reply({ embeds: [fail(`invalid position.`)], ephemeral: true });
      const removed = q.songs.splice(pos, 1)[0];
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🗑️ removed **${removed.name}** from queue`)] });
    }
    if (sub === "autoplay") {
      const q = distube.getQueue(guild);
      if (!q) return interaction.reply({ embeds: [fail(`nothing is playing.`)], ephemeral: true });
      const state = distube.toggleAutoplay(guild);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🔄 autoplay **${state ? "on" : "off"}**`)] });
    }
    if (sub === "247") {
      if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return interaction.reply({ embeds: [fail("you need manage server.")], ephemeral: true });
      const voiceChannel = member?.voice?.channel;
      if (!voiceChannel) return interaction.reply({ embeds: [fail("join a voice channel first.")], ephemeral: true });
      const current = twentyfourseven.get(guild.id);
      if (current) {
        // turn off
        clearInterval(current.intervalId);
        twentyfourseven.delete(guild.id);
        return interaction.reply({ embeds: [ok("24/7 mode **disabled**. bot will leave when queue ends.")] });
      } else {
        // turn on — rejoin if disconnected every 30s
        const intervalId = setInterval(async () => {
          try {
            const cfg = twentyfourseven.get(guild.id);
            if (!cfg) return;
            const vc = guild.channels.cache.get(cfg.channelId);
            if (!vc) return;
            const q = distube.getQueue(guild);
            if (!q || !q.voiceChannel) {
              await distube.voices.join(vc);
            }
          } catch {}
        }, 30_000);
        twentyfourseven.set(guild.id, { channelId: voiceChannel.id, intervalId });
        // join now if not already
        try { await distube.voices.join(voiceChannel); } catch {}
        return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : 🔁 24/7 mode **enabled** in **${voiceChannel.name}**. i'll stay in VC permanently.`)] });
      }
    }
  }
});

// ================= TEMPBAN HANDLER =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction.commandName;
  const guild = interaction.guild;
  const member = interaction.member;
  const user = interaction.user;

  if (cmd === "tempban") {
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return interaction.reply({ embeds: [fail("you need ban members.")], ephemeral: true });
    const target = interaction.options.getUser("user");
    const dur = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "no reason given";
    const ms = parseDuration(dur);
    if (!ms) return interaction.reply({ embeds: [fail("invalid duration. use e.g. 10m, 2h, 1d")], ephemeral: true });
    const targetMember = await guild.members.fetch(target.id).catch(() => null);
    if (targetMember && !targetMember.bannable)
      return interaction.reply({ embeds: [fail("i can't ban that user.")], ephemeral: true });
    await guild.members.ban(target.id, { reason });
    const caseId = addCase(guild.id, "tempban", target.id, user.id, reason);
    if (!tempbans.has(guild.id)) tempbans.set(guild.id, new Map());
    const unbanAt = Date.now() + ms;
    const timerId = setTimeout(async () => {
      await guild.members.unban(target.id, "tempban expired").catch(() => {});
      tempbans.get(guild.id)?.delete(target.id);
    }, ms);
    tempbans.get(guild.id).set(target.id, { unbanAt, timerId });
    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`${E.approve} : tempbanned **${target.tag}** for **${dur}** | case #${caseId}`).addFields({ name: "reason", value: reason })] });
  }

  // ================= INVITE TRACKING COMMANDS =================

  if (cmd === "invites") {
    const sub = interaction.options.getSubcommand();
    if (sub === "check") {
      const target = interaction.options.getUser("user") || user;
      const lb = inviteLeaderboard.get(guild.id) || new Map();
      const count = lb.get(target.id) || 0;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`${E.approve} : **${target.username}** has **${count}** invite${count !== 1 ? "s" : ""}.`)] });
    }
    if (sub === "leaderboard") {
      const lb = inviteLeaderboard.get(guild.id) || new Map();
      if (!lb.size) return interaction.reply({ embeds: [fail("no invite data yet.")] });
      const sorted = [...lb.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      const desc = sorted.map(([uid, cnt], i) => `**${i + 1}.** <@${uid}> — **${cnt}** invite${cnt !== 1 ? "s" : ""}`).join("\n");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("📨 invite leaderboard").setDescription(desc)] });
    }
    if (sub === "reset") {
      if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
        return interaction.reply({ embeds: [fail("you need administrator.")], ephemeral: true });
      const target = interaction.options.getUser("user");
      const lb = inviteLeaderboard.get(guild.id) || new Map();
      lb.delete(target.id);
      inviteLeaderboard.set(guild.id, lb);
      return interaction.reply({ embeds: [ok(`reset invite count for **${target.username}**.`)] });
    }
  }

  // ================= ANTI-RAID CONFIG =================

  if (cmd === "antiraid") {
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ embeds: [fail("you need administrator.")], ephemeral: true });
    const sub = interaction.options.getSubcommand();
    if (sub === "enable") {
      const threshold = interaction.options.getInteger("threshold") || 5;
      const action = interaction.options.getString("action") || "timeout";
      antiRaidConfig.set(guild.id, { enabled: true, threshold, action });
      return interaction.reply({ embeds: [ok(`anti-raid enabled. threshold: **${threshold}** joins/10s, action: **${action}**.`)] });
    }
    if (sub === "disable") {
      antiRaidConfig.set(guild.id, { enabled: false });
      return interaction.reply({ embeds: [ok("anti-raid disabled.")] });
    }
    if (sub === "view") {
      const cfg = antiRaidConfig.get(guild.id) || { enabled: false };
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🛡️ anti-raid config")
        .addFields(
          { name: "enabled", value: cfg.enabled ? "yes" : "no", inline: true },
          { name: "threshold", value: String(cfg.threshold || 5), inline: true },
          { name: "action", value: cfg.action || "timeout", inline: true }
        )] });
    }
  }

  // ================= ANTI-NUKE CONFIG =================

  if (cmd === "antinuke") {
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ embeds: [fail("you need administrator.")], ephemeral: true });
    const sub = interaction.options.getSubcommand();
    if (sub === "enable") {
      const threshold = interaction.options.getInteger("threshold") || 3;
      antiNukeConfig.set(guild.id, { enabled: true, threshold });
      return interaction.reply({ embeds: [ok(`anti-nuke enabled. threshold: **${threshold}** deletions/60s before stripping roles.`)] });
    }
    if (sub === "disable") {
      antiNukeConfig.set(guild.id, { enabled: false });
      return interaction.reply({ embeds: [ok("anti-nuke disabled.")] });
    }
    if (sub === "view") {
      const cfg = antiNukeConfig.get(guild.id) || { enabled: false };
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🛡️ anti-nuke config")
        .addFields(
          { name: "enabled", value: cfg.enabled ? "yes" : "no", inline: true },
          { name: "threshold", value: String(cfg.threshold || 3), inline: true }
        )] });
    }
  }

  // ================= AUTOMOD CONFIG =================

  if (cmd === "automod") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return interaction.reply({ embeds: [fail("you need manage server.")], ephemeral: true });
    const sub = interaction.options.getSubcommand();
    if (!automodConfig.has(guild.id)) automodConfig.set(guild.id, { spam: true, links: true, caps: false, capsThreshold: 70 });
    const cfg = automodConfig.get(guild.id);
    if (sub === "spam") {
      cfg.spam = interaction.options.getString("toggle") === "on";
      return interaction.reply({ embeds: [ok(`spam detection **${cfg.spam ? "on" : "off"}**.`)] });
    }
    if (sub === "links") {
      cfg.links = interaction.options.getString("toggle") === "on";
      return interaction.reply({ embeds: [ok(`link blocking **${cfg.links ? "on" : "off"}**.`)] });
    }
    if (sub === "caps") {
      cfg.caps = interaction.options.getString("toggle") === "on";
      const pct = interaction.options.getInteger("percent");
      if (pct) cfg.capsThreshold = pct;
      return interaction.reply({ embeds: [ok(`caps filter **${cfg.caps ? "on" : "off"}** (threshold: **${cfg.capsThreshold}%**).`)] });
    }
    if (sub === "view") {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🤖 automod config")
        .addFields(
          { name: "spam", value: cfg.spam ? "on" : "off", inline: true },
          { name: "links", value: cfg.links ? "on" : "off", inline: true },
          { name: "caps", value: `${cfg.caps ? "on" : "off"} (${cfg.capsThreshold}%)`, inline: true }
        )] });
    }
  }

  // ================= STATS CHANNELS =================

  if (cmd === "statschannels") {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return interaction.reply({ embeds: [fail("you need manage channels.")], ephemeral: true });
    const sub = interaction.options.getSubcommand();
    if (sub === "setup") {
      await interaction.deferReply({ ephemeral: true });
      const category = interaction.options.getChannel("category");
      const existing = statChannels.get(guild.id);
      if (existing) {
        for (const id of Object.values(existing)) {
          const ch = guild.channels.cache.get(id);
          if (ch) await ch.delete().catch(() => {});
        }
      }
      const members = guild.memberCount;
      const bots = guild.members.cache.filter(m => m.user.bot).size;
      const humans = members - bots;
      const chTotal = await guild.channels.create({ name: `👥 Members: ${members}`, type: ChannelType.GuildVoice, parent: category.id, permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.Connect] }] });
      const chHuman = await guild.channels.create({ name: `👤 Humans: ${humans}`, type: ChannelType.GuildVoice, parent: category.id, permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.Connect] }] });
      const chBots = await guild.channels.create({ name: `🤖 Bots: ${bots}`, type: ChannelType.GuildVoice, parent: category.id, permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.Connect] }] });
      statChannels.set(guild.id, { total: chTotal.id, human: chHuman.id, bot: chBots.id });
      return interaction.editReply({ embeds: [ok("stat channels created. they update every 10 minutes.")] });
    }
    if (sub === "remove") {
      const existing = statChannels.get(guild.id);
      if (!existing) return interaction.reply({ embeds: [fail("no stat channels set up.")], ephemeral: true });
      for (const id of Object.values(existing)) {
        const ch = guild.channels.cache.get(id);
        if (ch) await ch.delete().catch(() => {});
      }
      statChannels.delete(guild.id);
      return interaction.reply({ embeds: [ok("stat channels removed.")] });
    }
  }

  // ================= COLOR ROLES =================

  if (cmd === "color") {
    const sub = interaction.options.getSubcommand();
    if (sub === "set") {
      const input = interaction.options.getString("color");
      const hex = parseColor(input);
      if (!hex) return interaction.reply({ embeds: [fail("invalid color. use a hex like `#ff69b4` or a name like `pink`.")], ephemeral: true });
      // remove any existing color role from this user
      const oldRole = member.roles.cache.find(r => r.name.startsWith("color:"));
      if (oldRole) {
        await member.roles.remove(oldRole).catch(() => {});
        if (oldRole.members.size === 0) await oldRole.delete("color role unused").catch(() => {});
      }
      // find or create role
      let role = guild.roles.cache.find(r => r.name === `color:${hex}`);
      if (!role) {
        role = await guild.roles.create({ name: `color:${hex}`, color: hex, reason: "color role" }).catch(() => null);
        if (!role) return interaction.reply({ embeds: [fail("couldn't create role.")], ephemeral: true });
      }
      await member.roles.add(role).catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(hex).setDescription(`${E.approve} : set your color to **${hex}**.`)] });
    }
    if (sub === "remove") {
      const oldRole = member.roles.cache.find(r => r.name.startsWith("color:"));
      if (!oldRole) return interaction.reply({ embeds: [fail("you don't have a color role.")], ephemeral: true });
      await member.roles.remove(oldRole).catch(() => {});
      if (oldRole.members.size === 0) await oldRole.delete("color role unused").catch(() => {});
      return interaction.reply({ embeds: [ok("removed your color role.")] });
    }
    if (sub === "list") {
      const presets = Object.entries(COLOR_NAMES).map(([n, h]) => `**${n}** — \`${h}\``).join("\n");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🎨 preset colors").setDescription(presets)] });
    }
  }

  // ================= ANIMAL / GIF IMAGES =================

  if (cmd === "img") {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();
    try {
      let url;
      if (sub === "dog") {
        const r = await fetch("https://dog.ceo/api/breeds/image/random");
        url = (await r.json()).message;
      } else if (sub === "cat") {
        const r = await fetch("https://api.thecatapi.com/v1/images/search");
        url = (await r.json())[0].url;
      } else if (sub === "fox") {
        const r = await fetch("https://randomfox.ca/floof/");
        url = (await r.json()).image;
      } else if (sub === "duck") {
        const r = await fetch("https://random-d.uk/api/random");
        url = (await r.json()).url;
      } else if (sub === "panda") {
        const r = await fetch("https://some-random-api.com/animal/panda");
        url = (await r.json()).image;
      }
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle(`${sub} 🐾`).setImage(url)] });
    } catch { return interaction.editReply({ embeds: [fail("couldn't fetch image right now.")] }); }
  }

  // ================= TICKET MANAGEMENT COMMANDS =================

  if (cmd === "ticket") {
    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return interaction.reply({ embeds: [fail("you need manage server.")], ephemeral: true });
      const category = interaction.options.getChannel("category");
      const staffRole = interaction.options.getRole("staffrole");
      const logChannel = interaction.options.getChannel("logchannel");
      ticketConfig.set(guild.id, {
        categoryId: category.id,
        staffRoleId: staffRole?.id || null,
        logChannelId: logChannel?.id || null
      });
      return interaction.reply({ embeds: [ok(`ticket system configured.\ncategory: ${category}\nstaff role: ${staffRole || "none"}\nlog channel: ${logChannel || "none"}`)] });
    }

    if (sub === "view") {
      const cfg = ticketConfig.get(guild.id);
      if (!cfg) return interaction.reply({ embeds: [fail("ticket system not configured. use /ticket setup.")], ephemeral: true });
      const cat = guild.channels.cache.get(cfg.categoryId);
      const sr = cfg.staffRoleId ? guild.roles.cache.get(cfg.staffRoleId) : null;
      const lc = cfg.logChannelId ? guild.channels.cache.get(cfg.logChannelId) : null;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🎫 ticket config")
        .addFields(
          { name: "category", value: cat?.name || "deleted", inline: true },
          { name: "staff role", value: sr ? `${sr}` : "none", inline: true },
          { name: "log channel", value: lc ? `${lc}` : "none", inline: true }
        )] });
    }

    if (sub === "add") {
      const ownerMatch = interaction.channel.topic?.match(/ticket-owner:\d+/);
      if (!ownerMatch && !interaction.channel.name.startsWith("ticket-"))
        return interaction.reply({ embeds: [fail("this isn't a ticket channel.")], ephemeral: true });
      if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return interaction.reply({ embeds: [fail("you need manage channels.")], ephemeral: true });
      const target = interaction.options.getUser("user");
      await interaction.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true
      });
      return interaction.reply({ embeds: [ok(`added ${target} to this ticket.`)] });
    }

    if (sub === "remove") {
      if (!interaction.channel.name.startsWith("ticket-"))
        return interaction.reply({ embeds: [fail("this isn't a ticket channel.")], ephemeral: true });
      if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return interaction.reply({ embeds: [fail("you need manage channels.")], ephemeral: true });
      const target = interaction.options.getUser("user");
      await interaction.channel.permissionOverwrites.edit(target.id, { ViewChannel: false });
      return interaction.reply({ embeds: [ok(`removed ${target} from this ticket.`)] });
    }

    if (sub === "rename") {
      if (!interaction.channel.name.startsWith("ticket-"))
        return interaction.reply({ embeds: [fail("this isn't a ticket channel.")], ephemeral: true });
      if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
        return interaction.reply({ embeds: [fail("you need manage channels.")], ephemeral: true });
      const newName = interaction.options.getString("name").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90);
      await interaction.channel.setName(`ticket-${newName}`);
      return interaction.reply({ embeds: [ok(`renamed channel to **ticket-${newName}**.`)] });
    }

    if (sub === "close") {
      if (!interaction.channel.name.startsWith("ticket-"))
        return interaction.reply({ embeds: [fail("this isn't a ticket channel.")], ephemeral: true });
      const ownerMatch = interaction.channel.topic?.match(/ticket-owner:(\d+)/);
      const isOwner = ownerMatch?.[1] === user.id;
      const isStaff = member.permissions.has(PermissionsBitField.Flags.ManageChannels);
      if (!isOwner && !isStaff)
        return interaction.reply({ embeds: [fail("only the ticket owner or staff can close this.")], ephemeral: true });
      const cfg = ticketConfig.get(guild.id);
      if (cfg?.logChannelId) {
        const lc = guild.channels.cache.get(cfg.logChannelId);
        if (lc) lc.send(`🎫 ticket **${interaction.channel.name}** closed by ${user.tag}`).catch(() => {});
      }
      await interaction.reply(`ticket closing in 5 seconds (closed by ${user})...`);
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

// ================= INVITE TRACKING EVENTS =================

client.on("ready", async () => {
  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      const map = new Map();
      invites.forEach(inv => map.set(inv.code, { uses: inv.uses, inviterId: inv.inviter?.id }));
      inviteCache.set(guild.id, map);
    } catch {}
  }
});

client.on("guildMemberAdd", async member => {
  try {
    const cached = inviteCache.get(member.guild.id) || new Map();
    const current = await member.guild.invites.fetch();
    let usedInvite = null;
    for (const inv of current.values()) {
      const old = cached.get(inv.code);
      if (old && inv.uses > old.uses) { usedInvite = inv; break; }
      if (!old && inv.uses > 0) { usedInvite = inv; break; }
    }
    const map = new Map();
    current.forEach(inv => map.set(inv.code, { uses: inv.uses, inviterId: inv.inviter?.id }));
    inviteCache.set(member.guild.id, map);
    if (usedInvite?.inviter) {
      const lb = inviteLeaderboard.get(member.guild.id) || new Map();
      lb.set(usedInvite.inviter.id, (lb.get(usedInvite.inviter.id) || 0) + 1);
      inviteLeaderboard.set(member.guild.id, lb);
    }
  } catch {}
});

client.on("inviteCreate", async inv => {
  const map = inviteCache.get(inv.guild.id) || new Map();
  map.set(inv.code, { uses: inv.uses, inviterId: inv.inviter?.id });
  inviteCache.set(inv.guild.id, map);
});

client.on("inviteDelete", async inv => {
  const map = inviteCache.get(inv.guild.id);
  if (map) map.delete(inv.code);
});

// ================= STAT CHANNELS AUTO-UPDATE =================

setInterval(async () => {
  for (const [guildId, ids] of statChannels.entries()) {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;
      await guild.members.fetch();
      const total = guild.memberCount;
      const bots = guild.members.cache.filter(m => m.user.bot).size;
      const humans = total - bots;
      const chTotal = guild.channels.cache.get(ids.total);
      const chHuman = guild.channels.cache.get(ids.human);
      const chBot = guild.channels.cache.get(ids.bot);
      if (chTotal) await chTotal.setName(`👥 Members: ${total}`).catch(() => {});
      if (chHuman) await chHuman.setName(`👤 Humans: ${humans}`).catch(() => {});
      if (chBot) await chBot.setName(`🤖 Bots: ${bots}`).catch(() => {});
    } catch {}
  }
}, 10 * 60 * 1000);

// ================= FIX: AUTOMOD USES CONFIG =================
// Override the hardcoded anti-spam/anti-link to respect automod config

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  const cfg = automodConfig.get(message.guild.id) || { spam: true, links: true, caps: false, capsThreshold: 70 };

  // caps filter
  if (cfg.caps && message.content.length > 10) {
    const letters = message.content.replace(/[^a-zA-Z]/g, "");
    if (letters.length > 5) {
      const capsPct = (message.content.replace(/[^A-Z]/g, "").length / letters.length) * 100;
      if (capsPct >= cfg.capsThreshold && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        await message.delete().catch(() => {});
        return message.channel.send(`${message.author} please don't use excessive caps.`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
      }
    }
  }
});

// ================= INTERACTION / ACTION COMMANDS =================

const INTERACTION_ACTIONS = {
  hug:       { verb: "hugs",      emoji: "🤗", api: "hug" },
  kiss:      { verb: "kisses",    emoji: "💋", api: "kiss" },
  slap:      { verb: "slaps",     emoji: "👋", api: "slap" },
  pat:       { verb: "pats",      emoji: "🫶", api: "pat" },
  poke:      { verb: "pokes",     emoji: "👉", api: "poke" },
  cuddle:    { verb: "cuddles",   emoji: "🥰", api: "cuddle" },
  bite:      { verb: "bites",     emoji: "😬", api: "bite" },
  highfive:  { verb: "highfives", emoji: "🙌", api: "highfive" },
  punch:     { verb: "punches",   emoji: "👊", api: "punch" },
  stare:     { verb: "stares at", emoji: "👀", api: "stare" },
  wave:      { verb: "waves at",  emoji: "👋", api: "wave" },
  wink:      { verb: "winks at",  emoji: "😉", api: "wink" },
  lick:      { verb: "licks",     emoji: "👅", api: "lick" },
  bonk:      { verb: "bonks",     emoji: "🔨", api: "bonk" },
  yeet:      { verb: "yeets",     emoji: "🚀", api: "yeet" },
  blush:     { verb: "blushes at","emoji": "😊", api: "blush" },
  smile:     { verb: "smiles at", emoji: "😄", api: "smile" },
  nom:       { verb: "noms on",   emoji: "😋", api: "nom" },
  cry:       { verb: "is crying", emoji: "😢", api: "cry" },
  dance:     { verb: "is dancing",emoji: "💃", api: "dance" },
};

async function fetchActionGif(action) {
  try {
    const r = await fetch(`https://nekos.best/api/v2/${action}`);
    const j = await r.json();
    return j.results?.[0]?.url || null;
  } catch { return null; }
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction.commandName;
  const act = cmd === "action" ? INTERACTION_ACTIONS[interaction.options.getString("type")] : null;
  if (!act) return;

  await interaction.deferReply();
  const target = interaction.options.getUser("user");
  const sender = interaction.user;

  let desc;
  if (target && target.id !== sender.id) {
    desc = `${act.emoji} **${sender.displayName || sender.username}** ${act.verb} **${target.displayName || target.username}**!`;
  } else if (target && target.id === sender.id) {
    desc = `${act.emoji} **${sender.displayName || sender.username}** ${act.verb} themselves... okay then.`;
  } else {
    desc = `${act.emoji} **${sender.displayName || sender.username}** ${act.verb}!`;
  }

  const gif = await fetchActionGif(act.api);
  const embed = new EmbedBuilder().setColor("#87ceeb").setDescription(desc);
  if (gif) embed.setImage(gif);

  return interaction.editReply({ embeds: [embed] });
});

// ================= SOCIAL LOOKUP HANDLERS =================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "lookup") return;
  const sub = interaction.options.getSubcommand();
  if (!["youtube", "tiktok", "instagram", "twitter", "reddit"].includes(sub)) return;

  await interaction.deferReply();

  if (sub === "youtube") {
    const query = interaction.options.getString("query");
    const encoded = encodeURIComponent(query);
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encoded}&maxResults=1&type=video&key=${process.env.YOUTUBE_API_KEY}`);
      const j = await r.json();
      const item = j.items?.[0];
      if (!item) return interaction.editReply({ embeds: [fail("no results found.")] });
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const channel = item.snippet.channelTitle;
      const thumb = item.snippet.thumbnails?.high?.url;
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(title)
        .setURL(`https://www.youtube.com/watch?v=${videoId}`)
        .setDescription(`📺 **Channel:** ${channel}\n🔗 https://www.youtube.com/watch?v=${videoId}`)
        .setFooter({ text: "YouTube Search" });
      if (thumb) embed.setThumbnail(thumb);
      return interaction.editReply({ embeds: [embed] });
    } catch {
      // fallback if no API key
      const encoded = encodeURIComponent(query);
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor("#ff0000")
        .setTitle(`🔍 YouTube: ${query}`)
        .setDescription(`No API key set — here's a direct search link:\nhttps://www.youtube.com/results?search_query=${encoded}`)
        .setFooter({ text: "Set YOUTUBE_API_KEY in your .env for richer results" })] });
    }
  }

  if (sub === "tiktok") {
    const query = interaction.options.getString("query");
    const encoded = encodeURIComponent(query);
    return interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor("#010101")
      .setTitle(`🎵 TikTok: ${query}`)
      .setDescription(`🔗 [Search TikTok for **${query}**](https://www.tiktok.com/search?q=${encoded})\n\n*TikTok doesn't allow bots to fetch videos directly.*`)
      .setFooter({ text: "TikTok Search" })] });
  }

  if (sub === "instagram") {
    const username = interaction.options.getString("username").replace(/^@/, "");
    return interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor("#c13584")
      .setTitle(`📸 Instagram: @${username}`)
      .setDescription(`🔗 [View @${username} on Instagram](https://www.instagram.com/${username}/)\n\n*Instagram blocks bots from fetching profile data.*`)
      .setFooter({ text: "Instagram" })] });
  }

  if (sub === "twitter") {
    const username = interaction.options.getString("username").replace(/^@/, "");
    return interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor("#1da1f2")
      .setTitle(`🐦 Twitter/X: @${username}`)
      .setDescription(`🔗 [View @${username} on X](https://x.com/${username})\n\n*Twitter/X requires paid API access for profile data.*`)
      .setFooter({ text: "Twitter / X" })] });
  }

  if (sub === "reddit") {
    const query = interaction.options.getString("query").replace(/^r\//, "").replace(/^u\//, "");
    const isUser = interaction.options.getString("query").startsWith("u/");
    try {
      const url = isUser
        ? `https://www.reddit.com/user/${query}/about.json`
        : `https://www.reddit.com/r/${query}/about.json`;
      const r = await fetch(url, { headers: { "User-Agent": "VantaBot/1.0" } });
      const j = await r.json();
      const data = j.data;
      if (!data) return interaction.editReply({ embeds: [fail("couldn't find that user or subreddit.")] });
      const embed = new EmbedBuilder().setColor("#ff4500");
      if (isUser) {
        embed.setTitle(`👤 u/${data.name}`)
          .setURL(`https://www.reddit.com/user/${data.name}`)
          .addFields(
            { name: "Karma", value: `${(data.total_karma || 0).toLocaleString()}`, inline: true },
            { name: "Post Karma", value: `${(data.link_karma || 0).toLocaleString()}`, inline: true },
            { name: "Comment Karma", value: `${(data.comment_karma || 0).toLocaleString()}`, inline: true }
          );
      } else {
        embed.setTitle(`📋 r/${data.display_name}`)
          .setURL(`https://www.reddit.com/r/${data.display_name}`)
          .setDescription(data.public_description?.slice(0, 300) || "No description.")
          .addFields(
            { name: "Members", value: (data.subscribers || 0).toLocaleString(), inline: true },
            { name: "Online", value: (data.active_user_count || 0).toLocaleString(), inline: true },
            { name: "NSFW", value: data.over18 ? "Yes" : "No", inline: true }
          );
        if (data.icon_img) embed.setThumbnail(data.icon_img);
      }
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ embeds: [fail("couldn't fetch Reddit data.")] });
    }
  }
});

// ================= COMMA PREFIX SOCIAL COMMANDS =================

const COMMA_PREFIX = ",";

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(COMMA_PREFIX)) return;

  const args = message.content.slice(COMMA_PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  // ===== ,ask =====
  if (cmd === "ask") {
    const question = args.join(" ");
    if (!question) return message.reply("usage: `,ask <question>`");
    const typing = await message.channel.sendTyping();
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_KEY}` },
        body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: question }], max_tokens: 500 })
      });
      const j = await r.json();
      const answer = j.choices?.[0]?.message?.content || "no response.";
      return message.reply({ embeds: [new EmbedBuilder().setColor("#74aa9c").setTitle("🤖 ChatGPT").setDescription(answer.slice(0, 4096)).setFooter({ text: `asked by ${message.author.username}` })] });
    } catch { return message.reply("couldn't reach ChatGPT. make sure `OPENAI_KEY` is set in secrets."); }
  }

  // ===== ,twitch =====
  if (cmd === "twitch") {
    const sub = args[0]?.toLowerCase();

    if (!sub) return message.reply("usage: `,twitch <streamer>` or `,twitch add #channel <streamer>`");

    if (sub === "add") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const streamer = args[2]?.toLowerCase();
      if (!channel || !streamer) return message.reply("usage: `,twitch add #channel <streamer>`");
      if (!twitchFeeds.has(message.guild.id)) twitchFeeds.set(message.guild.id, []);
      twitchFeeds.get(message.guild.id).push({ channelId: channel.id, streamer, message: null, pingable: false });
      return message.reply({ embeds: [new EmbedBuilder().setColor("#9146ff").setDescription(`✅ twitch feed set up for **${streamer}** in ${channel}.`)] });
    }

    if (sub === "remove") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const streamer = args[2]?.toLowerCase();
      const feeds = twitchFeeds.get(message.guild.id) || [];
      const idx = feeds.findIndex(f => f.channelId === channel?.id && f.streamer === streamer);
      if (idx === -1) return message.reply("feed not found.");
      feeds.splice(idx, 1);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#9146ff").setDescription(`✅ removed twitch feed for **${streamer}**.`)] });
    }

    if (sub === "list") {
      const feeds = twitchFeeds.get(message.guild.id) || [];
      if (!feeds.length) return message.reply("no twitch feeds set up.");
      const desc = feeds.map(f => `<#${f.channelId}> → **${f.streamer}**`).join("\n");
      return message.reply({ embeds: [new EmbedBuilder().setColor("#9146ff").setTitle("📺 Twitch Feeds").setDescription(desc)] });
    }

    if (sub === "message") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const streamer = args[1]?.toLowerCase();
      const pingable = args.includes("--pingable");
      const msg = args.slice(2).filter(a => a !== "--pingable").join(" ");
      const feeds = twitchFeeds.get(message.guild.id) || [];
      const feed = feeds.find(f => f.streamer === streamer);
      if (!feed) return message.reply(`no feed found for **${streamer}**.`);
      feed.message = msg || null;
      feed.pingable = pingable;
      return message.reply({ embeds: [new EmbedBuilder().setColor("#9146ff").setDescription(`✅ message set for **${streamer}**.`)] });
    }

    // ,twitch <streamer> lookup
    const streamer = sub;
    try {
      const token = await getTwitchToken();
      const r = await fetch(`https://api.twitch.tv/helix/users?login=${streamer}`, {
        headers: { "Client-ID": process.env.TWITCH_CLIENT_ID, "Authorization": `Bearer ${token}` }
      });
      const j = await r.json();
      const user = j.data?.[0];
      if (!user) return message.reply(`streamer **${streamer}** not found.`);
      const streamR = await fetch(`https://api.twitch.tv/helix/streams?user_login=${streamer}`, {
        headers: { "Client-ID": process.env.TWITCH_CLIENT_ID, "Authorization": `Bearer ${token}` }
      });
      const streamJ = await streamR.json();
      const stream = streamJ.data?.[0];
      const embed = new EmbedBuilder()
        .setColor("#9146ff")
        .setTitle(user.display_name)
        .setURL(`https://twitch.tv/${user.login}`)
        .setThumbnail(user.profile_image_url)
        .addFields(
          { name: "Status", value: stream ? "🔴 LIVE" : "⚫ Offline", inline: true },
          { name: "Followers", value: "use Twitch API", inline: true }
        );
      if (stream) embed.setDescription(`**${stream.title}**\n🎮 ${stream.game_name}`);
      return message.reply({ embeds: [embed] });
    } catch {
      return message.reply("couldn't fetch Twitch data. make sure `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are set in secrets.");
    }
  }

  // ===== ,tiktok =====
  if (cmd === "tiktok") {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply("usage: `,tiktok <username>` or `,tiktok add #channel <username>`");

    if (sub === "add") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const username = args[2];
      if (!channel || !username) return message.reply("usage: `,tiktok add #channel <username>`");
      if (!tiktokFeeds.has(message.guild.id)) tiktokFeeds.set(message.guild.id, []);
      tiktokFeeds.get(message.guild.id).push({ channelId: channel.id, username, message: null, pingable: false, live: false });
      return message.reply({ embeds: [new EmbedBuilder().setColor("#010101").setDescription(`✅ TikTok feed set up for **@${username}** in ${channel}.`)] });
    }

    if (sub === "remove") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const username = args[2];
      const feeds = tiktokFeeds.get(message.guild.id) || [];
      const idx = feeds.findIndex(f => f.channelId === channel?.id && f.username === username);
      if (idx === -1) return message.reply("feed not found.");
      feeds.splice(idx, 1);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#010101").setDescription(`✅ removed TikTok feed for **@${username}**.`)] });
    }

    if (sub === "list") {
      const feeds = tiktokFeeds.get(message.guild.id) || [];
      if (!feeds.length) return message.reply("no TikTok feeds set up.");
      const desc = feeds.map(f => `<#${f.channelId}> → **@${f.username}**${f.live ? " (live)" : ""}`).join("\n");
      return message.reply({ embeds: [new EmbedBuilder().setColor("#010101").setTitle("🎵 TikTok Feeds").setDescription(desc)] });
    }

    if (sub === "live") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const username = args[1];
      const toggle = args[2]?.toLowerCase();
      const feeds = tiktokFeeds.get(message.guild.id) || [];
      const feed = feeds.find(f => f.username === username);
      if (!feed) return message.reply(`no feed found for **@${username}**.`);
      feed.live = toggle === "on";
      return message.reply({ embeds: [new EmbedBuilder().setColor("#010101").setDescription(`✅ live notifications **${feed.live ? "on" : "off"}** for **@${username}**.`)] });
    }

    if (sub === "message") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const username = args[1];
      const pingable = args.includes("--pingable");
      const msg = args.slice(2).filter(a => a !== "--pingable").join(" ");
      const feeds = tiktokFeeds.get(message.guild.id) || [];
      const feed = feeds.find(f => f.username === username);
      if (!feed) return message.reply(`no feed found for **@${username}**.`);
      feed.message = msg || null;
      feed.pingable = pingable;
      return message.reply({ embeds: [new EmbedBuilder().setColor("#010101").setDescription(`✅ message set for **@${username}**.`)] });
    }

    // ,tiktok <username> lookup
    const username = sub.replace(/^@/, "");
    return message.reply({ embeds: [new EmbedBuilder().setColor("#010101").setTitle(`🎵 TikTok: @${username}`).setDescription(`🔗 [View @${username} on TikTok](https://www.tiktok.com/@${username})\n\n*TikTok blocks bots from fetching profile data directly.*`)] });
  }

  // ===== ,youtube =====
  if (cmd === "youtube") {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply("usage: `,youtube <search>` or `,youtube add #channel <url>`");

    if (sub === "add") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const ytUrl = args[2];
      if (!channel || !ytUrl) return message.reply("usage: `,youtube add #channel <channel url>`");
      if (!youtubeFeeds.has(message.guild.id)) youtubeFeeds.set(message.guild.id, []);
      youtubeFeeds.get(message.guild.id).push({ channelId: channel.id, ytChannelUrl: ytUrl, message: null, pingable: false });
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ff0000").setDescription(`✅ YouTube feed set up for **${ytUrl}** in ${channel}.`)] });
    }

    if (sub === "remove") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const ytUrl = args[2];
      const feeds = youtubeFeeds.get(message.guild.id) || [];
      const idx = feeds.findIndex(f => f.channelId === channel?.id && f.ytChannelUrl === ytUrl);
      if (idx === -1) return message.reply("feed not found.");
      feeds.splice(idx, 1);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ff0000").setDescription(`✅ removed YouTube feed for **${ytUrl}**.`)] });
    }

    if (sub === "list") {
      const feeds = youtubeFeeds.get(message.guild.id) || [];
      if (!feeds.length) return message.reply("no YouTube feeds set up.");
      const desc = feeds.map(f => `<#${f.channelId}> → **${f.ytChannelUrl}**`).join("\n");
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ff0000").setTitle("📺 YouTube Feeds").setDescription(desc)] });
    }

    if (sub === "message") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const ytUrl = args[1];
      const pingable = args.includes("--pingable");
      const msg = args.slice(2).filter(a => a !== "--pingable").join(" ");
      const feeds = youtubeFeeds.get(message.guild.id) || [];
      const feed = feeds.find(f => f.ytChannelUrl === ytUrl);
      if (!feed) return message.reply(`no feed found for **${ytUrl}**.`);
      feed.message = msg || null;
      feed.pingable = pingable;
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ff0000").setDescription(`✅ message updated.`)] });
    }

    // ,youtube <search>
    const query = args.join(" ");
    const encoded = encodeURIComponent(query);
    if (process.env.YOUTUBE_API_KEY) {
      try {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encoded}&maxResults=1&type=video&key=${process.env.YOUTUBE_API_KEY}`);
        const j = await r.json();
        const item = j.items?.[0];
        if (!item) return message.reply("no results found.");
        const videoId = item.id.videoId;
        return message.reply(`https://www.youtube.com/watch?v=${videoId}`);
      } catch {}
    }
    return message.reply(`🔍 https://www.youtube.com/results?search_query=${encoded}`);
  }

  // ===== ,reddit / ,subreddit =====
  if (cmd === "reddit" || cmd === "subreddit") {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply("usage: `,subreddit r/<name>` or `,subreddit add #channel <name>`");

    if (sub === "add") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const name = args[2]?.replace(/^r\//, "");
      if (!channel || !name) return message.reply("usage: `,subreddit add #channel r/<name>`");
      if (!redditFeeds.has(message.guild.id)) redditFeeds.set(message.guild.id, []);
      redditFeeds.get(message.guild.id).push({ channelId: channel.id, subreddit: name, message: null, pingable: false, color: "#ff4500" });
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ff4500").setDescription(`✅ Reddit feed set up for **r/${name}** in ${channel}.`)] });
    }

    if (sub === "remove") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const name = args[2]?.replace(/^r\//, "");
      const feeds = redditFeeds.get(message.guild.id) || [];
      const idx = feeds.findIndex(f => f.channelId === channel?.id && f.subreddit === name);
      if (idx === -1) return message.reply("feed not found.");
      feeds.splice(idx, 1);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ff4500").setDescription(`✅ removed Reddit feed for **r/${name}**.`)] });
    }

    if (sub === "list") {
      const feeds = redditFeeds.get(message.guild.id) || [];
      if (!feeds.length) return message.reply("no Reddit feeds set up.");
      const desc = feeds.map(f => `<#${f.channelId}> → **r/${f.subreddit}**`).join("\n");
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ff4500").setTitle("📋 Reddit Feeds").setDescription(desc)] });
    }

    if (sub === "color") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const name = args[1]?.replace(/^r\//, "");
      const color = args[2];
      const feeds = redditFeeds.get(message.guild.id) || [];
      const feed = feeds.find(f => f.subreddit === name);
      if (!feed) return message.reply(`no feed found for **r/${name}**.`);
      feed.color = color;
      return message.reply({ embeds: [new EmbedBuilder().setColor(color).setDescription(`✅ color set for **r/${name}**.`)] });
    }

    // lookup
    const name = sub.replace(/^r\//, "");
    try {
      const r = await fetch(`https://www.reddit.com/r/${name}/about.json`, { headers: { "User-Agent": "VantaBot/1.0" } });
      const j = await r.json();
      const data = j.data;
      if (!data) return message.reply("subreddit not found.");
      const embed = new EmbedBuilder().setColor("#ff4500")
        .setTitle(`📋 r/${data.display_name}`)
        .setURL(`https://www.reddit.com/r/${data.display_name}`)
        .setDescription(data.public_description?.slice(0, 300) || "No description.")
        .addFields(
          { name: "Members", value: (data.subscribers || 0).toLocaleString(), inline: true },
          { name: "Online", value: (data.active_user_count || 0).toLocaleString(), inline: true },
          { name: "NSFW", value: data.over18 ? "Yes" : "No", inline: true }
        );
      if (data.icon_img) embed.setThumbnail(data.icon_img);
      return message.reply({ embeds: [embed] });
    } catch { return message.reply("couldn't fetch subreddit data."); }
  }

  // ===== ,pinterest / ,pinsearch =====
  if (cmd === "pinterest") {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply("usage: `,pinterest <username>` or `,pinterest add #channel`");

    if (sub === "add") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply("usage: `,pinterest add #channel`");
      if (!pinterestFeeds.has(message.guild.id)) pinterestFeeds.set(message.guild.id, []);
      pinterestFeeds.get(message.guild.id).push({ channelId: channel.id, message: null, pingable: false });
      return message.reply({ embeds: [new EmbedBuilder().setColor("#e60023").setDescription(`✅ Pinterest feed set up in ${channel}.`)] });
    }

    if (sub === "list") {
      const feeds = pinterestFeeds.get(message.guild.id) || [];
      if (!feeds.length) return message.reply("no Pinterest feeds set up.");
      const desc = feeds.map(f => `<#${f.channelId}>`).join("\n");
      return message.reply({ embeds: [new EmbedBuilder().setColor("#e60023").setTitle("📌 Pinterest Feeds").setDescription(desc)] });
    }

    const username = sub.replace(/^@/, "");
    return message.reply({ embeds: [new EmbedBuilder().setColor("#e60023").setTitle(`📌 Pinterest: ${username}`).setDescription(`🔗 [View ${username} on Pinterest](https://www.pinterest.com/${username}/)`)] });
  }

  if (cmd === "pinsearch") {
    const imageUrl = args[0];
    if (!imageUrl) return message.reply("usage: `,pinsearch <image url>`");
    const encoded = encodeURIComponent(imageUrl);
    return message.reply({ embeds: [new EmbedBuilder().setColor("#e60023").setTitle("📌 Pinterest Lens Search").setDescription(`🔗 [Search Pinterest for this image](https://www.pinterest.com/search/pins/?q=${encoded})`)] });
  }

  // ===== ,setme =====
  if (cmd === "setme") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("you need administrator.");
    await message.channel.sendTyping();
    try {
      // create #jail and #jail-log if they don't exist
      const existing = message.guild.channels.cache;
      let jailCh = existing.find(c => c.name === "jail");
      let jailLogCh = existing.find(c => c.name === "jail-log");
      if (!jailCh) {
        jailCh = await message.guild.channels.create({
          name: "jail",
          type: ChannelType.GuildText,
          permissionOverwrites: [{ id: message.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] }]
        });
      }
      if (!jailLogCh) {
        jailLogCh = await message.guild.channels.create({
          name: "jail-log",
          type: ChannelType.GuildText,
          permissionOverwrites: [{ id: message.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel] }]
        });
      }
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("⚙️ Setup Complete").setDescription(`✅ Created ${jailCh} and ${jailLogCh}.`)] });
    } catch (e) {
      return message.reply(`failed to set up: ${e.message}`);
    }
  }

  // ===== ,setupmute =====
  if (cmd === "setupmute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("you need administrator.");
    await message.channel.sendTyping();
    try {
      const roles = ["mute", "imute", "rmute"];
      const created = [];
      for (const name of roles) {
        let role = message.guild.roles.cache.find(r => r.name === name);
        if (!role) {
          role = await message.guild.roles.create({ name, color: "#808080", reason: "setupmute" });
          created.push(name);
        }
        // apply to all channels
        for (const ch of message.guild.channels.cache.values()) {
          if (ch.type === ChannelType.GuildText) {
            const deny = name === "imute"
              ? [PermissionsBitField.Flags.AddReactions]
              : name === "rmute"
              ? [PermissionsBitField.Flags.ReadMessageHistory]
              : [PermissionsBitField.Flags.SendMessages];
            await ch.permissionOverwrites.edit(role.id, { [name === "imute" ? "AddReactions" : name === "rmute" ? "ReadMessageHistory" : "SendMessages"]: false }).catch(() => {});
          }
        }
      }
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("⚙️ Mute Setup Complete").setDescription(`✅ Mute roles ready: **mute**, **imute**, **rmute**\n${created.length ? `Created: ${created.join(", ")}` : "All roles already existed, permissions updated."}`)] });
    } catch (e) {
      return message.reply(`failed: ${e.message}`);
    }
  }

  // ===== ,settings =====
  if (cmd === "settings") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("you need administrator.");
    const setting = args[0]?.toLowerCase();
    const value = args[1]?.toLowerCase();

    if (setting === "jailroles") {
      const guildSettings = serverSettings.get(message.guild.id) || {};
      guildSettings.jailRoles = value === "yes";
      serverSettings.set(message.guild.id, guildSettings);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`✅ **jailroles** set to **${value === "yes" ? "yes" : "no"}**. Roles will ${value === "yes" ? "be removed" : "not be removed"} when a member is jailed.`)] });
    }

    return message.reply("unknown setting. available: `jailroles yes/no`");
  }

  // ===== ,fp (fake permissions) =====
  if (cmd === "fp") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("you need administrator.");
    const sub = args[0]?.toLowerCase();

    const VALID_FP = ["manage_messages", "moderate_members", "manage_nicknames", "manage_roles", "ban_members", "kick_members", "administrator", "manage_channels", "view_audit_log", "manage_guild"];

    if (sub === "grant") {
      const role = message.mentions.roles.first();
      const perm = args[2]?.toLowerCase();
      if (!role || !perm) return message.reply("usage: `,fp grant @role <permission>`");
      if (!VALID_FP.includes(perm)) return message.reply(`invalid permission. valid: ${VALID_FP.join(", ")}`);
      if (!fakePerms.has(message.guild.id)) fakePerms.set(message.guild.id, new Map());
      const guildFp = fakePerms.get(message.guild.id);
      if (!guildFp.has(role.id)) guildFp.set(role.id, new Set());
      guildFp.get(role.id).add(perm);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`✅ granted **${perm}** to ${role}.`)] });
    }

    if (sub === "revoke") {
      const role = message.mentions.roles.first();
      const perm = args[2]?.toLowerCase();
      if (!role || !perm) return message.reply("usage: `,fp revoke @role <permission>`");
      const guildFp = fakePerms.get(message.guild.id);
      guildFp?.get(role.id)?.delete(perm);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`✅ revoked **${perm}** from ${role}.`)] });
    }

    if (sub === "list") {
      const guildFp = fakePerms.get(message.guild.id);
      if (!guildFp?.size) return message.reply("no fake permissions set up.");
      const desc = [...guildFp.entries()].map(([rid, perms]) => `<@&${rid}>: ${[...perms].join(", ")}`).join("\n");
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🔐 Fake Permissions").setDescription(desc)] });
    }

    return message.reply("usage: `,fp grant @role <permission>` | `,fp revoke @role <permission>` | `,fp list`");
  }

  // ===== ,prefix =====
  if (cmd === "prefix") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("you need administrator.");
    const sub = args[0]?.toLowerCase();
    if (sub === "set") {
      const newPrefix = args[1];
      if (!newPrefix) return message.reply("usage: `,prefix set <symbol>`");
      const guildSettings = serverSettings.get(message.guild.id) || {};
      guildSettings.customPrefix = newPrefix;
      serverSettings.set(message.guild.id, guildSettings);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`✅ prefix set to **${newPrefix}** for this server.`)] });
    }
    return message.reply(`current prefix: \`${serverSettings.get(message.guild.id)?.customPrefix || ","}\``);
  }

  // ===== ,tts =====
  if (cmd === "tts") {
    const voice = args[0];
    const text = args.slice(1).join(" ");
    if (!voice || !text) return message.reply("usage: `,tts <voice> <text>` — e.g. `,tts Joey hello!`");

    const VALID_VOICES = [
      "Maxim","Cristiano","Ricardo","Jan","Jacek","Ruben","Takumi","Giorgio","Karl","Mathieu",
      "Miguel","Enrique","Geraint","Matthew","Justin","Joey","Brian","Russell","Hans","Mads",
      "Gwyneth","Danny","Asaf","Stefanos","Filip","Ivan","Heidi","Herena","Kalpana","Hemant",
      "Matej","Andika","Rizwan","Lado","Valluvar","Sean","Michael","Karsten","Guillaume",
      "Pattara","Jakub","Szabolcs","Hoda","Naayf",
      "Filiz","Astrid","Tatyana","Carmen","Ines","Vitoria","Maja","Ewa","Lotte","Liv",
      "Seoyeon","Mizuki","Carla","Bianca","Dora","Celine","Chantal","Penelope","Mia",
      "Conchita","Salli","Kimberly","Kendra","Joanna","Ivy","Raveena","Zhiwei"
    ];

    const matchedVoice = VALID_VOICES.find(v => v.toLowerCase() === voice.toLowerCase());
    if (!matchedVoice) return message.reply(`invalid voice. use \`,tts voices\` to see all available voices.`);

    await message.channel.sendTyping();
    try {
      const encoded = encodeURIComponent(text.slice(0, 500));
      // try streamelements first, fall back to google TTS
      let buffer;
      try {
        const r = await fetch(`https://api.streamelements.com/kappa/v2/speech?voice=${matchedVoice}&text=${encoded}`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!r.ok) throw new Error("SE failed");
        buffer = Buffer.from(await r.arrayBuffer());
      } catch {
        // fallback: google translate TTS
        const r = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!r.ok) throw new Error("Google TTS failed");
        buffer = Buffer.from(await r.arrayBuffer());
      }
      return message.reply({ files: [{ attachment: buffer, name: "tts.mp3" }] });
    } catch { return message.reply("couldn't generate TTS audio right now. try again in a moment."); }
  }

  if (cmd === "tts" && args[0]?.toLowerCase() === "voices") {
    return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setTitle("🎙️ TTS Voices")
      .addFields(
        { name: "Male", value: "Maxim, Cristiano, Ricardo, Jan, Jacek, Ruben, Takumi, Giorgio, Karl, Mathieu, Miguel, Enrique, Geraint, Matthew, Justin, Joey, Brian, Russell, Hans, Mads, Gwyneth, Danny, Asaf, Stefanos, Filip, Ivan, Heidi, Herena, Kalpana, Hemant, Matej, Andika, Rizwan, Lado, Valluvar, Sean, Michael, Karsten, Guillaume, Pattara, Jakub, Szabolcs, Hoda, Naayf" },
        { name: "Female", value: "Filiz, Astrid, Tatyana, Carmen, Ines, Vitoria, Maja, Ewa, Lotte, Liv, Seoyeon, Mizuki, Carla, Bianca, Dora, Celine, Chantal, Penelope, Mia, Conchita, Salli, Kimberly, Kendra, Joanna, Ivy, Raveena, Zhiwei" }
      )] });
  }

  // ===== ,gw / ,giveaway =====
  if (cmd === "gw" || cmd === "giveaway") {
    const sub = args[0]?.toLowerCase();

    if (sub === "start") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const channel = message.mentions.channels.first();
      const duration = args[2];
      const winnersStr = args[3];
      const prize = args.slice(4).join(" ");
      if (!channel || !duration || !winnersStr || !prize)
        return message.reply("usage: `,gw start #channel <duration> <winners> <prize>` — e.g. `,gw start #giveaways 1h 1 Discord Nitro`");

      const ms = parseDuration(duration);
      if (!ms) return message.reply("invalid duration. use e.g. `1h`, `2d`, `30m`");
      const winners = parseInt(winnersStr);
      if (isNaN(winners) || winners < 1) return message.reply("winners must be a number.");

      const endsAt = new Date(Date.now() + ms);
      const gwMsg = await channel.send({ embeds: [new EmbedBuilder()
        .setColor("#ffaa00")
        .setTitle("🎉 GIVEAWAY")
        .setDescription(`**${prize}**\n\nReact with 🎉 to enter!\n\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n**Winners:** ${winners}`)
        .setFooter({ text: `Hosted by ${message.author.username}` })
        .setTimestamp(endsAt)] });

      await gwMsg.react("🎉");

      if (!giveaways.has(message.guild.id)) giveaways.set(message.guild.id, []);
      giveaways.get(message.guild.id).push({
        id: gwMsg.id,
        channelId: channel.id,
        prize,
        winners,
        endsAt: endsAt.getTime(),
        hostId: message.author.id,
        ended: false,
        requiredRoles: [],
        requiredLevel: null
      });

      // auto-end timer
      setTimeout(async () => {
        await endGiveaway(message.guild, gwMsg.id);
      }, ms);

      return message.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`✅ giveaway started in ${channel}!`)] });
    }

    if (sub === "end") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const msgLink = args[1];
      const gwId = msgLink?.split("/").pop();
      if (!gwId) return message.reply("usage: `,gw end <message link>`");
      await endGiveaway(message.guild, gwId);
      return message.reply("giveaway ended.");
    }

    if (sub === "reroll") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const msgLink = args[1];
      const gwId = msgLink?.split("/").pop();
      if (!gwId) return message.reply("usage: `,gw reroll <message link>`");
      const guildGws = giveaways.get(message.guild.id) || [];
      const gw = guildGws.find(g => g.id === gwId);
      if (!gw) return message.reply("giveaway not found.");
      const ch = message.guild.channels.cache.get(gw.channelId);
      const gwMsg = await ch?.messages.fetch(gwId).catch(() => null);
      if (!gwMsg) return message.reply("couldn't find the giveaway message.");
      const reaction = gwMsg.reactions.cache.get("🎉");
      const users = (await reaction?.users.fetch())?.filter(u => !u.bot) || new Map();
      if (!users.size) return message.reply("no entrants to reroll.");
      const newWinners = [...users.values()].sort(() => Math.random() - 0.5).slice(0, gw.winners);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setTitle("🎉 Rerolled!").setDescription(`New winner${newWinners.length > 1 ? "s" : ""}: ${newWinners.map(u => `<@${u.id}>`).join(", ")}`)] });
    }

    if (sub === "cancel") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const msgLink = args[1];
      const gwId = msgLink?.split("/").pop();
      if (!gwId) return message.reply("usage: `,gw cancel <message link>`");
      const guildGws = giveaways.get(message.guild.id) || [];
      const idx = guildGws.findIndex(g => g.id === gwId);
      if (idx === -1) return message.reply("giveaway not found.");
      const gw = guildGws[idx];
      const ch = message.guild.channels.cache.get(gw.channelId);
      const gwMsg = await ch?.messages.fetch(gwId).catch(() => null);
      if (gwMsg) await gwMsg.edit({ embeds: [new EmbedBuilder().setColor("#808080").setTitle("🎉 GIVEAWAY CANCELLED").setDescription(`~~${gw.prize}~~\n\nThis giveaway has been cancelled.`)] });
      guildGws.splice(idx, 1);
      return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription("✅ giveaway cancelled.")] });
    }

    if (sub === "list") {
      const guildGws = giveaways.get(message.guild.id) || [];
      if (!guildGws.length) return message.reply("no giveaways found.");
      const desc = guildGws.map((g, i) => `**${i + 1}** ${g.prize}${g.ended ? " (ended)" : ""}`).join("\n");
      return message.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setTitle(`🎉 Giveaways`).setDescription(desc).setFooter({ text: `Page 1/1 (${guildGws.length} giveaway${guildGws.length !== 1 ? "s" : ""})` })] });
    }

    if (sub === "edit") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return message.reply("you need manage server.");
      const setting = args[1]?.toLowerCase();
      const msgLink = args[2];
      const gwId = msgLink?.split("/").pop();
      const guildGws = giveaways.get(message.guild.id) || [];
      const gw = guildGws.find(g => g.id === gwId);
      if (!gw) return message.reply("giveaway not found.");

      if (setting === "requiredroles") {
        const roles = message.mentions.roles.map(r => r.id);
        gw.requiredRoles = roles;
        return message.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`✅ required roles updated: ${roles.length ? roles.map(id => `<@&${id}>`).join(", ") : "none"}`)] });
      }

      if (setting === "prize") {
        gw.prize = args.slice(3).join(" ");
        return message.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`✅ prize updated to **${gw.prize}**`)] });
      }

      if (setting === "winners") {
        gw.winners = parseInt(args[3]) || 1;
        return message.reply({ embeds: [new EmbedBuilder().setColor("#ffaa00").setDescription(`✅ winners updated to **${gw.winners}**`)] });
      }

      return message.reply("usage: `,gw edit requiredroles/prize/winners <message link> <value>`");
    }

    return message.reply("usage: `,gw start/end/reroll/cancel/list/edit`");
  }

  // ===== ,customize =====
  if (cmd === "customize") {
    if (message.author.id !== message.guild.ownerId)
      return message.reply("only the server owner can use this command.");
    const sub = args[0]?.toLowerCase();

    if (sub === "avatar") {
      const url = args[1];
      if (!url) return message.reply("usage: `,customize avatar <image url>`");
      try {
        await client.user.setAvatar(url);
        return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription("✅ bot avatar updated!").setThumbnail(url)] });
      } catch (e) { return message.reply(`failed: ${e.message}`); }
    }

    if (sub === "banner") {
      const url = args[1];
      if (!url) return message.reply("usage: `,customize banner <image url>`");
      try {
        await client.user.setBanner(url);
        return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription("✅ bot banner updated!")] });
      } catch (e) { return message.reply(`failed: ${e.message} (note: banner requires Discord Nitro on the bot account)`); }
    }

    if (sub === "bio") {
      const bio = args.slice(1).join(" ");
      if (!bio) return message.reply("usage: `,customize bio <text>`");
      try {
        await client.user.setAboutMe(bio);
        return message.reply({ embeds: [new EmbedBuilder().setColor("#87ceeb").setDescription(`✅ bot bio updated to: ${bio}`)] });
      } catch (e) { return message.reply(`failed: ${e.message}`); }
    }

    return message.reply("usage: `,customize avatar/banner/bio <value>`");
  }

  // ===== ,translate =====
  if (cmd === "translate") {
    const to = args[0];
    const from = args[1];
    const text = args.slice(2).join(" ");
    if (!to || !text) return message.reply("usage: `,translate <to> <from> <text>` — e.g. `,translate fr en hello`");
    await message.channel.sendTyping();
    try {
      const encoded = encodeURIComponent(text);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from || "auto"}&tl=${to}&dt=t&q=${encoded}`;
      const r = await fetch(url);
      const j = await r.json();
      const translated = j[0]?.map(s => s[0]).join("") || "translation failed.";
      const langNames = { en: "English", fr: "French", es: "Spanish", de: "German", it: "Italian", pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean", zh: "Chinese", ar: "Arabic", hi: "Hindi" };
      const fromName = langNames[from] || from?.toUpperCase() || "Auto";
      const toName = langNames[to] || to?.toUpperCase();
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor("#4285f4")
        .setAuthor({ name: message.author.displayName || message.author.username, iconURL: message.author.displayAvatarURL() })
        .setTitle(`Translated from ${fromName} to ${toName}`)
        .setDescription(`\`\`\`${translated}\`\`\``)
        .setFooter({ text: "Google Translate", iconURL: "https://www.google.com/favicon.ico" })] });
    } catch { return message.reply("translation failed. check the language codes and try again."); }
  }

  // ===== ,spotify =====
  if (cmd === "spotify") {
    const sub = args[0]?.toLowerCase();
    if (!sub) return message.reply("usage: `,spotify <track name>`");
    if (sub === "login") {
      return message.reply({ embeds: [new EmbedBuilder().setColor("#1db954").setTitle("🎵 Spotify Login").setDescription("Spotify OAuth requires a web server setup. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to your secrets to enable full Spotify integration.")] });
    }
    const query = args.join(" ");
    try {
      const token = await getSpotifyToken();
      const encoded = encodeURIComponent(query);
      const r = await fetch(`https://api.spotify.com/v1/search?q=${encoded}&type=track&limit=1`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const j = await r.json();
      const track = j.tracks?.items?.[0];
      if (!track) return message.reply("no track found.");
      const embed = new EmbedBuilder()
        .setColor("#1db954")
        .setTitle(track.name)
        .setURL(track.external_urls.spotify)
        .setDescription(`🎤 **${track.artists.map(a => a.name).join(", ")}**\n💿 ${track.album.name}`)
        .setThumbnail(track.album.images?.[0]?.url)
        .addFields({ name: "Duration", value: `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}`, inline: true });
      return message.reply({ embeds: [embed] });
    } catch { return message.reply("couldn't fetch Spotify data. make sure `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set in secrets."); }
  }
});

// ===== SPOTIFY TOKEN HELPER =====
async function getSpotifyToken() {
  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const j = await r.json();
  return j.access_token;
}

// ===== TWITCH TOKEN HELPER =====
async function getTwitchToken() {
  const r = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, { method: "POST" });
  const j = await r.json();
  return j.access_token;
}

// ===== GIVEAWAY HELPER =====
async function endGiveaway(guild, gwId) {
  const guildGws = giveaways.get(guild.id) || [];
  const gw = guildGws.find(g => g.id === gwId);
  if (!gw || gw.ended) return;
  gw.ended = true;
  try {
    const ch = guild.channels.cache.get(gw.channelId);
    const gwMsg = await ch?.messages.fetch(gwId).catch(() => null);
    if (!gwMsg) return;
    const reaction = gwMsg.reactions.cache.get("🎉");
    let users = (await reaction?.users.fetch())?.filter(u => !u.bot) || new Map();
    if (gw.requiredRoles?.length) {
      const filtered = new Map();
      for (const [id, user] of users) {
        const member = await guild.members.fetch(id).catch(() => null);
        if (member && gw.requiredRoles.every(rid => member.roles.cache.has(rid))) filtered.set(id, user);
      }
      users = filtered;
    }
    if (!users.size) {
      await gwMsg.edit({ embeds: [new EmbedBuilder().setColor("#808080").setTitle("🎉 GIVEAWAY ENDED").setDescription(`**${gw.prize}**\n\nNo valid entrants.`)] });
      return ch?.send("no valid entrants for the giveaway.");
    }
    const winners = [...users.values()].sort(() => Math.random() - 0.5).slice(0, gw.winners);
    await gwMsg.edit({ embeds: [new EmbedBuilder().setColor("#ffaa00").setTitle("🎉 GIVEAWAY ENDED").setDescription(`**${gw.prize}**\n\nWinner${winners.length > 1 ? "s" : ""}: ${winners.map(u => `<@${u.id}>`).join(", ")}`)] });
    return ch?.send(`🎉 Congratulations ${winners.map(u => `<@${u.id}>`).join(", ")}! You won **${gw.prize}**!`);
  } catch {}
}

// ================= LOGIN =================

client.login(process.env.TOKEN);
