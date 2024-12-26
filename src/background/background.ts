import { storage } from '../utils/storage';

// Escuchar cuando la extensión se instala o actualiza
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated');
    await storage.initialize();
});

// Manejar mensajes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);
    sendResponse({ status: 'received' });
    return true; // Mantiene el canal de mensaje abierto para respuestas asíncronas
});