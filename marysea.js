var express = require('express');
var app = express();
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var geoip = require('geoip-lite');
var path = require('path')
var fetch = require("node-fetch");


app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
var questions = ["Сколько цветовых каналов в изображении с прозрачностью?",
    "Сколько сверточных слоев в VGG16?",
    "Сколько секунд есть у сервера на то чтобы ответить Марусе при создании скила?",
    "Как называется программа для создания Android приложений?",
    "Является ли JavaScript интерпретируемым языком программирования?",
    "Какая Python библиотека оcнованная на библиотеке NumPy используется для анализа больших данных?",
    "Какой порт используется передачи данных через HTTP протокол?",
    "Какой стикер отображается при первом билде в VK mini APP в примере из руководства?"
]

var questionsTTS = ["Сколько цветовых каналов в изображении с прозрачностью?",
    "Сколько сверточных слоев у ви джи джи 16?",
    "Сколько секунд есть у с`ервера на то чтобы ответить марусе при создании скил`а?",
    "Как называется программа для создания ^Android^ приложений?",
    "Является ли дж`ава скрипт интерпретируемым языком ^программирования^?",
    "Какая п`айтон библиотека основанная на библиотеке намп`ай используется для анализа больших данных?",
    "Какой порт используется для передачи данных через H ти ти пи протокол?",
    "Какой стикер отображается при первом билд`е в ви кей м`ини ап примере из руководства?"
]

var answers = ["4 четыре",
    "16 шестнадцать",
    "5 пять",
    "Android Studio Андройд Студио",
    "Да",
    "Pandas пандас",
    "80 восемьдесят восьмидесятый",
    "персик кот"
]

var categories = ["Дизайн интерфейсов",
    "Computer vision",
    "Маруся",
    "Мобильная разработка",
    "WEB",
    "Анализ данных",
    "Back End",
    "VK Mini Apps"
]

var categoriesTTS = ["Диз`айн ^интерф`ейсов^",
    "Компьютерное ^зрение^",
    "Мар`уся",
    "Моб`ильная ^разраб`отка^",
    "Вэб",
    "Анализ ^данных^",
    "Бэк энд",
    "Ви кей м`ини ^апс^"
]
var maryseaSessions = {}
app.post('/api/maryseaSkill', async (req, res) => {

    var requestOut = getBaseResponseMarysea(req)
    var original_utterance = req.body.request.original_utterance.toLowerCase()
    console.log("original_utterance: " + original_utterance)
    if (maryseaSessions.hasOwnProperty(req.body.session.session_id)) {
        var sessionItem = maryseaSessions[req.body.session.session_id]


        var isCorrectAnswer = contain(answers[sessionItem.step], original_utterance.split(" ")[0])
        console.log("sessionItem.step: " + sessionItem.step + "isCorrectAnswer: " + isCorrectAnswer)
        if (isCorrectAnswer) {
            sessionItem['category'] = sessionItem.step
        }
        sessionItem.step = sessionItem.step + 1

        if (sessionItem.step >= questions.length) {
            if (sessionItem.hasOwnProperty('category')) {
                requestOut.response = {
                    "text": "Вам лучше всего подойдет категория: " + categories[sessionItem['category']],
                    "tts": "<speaker audio=marusia-sounds/game-win-1> " + "Вам лучше всего подойдет категория: " + categoriesTTS[sessionItem['category']],
                    "commands": [{
                            "type": "BigImage",
                            "image_id": 457239029
                        },
                        {
                            "type": "MiniApp",
                            "url": "https://vk.com/app7543093"
                        },
                        {
                            "type": "Link",
                            "url": "https://vk.com/app7543093",
                            "title": "Регистрация",
                            "text": "Вездекод",
                            "image_id": 457239027
                        }
                    ],
                    "end_session": true
                }
            } else {
                requestOut.response = {
                    "text": "К сожалению не было верных ответов. Для вас подходящих категорий нет =(",
                    "tts": "<speaker audio=marusia-sounds/game-loss-1>  К сожалению не было верных ответов. Для вас подходящих категорий нет.",
                    "card": {
                        "type": "BigImage",
                        "image_id": 457239028
                    },
                    "end_session": true
                }
            }
            delete maryseaSessions[req.body.session.session_id]
            return res.send(requestOut);
        }

        requestOut.response = {
            "text": questions[sessionItem.step],
            "tts": "<speaker audio=marusia-sounds/game-8-bit-coin-1> " + questionsTTS[sessionItem.step],
            "card": {
                "type": "BigImage",
                "image_id": 457239017 + sessionItem.step
            },
            "end_session": false
        }




        return res.send(requestOut);
    }


    if (contain(original_utterance, "везде") && (contain(original_utterance, "код") || contain(original_utterance, "кот") || contain(original_utterance, "ход"))) {
        requestOut.response = {
            "text": "Привет вездекодерам!",
            "tts": "<speaker audio=marusia-sounds/game-win-2> " + "Привет ^вездек`одерам^",
            "card": {
                "type": "BigImage",
                "image_id": 457239027
            },
            "end_session": true
        }
        delete maryseaSessions[req.body.session.session_id]
        return res.send(requestOut);
    }

    if (contain(original_utterance, "начать")) {
        requestOut.response = {
            "text": questions[0],
            "tts": "<speaker audio=marusia-sounds/music-gong-1>  " + questions[0],
            "card": {
                "type": "BigImage",
                "image_id": 457239017
            },
            "end_session": false
        }
        maryseaSessions[req.body.session.session_id] = {
            "typeRequest": 2,
            "step": 0
        }
        return res.send(requestOut);
    }

    requestOut.response = {
        "text": "Запрос не определен =(",
        "tts": "<speaker audio=marusia-sounds/animals-owl-1> " + "Запрос не определен",
        "card": {
            "type": "BigImage",
            "image_id": 457239025
        },
        "end_session": true
    }
    delete maryseaSessions[req.body.session.session_id]
    return res.send(requestOut);
});

function getBaseResponseMarysea(req) {
    return {
        "session": {
            "session_id": req.body.session.session_id,
            "user_id": req.body.session.user_id,
            "skill_id": req.body.session.skill_id,
            "new": false,
            "message_id": req.body.session.message_id,
            "user": {
                "user_id": req.body.session.user_id
            },
            "application": {
                "application_id": req.body.session.application.application_id,
                "application_type": req.body.session.application.application_type
            }
        },
        "version": req.body.version
    }
}

function contain(text, pattern) {
    if (text.toLowerCase().indexOf(pattern.toLowerCase()) == -1) {
        return false
    } else {
        return true
    }
}
