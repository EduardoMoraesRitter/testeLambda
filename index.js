global.aws = require('aws-sdk')
global.aws.config.region = 'us-east-1';


sdfsdf = 010

let lambda = new global.aws.Lambda();

const config = require("./services/config");
const whatsapp = require("./services/whatsapp");

let https = require('https')

function ivocation(functionName, payload) {
  return new Promise(function (resolve, reject) {
    console.log("ivocation ", functionName);
    lambda.invoke({
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(payload)
    }, function (err, data) {
      if (err) {
        console.log("ivocation erro ", functionName, payload, err);
      } else {
        console.log("ivocation sucesso ", functionName);
        resolve(JSON.parse(data.Payload));
      }
    })
  });
}

function saveDash(objConfig, objBot, objUser) {
  return new Promise(function (resolve, reject) {
    console.log("saveDash")

    const options = {
      hostname: 'api.powerbi.com',
      path: '/beta/cf56e405-d2b0-4266-b210-aa04636b6161/datasets/80d7cd92-8dd8-4a5d-b0ba-e8d7c76e12a4/rows?key=%2F5ceHWFUXm69Bga1fAexiX626w2F7zrlsRB9KDy2oSJ2gyYh1lerqlE9XjJkLGOzxAwq%2BdrGbztnRWNGUHxbiw%3D%3D',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    const req = https.request(options, (res) => {
      console.log(res.statusCode)
      var str = '';
      res.on('data', d => {
        str += d
      })
      res.on('end', () => {
        console.log("FOIIII SALVOU", str)
        resolve(str)
      });
    })
    req.write(JSON.stringify(
      [{
        "send": "client",
        "userID": objUser.userID,
        "serverID": objConfig.nameBot,
        "text": objUser.message,
        "intent": objBot.titulo,
        "time": new Date()//.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      }]
    ))
    req.end()
  })
}

exports.handler = async (event) => {
  //console.log("Entrada --------------- \n\n ", JSON.stringify(event), "\n\n\n");

  var objUser = await whatsapp.extract(event);
  if (!objUser) return "ERROR extract"
  //console.log("getconfig ", objUser.serverID)

  //PEGAS AS CONFIGURACOES
  var objConfig = await config.getconfig(objUser.serverID);
  if (!objConfig) return "ERROR getconfig"
  //console.log("retorno getconfig ", objConfig)

  //PEGA O CONTEXTO
  //console.log("getcontext ", objUser.userID, objUser.context, objConfig.table) 
  objUser.context = await config.getcontext(objUser.userID, objUser.context, objConfig.table);
  if (!objUser.context) return "ERRO getcontext"
  //console.log("RETORNO getcontext ",  objUser.context) 

  if (objUser.context.transbordo) {

    console.log("EM TRANSBORDO")
    const atendente = require("./services/sendAtendente");

    //TODO:voltar aqui

    if(objUser.context.Sequence){
      objUser.context.Sequence = objUser.context.Sequence + 1
    }else{
      objUser.context.Sequence = 1
    }
    
    await atendente.sendAtendente(objConfig.transbordo.URL, objUser.context.Session_AffinityToken, objUser.context.Session_Key, objUser.context.Sequence, objUser.message)

  } else {

    //INVOCA O WATSON
    var objBot = await ivocation("XPCustomerWatson", {
      serverID: objUser.serverID,
      message: objUser.message,
      context: objUser.context,
      workspaces: objConfig.nlp.workspace,
      apikey: objConfig.nlp.apikey
    });

    objUser.context = objBot.context;

    if (objBot.actions != undefined) {

      let retornoApi = await ivocation("XPCustomerAPI", {
        api: objBot.actions[0],
        context: objUser.context,
        config: objConfig
      });

      if (retornoApi.context) {
        objUser.context = Object.assign(objUser.context, retornoApi.context);
      }

      if (retornoApi.events) {

        retornoApi.events = Object.assign(objUser.context, retornoApi.events);
        
        let retornoWatson = await ivocation("XPCustomerWatson", {
          message: "",
          context: retornoApi.events,
          serverID: objUser.serverID,
          workspaces: objConfig.nlp.workspace,
          apikey: objConfig.nlp.apikey
        });

        objUser.context = Object.assign(objUser.context, retornoWatson.context);

        objBot.messages = objBot.messages.concat(retornoWatson.messages);
      }
    }

    var enviado = await ivocation("XPCustomerWhatsapp", {
      URL: objConfig.channel.URL,
      userID: objUser.userID,
      Authorization: objConfig.channel.Authorization,
      recipient_type: objUser.context.recipient_type,
      serverID: objUser.serverID,
      messages: objBot.messages
    });

    await saveDash(objConfig, objBot, objUser);
  }

  await config.updatecontext(objUser.userID, objUser.context, objConfig.table);

  console.log("menssagem ", enviado)

  return "ok";
};
