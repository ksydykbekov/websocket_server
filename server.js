//
// Copyright (c) 2021 Steve Seguin. All Rights Reserved.
//  Use of this source code is governed by the APGLv3 open-source 
//  Use at your own risk, as it may contain bugs or security vunlerabilities
//
///// INSTALLATION
// sudo apt-get update
// sudo apt-get upgrade
// sudo apt-get install nodejs -y
// sudo apt-get install npm -y
// sudo npm install express
// sudo npm install ws
// sudo npm install fs
// sudo add-apt-repository ppa:certbot/certbot  
// sudo apt-get install certbot -y
// sudo certbot certonly // register your domain
// sudo nodejs server.js // port 443 needs to be open. THIS STARTS THE SERVER
//
//// Finally, if using this with a ninja deploy, update index.html of the ninja installation as needed, such as with:
//  session.wss = "wss://wss.contribute.cam:443";
//  session.customWSS = true;  #  Please refer to the vdo.ninja instructions for exact details on settings; this is just a demo.
/////////////////////////
"use strict";
const express = require("express");
const WebSocket = require("ws");

const app = express();
const server = app.listen(8088, () => {
    console.log("WebSocket server started on port 8088");
});

const websocketServer = new WebSocket.Server({ server });

websocketServer.on("connection", (webSocketClient) => {
    console.log("New WebSocket connection");

    // Handle incoming messages
    webSocketClient.on("message", (message) => {
        console.log("Received message:", message);

        // Broadcast the message to other clients (except the sender)
        websocketServer.clients.forEach(client => {
            if (client !== webSocketClient && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    // Handle errors
    webSocketClient.on("error", (error) => {
        console.error("WebSocket error:", error);
    });

    // Handle connection close
    webSocketClient.on("close", () => {
        console.log("WebSocket connection closed");
    });
});
