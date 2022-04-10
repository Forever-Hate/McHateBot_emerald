let language
module.exports = function (config){
    try
    {
        language = require(`${process.cwd()}/language/${config.language}.json`)
    }
    catch (e)
    {
        throw new LocalizationException(`unknown language:${config.language} (language in config.json)`);
    }
    this.get_content = function (path,map,...vars)
    {
        try
        {
            let content = eval("language."+path)
            if (content === undefined)
            {
                throw new LocalizationException(`no such path:${path} in ${config.language}.json`)
            }
            else
            {
                if(typeof content === "object")
                {
                    content.forEach((c,index)=>{
                        content[index] = c.format(map,...vars)
                    })
                    return content
                }
                else if (map === undefined)
                {
                    return content
                }
                return content.format(map,...vars)
            }
        }
        catch (e)
        {
            return e.toString()
        }
    }




    return this
}

function LocalizationException(message) {
    this.message = message;
    this.name = "LocalizationException";
}

LocalizationException.prototype.toString = function() {
    return this.name + ': "' + this.message + '"';
}

String.prototype.format = function(map,...vars) {
    let formatted = this;
    for( let index in vars) {
        formatted = formatted.replace("${" + map.get(index) + "}", vars[index]);
    }
    return formatted;
};