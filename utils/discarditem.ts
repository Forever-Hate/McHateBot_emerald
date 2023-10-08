import { Item } from 'prismarine-item';
import { bot } from '../commands/main/bot';
import { logger } from './logger';

export let discardItemer:DiscardItemer;

export class DiscardItemer
{
  /**
   * 丟棄bot身上所有的物品(不包含身上穿的盔甲)
  */
  async discardAllItems():Promise<void>
  {
    logger.i("進入discardAllItems，丟棄身上所有的物品(不包含身上穿的盔甲)")
    for (const item of bot.inventory.items()) 
    {
      await bot.tossStack(item);
    }
  }

  /**
   * 丟棄bot身上指定物品清單內的物品
   * @param { Item[] } itemList - 指定丟棄的物品清單
   */
  async tossItemFromList(itemList:Item[]):Promise<void>
  {
    logger.i("進入tossItem，丟棄身上指定物品清單內的物品")
    for (const i of bot.inventory.items()) 
    {
        if (itemList.includes(i)) 
        {
          logger.d(`背包包含物品 ${i.name}`)
          await bot.tossStack(i).catch((err: string) => {
            if (err) {
                logger.e("錯誤:" + err)
            }
          })
        }
    }
  }

  constructor()
  {
    logger.i("建立DiscardItemer物件")
  }
  
}

export default function setDiscardItemer()
{
  logger.i("進入setDiscardItemer，建立一個新的DiscardItemer物件")
  discardItemer = new DiscardItemer();
}