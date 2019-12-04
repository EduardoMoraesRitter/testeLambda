let documentClient = new global.aws.DynamoDB.DocumentClient();

var fs = require("fs");

exports.getconfig = function (serverID) {
    console.log("getconfig")
    return new Promise(function (resolve, reject) {
        fs.readFile("./services/serverConfig.json", "utf8", function (err, data) {
            if (err) {
                reject(false);
                console.log("Erro ao ler arquivo ", err, data);
            } else {
                let serverConfig = JSON.parse(data);

                if (!serverID) console.error('serverController.pegaConfig - SEM SERVER');

                var server = serverConfig.filter(item => item.serverID == serverID)[0];
                if (!server) {
                    console.warn("serverController - ", server);
                    reject(false);
                } else {
                    resolve(server);
                }
            }
        })
    })
}

exports.getcontext = function (userID, context, table) {
    console.log("getcontext")
    return new Promise(function (resolve, reject) {
        if (!userID && !context && !table) {
            console.log("getcontext vazio ", userID, context, table);
            //return false
            reject(false)
        } else {
            console.log("getcontext OK ")
            var params = {
                Key: {
                    "userID": userID
                },
                TableName: table
            };
            documentClient.get(params, function (err, data) {
                if (err) {
                    console.log("getcontext erro ", err);
                    //return false
                    reject(false)
                } else if (data.Item && data.Item.context) {
                    //return data.Item.context
                    resolve(data.Item.context)
                } else {
                    console.log("getcontext - nao encontro ", data);
                    var param = {
                        Item: {
                            "userID": userID,
                            "context": context,
                            "data": new Date().toLocaleString('pt-BR', {
                                timeZone: 'America/Sao_Paulo'
                              })
                        },
                        TableName: table
                    };
                    documentClient.put(param, function (err, data) {
                        console.log("put getcontext ", err, data);
                        //return context
                        resolve(context)
                    })
                }
            });
        }
    })
}

exports.updatecontext = function (userID, context, table) {
    return new Promise(function (resolve, reject) {
        console.log("updatecontext")
        for (let key in context) {
            if (context[key] == "" || context[key] == " ")
                delete context[key]
        }
        var params = {
            Key: {
                "userID": userID
            },
            UpdateExpression: "set #context = :context, #data = :data",
            ExpressionAttributeNames: {
                "#context": "context",
                "#data": "data",
            },
            ExpressionAttributeValues: {
                ":context": context,
                ":data": new Date().toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo'
                  })
            },
            ReturnValues: 'UPDATED_NEW',
            TableName: table
        };
        documentClient.update(params, function (err, data) {
            if (err) {
                console.log("updatecontext erro ", err);
                reject(false)
            } else {
                console.log("updatecontext salvo");
                resolve(true)
            }
        });
    })
};