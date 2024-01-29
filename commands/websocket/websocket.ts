import * as WebSocket from 'ws';
import * as http from 'http';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { logger } from '../../utils/logger';
import { bot, isOnline } from '../main/bot';
import path from 'path';
import { config, getAvailablePort, settings } from '../../utils/util';
import {financer} from "../main/finance";

export let websocketClient:WebSocketClient | null = null

export const enum Route
{
  message = "/message",
  player = "/player"
}

export class WebSocketClient
{
  routeMap: Map<Route, WebSocket[]> = new Map();
  app = express();
  server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server');
  });
  wss = new WebSocket.Server({ noServer:true });
  
  playerInterval:NodeJS.Timeout | null = null

  /**
   * 傳送訊息至指定路由(websocket)
   * @param { Route } route 路由
   * @param { any } message 訊息
   */
  send(route:Route,message:any)
  {
    logger.i(`進入send，傳送訊息，路由:${route}，訊息:${message}`)
    const clients = this.routeMap.get(route)
    if (clients) 
    {
      // 對所有連線中的 client 廣播訊息
      for (const client of clients) {
        logger.d(client.readyState)
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }
  }

  constructor()
  {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      console.log('Client connected');
      console.log(req.url);
      const route = this.stringToEnum(req.url ?? "")
      if(route)
      {
        if(!this.routeMap.has(route))
        {
          this.routeMap.set(route,[])
        }
        this.routeMap.get(route)?.push(ws)
      }
      ws.on('close', () => {
        console.log('Client disconnected');
        //移除連線
        for (const [route, clients] of this.routeMap.entries()) {
          const index = clients.indexOf(ws);
    
          if (index !== -1) {
            clients.splice(index, 1);
          }
    
          if (clients.length === 0) {
            this.routeMap.delete(route);
          }
        }
      });
    });
    
    this.server.on('upgrade', (request: http.IncomingMessage, socket: any, head: Buffer) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });
    getAvailablePort(parseInt(process.env.WEBSOCKET_PORT!)).then((port)=>{
      this.server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })



    //express伺服器
    const router = express.Router();
    
    //玩家資料路由(API)
    router.get('/player', 
      /* 	
          #swagger.summary = '取得玩家資料'
          #swagger.tags = ['player']
          #swagger.description = '取得bot資訊' */
      /* #swagger.responses[200] = { 
          schema: {  
            $ref: '#/components/schemas/Player'
          },
          description: "玩家資料" } */
      (req, res) => {
        const split =  bot.tablist.header.toString().split("\n")
        const MoneyRegex = new RegExp("綠寶石餘額 : ([\\s\\S]+) \\/ 村民錠餘額 : ([\\s\\S]+) \\/ 村民錠價格 : 每個約 ([\\s\\S]+) 綠").exec(split.toString().trim())
        const CurrenServer = new RegExp(`所處位置 : 分流([\\s\\S]+)-([\\s\\S]+) -([\\s\\S]+) -座標 : ([\\s\\S]+)`).exec(split.toString().trim())
        const CurrentPlayers = new RegExp(`當前分流人數 : (\\S+)`).exec(split.toString().trim())

        let BotStates = {
          Money:"",
          VCoin:"",
          CurrenServer:0,
          CurrentPlayers:0,
        }

        if (MoneyRegex){
          let Money =  parseInt(MoneyRegex[1].replaceAll(",",""))
          financer.balance = Money
          BotStates.Money = MoneyRegex[1]
          BotStates.VCoin = MoneyRegex[2]
        }

        if (CurrenServer){
          BotStates.CurrenServer = parseInt(CurrenServer[1])
        }

        if (CurrentPlayers){
          BotStates.CurrentPlayers = parseInt(CurrentPlayers[1])
        }

        const block = bot.blockAtCursor()
        this.send(Route.player,JSON.stringify({
          "ip":config.ip,
          "version":config.version,
          "username":bot.username,
          "uuid":bot.player.uuid,
          "tps":bot.getTps(),
          "money":BotStates.Money,
          "coin":BotStates.VCoin,
          "server":BotStates.CurrenServer,
          "currentPlayers":BotStates.CurrentPlayers,
          "targetedBlock":block ? {
            "type":block.type,
            "name":block.name,
            "position":block.position
          } : null,
          "position":bot.entity.position,
          "health":bot.health,
          "food":bot.food,
          "level":bot.experience.level,
          "points":bot.experience.points,
          "progress":bot.experience.progress,
          "items":bot.inventory.items(),
        }))
    });

    //聊天室訊息路由(API)
    router.get('/message',
      /* 	#swagger.tags = ['message']
          #swagger.description = '取得聊天室訊息' */
      (req, res) => {
        res.send("hi,message")
    });

    //swagger路由
    router.use('/api-docs', process.env.DEVELOP == 'true' ? swaggerUi.serve :express.static(path.join(__dirname,'../../dist')));
    
    if(process.env.DEVELOP == 'true')
    {
      router.get('/api-docs', 
        // #swagger.ignore = true
        swaggerUi.setup(require(`${process.cwd()}/swagger-output.json`))
      );
    }

    this.app.use('/', router);
    getAvailablePort(parseInt(process.env.EXPRESS_PORT!)).then((port)=>{
      this.app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
  }

  /*
  * 字串轉Enum
  */
  stringToEnum(value: string): Route | undefined {
    switch (value) {
      case "/message":
        return Route.message;
      case "/player":
        return Route.player;
      default:
        return undefined; 
    }
  }

  /**
   * 更新資料(每秒)
   */
  refreshData()
  {
    logger.i("進入refresh，更新資料")
    this.playerInterval = setInterval(()=>{
      if(isOnline)
      {
        const split =  bot.tablist.header.toString().split("\n")
        const MoneyRegex = new RegExp("綠寶石餘額 : ([\\s\\S]+) \\/ 村民錠餘額 : ([\\s\\S]+) \\/ 村民錠價格 : 每個約 ([\\s\\S]+) 綠").exec(split.toString().trim())
        const CurrenServer = new RegExp(`所處位置 : 分流([\\s\\S]+)-([\\s\\S]+) -([\\s\\S]+) -座標 : ([\\s\\S]+)`).exec(split.toString().trim())
        const CurrentPlayers = new RegExp(`當前分流人數 : (\\S+)`).exec(split.toString().trim())

        let BotStates = {
          Money:"",
          VCoin:"",
          CurrenServer:0,
          CurrentPlayers:0,
        }

        if (MoneyRegex){
          let Money =  parseInt(MoneyRegex[1].replaceAll(",",""))
          financer.balance = Money
          BotStates.Money = MoneyRegex[1]
          BotStates.VCoin = MoneyRegex[2]
        }

        if (CurrenServer){
          BotStates.CurrenServer = parseInt(CurrenServer[1])
        }

        if (CurrentPlayers){
          BotStates.CurrentPlayers = parseInt(CurrentPlayers[1])
        }

        const block = bot.blockAtCursor()
        this.send(Route.player,JSON.stringify({
          "ip":config.ip,
          "version":config.version,
          "username":bot.username,
          "uuid":bot.player.uuid,
          "tps":bot.getTps(),
          "money":BotStates.Money,
          "coin":BotStates.VCoin,
          "server":BotStates.CurrenServer,
          "currentPlayers":BotStates.CurrentPlayers,
          "targetedBlock":block ? {
            "type":block.type,
            "name":block.name,
            "position":block.position
          } : null,
          "position":bot.entity.position,
          "health":bot.health,
          "food":bot.food,
          "level":bot.experience.level,
          "points":bot.experience.points,
          "progress":bot.experience.progress,
          "items":bot.inventory.items(),
        }))
      }
      else
      {
        this.send(Route.player,JSON.stringify({
          "error":"bot is offline"
        }))
      }
    },1000)
  }
  /**
   * 停止更新資料
   */
  stopRefreshData()
  {
    logger.i("進入stopRefreshData，停止更新資料")
    if(this.playerInterval)
    {
      clearInterval(this.playerInterval)
    }
  }

  static init()
  {
    logger.i("進入init，初始化websocket")
    websocketClient = new WebSocketClient()    
  }
  
}