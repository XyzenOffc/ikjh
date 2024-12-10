const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Token bot Telegram
const token = '7361099428:AAHsbnKKUK_aYNsPZNX4BqMLPg3su79JG90';

// ID owner
const ownerId = 7257721467; // Ganti dengan ID Telegram Anda

// Inisialisasi bot
const bot = new TelegramBot(token, { polling: true });

// Fungsi untuk membaca sesi
function readSession() {
    try {
        return JSON.parse(fs.readFileSync('./database/aisesi.json', 'utf8'));
    } catch (error) {
        return {};
    }
}

// Fungsi untuk menulis sesi
function writeSession(data) {
    fs.writeFileSync('./database/aisesi.json', JSON.stringify(data, null, 2));
}

// Handler pesan
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Cek apakah pesan berasal dari owner
    if (msg.from.id === ownerId) {
        bot.sendMessage(chatId, "Siap, Tuan Xyzen! Pesan Anda sedang diproses...");
    }

    // Jika tidak ada teks, jangan lakukan apa-apa
    if (!text) return;

    // Integrasi dengan API AI
    try {
        let sessions = readSession();
        let userSession = sessions[msg.from.id] || "";
        let question = userSession ? `${userSession}\n${text}` : text;
        const URL = "https://meitang.xyz/openai";
        let { data } = await axios({
            method: "GET",
            url: URL,
            params: { text: question }
        });

        if (data.status) {
            sessions[msg.from.id] = `${question}\n${data.result}`;
            writeSession(sessions);
            bot.sendMessage(chatId, data.result);
        } else {
            bot.sendMessage(chatId, "Gagal mendapatkan respons dari API.");
        }
    } catch (e) {
        console.log(e);
        bot.sendMessage(chatId, "Sesi sudah mencapai batas! Ketik /resetsesi dan coba lagi.");
    }
});

// Perintah untuk mereset sesi
bot.onText(/\/resetsesi/, (msg) => {
    const chatId = msg.chat.id;
    let sessions = readSession();
    delete sessions[msg.from.id];
    writeSession(sessions);
    bot.sendMessage(chatId, "Sesi AI berhasil direset!");
});
