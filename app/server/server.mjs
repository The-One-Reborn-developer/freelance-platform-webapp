import Database from "better-sqlite3";
import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import { createServer } from "http";
import path from "path";

import { 
    createUsersTable,
    createBidsTable,
    createResponsesTable  } from "./create_tables.mjs";
import { checkTelegramData } from "./check_telegram_data.mjs";
import { postUser } from "./post_user.mjs";
import { checkUserTelegram } from "./check_user_telegram.mjs";
import { getUser } from "./get_user.mjs";
import { postBid } from "./post_bid.mjs";
import { getOpenBidsByCustomerTelegramID } from "./get_open_bids_by_customer_telegram_id.mjs";
import { updateCloseBid } from "./update_close_bid.mjs";
import { getBidsByCity } from "./get_bids_by_city.mjs";
import { postResponse } from "./post_response.mjs";
import { sendMessage } from "./send_message.mjs";
import { saveChatMessage } from "./save_chat_message.mjs";
import { getBidByBidID } from "./get_bid_by_bid_id.mjs";
import { getChatMessages } from "./get_chat_messages.mjs";
import { getResponses } from "./get_responses.mjs";
import { updateProfileInfo } from "./update_profile_info.mjs"
import { updateResponse } from "./update_response.mjs";
import { getResponsesByPerformerTelegramIDWithChatStarted } from "./get_responses_by_performer_telegram_id_with_chat_started.mjs";
import { setupWebsocketServer } from "./setup_websocket_server.mjs"
import { getAllBidsByCustomerTelegramID } from "./get_all_bids_by_customer_telegram_id.mjs";
import { getResponsesByBidIDWithChatStarted } from "./get_responses_by_bid_id_with_chat_started.mjs";


dotenv.config({ path: '/app/.env' });

const app = express();
app.use(express.json());
app.use(express.static('app/public'));
console.log('Express app created');

const db = new Database('./app/database.db', { verbose: console.log });

const httpServer = createServer(app);
const { sendMessageToUser } = setupWebsocketServer(httpServer);
const PORT = process.env.PORT || 3000;

createUsersTable(db);
createBidsTable(db);
createResponsesTable(db);


app.get('/', (req, res) => {
    res.sendFile('app/public/register.html', { root: './' });    
});


app.post('/check-registration', (req, res) => {
    try {
        // Check telegram data
        const checkTelegramDataResult = checkTelegramData(req, res);

        if (!checkTelegramDataResult) {
            return;
        } else {
            // Check if the user is already registered
            const checkUserTelegramResult = checkUserTelegram(db, checkTelegramDataResult.telegramID);

            if (checkUserTelegramResult.count > 0) {
                return res.status(200).json({ registered: true, telegram_id: checkTelegramDataResult.telegramID });
            } else {
                return res.status(200).json({ registered: false });
            }
        };
    } catch (error) {
        console.error('Error in /check-registration:', error);
        res.status(500).json({ message: 'Произошла ошибка при проверке регистрации пользователя.' });
    };
});


app.post('/registration-attempt', (req, res) => {
    try {
        // Check telegram data
        const checkTelegramDataResult = checkTelegramData(req, res);

        if (!checkTelegramDataResult) {
            return;
        } else {
            // Post the new user
            postUser(
                db,
                res,
                checkTelegramDataResult.telegramID,
                checkTelegramDataResult.role,
                checkTelegramDataResult.name,
                checkTelegramDataResult.rate,
                checkTelegramDataResult.experience,
            );
        };
    } catch (error) {
        console.error('Error in /registration-attempt:', error);
        res.status(500).json({ message: 'Произошла ошибка при регистрации пользователя.' });
    };
});


app.post('/get-user-data', (req, res) => {
    try {
        const telegramID = req.body.telegram_id;
        // Get user data
        const userData = getUser(db, telegramID);
        res.status(200).json({ success: true, userData });
    } catch (error) {
        console.error('Error in /get-user-data:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении данных пользователя.' });
    };
});


app.post('/post-bid', (req, res) => {
    try {
        const customerTelegramID = req.body.customer_telegram_id;
        const customerName = req.body.customer_name;
        const city = req.body.city;
        const description = req.body.description;
        const deadlineFrom = req.body.deadline_from;
        const deadlineTo = req.body.deadline_to;
        const instrumentProvided = req.body.instrument_provided;

        // Post the new bid
        postBid(
            db,
            res,
            customerTelegramID,
            customerName,
            city,
            description,
            deadlineFrom,
            deadlineTo,
            instrumentProvided
        );
    } catch (error) {
        console.error('Error in /post-bid:', error);
        res.status(500).json({ message: 'Произошла ошибка при создании заказа.' });
    };
});


