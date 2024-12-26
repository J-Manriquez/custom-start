import { BackgroundConfig, GridConfig, StorageData } from '../types';
import { STORAGE_KEYS, DEFAULT_GRID_CONFIG, DEFAULT_BACKGROUND_CONFIG } from './constants';

interface StorageResult {
    [key: string]: any;
}

export class StorageManager {
    private static instance: StorageManager;

    private constructor() { }

    public static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }

    public async initialize(): Promise<void> {
        const data = await this.getAll();
        if (!data.gridConfig) {
            await this.setGridConfig(DEFAULT_GRID_CONFIG);
        }
        if (!data.background) {
            await this.setBackground(DEFAULT_BACKGROUND_CONFIG);
        }
        if (!data.widgets) {
            await this.setWidgets([]);
        }
    }

    private async chunkedSave(key: string, data: any): Promise<void> {
        const jsonData = JSON.stringify(data);
        const chunkSize = 8192;
        const chunks: string[] = [];

        for (let i = 0; i < jsonData.length; i += chunkSize) {
            chunks.push(jsonData.slice(i, i + chunkSize));
        }

        const chunkKeys = chunks.map((_, index) => `${key}_chunk_${index}`);

        const storageData: { [key: string]: string } = {
            [`${key}_chunks`]: JSON.stringify(chunkKeys)
        };

        chunks.forEach((chunk, i) => {
            storageData[chunkKeys[i]] = chunk;
        });

        await chrome.storage.sync.set(storageData);
    }

    private async chunkedLoad(key: string): Promise<any> {
        const result = await chrome.storage.sync.get(`${key}_chunks`);
        const chunkKeysStr = result[`${key}_chunks`];

        if (!chunkKeysStr) return null;

        const chunkKeys = JSON.parse(chunkKeysStr) as string[];
        const chunks = await chrome.storage.sync.get(chunkKeys);
        const jsonData = chunkKeys.map(key => chunks[key]).join('');

        return JSON.parse(jsonData);
    }

    public async getAll(): Promise<Partial<StorageData>> {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (items: StorageResult) => {
                resolve(items as Partial<StorageData>);
            });
        });
    }

    public async getWidgets(): Promise<StorageData['widgets']> {
        return this.chunkedLoad(STORAGE_KEYS.WIDGETS) || [];
    }

    public async setWidgets(widgets: StorageData['widgets']): Promise<void> {
        await this.chunkedSave(STORAGE_KEYS.WIDGETS, widgets);
    }

    public async getBackground(): Promise<BackgroundConfig> {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.BACKGROUND);
        return result[STORAGE_KEYS.BACKGROUND] || DEFAULT_BACKGROUND_CONFIG;
    }

    public async setBackground(config: BackgroundConfig): Promise<void> {
        await chrome.storage.sync.set({ [STORAGE_KEYS.BACKGROUND]: config });
    }

    public async getGridConfig(): Promise<GridConfig> {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.GRID_CONFIG);
        return result[STORAGE_KEYS.GRID_CONFIG] || DEFAULT_GRID_CONFIG;
    }

    public async setGridConfig(config: GridConfig): Promise<void> {
        await chrome.storage.sync.set({ [STORAGE_KEYS.GRID_CONFIG]: config });
    }

    public async clear(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.clear(resolve);
        });
    }
}

export const storage = StorageManager.getInstance();