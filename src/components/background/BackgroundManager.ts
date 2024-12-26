import { BackgroundConfig } from '../../types';
import { storage } from '../../utils/storage';
import { CUSTOM_EVENTS, ERROR_MESSAGES } from '../../utils/constants';

export class BackgroundManager {
    private static instance: BackgroundManager;
    private config: BackgroundConfig;
    private slideshowInterval: number | null;

    private constructor() {
        this.config = {
            type: 'color',
            value: '#f0f0f0',
            slideshow: {
                enabled: false,
                interval: 300000,
                images: []
            }
        };
        this.slideshowInterval = null;
    }

    public static getInstance(): BackgroundManager {
        if (!BackgroundManager.instance) {
            BackgroundManager.instance = new BackgroundManager();
        }
        return BackgroundManager.instance;
    }

    public async initialize(): Promise<void> {
        // Cargar configuración desde el almacenamiento
        const storedConfig = await storage.getBackground() as BackgroundConfig;
        this.config = storedConfig;

        // Aplicar configuración inicial
        this.applyBackground();

        // Iniciar slideshow si está habilitado
        if (this.config.slideshow.enabled) {
            this.startSlideshow();
        }
    }

    public async setBackground(type: 'color' | 'image', value: string): Promise<void> {
        this.config.type = type;
        this.config.value = value;

        await this.saveConfig();
        this.applyBackground();

        // Disparar evento de cambio de fondo
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.BACKGROUND_CHANGED, {
            detail: { type, value }
        }));
    }

    public async toggleSlideshow(enabled: boolean): Promise<void> {
        this.config.slideshow.enabled = enabled;

        if (enabled && this.config.slideshow.images.length > 0) {
            this.startSlideshow();
        } else {
            this.stopSlideshow();
        }

        await this.saveConfig();
    }

    public async addSlideshowImage(imageUrl: string): Promise<void> {
        if (!this.config.slideshow.images.includes(imageUrl)) {
            this.config.slideshow.images.push(imageUrl);
            await this.saveConfig();
        }
    }

    public async removeSlideshowImage(imageUrl: string): Promise<void> {
        this.config.slideshow.images = this.config.slideshow.images.filter(
            img => img !== imageUrl
        );
        await this.saveConfig();
    }

    public async setSlideshowInterval(interval: number): Promise<void> {
        this.config.slideshow.interval = interval;

        if (this.config.slideshow.enabled) {
            this.restartSlideshow();
        }

        await this.saveConfig();
    }

    private async saveConfig(): Promise<void> {
        await storage.setBackground(this.config);
    }

    private applyBackground(): void {
        const body = document.body;

        if (this.config.type === 'color') {
            body.style.backgroundImage = 'none';
            body.style.backgroundColor = this.config.value;
        } else {
            body.style.backgroundImage = `url(${this.config.value})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.style.backgroundRepeat = 'no-repeat';
        }
    }

    private startSlideshow(): void {
        if (this.slideshowInterval) {
            this.stopSlideshow();
        }

        this.slideshowInterval = window.setInterval(() => {
            this.showNextImage();
        }, this.config.slideshow.interval);
    }

    private stopSlideshow(): void {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
    }

    private restartSlideshow(): void {
        this.stopSlideshow();
        this.startSlideshow();
    }

    private showNextImage(): void {
        if (this.config.slideshow.images.length === 0) return;

        const currentImage = this.config.value;
        const currentIndex = this.config.slideshow.images.indexOf(currentImage);
        const nextIndex = (currentIndex + 1) % this.config.slideshow.images.length;

        this.setBackground('image', this.config.slideshow.images[nextIndex]);
    }

    public getConfig(): BackgroundConfig {
        return { ...this.config };
    }
}

export const backgroundManager = BackgroundManager.getInstance();