app.post('/my-bids', (req, res) => {
    try {
        const customerTelegramID = req.body.customer_telegram_id

        const bids = getOpenBidsByCustomerTelegramID(db, customerTelegramID);

        res.status(200).json({ success: true, bids });
    } catch (error) {
        console.error('Error in /my-bids:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении списка заказов.' });
    }
});


app.post('/close-bid', (req, res) => {
    try {
        const bidID = req.body.bid_id;
        
        const closeBidResult = updateCloseBid(db, bidID);

        if (!closeBidResult) {
            res.status(500).json({ success: false, message: 'Ошибка при закрытии заказа.' });
        } else {
            res.status(200).json({ success: true, message: `Заказ №${bidID} успешно закрыт.` });
        };
    } catch (error) {
        console.error('Error in /close-bid:', error);
        res.status(500).json({ message: 'Произошла ошибка при закрытии заказа.' });
    };
});


app.post('/get-bids', (req, res) => {
    try {
        const city = req.body.city;

        const bids = getBidsByCity(db, city);

        res.status(200).json({ success: true, bids });
    } catch (error) {
        console.error('Error in /get-bids:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении списка заказов.' });
    };
});


app.post('/respond-to-bid', (req, res) => {
    try {
        const bidID = req.body.bid_id;
        const performerTelegramID = req.body.performer_telegram_id;
        
        const performerData = getUser(db, performerTelegramID);
        const performerName = performerData.name;
        const performerRate = performerData.rate;
        const performerExperience = performerData.experience;
        
        const postResponseResult = postResponse(
            db,
            bidID,
            performerTelegramID,
            performerName,
            performerRate,
            performerExperience
        );

        if (postResponseResult === true) {
            const bidData = getBidByBidID(db, bidID);
            const customerTelegramID = bidData.customer_telegram_id;
            const customerName = bidData.customer_name;
            const city = bidData.city;
            const description = bidData.description;
            const deadlineFrom = bidData.deadline_from;
            const deadlineTo = bidData.deadline_to;
            const instrumentProvided = bidData.instrument_provided;
            const message = 'На Ваш заказ №' + bidID + ': \n\n' +
                            'Город: ' + city + '\n' +
                            'Описание: ' + description + '\n' +
                            'Срок выполнения: от <i>' + deadlineFrom + ' - до ' + deadlineTo + '</i>\n' +
                            'Предоставляется инструмент: ' + ((instrumentProvided === true || instrumentProvided === 1) ? 'да' : 'нет') + '\n\n' +
                            'Откликнулся мастер ' + performerName + ', ставка: <i>' + performerRate +
                            '/час</i>, опыт: <i>' + performerExperience + ' (в годах)</i>.';


            sendMessage(
                customerTelegramID,
                message
            );

            saveChatMessage(
                bidID,
                customerTelegramID,
                performerTelegramID,
                customerName,
                performerName,
                message,
                'performer'
            );
            
            res.status(200).json({ success: true, message: 'Ваш отклик успешно отправлен заказчику 📲' });
        } else if (postResponseResult === false) {
            res.status(409).json({ success: true, message: 'Вы уже откликнулись на этот заказ.' });
        };
    } catch (error) {
        console.error('Error in /respond-to-bid:', error);
        res.status(500).json({ message: 'Произошла ошибка при отклике на заказ.' });
    };
});


app.get('/get-chats', (req, res) => {
    const bidID = req.query.bid_id;
    const customerTelegramID = req.query.customer_telegram_id;
    const performerTelegramID = req.query.performer_telegram_id;
    
    const chatMessages = getChatMessages(bidID, customerTelegramID, performerTelegramID);

    res.status(200).json({ success: true, chatMessages });
});


app.post('/send-message', (req, res) => {
    try {
        const bidID = req.body.bid_id;
        const customerTelegramID = req.body.customer_telegram_id;
        const performerTelegramID = req.body.performer_telegram_id;
        const customerName = getUser(db, customerTelegramID).name;
        const performerName = getUser(db, performerTelegramID).name;
        const message = req.body.message;
        const senderType = req.body.sender_type;

        saveChatMessage(
            bidID,
            customerTelegramID,
            performerTelegramID,
            customerName,
            performerName,
            message,
            senderType
        );

        if (senderType === 'customer') {
            updateResponse(
                db,
                bidID,
                performerTelegramID,
                true
            );
        };

        const recipientTelegramID = senderType === 'customer' ? performerTelegramID : customerTelegramID;

        const formattedMessage = senderType === 'customer' ? 
            `Заказчик ${customerName}:\n${message}` :
            `Мастер ${performerName}:\n${message}`;
        sendMessage(
            recipientTelegramID,
            formattedMessage
        );

        res.status(200).json({ success: true, message: 'Сообщение успешно отправлено.' });
    } catch (error) {
        console.error('Error in /send-message:', error);
        res.status(500).json({ message: 'Произошла ошибка при отправке сообщения.' });
    };
});


