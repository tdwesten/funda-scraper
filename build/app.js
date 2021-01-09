"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config({ path: __dirname + '/../.env' });
const axios_1 = __importDefault(require("axios"));
const dto_house_1 = require("./dto:house");
const lowdb_1 = __importDefault(require("lowdb"));
const FileAsync_1 = __importDefault(require("lowdb/adapters/FileAsync"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const cheerio = require('cheerio');
const url = process.env.FUNDA_SEARCH_URL || '';
class FundaScraper {
    constructor(url) {
        const token = process.env.TELEGRAM_BOT_TOKEN || '';
        this.chatId = process.env.TELEGRAM_CHAT_ID || '';
        this.bot = new node_telegram_bot_api_1.default(token, { polling: true });
        this.initDatabase();
        this.getHtml(url)
            .then((response) => {
            this.findHouses(response.data).then(() => {
                this.bot.stopPolling();
                // this.bot.close();
                console.log('done');
                return;
            });
        })
            .catch(console.error);
    }
    initDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = yield lowdb_1.default(new FileAsync_1.default('db.json', {
                defaultValue: { Houses: [] },
            }));
        });
    }
    getHtml(url) {
        return axios_1.default(url);
    }
    findHouses(html) {
        return new Promise((resolve, reject) => {
            const $ = cheerio.load(html);
            const searchResults = $('ol.search-results');
            let counter = 0;
            searchResults.each((result, elm) => {
                this.parseResult(elm, $);
                counter++;
                if (searchResults.length === counter)
                    resolve(true);
            });
        });
    }
    parseResult(result, $) {
        const house = new dto_house_1.House();
        const price = $(result)
            .find('.search-result-price')
            .text()
            .replace('€ ', '')
            .replace('.', '')
            .replace(' k.k.', '');
        house.Price = parseInt(price);
        house.Id = $(result).find('.search-result').data('global-id');
        house.Adress = $(result)
            .find('.search-result__header-title.fd-m-none')
            .text()
            .replace('\n              ', '')
            .replace('\n        ', '');
        house.Zipcode = $(result)
            .find('.search-result__header-subtitle.fd-m-none')
            .text()
            .replace('\n        ', '')
            .replace('    ', '')
            .replace('\n\n        ', '');
        house.Url =
            'https://www.funda.nl' +
                $(result).find('.search-result__header-title-col > a').attr('href');
        house.ImageUrl = $(result).find('img').attr('src');
        const matches = this.db.get('Houses').filter({ Id: house.Id }).value();
        if (matches.length === 0) {
            this.sendUpdateToTelegram(house.Url);
            this.db.get('Houses').push(house).write();
        }
        else {
            console.log(`House with the adress "${house.Adress}" is already in the DB`);
        }
    }
    sendUpdateToTelegram(url) {
        this.bot.sendMessage(this.chatId, 'Yeah! Nieuw huis gevonden 🏡🏡🏡');
        setTimeout(() => {
            this.bot.sendMessage(this.chatId, url);
        });
        return true;
    }
}
new FundaScraper(url);
