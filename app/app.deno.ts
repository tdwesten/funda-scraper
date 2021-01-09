import { config } from 'https://deno.land/x/dotenv/mod.ts';
config({ path: '/../.env' });

import axiod from 'https://deno.land/x/axiod/mod.ts';
import { House } from './dto.house.ts';
import { HouseDataBase } from './dto.housedb.ts';
import { CasualDB } from 'https://deno.land/x/casualdb/mod.ts';
import {
  TelegramBot,
  UpdateType,
} from 'https://deno.land/x/telegram_bot_api/mod.ts';

class FundaScraper {
  public db: CasualDB<HouseDataBase>;
  public bot: TelegramBot;
  public chatId: string;

  constructor(url: any) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = Deno.env.get('TELEGRAM_CHAT_ID') || '';
    this.bot = new TelegramBot(token);

    this.db = new CasualDB<HouseDataBase>();

    this.getHtml(url)
      .then((response) => {
        this.findHouses(response.data).then(() => {
          console.log('done');
          return;
        });
      })
      .catch(console.error);
  }

  getHtml(url: string) {
    return axiod(url);
  }

  async findHouses(html: string): Promise<boolean> {
    await this.db.connect('./db.json');

    return new Promise((resolve, reject) => {
      // const searchResults = $('ol.search-results');
      // let counter = 0;
      // searchResults.each((result: any, elm: any) => {
      //   this.parseResult(elm);
      //   counter++;
      //   if (searchResults.length === counter) resolve(true);
      // });
    });
  }

  async parseResult(result: any, $: any) {
    // const house: House;
    // const price = $(result)
    //   .find('.search-result-price')
    //   .text()
    //   .replace('€ ', '')
    //   .replace('.', '')
    //   .replace(' k.k.', '');
    // house.Price = parseInt(price);
    // house.FundaId = $(result).find('.search-result').data('global-id');
    // house.Adress = $(result)
    //   .find('.search-result__header-title.fd-m-none')
    //   .text()
    //   .replace('\n              ', '')
    //   .replace('\n        ', '');
    // house.Zipcode = $(result)
    //   .find('.search-result__header-subtitle.fd-m-none')
    //   .text()
    //   .replace('\n        ', '')
    //   .replace('    ', '')
    //   .replace('\n\n        ', '');
    // house.Url =
    //   'https://www.funda.nl' +
    //   $(result).find('.search-result__header-title-col > a').attr('href');
    // house.ImageUrl = $(result).find('img').attr('src');
    // const matches = await this.db
    //   .findMany()
    //   .filter({ FundaId: house.FundaId })
    //   .value();
    // if (matches.length === 0) {
    //   this.sendUpdateToTelegram(house.Url);
    //   this.db.findOne('Houses').push(house).write();
    // } else {
    //   console.log(
    //     `House with the adress "${house.Adress}" is already in the DB`
    //   );
    // }
  }

  async sendUpdateToTelegram(url: string) {
    await this.bot.sendMessage({ chat_id: this.chatId, text: url });

    return true;
  }
}

new FundaScraper(Deno.env.get('FUNDA_SEARCH_URL'));
