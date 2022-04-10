var fs = require('fs');
var path = require('path');
var yggdrasil = require('yggdrasil')({});
module.exports = (_opt, _cb) => {

  var options = _opt;
  var cb = _cb;
  var json = null;
  var changed = false;
  var debug = function(_msg){ if(options.tokensDebug) console.log('[prismarine-tokens]<'+options.username+'> '+_msg) };
  var serve = function(){
    if(options.tokensLocation) delete options.tokensLocation;
    if(options.tokensDebug) delete options.tokensDebug;
    cb(null, options);
    return true;
  }
  var error = function(_err){
    cb(_err, null);
    return false;
  }
  var finish = function(){
    if(changed) {
      debug('The json file has changed - save changes...');
      json.sessions[options.username] = options.session;
      json.clientToken = options.clientToken;
      fs.writeFile(options.tokensLocation, JSON.stringify(json), function(_err,_data) {
        if(_err) return error(_err);
        debug('json file updated and saved.');
        return serve();
      });
    } else return serve();
  }
  var resetTokens = function(){
    if(!options.password || !options.username){ //no password ?
      debug('Valid Password and Username are required to generate a new token.');
      debug('Stop minecraft-tokens for this one. It should work in offline-mode.');
      if(options.username){
         options.username = options.username.split('@')[0];
         options.username = options.username.replace(/\W/g, '');
       }
      delete options.session;
      return finish();
    }
    _clientToken = ( options.clientToken ) ? options.clientToken : null; //if there is a client token, don't re-generate it
    yggdrasil.auth({ user: options.username, pass: options.password, token: _clientToken }, function(_err, _data){
      if(_err){
        debug('Password authentification impossible ('+_err+')');
        delete options.password;
        return resetTokens();
      }
      debug('accessToken reset (new value: '+_data.accessToken+')');
      options.session = _data;
      options.clientToken = ( options.clientToken ) ? options.clientToken : _data.clientToken;
      changed = true;
      return finish();
    });
  }
//No tokensLocation return options without transformation
  if(!options.tokensLocation) return finish();

// Check if the folder for the Tokens exists
  fs.access(path.dirname(options.tokensLocation), fs.R_OK | fs.W_OK, (_err) => {
    if (_err) return error(_err);

//--Try to read the file and parse the json. Set a new object if the file is missing, empty or corrupted.
    fs.readFile(options.tokensLocation, (_err, _data) => {
      try { json = JSON.parse( _data.toString() ); }
      catch (_err) { json = { 'clientToken':null, 'sessions':{} }; }

//----Get the session object for the username if it exists
      if(options.username in json.sessions) options.session = json.sessions[options.username];

//----Like the official launcher, get the global clientToken
      if(json.clientToken !== null){
        if(options.session) options.session.clientToken = json.clientToken;
        options.clientToken = json.clientToken;
      }

//----If there is no session/tokens, authentication with yggdrasil
      if(!options.session || !options.session.accessToken || !options.clientToken){
        debug('No accessToken yet - try to make one from password authentication');
        return resetTokens();
//----If we already have a session
      } else {
        yggdrasil.validate(options.session.accessToken, function(err) {
          if (!err) { //Session is ok
            debug('accessToken still ok !');
            return finish();
          } else { //Session is outdated, try to refresh it
            debug('Token outdated - try to refresh it');
            yggdrasil.refresh(options.session.accessToken, options.clientToken, function(_err, _accessToken, _data) {
              //Error - reset of accessToken
              if(_err || _accessToken === null){
                debug('Invalid token. - new one from password authentication');
                return resetTokens();
              }
              //Success - change the accessToken in the options
              else {
                debug('accessToken updated. (new value: '+_accessToken+')');
                changed = true;
                options.session.accessToken = _accessToken;
                return finish();
              }
            });
          }
        });
      }

    });
  });

}
