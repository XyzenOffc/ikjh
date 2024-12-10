const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');

// Token bot Telegram Anda
const token = '7361099428:AAHsbnKKUK_aYNsPZNX4BqMLPg3su79JG90';
const bot = new TelegramBot(token, { polling: true });

// Fungsi membaca sesi
function readSession() {
    try {
        return JSON.parse(fs.readFileSync('./database/aisesi.json', 'utf8'));
    } catch (error) {
        return {};
    }
}

// Fungsi menulis sesi
function writeSession(data) {
    fs.writeFileSync('./database/aisesi.json', JSON.stringify(data, null, 2));
}

// Tangani perintah `/ai` dan `/openai`
bot.onText(/\/(ai|openai) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[2]; // Query dari user
    let sessions = readSession();
    let userSession = sessions[chatId] || "";

    if (!text) {
        return bot.sendMessage(chatId, "Masukkan query!");
    }

    try {
        let question = userSession ? `${userSession}\n${text}` : text;
        const URL = "https://meitang.xyz/openai";

        let { data } = await axios.get(URL, {
            params: { text: question }
        });

        if (data.status) {
            sessions[chatId] = `${question}\n${data.result}`;
            writeSession(sessions);
            bot.sendMessage(chatId, data.result);
        } else {
            bot.sendMessage(chatId, "Gagal mendapatkan respons dari API.");
        }
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Sesi sudah mencapai batas!\nKetik /resetsesi dan coba lagi.");
    }
});

// Tangani perintah `/resetsesi`
bot.onText(/\/resetsesi/, (msg) => {
    const chatId = msg.chat.id;
    let sessions = readSession();
    delete sessions[chatId];
    writeSession(sessions);
    bot.sendMessage(chatId, "Sesi AI berhasil direset!");
});

// Buat folder `database` jika belum ada
if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database');
}

// Buat file `aisesi.json` jika belum ada
if (!fs.existsSync('./database/aisesi.json')) {
    fs.writeFileSync('./database/aisesi.json', '{}');
}
