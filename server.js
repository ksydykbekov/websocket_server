"use strict";
const express = require("express");
const WebSocket = require("ws");

const app = express();
const server = app.listen(8088, () => {
    console.log("WebSocket server started on port 8088");
});

const websocketServer = new WebSocket.Server({ server });

// Store clients in a map for easy access
const clients = new Map();

websocketServer.on("connection", (webSocketClient) => {
    console.log("New WebSocket connection");

    // Assign a unique ID for this client
    const clientId = Date.now();
    clients.set(clientId, webSocketClient);

    // Handle incoming messages
    webSocketClient.on("message", (message) => {
        console.log("Received message:", message);

        let data;
        try {
            data = JSON.parse(message); // Parse the JSON message
        } catch (error) {
            console.error("Failed to parse message:", error);
            return; // Exit if parsing fails
        }

        // Handle offer, answer, and candidate messages
        if (data.type === "offer") {
            console.log("Handling offer:", data.offer);
            // Send offer to another client (e.g., consumer)
            clients.forEach((client, id) => {
                if (client !== webSocketClient && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "offer",
                        offer: data.offer,
                        from: clientId // Optional: include the sender's ID
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
                    from: clientId // Optional: include the sender's ID
                }));
            }
        } else if (data.type === "candidate") {
            console.log("Handling candidate:", data.candidate);
            // Send ICE candidate to the peer
            clients.forEach((client, id) => {
                if (client !== webSocketClient && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "candidate",
                        candidate: data.candidate,
                        from: clientId // Optional: include the sender's ID
                    }));
                }
            });
        }
    });

    // Handle errors
    webSocketClient.on("error", (error) => {
        console.error("WebSocket error:", error);
    });

    // Handle connection close
    webSocketClient.on("close", () => {
        console.log("WebSocket connection closed");
        clients.delete(clientId); // Remove client from map
    });
});
