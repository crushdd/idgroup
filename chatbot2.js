const puppeteer = require('puppeteer-core');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Caminhos para os arquivos JSON que armazenarão as datas dos testes
const emellyandroidTestDatesFilePath = path.join(__dirname, 'emellyandroidTestDates.json');
const emellyiphoneTestDatesFilePath = path.join(__dirname, 'emellyiphoneTestDates.json');

// Função para carregar as datas dos testes do arquivo JSON
function loadTestDates(filePath) {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    }
    return {};
}

// Função para salvar as datas dos testes no arquivo JSON
function saveTestDates(filePath, testDates) {
    fs.writeFileSync(filePath, JSON.stringify(testDates, null, 2));
}

// Carregar as datas dos testes ao iniciar o script
let emellyandroidTestDates = loadTestDates(emellyandroidTestDatesFilePath);
let emellyiphoneTestDates = loadTestDates(emellyiphoneTestDatesFilePath);

// Função para verificar se o usuário pode realizar um novo teste
function canUserTest(userId, testDates) {
    const lastTestDate = testDates[userId];
    if (!lastTestDate) {
        return true;
    }
    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();
    return (now - new Date(lastTestDate)) > oneMonthInMs;
}

// Função para registrar a data do teste do usuário
function registerUserTest(userId, testDates, filePath) {
    testDates[userId] = new Date();
    saveTestDates(filePath, testDates);
}

// Configuração do WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'client2' }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable', // Caminho para o navegador
        args: [
            '--no-sandbox', // Desativa o sandbox
            '--disable-setuid-sandbox', // Desativa o setuid sandbox
        ],
    },
});

// Função para baixar o arquivo
async function downloadFile(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Função para simular digitação
async function simulateTyping(chat, duration) {
    await chat.sendStateTyping();
    return new Promise(resolve => setTimeout(resolve, duration));
}

// Função para apagar arquivos
async function deleteFile(filePath) {
    return fs.promises.unlink(filePath);
}

// Gerar o QR Code para autenticação
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escaneie o QR Code acima do bot emelly!');
});

// Após a conexão bem-sucedida
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp emelly conectado.');
});

