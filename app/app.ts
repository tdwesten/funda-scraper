require('dotenv').config({ path: __dirname + '/../.env' });

import axios from 'axios';
import { House } from './dto:house';
import lowdb from 'lowdb';
import { default as FileAsync } from 'lowdb/adapters/FileAsync';
import { HouseDataBase } from './dto:housedb';
import TelegramBot from 'node-telegram-bot-api';

const cheerio = require('cheerio');

const url = process.env.FUNDA_SEARCH_URL || '';

class FundaScraper {
  public db: lowdb.LowdbAsync<HouseDataBase>;
  public bot: TelegramBot;
  public chatId: string;

  constructor(url: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.bot = new TelegramBot(token, { polling: true });

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

  private async initDatabase() {
    this.db = await lowdb(
      new FileAsync<HouseDataBase>('db.json', {
        defaultValue: { Houses: [] },
      })
    );
  }

  getHtml(url: string) {
    return axios(url);
  }

  findHouses(html: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const $ = cheerio.load(html);
      const searchResults = $('ol.search-results');
      let counter = 0;

      searchResults.each((result: any, elm: any) => {
        this.parseResult(elm, $);

        counter++;

        if (searchResults.length === counter) resolve(true);
      });
    });
  }

  parseResult(result: any, $: any) {
    const house = new House();
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
    } else {
      console.log(
        `House with the adress "${house.Adress}" is already in the DB`
      );
    }
  }

  sendUpdateToTelegram(url: string) {
    this.bot.sendMessage(this.chatId, 'Yeah! Nieuw huis gevonden 🏡🏡🏡');

    setTimeout(() => {
      this.bot.sendMessage(this.chatId, url);
    });

    return true;
  }
}

new FundaScraper(url);
