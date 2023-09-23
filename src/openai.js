import fs from 'fs';
import config from 'config';
import yandexSpeech from 'yandex-speech';
import { XMLParser } from 'fast-xml-parser';
import { removeFile } from './utils.js';
import OpenAI from 'openai';


class OpenAi {

    roles = {
        USER: 'user',
        ASSISTANT: 'assistant',
        SYSTEM: 'system'
    }

    constructor() {
        this.openai = new OpenAI({
                apiKey: config.get('OPENAI_KEY')
            }) 
    }

    async text (messages) {
        try {
            
            const chatCompletion = await this.openai.chat.completions.create({
            messages,
            model: 'gpt-3.5-turbo',
        });
        return chatCompletion.data.choices[0].message
        }
        catch (e) {
            console.log("Error while gpt chat", e.message)
        }

    }

    async audioTranscription(filePath) {
        try {
            return new Promise((resolve, rejects) => {

            const parser = new XMLParser();
               
            fs.createReadStream(filePath).pipe(yandexSpeech.ASR({
                developer_key: config.get('YANDEX_KEY'),
                debug: false,
                topic: "queries"
            }, function(err, responseRequest, xml) {
                if(err) {
                    console.log(err)
                    rejects(err)
                    removeFile(filePath)
                } else{
                    const resp = parser.parse(xml).recognitionResults.variant
                    if (typeof(resp) == "string") {
                        resolve(resp)
                    } else {
                        resolve(resp[0])

                    }
                    console.log(responseRequest.statusCode)
                    removeFile(filePath)
                }
            }))
            })
        } catch (e) {
            console.log("Error while trancription", e.message)
        }
    }
}

export const openAii = new OpenAi()