// Lidar com as mensagens recebidas no WhatsApp
client.on('message', async (message) => {
    console.log('Mensagem recebida:', message.body);

    const chat = await message.getChat();

    // Opções para interagir com o menu principal
    if (message.body.match(/(menu|Menu|tornar|saber|interessado)/i)) {
        await simulateTyping(chat, 3500);
        const contact = await message.getContact();
        const name = contact.pushname || 'Amigo';
        await client.sendMessage(
            message.from,
            `Olá, ${name.split(' ')[0]}! Sou o assistente virtual da Hyper. Escolha uma das opções abaixo digitando o número correspondente:\n\n` +
            '1 - Como funciona\n' +
            '2 - Valores dos planos\n' +
            '3 - Fazer teste no Android\n' +
            '4 - Fazer teste no iPhone\n' +
            '5 - Como aderir\n' +
            '6 - Perguntas Frequentes\n' +
            '7 - Falar com um Atendente\n' +
            '8 - Quero me tornar um Revendedor\n' +
            '9 - Tabela de Valores para Revendedores\n' +		
            '10 - Termos de uso\n' +
            '11 - Planos IPTV\n' +
            '12 - Testar IPTV'    
        );
        return;
    }

    // Responder às opções do menu
    switch (message.body) {
        case '1':
            await simulateTyping(chat, 3000);
            await message.reply(
                'Oferecemos internet ilimitada por meio de nosso aplicativo. É simples: baixe, faça login com as credenciais fornecidas e conecte. Enquanto estiver conectado ao app, você terá acesso à internet ilimitada!'
            );
            break;
        case '2':
            await simulateTyping(chat, 2500);
            await client.sendMessage(
                message.from,
                `### *PLANOS SEM ACESSO PARA ROTEAR INTERNET:*

====================== 
*Plano Mensal:* R$25,00 /mês  
30 dias de internet ilimitada (sem acesso para rotear para TV/computador/celular)

-------------------------------------------------
*Plano Bronze* 🥉  
3 Meses de internet ilimitada por: *R$69,90*  
(Ficam apenas R$23,30 por mês)

-------------------------------------------------
*Plano Prata* 🥈  
6 Meses de internet ilimitada por: *R$129,90*  
(Ficam apenas R$21,65 por mês)  
+ 1 Mês de Bônus (Pague 6 e Leve 7 meses)

-------------------------------------------------
*Plano Ouro* 🥇  
12 Meses de internet ilimitada por: *R$226,90*  
(Ficam apenas R$18,90 por mês)  
+ 2 Meses de Bônus (Pague 12 e Leve 14 meses)

======================

### *PLANOS COM ACESSO PARA ROTEAR INTERNET:*
*(DISPONIVEL APENAS PARA PLANOS COMPRADOS PARA ANDROID)*

====================== 
*Plano Mensal:* R$35,00 /mês  
30 dias de internet ilimitada + roteamento ilimitado para TV/computador/celular

-------------------------------------------------
*Plano Bronze* 🥉  
3 Meses de internet ilimitada + roteamento por: *R$95,00*  
(Ficam apenas R$31,67 por mês)

-------------------------------------------------
*Plano Prata* 🥈  
6 Meses de internet ilimitada + roteamento por: *R$180,00*  
(Ficam apenas R$30,00 por mês)  
+ 1 Mês de Bônus (Pague 6 e Leve 7 meses)

-------------------------------------------------
*Plano Ouro* 🥇  
12 Meses de internet ilimitada + roteamento por: *R$330,00*  
(Ficam apenas R$27,50 por mês)  
+ 2 Meses de Bônus (Pague 12 e Leve 14 meses)

======================`
            );
            break;
        case '3':
            if (!canUserTest(message.from, emellyandroidTestDates)) {
                await simulateTyping(chat, 2000);
                await client.sendMessage(
                    message.from,
                    'Você já realizou um teste. Caso queira continuar utilizando o serviço, consulte a tabela de planos digitando *2*.'
                );
                break;
            }
            registerUserTest(message.from, emellyandroidTestDates, emellyandroidTestDatesFilePath);

            await simulateTyping(chat, 3600);
            await client.sendMessage(
                message.from,
                'Por favor, *INSTALE* este aplicativo: https://play.google.com/store/apps/details?id=com.hypernet23.pro e abra-o com o Wi-Fi ligado.'
            );
            await simulateTyping(chat, 2100);
            await client.sendMessage(
                message.from,
                '👤 Usuário: 3031\n🔑 Senha: 3031\n📲 Limite: 1\n🗓️ Expira em: 24 horas\n🌍 Instruções: Use o Wi-Fi ao abrir o app, depois ative os dados móveis. Escolha a operadora e clique em conectar.'
            );
            await simulateTyping(chat, 3150);

            // Agora, o vídeo será baixado e enviado diretamente
            const videoLink = 'https://drive.google.com/uc?export=download&id=1B30tef3Ic9lImJy6J_EadmjwlhOUcJcd';
            const videoFilePath = path.join(__dirname, 'tutorialandroid3_video.mp4'); // Caminho para salvar o vídeo

            await downloadFile(videoLink, videoFilePath); // Baixar o vídeo

            // Enviar o vídeo para a conversa
            const media = MessageMedia.fromFilePath(videoFilePath); // Criar o objeto de mídia
            await client.sendMessage(message.from, media, { caption: 'Vídeo ensinando como conectar no aplicativo!' });

            break;
            case '4':
                if (!canUserTest(message.from, emellyiphoneTestDates)) {
                    await simulateTyping(chat, 2000);
                    await client.sendMessage(
                        message.from,
                        'Você já realizou um teste. Caso queira continuar utilizando o serviço, consulte a tabela de planos digitando *2*.'
                    );
                    break;
                }
            
                // Não registrar data ainda, aguardar a resposta do cliente
                await simulateTyping(chat, 3000);
                await client.sendMessage(
                    message.from,
                    'Por favor, *BAIXE* este aplicativo: https://apps.apple.com/app/napsternetv/id1629465476.'
                );
                await simulateTyping(chat, 3500);
                await client.sendMessage(
                    message.from,
                    'Em qual operadora você gostaria de testar? Para testar, digite *vivo iphone* ou *tim iphone*, de acordo com a sua operadora.'
                );
            
                const filter = (response) => response.from === message.from;
            
                const collector = async (response) => {
                    if (response.from !== message.from) return;
            
                    const userReply = response.body.toLowerCase();
            
                    const sendFileAndVideo = async (operator, fileLink, fileName, videoLink, videoName) => {
                        try {
                            const filePath = path.join(__dirname, fileName);
                            await downloadFile(fileLink, filePath);
            
                            const media = MessageMedia.fromFilePath(filePath);
                            await client.sendMessage(response.from, media, {
                                caption: `Arquivo de configuração para ${operator} no iPhone`,
                            });
            
                            const videoPath = path.join(__dirname, videoName);
                            await downloadFile(videoLink, videoPath);
            
                            const videoMedia = MessageMedia.fromFilePath(videoPath);
                            await client.sendMessage(response.from, videoMedia);
            
                            await deleteFile(filePath);
                            await deleteFile(videoPath);
                        } catch (err) {
                            console.error(`Erro ao processar os arquivos para ${operator}:`, err);
                        }
                    };
            
                    if (userReply.includes('vivo') && userReply.includes('iphone')) {
                        // Registrar data somente se a operadora for válida
                        registerUserTest(message.from, emellyiphoneTestDates, emellyiphoneTestDatesFilePath);
                        await sendFileAndVideo(
                            'Vivo',
                            'https://drive.google.com/uc?export=download&id=11GH5bhgAQvFFJyVL95XifHCWp4mUldhV',
                            'vivom2.inpv',
                            'https://drive.google.com/uc?export=download&id=1w8Wlt_lcs0gCm845ZsJiYWxjw58MZh-F',
                            'vivo3_tutorial_video.mp4'
                        );
                    } else if (userReply.includes('tim') && userReply.includes('iphone')) {
                        // Registrar data somente se a operadora for válida
                        registerUserTest(message.from, emellyiphoneTestDates, emellyiphoneTestDatesFilePath);
                        await sendFileAndVideo(
                            'TIM',
                            'https://drive.google.com/uc?export=download&id=1aPJYGj0SkmpcDhdqAQ4EHA32FY3cNfF6',
                            'timm2.inpv',
                            'https://drive.google.com/uc?export=download&id=1w8Wlt_lcs0gCm845ZsJiYWxjw58MZh-F',
                            'tim2_tutorial_video.mp4'
                        );
                    } else if (userReply.includes('claro') && userReply.includes('iphone')) {
                        // Não registrar data, apenas informar que Claro não está disponível
                        await simulateTyping(chat, 2000);
                        await client.sendMessage(
                            response.from,
                            'No momento, não trabalhamos com essa operadora. Nossa internet ilimitada está disponível apenas para Vivo e Tim. Se desejar aproveitar nosso serviço, basta adquirir um chip de uma dessas operadoras.'
                        );
                    }
            
                    // Remover o coletor após a primeira resposta
                    client.removeListener('message', collector);
                };
            
                client.on('message', collector);
            
                break;
            case '5':            
            await simulateTyping(chat, 2220);
            await client.sendMessage(
                message.from,
                'Para aderir, basta escolher um dos nossos planos, efetuar o pagamento e enviar o comprovante. Nossa chave PIX é a seguinte:\n\n' +
                'Chave PIX Nubank: speednetservicec@gmail.com\n' +
                'Nome: Julio Cezar\n\n' +
                'Por favor, envie o comprovante para que possamos liberar seu acesso.'
            );
            break;
        case '6':
            await simulateTyping(chat, 3450);
            await client.sendMessage(
                message.from,
                `*Perguntas Frequentes*

*1. A conexão é segura? Meus dados estão protegidos?*
*R:* Sim, nossa conexão é criptografada de ponta a ponta, garantindo total segurança para seus dados. Você sempre navegará com tranquilidade e privacidade.

*2. O aplicativo pode apresentar quedas?*
*R:* Sim, podem ocorrer quedas por dois motivos principais:
- *Manutenções programadas:* Embora raras, manutenções podem ser realizadas para aprimorar o aplicativo. Quando isso acontece, ele pode ficar fora do ar por algumas horas. Sempre notificamos antecipadamente no grupo de clientes.
- *Quedas inesperadas:* Caso ocorra uma queda por qualquer outro motivo e o aplicativo não volte a funcionar, garantimos a compensação do tempo em que ficou fora do ar.

*3. Posso usar meu acesso em outros dispositivos?*
*R:* Não. Se você compartilhar seu acesso ou utilizá-lo em mais de um dispositivo sem adquirir uma licença adicional, nosso sistema detectará a irregularidade, o acesso será suspenso, e não será recriado nem reembolsado. Para evitar problemas, nunca compartilhe seu acesso.

*4. Existe um grupo para clientes?*
*R:* Sim. Após a compra, você será adicionado ao grupo exclusivo de clientes. Nesse grupo, informamos sobre manutenções, descontos em renovações e quaisquer outras atualizações importantes.

Caso tenha mais dúvidas, entre em contato conosco. Estamos à disposição para ajudar!`
            );
            break;
        case '7':
            await simulateTyping(chat, 2115);
            await client.sendMessage(
                message.from,
                'Por favor, aguarde um momento enquanto direcionamos você para um de nossos atendentes.'
            );

            // Simular digitação antes de enviar a mensagem para o atendente
            await simulateTyping(chat, 2000);

            // Enviar mensagem para o atendente
            const atendenteNumero = '5538991075879@c.us'; // Número do atendente no formato internacional
            const numeroCliente = message.from.replace('@c.us', ''); // Remover o sufixo para obter o número do cliente
            await client.sendMessage(
                atendenteNumero,
                `Alguém precisa de atendimento! Número do cliente: ${numeroCliente}`
            );
            break;
        case '8':
            await simulateTyping(chat, 3150);
            await client.sendMessage(
                message.from,
                'Para se tornar nosso revendedor, é bem simples. Temos revenda disponível para Android e uma revenda híbrida para Android e iPhone. Basta escolher uma das opções e a quantidade de crédito/acesso que você deseja adquirir. Para consultar os valores para revendedores, digite o número 9.'
            );
            break;
        case '9':
            await simulateTyping(chat, 4100);
            await client.sendMessage(
                message.from,
                `📲 SPEEDNET - SOLUÇÕES EM VPN 📡

*INFORMAÇÕES PARA NOVOS CLIENTES*
Quer revender nossos serviços? Escolha seu plano de revendedor logo abaixo:

🚀 PLANOS PARA REVENDER APENAS PARA *ANDROID* 🚀
*Operadoras disponíveis:*
- *Tim* ✅
- *VIVO (funcionando normalmente).* ✅

*Preços por quantidade de créditos no painel (sem acesso ao servidor iPhone):*
- *10 a 49 créditos/unidades*: R$ 4,00 cada
- *50 a 99 créditos/unidades*: R$ 3,00 cada
- *100 a 299 créditos/unidades*: R$ 2,50 cada
- *300 a 499 créditos/unidades*: R$ 2,00 cada
- *500 ou mais créditos/unidades*: R$ 1,50 cada

➡️ *Obs:* Ao comprar em maior quantidade, o valor de cada crédito fica mais barato. Por exemplo: adquirindo acima de 49 créditos, cada um sai por R$ 3,00; comprando acima de 99 créditos, o valor reduz para R$ 2,50 cada, e assim por diante.

*📆 Pagamento mensal obrigatório*

---

🚀 PLANOS PARA *IPHONE + ANDROID* 🚀
*Operadoras disponíveis:*
- *Tim* ✅
- *VIVO (funcionando normalmente).* ✅

*Preços por quantidade de créditos no painel (com acesso ao servidor iPhone):*
- *10 a 49 créditos*: R$ 4,50 cada
- *50 a 99 créditos*: R$ 3,50 cada
- *100 a 299 créditos*: R$ 3,00 cada
- *300 a 499 créditos*: R$ 2,00 cada
- *500 ou mais créditos*: R$ 1,50 cada

➡️ *Obs:* Ao comprar em maior quantidade, o valor de cada crédito fica mais barato. Por exemplo: adquirindo acima de 49 créditos, cada um sai por R$ 3,50; comprando acima de 99 créditos, o valor reduz para R$ 3,00 cada, e assim por diante.

*📆 Pagamento mensal obrigatório*

---

COMO ADQUIRIR SEU PLANO:
1. Escolha seu plano Android ou iPhone.
2. Realize o pagamento via:
   - *🏦 Banco:* Nubank
   - *💠 PIX:* speednetservicec@gmail.com
3. Envie o comprovante de pagamento.

*📥 Liberação imediata do painel após envio do comprovante.*

---

*SUPORTE:*
- Acesse nossos grupos no WhatsApp para suporte e atendimento exclusivo para clientes.

*MATERIAL PARA DIVULGAÇÃO:*
- Após adquirir a revenda, fornecemos banners e vídeos exclusivos para facilitar sua divulgação e atrair mais clientes.

---

*✅ Garantimos a qualidade do serviço.*

*❌ Não realizamos devolução do valor investido.*

Seja bem-vindo(a) ao *SpeedNet - Soluções em VPN!* ✌️`
            );
            break;
        case '10':
            await simulateTyping(chat, 2890);
            await client.sendMessage(
                message.from,
                `*TERMOS DE USO – HYPER NET*

Bem-vindo à *HYPER NET*, fornecedora de internet via aplicativos VPN. Ao utilizar nossos serviços, você concorda integralmente com os termos e condições descritos abaixo. Leia atentamente para evitar dúvidas ou desentendimentos futuros.

---

⚠️ *SOBRE O SERVIÇO* ⚠️
A *HYPER NET* oferece conexão à internet utilizando VPN, que funciona de forma diferente das conexões Wi-Fi tradicionais. É possível acessar jogos, realizar ligações via WhatsApp e usar serviços de streaming, mas *não garantimos uma experiência idêntica à de uma conexão Wi-Fi*.

Se você precisa de:
- *Ping abaixo de 100ms para jogos online*;
- *Streaming em qualidade 4K sem interrupções*;
- *Downloads de arquivos grandes via torrent*;

*Recomendamos contratar um serviço de Wi-Fi de um provedor local.* Essa informação deve ser repassada aos clientes antes da compra para evitar frustrações e mal-entendidos.

---

⭐ *SUPORTE* ⭐
1. *Treinamento e Instruções:* Ajudamos a configurar os aplicativos e o painel do revendedor. Caso o serviço apresente problemas, entre em contato para análise.
2. *Limitações:*
   - Problemas de lentidão, manutenção na rede, ou bloqueios da operadora não estão sob nossa responsabilidade.
   - Se houver instabilidade na rede da operadora, nossa equipe orientará sobre possíveis soluções, mas *não podemos garantir suporte em questões externas à VPN.*
3. *Responsabilidade do Revendedor:*
   - Revendedores precisam compreender e solucionar problemas comuns. Caso a solução já tenha sido ensinada previamente, não responderemos questões repetidas.
   - *Leitura obrigatória do grupo de avisos:* Todas as atualizações são publicadas no grupo. Questões já esclarecidas lá não serão respondidas novamente.

⚠️ *Respeite a ordem de atendimento.* Flood de mensagens ou chamadas repetidas atrasam o suporte.

---

⭐ *GARANTIAS* ⭐
1. O serviço contratado é válido por 30 dias. Caso o método de conexão seja bloqueado pela operadora antes desse prazo, os dias perdidos serão repostos sem custo adicional.
2. *Importante:* Bloqueios da operadora podem ocorrer em determinadas regiões ou estados, afetando todos os usuários. Esse tipo de interrupção está fora do nosso controle.

---

⭐ *REEMBOLSO* ⭐
- Oferecemos *testes gratuitos* antes da compra para uso pessoal ou revenda.
- Por se tratar de um produto digital, não realizamos reembolsos totais ou parciais após a compra.

---

⭐ *REGRAS DE USO* ⭐

1. *Dispositivos Limitados:* Respeite o limite contratado. O uso indevido em múltiplos dispositivos pode acarretar suspensão do serviço.
2. *Proibição de Torrents e P2P:* O uso desses serviços sobrecarrega os servidores e prejudica todos os usuários.
3. *Atividades Ilícitas:* É proibido utilizar o serviço para ataques DDoS, carding ou qualquer crime cibernético.
4. *Citação de Outros Serviços:* É proibido divulgar concorrentes em grupos ou contatar outros revendedores para vendas não autorizadas.
5. *Vendas Não Autorizadas:* A comercialização de produtos não relacionados, como IPTV, em nossos grupos ou privados, é terminantemente proibida.

⚠️ *Penalidades:* O descumprimento de qualquer regra resultará no cancelamento do acesso sem aviso prévio, reembolso ou reativação da conta.

---

*ATENÇÃO, REVENDEDORES*
1. *Logins acima de 30 dias não são permitidos sem autorização prévia.* Logins longos sobrecarregam os servidores. A detecção de logins irregulares resultará na exclusão automática do acesso.
2. *Seja proativo:* Leia os avisos no grupo e evite dependência excessiva do suporte. Quanto mais informado você estiver, mais rápido conseguirá atender seus clientes.

---

Agradecemos por confiar na *HYPER NET*! Juntos, garantimos a melhor experiência possível dentro das limitações do serviço. Para dúvidas adicionais, entre em contato. 🚀`
            );
            break;
		case '11':
            await simulateTyping(chat, 3000);
            await client.sendMessage(
                message.from,
                'Aproveite agora a melhor IPTV do Brasil por apenas R$30,00/mês! 🔥 Uma oferta imperdível e por tempo limitado!\n\n' +
                'Quer testar antes? Digite "12" e ganhe 6 horas de acesso gratuito! Não perca essa chance!'
            );

            // Baixar e enviar a imagem
            const imageLink = 'https://drive.google.com/uc?export=download&id=1Sc-eweWkHA4lXGdjk7-Fo7LrKAtG8AXc';
            const imageFilePath = path.join(__dirname, 'iptv_image.jpg');
            await downloadFile(imageLink, imageFilePath);
            const imageMedia = MessageMedia.fromFilePath(imageFilePath);
            await client.sendMessage(message.from, imageMedia);

            // Baixar e enviar o vídeo
            const videoLinkIptv = 'https://drive.google.com/uc?export=download&id=1VOLQ9aeI-FlxfyHC46zsWbScNewZGX30';
            const videoFilePathIptv = path.join(__dirname, 'ipt3_video.mp4');
            await downloadFile(videoLinkIptv, videoFilePathIptv);
            const videoMediaIptv = MessageMedia.fromFilePath(videoFilePathIptv);
            await client.sendMessage(message.from, videoMediaIptv);

            // Apagar os arquivos locais após o envio
            await deleteFile(imageFilePath);
            await deleteFile(videoFilePathIptv);
            break;
        case '12':
            await simulateTyping(chat, 1500);
            await client.sendMessage(
                    message.from,
                    'Para liberarmos um teste, precisamos saber onde você deseja testar. Será em uma TV? Qual o modelo da sua TV? Ou será em um dispositivo Android ou iPhone? Basta nos informar e tentaremos enviar o teste o mais rápido possível após recebermos sua resposta.'
            );
            break;
        default:
            await simulateTyping(chat, 1500);
            break;
        }
    });
    
    // Inicializar cliente WhatsApp
    client.initialize();
        
