exports.extract = async (req) => {
    console.log("Extract")

    if (req.body && req.serverID) {
        //WHATSAPP INFOMANDO A MESSAGEM FOI RECEBIDO OU LIDA
        if (req.body.statuses) {
            console.log("MESSAGEM RECEBIDA")
            return;
        }
        //Tratamento de uma mensagem de erro de invalid contact
        if (req.body.contacts && req.body.contacts.status && req.body.contacts.status === "invalid") {
            console.warn("whatsapp invalido", req.data);
            return;
        }

        let objUser = {
            serverID: req.serverID,
            timestamp: req.body.messages[0].timestamp,
            context: {
                nome: req.body.contacts[0].profile.name ? req.body.contacts[0].profile.name : "",
                telefone: req.body.contacts[0].wa_id,
            }
        };

        //GRUPO
        if (req.body.messages[0].group_id) {
            objUser.userID = req.body.messages[0].group_id
            objUser.context.recipient_type = "group"
        } else {
            objUser.userID = req.body.messages[0].from
            objUser.context.recipient_type = "individual"
        }

        //extração do tipo da mensagem
        if (req.body.messages && req.body.messages[0] && req.body.messages[0].type === "text") {
            objUser.message = req.body.messages[0].text.body;
        } else if (req.body.messages && req.body.messages[0] && req.body.messages[0].type === "image") {
            //NAO FAZER NADA
            return;
        }

        //devolve o objeto formatado
        return objUser

    } else {
        console.error("vazio - ", req.data)
        return;
    }
}