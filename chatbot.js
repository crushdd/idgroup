const puppeteer = require('puppeteer-core');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Configuração do WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    },
});

// Gerar o QR Code para autenticação
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code acima!');
});

// Após a conexão bem-sucedida
client.on('ready', async () => {
    console.log('Tudo certo! WhatsApp conectado.');

    // Obter todos os chats
    const chats = await client.getChats();

    // Filtrar apenas os grupos
    const groups = chats.filter(chat => chat.isGroup);

    // Listar os grupos e seus IDs
    console.log('Grupos disponíveis:');
    groups.forEach(group => {
        console.log(`Nome: ${group.name}, ID: ${group.id._serialized}`);
    });
});

// Inicializar cliente WhatsApp
client.initialize();
