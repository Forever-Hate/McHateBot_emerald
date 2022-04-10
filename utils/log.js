module.exports = function (local,fs,sd,settings){
    fs.mkdir('./logs', {recursive: true}, (err) => {
        if (err) throw err;
    });
    if (settings.enable_pay_logs)
    {
        fs.mkdir('./pay_logs', {recursive: true}, (err) => {
            if (err) throw err;
        });
    }
    this.writeErrorLog =function (e){
            let time =  sd.format(new Date(), 'YYYY-MM-DD HH-mm-ss');
            fs.writeFileSync(`./logs/${time}.txt`,e.toString(), function (err) {
                if (err)
                    console.log(err);
            });
    }
    this.writePayLog = function (playerid,client,expanse,balance){
        let time =  sd.format(new Date(), 'YYYY/MM/DD HH:mm:ss');
        if(fs.existsSync(`./pay_logs/logs.txt`))
        {
            fs.appendFileSync(`./pay_logs/logs.txt`,`time: [${time}]，executor: [${playerid}]，transferee: [${client}]，expanse: [$${expanse}]，balance:[$${balance}]`+"\r\n", function (err) {
                if (err)
                    console.log(err);
            })
        }
        else
        {
            fs.writeFileSync(`./pay_logs/logs.txt`,`time: [${time}]，executor: [${playerid}]，transferee: [${client}]，expanse: [$${expanse}]，balance:[$${balance}]`+"\r\n", function (err) {
                if (err)
                    console.log(err);
            });
        }

    }

    return this
}
