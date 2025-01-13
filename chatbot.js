const puppeteer = require('puppeteer-core');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

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

    try {
        // Obter todos os chats
        const chats = await client.getChats();

        // Filtrar apenas os grupos
        const groups = chats.filter(chat => chat.isGroup);

        // Verificar se há grupos
        if (groups.length === 0) {
            console.log('Nenhum grupo encontrado.');
            return;
        }

        // Listar os grupos e seus IDs
        console.log('Grupos disponíveis:');
        const ids = groups.map(group => `Nome: ${group.name}, ID: ${group.id._serialized}`).join('\n');
        console.log(ids);

        // Criar a pasta ids se não existir
        const dir = './ids';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        // Escrever os IDs no arquivo ids.txt dentro da pasta ids
        fs.writeFileSync(path.join(dir, 'ids.txt'), ids, 'utf8');
        console.log('IDs dos grupos foram salvos no arquivo ids/ids.txt');
    } catch (error) {
        console.error('Erro ao obter os grupos:', error);
    }
});

// Lidar com as mensagens recebidas no WhatsApp
client.on('message', async (message) => {
    console.log('Mensagem recebida:', message.body);

    // Verificar se a mensagem é a opção 7
    if (message.body === '7') {
        const contact = await message.getContact();
        const contactName = contact.pushname || contact.number;
        const notifyNumber = '5538991075879@c.us'; // Número para notificação (formato internacional)

        // Enviar mensagem para o número específico
        const notifyMessage = `Um cliente solicitou atendimento: ${contactName} (${message.from})`;
        await client.sendMessage(notifyNumber, notifyMessage);
        console.log(`Mensagem de notificação enviada para ${notifyNumber}`);
    }
});

// Inicializar cliente WhatsApp
client.initialize();
