import { apiWebSocketUrl } from '@/lib/utils/helperUtils';
import { fetchJwt } from '@/lib/utils/userUtils';
import React, { useContext, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';



const WebSocketContext = React.createContext
    <{
        webSocket: Socket | null,
        setWebSocket: React.Dispatch<React.SetStateAction<Socket | null>>
    }>({
        webSocket: null,
        setWebSocket: () => { },
    });

export const WebSocketProvider: React.FC<{
    children: React.ReactNode
}> = ({ children }) => {
    const [webSocket, setWebSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const jwt = fetchJwt();
        if (!jwt) return;
        // Create connection
        const newSocket = io(apiWebSocketUrl!, {
            auth: {
                token: jwt
            }
        });

        // Connection opened
        newSocket.on('connect', () => {
            console.log("WS is active.");
            // Store the WebSocket instance for the session
            setWebSocket(newSocket);
        });

        // Connection closed
        newSocket.on('disconnect', () => {
            console.log("WS is closed.");
            // Reset the socket in state
            setWebSocket(null);
        });

        return () => {
            // Clean up the WebSocket connection when the component unmounts
            newSocket.close();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ webSocket, setWebSocket }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};