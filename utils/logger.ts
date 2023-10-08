import fs from "fs"; //讀取fs模塊
import { settings } from "./util";
import { StoreLog } from "../commands/main/store_emerald";
const sd = require('silly-datetime'); //讀取silly-datetime模塊
export let logger:Log

export class Log 
{

  /**
   * 寫入錯誤log
   * @param { any } e - 錯誤
   */
  writeErrorLog(e:any):void
  {
    this.i("進入writeErrorLog，撰寫ErrorLog");
    const time = sd.format(new Date(), 'YYYY-MM-DD-HH-mm-ss');
    if (!fs.existsSync(`./logs/${time}.txt`))
    {
      fs.writeFileSync(`./logs/${time}.txt`, e.toString());
    } 
  }
  /**
   * 寫入轉帳紀錄log
   * @param { string } playerId 下指令的玩家ID
   * @param { string } recipientId 接收轉帳的ID 
   * @param { string } expence 轉帳金額 
   * @param { string } balance 剩餘金額 
   * @param { string } reason 理由
   */
  writePayLog(playerId:string,recipientId:string,expence:string,balance:string,reason:string):void
  {
    this.i("進入writePayLog，撰寫PayLog");
    const time = sd.format(new Date(), 'YYYY/MM/DD HH:mm:ss');
    const logMessage = `時間: [${time}]，轉帳ID: [${playerId}]，被轉帳人ID: [${recipientId}]，費用: [$${expence}元]，餘額: [$${balance}元]，理由: [${reason}]\r\n`;

    if (fs.existsSync(`./pay_logs/logs.txt`)) 
    {
      fs.appendFileSync(`./pay_logs/logs.txt`, logMessage);
    } 
    else 
    {
      fs.writeFileSync(`./pay_logs/logs.txt`, logMessage);
    }
  }
  /**
   * 寫入存綠紀錄log
   * @param { StoreLog } storeLog 
   */
  writeStoreLog(storeLog:StoreLog)
  {
    this.i("進入writeStoreLog，撰寫StoreLog");

    let logsObject: { list: any[] } = { list: [] };
    if (fs.existsSync(`./store_logs/logs.txt`)) 
    {
      this.d("已撰寫過存綠紀錄Log，附加檔案");
      // 讀取現有的 JSON 檔案
      const existingData = fs.readFileSync(`./store_logs/logs.txt`, 'utf8');
      try {
        // 如果現有的資料是有效的 JSON，則解析它
        const parsedData = JSON.parse(existingData);

        // 檢查它是否有 'list' 屬性
        if (parsedData && Array.isArray(parsedData.list)) {
            logsObject = parsedData;
        }
      } 
      catch (error:any) 
      {
          this.e(`解析現有 JSON 資料時出錯：${error}`);
      }
    } 
    else 
    {
      this.d("未撰寫過存綠紀錄Log，直接寫入檔案");
    }
    // 附加到 'list' 陣列中
    logsObject.list.push(
      storeLog.toJson()
    );
  
    // 將更新後的 JSON 寫回檔案
    fs.writeFileSync(`./store_logs/logs.txt`, JSON.stringify(logsObject, null, 2));
  }

  e(msg: any):void
  {
    if(process.env.DEBUG! === "true")
    {
      console.error(msg);
    }
  }

  d(msg: any):void
  {
    if(process.env.DEBUG! === "true")
    {
      console.debug(msg)
    }
  }

  i(msg: any):void
  {
    if(process.env.DEBUG! === "true")
    {
      console.info(msg)
    }
  }

  l(msg: any):void
  {
    console.log(msg);
  }

  constructor()
  {
    this.i("建立Log物件")
    //建立資料夾
    fs.mkdir('./logs', { recursive: true }, (err) => {
      if (err) throw err;
    });
    if(settings.enable_pay_log)
    {
      this.d("有開啟轉帳紀錄");
      fs.mkdir('./pay_logs', { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
    if(settings.enable_store_log)
    {
      this.d("有開啟存綠紀錄");
      fs.mkdir('./store_logs', { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  }

}

export default function setLogger()
{
  logger = new Log();
  logger.i("進入setLogger，建立一個新的Log物件")
}

