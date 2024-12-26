import { storage } from '../utils/storage';
import { CUSTOM_EVENTS } from '../utils/constants';

class ContentScript {
    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // Escuchar mensajes del background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Mantener el canal de mensajes abierto
        });

        // Observar cambios en el DOM
        this.observeDOM();
    }

    private handleMessage(
        message: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
    ): void {
        switch (message.type) {
            case 'CAPTURE_FAVICON':
                this.captureFavicon()
                    .then(favicon => sendResponse({ favicon }))
                    .catch(error => sendResponse({ error: error.message }));
                break;

            case 'CAPTURE_METADATA':
                this.captureMetadata()
                    .then(metadata => sendResponse({ metadata }))
                    .catch(error => sendResponse({ error: error.message }));
                break;

            default:
                sendResponse({ error: 'Unknown message type' });
        }
    }

    private async captureFavicon(): Promise<string> {
        const links = document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]');
        if (links.length > 0) {
            // Intentar obtener el favicon más grande disponible
            const icons = Array.from(links).map(link => ({
                href: link.href,
                sizes: link.getAttribute('sizes') || ''
            }));

            const bestIcon = icons.reduce((best, current) => {
                const currentSize = parseInt(current.sizes.split('x')[0]) || 0;
                const bestSize = parseInt(best.sizes.split('x')[0]) || 0;
                return currentSize > bestSize ? current : best;
            });

            return bestIcon.href;
        }

        // Fallback al favicon por defecto
        return `${window.location.origin}/favicon.ico`;
    }

    private async captureMetadata(): Promise<{
        title: string;
        description: string;
        image: string;
    }> {
        const metadata = {
            title: document.title,
            description: '',
            image: ''
        };

        // Obtener meta descripción
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta) {
            metadata.description = descriptionMeta.getAttribute('content') || '';
        }

        // Obtener imagen principal
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
            metadata.image = ogImage.getAttribute('content') || '';
        }

        return metadata;
    }

    private observeDOM(): void {
        // Observar cambios en el título de la página
        const titleObserver = new MutationObserver(() => {
            chrome.runtime.sendMessage({
                type: 'PAGE_TITLE_CHANGED',
                title: document.title
            });
        });

        if (document.querySelector('title')) {
            titleObserver.observe(document.querySelector('title')!, {
                subtree: true,
                characterData: true,
                childList: true
            });
        }
    }
}

// Iniciar el content script
new ContentScript();