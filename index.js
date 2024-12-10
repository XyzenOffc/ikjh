const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Ganti dengan token bot Anda
const token = '7361099428:AAHsbnKKUK_aYNsPZNX4BqMLPg3su79JG90';
const bot = new TelegramBot(token, { polling: true });

// ID owner bot (gunakan ID Anda)
const ownerId = 7257721467;

// Path ke file sesi
const path = './database/aisesi.json';

// Membaca sesi
function readSession() {
  try {
    // Memastikan folder dan file ada
    if (!fs.existsSync('./database')) {
      fs.mkdirSync('./database');
    }
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify({}));
    }

    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    console.log("Error membaca file sesi:", error);
    return {}; // Jika ada kesalahan, kembalikan objek kosong
  }
}

// Menulis sesi ke file
function writeSession(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Menangani pesan masuk
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Jika pesan dari owner bot
  if (msg.from.id === ownerId) {
    bot.sendMessage(chatId, "Siap, Tuan Xyzen! Pesan Anda sedang diproses...");
  }

  // Jika tidak ada teks, jangan lakukan apa-apa
  if (!text) return;

  // Jangan anggap pesan "hai" atau pesan umum lainnya sebagai permintaan AI
  if (text.toLowerCase().includes('hai')) {
    bot.sendMessage(chatId, "Hai Tuan Xyzen! Apa yang bisa saya bantu?");
    return;
  }

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
    console.log("Error:", e);
    bot.sendMessage(chatId, "Sesi sudah mencapai batas! Ketik /resetsesi dan coba lagi.");
  }
});

// Menangani perintah reset sesi
bot.onText(/\/resetsesi/, (msg) => {
  const chatId = msg.chat.id;
  let sessions = readSession();
  delete sessions[msg.from.id]; // Hapus sesi pengguna
  writeSession(sessions);
  bot.sendMessage(chatId, "Sesi AI berhasil direset!");
});