app.get('/responded-performers', (req, res) => {
    const customerTelegramID = req.query.customer_telegram_id;

    try {
        if (!customerTelegramID) {
            res.status(400).json({ message: 'Telegram ID пользователя не указан.' });
            return;
        } else {
            const customerBids = getOpenBidsByCustomerTelegramID(db, customerTelegramID);

            if (customerBids.length === 0) {
                res.status(200).json({ success: true, performers: [] });
                return;
            } else {
                const responses = getResponses(db, customerBids);

                if (responses.length === 0) {
                    res.status(200).json({ success: true, responses: [] });
                } else {
                    res.status(200).json({ success: true, responses });
                };
            };
        };
    } catch (error) {
        console.error('Error in /responded-performers:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении списка откликнувшихся мастеров.' });
    };    
});


app.post('/change-profile-info', (req, res) => {
    try {
        const telegramID = req.body.telegram_id;
        const rate = req.body.rate;
        const experience = req.body.experience;

        const updateProfileInfoResult = updateProfileInfo(db, telegramID, rate, experience);

        if (!updateProfileInfoResult) {
            res.status(500).json({ message: 'Произошла ошибка при изменении информации о профиле.' });
        } else {
            res.status(200).json({ success: true, message: 'Информация о профиле успешно изменена.' });
        };
    } catch (error) {
        console.error('Error in /change-profile-info:', error);
        res.status(500).json({ message: 'Произошла ошибка при изменении информации о профиле.' });
    };
});


app.get('/responded-customers', (req, res) => {
    const performerTelegramID = req.query.performer_telegram_id;
    console.log(`Fetching responded customers for Telegram ID: ${performerTelegramID}`);

    try {
        if (!performerTelegramID) {
            res.status(400).json({ message: 'Telegram ID пользователя не указан.' });
            return;
        } else {
            const responses = getResponsesByPerformerTelegramIDWithChatStarted(db, performerTelegramID);
            
            if (responses.length > 0) {
                const bidIDs = responses.map((res) => res.bid_id);

                // Extract customer info from bids
                const bidsInfo = bidIDs.map((bidID) => {
                    const bidInfo = getBidByBidID(db, bidID);
                    return bidInfo;
                });

                res.status(200).json({ success: true, bidsInfo });
            } else {
                res.status(200).json({ success: true, responses: [] });
            }
        };
    } catch (error) {
        console.error('Error in /responded-customers:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении списка откликнувшихся заказчиков.' });
    };
});


app.post('/show-chats-list', (req, res) => {
    try {
        const customerTelegramID = req.body.customer_telegram_id;

        // Step 1: Retrieve all bids created by the customer
        const customerBids = getAllBidsByCustomerTelegramID(db, customerTelegramID);
        if (!customerBids || customerBids.length === 0) {
            return res.status(200).json({ success: false });
        };

        // Step 2: Filter all bids to include only those with matching responses
        const bidsWithResponses = customerBids.map((bid) => {
            const responses = getResponsesByBidIDWithChatStarted(db, bid.id);
            if (responses && responses.length > 0) {
                return {
                    ...bid,
                    responses: responses
                };
            } else {
                return null; // Skip bids without responses
            }
        }).filter(Boolean); // Filter out null entries

        // Step 3: Return only bids with responses
        if (bidsWithResponses.length > 0) {
            return res.status(200).json({ success: true, bids: bidsWithResponses });
        } else {
            return res.status(404).json({ success: false, message: 'У данного заказчика не было переписок.' });
        };
    } catch (error) {
        console.error('Error in /show-chats-list:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching chat files.' });
    };
});


app.post('/show-selected-customer-chat', (req, res) => {
    try {
        const bidID = req.body.bid_id;
        const customerTelegramID = req.body.customer_telegram_id;
        const performerTelegramID = req.body.performer_telegram_id;

        // Step 1: Retrieve chat messages
        const messages = getChatMessages(bidID, customerTelegramID, performerTelegramID);
        if (messages.length === 0) {
            return res.status(404).json({ success: false, message: 'Чат не найден.' });
        };

        // Step 2: Return chat messages
        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error in /show-selected-customer-chat:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching chat messages.' });
    };
});


// 404 Route
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found.' });
});


// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Unexpected server error.' });
});


httpServer.listen(PORT, () => {
    console.log(`HTTPS server started on port ${PORT}`);
});