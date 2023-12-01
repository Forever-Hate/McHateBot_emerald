const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
  info: {
    version:'1.0.0',
    title: '測試API',
    description: '傳遞給websocket的資料測試區'
  },
  servers: [
    {
      url:'http://localhost:3000',
      description: '預設網址'
    }
  ],
  tags:[

  ],
  components:{
    schemas:{
      Player: {
        type: "object",
        properties: {
          ip: {
            type: "string",
            description: "連線IP",
            nullable: false,
          },
          version: {
            type: "string",
            description: "版本",
            nullable: false,
          },
          username: {
            type: "string",
            description: "玩家名稱",
            nullable: false,
          },
          uuid: {
            type: "string",
            description: "玩家uuid",
            nullable: false,
          },
          money: {
            type: "string",
            description: "玩家持有綠寶石",
            nullable: true,
          },
          coin: {
            type: "string",
            description: "玩家持有村民錠",
            nullable: true,
          },
          server: {
            type: "integer",
            description: "玩家當前分流",
            nullable: true,
          },
          currentPlayers: {
            type: "integer",
            description: "玩家當前分流人數",
            nullable: true,
          },
          targetedBlock: {
            description: "玩家面對的方塊",
            $ref: '#/components/schemas/Block',
          },
          position: {
            description: "玩家當前座標",
            $ref: '#/components/schemas/Position',
          },
          health: {
            type: "number",
            description: "玩家血量",
            nullable: false,
          },
          food: {
            type: "number",
            description: "玩家飽食度",
            nullable: false,
          },
          level: {
            type: "number",
            description: "玩家等級",
            nullable: false,
          },
          points: {
            type: "number",
            description: "玩家經驗值",
            nullable: false,
          },
          progress: {
            type: "number",
            description: "玩家經驗進度條",
            nullable: false,
          },
          items: {
            type: "array",
            description: "玩家物品清單",
            nullable: false,
            items: {
              description: "物品",
              $ref: '#/components/schemas/Item',
            },
          },
        },
      },
      Position:{
        type: "object",
        properties: {
          x: {
            type: "number",
            description: "X 座標",
            nullable: false,
          },
          y: {
            type: "number",
            description: "Y 座標",
            nullable: false,
          },
          z: {
            type: "number",
            description: "Z 座標",
            nullable: false,
          },
        }
      },
      Item:{
        type: "object",
        description:"物品",
        properties: {
          type: {
            type: "integer",
            description: "物品類型ID",
            nullable: false,
          },
          count: {
            type: "integer",
            description: "物品數量",
            nullable: false,
          },
          metadata: {
            type: "integer",
            description: "物品元數據",
            nullable: false,
          },
          nbt: {
            type: "string",
            description: "NBT 資料",
            nullable: true,
          },
          stackId: {
            type: "string",
            description: "堆疊 ID",
            nullable: true,
          },
          name: {
            type: "string",
            description: "物品名稱",
            nullable: false,
          },
          displayName: {
            type: "string",
            description: "物品顯示名稱",
            nullable: false,
          },
          stackSize: {
            type: "integer",
            description: "最大堆疊大小",
            nullable: false,
          },
          slot: {
            type: "integer",
            description: "物品當前位置",
            nullable: false,
          },
        },
      },
      Block:{
        type: "object",
        nullable: true,
        properties: {
          type: {
            type: "integer",
            description: "物品ID",
            nullable: false,
          },
          name:{
            type: "string",
            description: "物品名稱",
            nullable: false,
          },
          
          position: {
            description: "方塊座標",
            $ref: '#/components/schemas/Position',
          },
        }
      }
    }
    
  }
};

const outputFile = './swagger-output.json';
const routes = ['./commands/websocket/websocket.ts'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);