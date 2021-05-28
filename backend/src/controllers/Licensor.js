const Clients = require('../models/Client');
const Sellers = require('../models/Seller'); 
const History = require('./History');

module.exports = {

    async store(request, response) {
        const { sellerEmail, 
            clientEmail,
            botName, isTest,
        } = request.body;
        
        if (!sellerEmail || !clientEmail || !botName || 
            isTest === undefined) {
            return response.json({});
        } 

        const seller = await Sellers.findOne({ email: sellerEmail });
        const client = await Clients.findOne({ email: clientEmail });
        const result = {
            licenses: seller.licenses,
            tests: seller.tests,
            time: 0
        }
        
        if (!client || seller.botlist.indexOf(botName) === -1) {
            return response.status(401).json(result);
        }

        const agora = new Date().getTime() / 1000;
        const licenses = client.license;
        let daysToAdd = 0;
        if (isTest && seller.tests > 0) {
            result.tests -= 1;
            daysToAdd = 3;
        } else if (!isTest){
            daysToAdd = 31;
            result.licenses += 1;
        }

        let foundBot = false;
        licenses.forEach(bot => {
            if (bot.botname === botName) {
                foundBot = true;
                bot.timestamp = agora + 86400 * daysToAdd;
                result.time = daysToAdd;
            }
        })
        if (!foundBot) {
            licenses.push({
                botname: botName,
                timestamp: agora + 86400 * daysToAdd
            })
            result.time = daysToAdd;
        }

        await Sellers.findOneAndUpdate(
            {email: sellerEmail}, {
                licenses: result.licenses,
                tests: result.tests
            });
        await Clients.findOneAndUpdate(
            {email: clientEmail}, {license: licenses})            
        
        if (daysToAdd > 0) {
            History.store(sellerEmail, `Added ${daysToAdd} days to ${clientEmail}.`)
        }
        return response.json(result);
    }
}