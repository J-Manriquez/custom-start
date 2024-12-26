import { BookmarkData, BookmarkFolder } from "@/types";

export class BookmarkService {
    private static instance: BookmarkService;

    private constructor() { }

    public static getInstance(): BookmarkService {
        if (!BookmarkService.instance) {
            BookmarkService.instance = new BookmarkService();
        }
        return BookmarkService.instance;
    }

    /**
     * Obtiene un favicon para una URL dada
     */
    public async getFavicon(url: string): Promise<string> {
        try {
            const domain = new URL(url).hostname;
            // Intentar obtener un favicon de alta calidad primero
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

            const response = await fetch(googleFaviconUrl);
            if (response.ok) {
                return googleFaviconUrl;
            }

            // Fallback al favicon por defecto del sitio
            return `https://${domain}/favicon.ico`;
        } catch (error) {
            console.error('Error fetching favicon:', error);
            return '/assets/default-favicon.png';
        }
    }

    /**
     * Obtiene metadatos de una página web
     */
    public async getPageMetadata(url: string): Promise<{ title: string; description: string }> {
        try {
            return new Promise((resolve) => {
                chrome.tabs.create(
                    { url, active: false },
                    async (tab) => {
                        if (!tab.id) {
                            resolve({
                                title: new URL(url).hostname,
                                description: ''
                            });
                            return;
                        }

                        try {
                            const result = await chrome.tabs.sendMessage(tab.id, {
                                type: 'CAPTURE_METADATA'
                            });

                            // Cerrar la pestaña temporal
                            await chrome.tabs.remove(tab.id);
                            resolve(result as { title: string; description: string });
                        } catch (error) {
                            resolve({
                                title: new URL(url).hostname,
                                description: ''
                            });
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error getting page metadata:', error);
            return {
                title: new URL(url).hostname,
                description: ''
            };
        }
    }

    /**
     * Sincroniza con los marcadores del navegador
     */
    public async syncWithBrowser(): Promise<{ bookmarks: BookmarkData[]; folders: BookmarkFolder[] }> {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
                const bookmarks: BookmarkData[] = [];
                const folders: BookmarkFolder[] = [];

                const processNode = async (node: chrome.bookmarks.BookmarkTreeNode) => {
                    if (node.url) {
                        // Es un marcador
                        const favicon = await this.getFavicon(node.url);
                        bookmarks.push({
                            url: node.url,
                            title: node.title,
                            favicon,
                            tags: [],
                            lastVisited: Date.now(),
                            folderId: node.parentId
                        });
                    } else if (node.title) {
                        // Es una carpeta
                        folders.push({
                            id: node.id,
                            name: node.title,
                            parentId: node.parentId || undefined
                        });
                    }

                    // Procesar hijos recursivamente
                    if (node.children) {
                        for (const child of node.children) {
                            await processNode(child);
                        }
                    }
                };

                // Procesar el árbol de marcadores
                for (const root of bookmarkTreeNodes) {
                    await processNode(root);
                }

                resolve({ bookmarks, folders });
            });
        });
    }

    /**
     * Añade un marcador al navegador
     */
    public async addToBrowser(bookmark: BookmarkData): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.bookmarks.create({
                title: bookmark.title,
                url: bookmark.url,
                parentId: bookmark.folderId
            }, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Valida una URL
     */
    public validateUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

export const bookmarkService = BookmarkService.getInstance();