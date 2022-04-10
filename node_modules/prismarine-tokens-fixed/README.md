# prismarine-tokens-fixed
Store and use authentication tokens instead of passwords to emulate the way the official launcher works
This is simply a fork of prismarine-tokens with a minor patch applied to get it working. All credit goes to pqml. You can find the original project here -> https://github.com/pqml/prismarine-tokens
## Features

* Store all authentications tokens to automatically reuse them on future connections
* Minimal username+password authentications to prevent Mojang from blocking your account
* Support of both mineflayer and minecraft-protocol
* Multiple storage files
* Asynchronous calls
* Easy implementation on your project: just wrap all your bot in a callback function

## Installation

`npm install prismarine-tokens-fixed`


## Usage

### Example with mineflayer

```js
var mineflayer = require('mineflayer');
var tokens = require('prismarine-tokens-fixed');

var options = {
  host: 'localhost',   // optional
  port: 25565,         // optional
  username: 'email@example.com',
  password: '12345678',
  //Location of the file to store and read tokens for this bot
  //You can use the same file for all your bots
  tokensLocation: './bot_tokens.json',
  //Set to true if you want debug informations
  tokensDebug: true
};

tokens.use(options, function(_err, _opts){

  if (_err) throw _err;

  var bot = mineflayer.createBot(_opts);

  bot.on('connect', function() {
    console.info('connected');
  });

});

```

### Example with minecraft-protocol

```js
var mc = require('minecraft-protocol');
var tokens = require('prismarine-tokens-fixed');

var options = {
  host: 'localhost',   // optional
  port: 25565,         // optional
  username: 'email@example.com',
  password: '12345678',
  //Location of the file to store and read tokens for this bot
  //You can use the same file for all your bots
  tokensLocation: './bot_tokens.json',
  //Set to true if you want debug informations
  tokensDebug: true
};


tokens.use(options, function(_err, _opts){

  if (_err) throw _err;

  var client = mc.createClient(_opts);

  client.on('connect', function() {
    console.info('connected');
  });

});

```
