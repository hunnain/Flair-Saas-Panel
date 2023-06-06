const Promise = require('bluebird');
var admin = require("firebase-admin");

// var serviceAccount = require("../firbaseVeliaServiceAccount.json");
var serviceAccount = null

admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
});
class Push {
    constructor() {

    }

    

    setTopicNotification() {
        return new Promise(function (resolve) {
            const registrationTokens = [
                'cZOQggncSkS_kuz5kAtXB0:APA91bFg_t-vek-_MfafzsZGzShVOm9AzcgrqhmE9oFzAlXuxG4h1bf1AmvKXzshrmmNnbPckXqeT2J_5qOKvOsqhvp_hKTwoCIXL54ulqvYEibpzwUtm8OsntsaV53bL4i872brHeXs'
              ];
              let topic = "global"
              // Subscribe the devices corresponding to the registration tokens to the
              // topic.
              admin.messaging().subscribeToTopic(registrationTokens, topic)
                .then((response) => {
                  // See the MessagingTopicManagementResponse reference documentation
                  // for the contents of response.
                  console.log('Successfully subscribed to topic:', response);
                })
                .catch((error) => {
                  console.log('Error subscribing to topic:', error);
                });
                resolve("Saved..!")
        });
    }
    sendTopicNotification(body, title) {
        return new Promise(function (resolve) {
            //set topic
            const topic = 'global';
            body = body.toString()
            title = title.toString()
            const message = {
                data: {
                title: title,
                body: body
            },
                notification: {
                    title: title,
                    body: body
                  },
              topic: topic
            };
            
            // Send a message to devices subscribed to the provided topic.
            admin.messaging().send(message)
              .then((response) => {
                // Response is a message ID string.
                console.log('Successfully sent message:', response);
              })
              .catch((error) => {
                console.log('Error sending message:', error);
              });
            resolve("Notification Sent..!")
        })}
        
        
    //send Push Notification
    sendPushNotification(mobile_id, body, title, type, dataId) {
        mobile_id = mobile_id || "123123"
        var order_id = body.toString()
        return new Promise(function (resolve) {
            var payload = {
                data: {
                    title: title,
                    body: body,
                    type : type,      
                    id: dataId
                },
                notification: {
                    title: title,
                    body: body,
                    type : type,
                    id: dataId
                }
            }
            var options = {
                priority: "high",
                timeToLive: 60 * 60 * 24,
                content_available:true
            }
            console.log("Mobile Id ",mobile_id);
            // console.log("payload",payload);
            admin.messaging().sendToDevice(mobile_id, payload, options)
                .then(function (response) {
                    console.log("Error", response.results[0].error);
                    console.log("Successfully send to device", response);
                }).catch(function (response) {
                    console.log("Fail to Send", response);
                })

            resolve("Notification Sent"); //Passing results to callback function
        });

    }
    
    

}
module.exports = Push;