import { Telegraf, session } from "telegraf";
import config from 'config'
import { message } from 'telegraf/filters' 
import { ogg } from './ogg.js'
import { openAii } from './openai.js'
import { code, italic, bold } from "telegraf/format";

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
const INITIAL_SESSION = {
    messages: [],
}

bot.use(session())


bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply('Отправил Ваш запрос на сервер, жду ответ')

        ctx.session.messages.push({role: openAii.roles.USER, content: ctx.session.messages})

        const response = await openAii.text(ctx.session.messages)

        ctx.session.messages.push({role: openAii.roles.ASSISTANT, content: response.content})

        await ctx.reply(response) 
    }
    catch (e) {
        console.log('Error while text messege', e.message)
    }
})

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try{
        await ctx.reply(code('Обрабатываю сообщение. Подождите немножко.'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        console.log(link.href)

        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.ToMp3(oggPath, userId)

        const text = await openAii.audioTranscription(mp3Path)
        await ctx.reply(code(`Ваш запрос:\n${text}`))

        ctx.session.messages.push({role: openAii.roles.USER, content: text})

        const response = await openAii.text(ctx.session.messages)

        //ctx.session.messages.push({role: openAii.roles.ASSISTANT, content: response.content})

        //await ctx.reply(response)

    } catch(e) 
    {console.log("Error while voice message", e.message)}
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SITERM'))