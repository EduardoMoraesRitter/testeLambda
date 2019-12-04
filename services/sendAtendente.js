let https = require('https')

exports.sendAtendente = function (URL, Session_AffinityToken, Session_Key, Sequence, message) {
    return new Promise(function (resolve, reject) {
        //console.log("sendAtendente - ", URL, Session_AffinityToken, Session_Key, Sequence, message)      
        let retorno = {}
        const options = {
            hostname: URL,
            path: '/chat/rest/Chasitor/ChatMessage',
            method: 'POST',
            headers: {
                'X-LIVEAGENT-API-VERSION': 47,
                'X-LIVEAGENT-AFFINITY': Session_AffinityToken,
                'X-LIVEAGENT-SESSION-KEY': Session_Key,
                'X-LIVEAGENT-SEQUENCE': Sequence,
                'Content-Type': 'application/json'
            }
        }
        const req = https.request(options, (res) => {
            console.log("sendAtendente status: ", res.statusCode)
            var str = '';
            res.on('data', d => {
                str += d
            })
            res.on('end', () => {
                if (res.statusCode >= 300) {
                    console.error("error-search ", str)
                } else if (res.statusCode != 200) {
                    console.warn("warn-search ", str)
                } else {
                    console.log(str)
                }
                resolve("ok")
            });
        })
        req.write(JSON.stringify({
            "text": message
        }))
        req.end()
    })
}
