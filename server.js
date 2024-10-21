"use strict";
const express = require("express");
const WebSocket = require("ws");

const app = express();
const server = app.listen(8088, () => {
    console.log("WebSocket server started on port 8088");
});

const websocketServer = new WebSocket.Server({ server });

const clients = new Map(); // Store clients with their IDs

websocketServer.on("connection", (webSocketClient) => {
    console.log("New WebSocket connection");

    const clientId = Date.now(); // Unique client ID
    clients.set(clientId, webSocketClient);

    webSocketClient.on("message", (message) => {
        console.log("Received message:", message);

        let data;
        try {
            data = JSON.parse(message); // Parse the JSON message
        } catch (error) {
            console.error("Failed to parse message:", error);
            return;
        }

        if (data.type === "offer") {
            console.log("Handling offer:", data.offer);
            // Send offer to other clients
            clients.forEach((client, id) => {
                if (client !== webSocketClient && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "offer",
                        offer: data.offer,
                        from: clientId
                    }));
                }
            });
        } else if (data.type === "answer") {
            console.log("Handling answer:", data.answer);
            // Send answer to the original offer sender
            const senderClient = [...clients.values()].find(client => client.readyState === WebSocket.OPEN && clientId !== clientId);
            if (senderClient) {
                senderClient.send(JSON.stringify({
                    type: "answer",
                    answer: data.answer,
                    from: clientId
                }));
            }
        } else if (data.type === "candidate") {
            console.log("Handling candidate:", data.candidate);
            // Send the candidate to all other clients
            websocketServer.clients.forEach(client => {
                if (client !== webSocketClient && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "candidate",
                        candidate: {
                            candidate: data.candidate.candidate,
                            sdpMid: data.candidate.sdpMid,
                            sdpMLineIndex: data.candidate.sdpMLineIndex
                        }
                    }));
                }
            });
        } else if (data.request === "candidate") {
            console.log("Received request for ICE candidates.");
            // Respond with all gathered ICE candidates if necessary
            clients.forEach((client, id) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "candidate",
                        candidate: "Your candidate here" // Replace with actual candidate data if needed
                    }));
                }
            });
        }
    });

    webSocketClient.on("error", (error) => {
        console.error("WebSocket error:", error);
    });

    webSocketClient.on("close", () => {
        console.log("WebSocket connection closed");
        clients.delete(clientId); // Remove client from the map
    });
});
