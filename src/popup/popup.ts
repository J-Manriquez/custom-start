import { storage } from '../utils/storage';
import { BackgroundConfig, GridConfig, WidgetType } from '../types';
import { DEFAULT_BACKGROUND_CONFIG, DEFAULT_GRID_CONFIG, LIMITS } from '../utils/constants';

class PopupManager {
    private config: {
        background: BackgroundConfig;
        grid: GridConfig;
    };

    constructor() {
        this.config = {
            background: DEFAULT_BACKGROUND_CONFIG,
            grid: DEFAULT_GRID_CONFIG
        };
        this.initialize();
    }

    private async initialize(): Promise<void> {
        await this.loadCurrentSettings();
        this.setupEventListeners();
        this.updateUI();
    }

    private async loadCurrentSettings(): Promise<void> {
        try {
            const [background, grid] = await Promise.all([
                storage.getBackground(),
                storage.getGridConfig()
            ]);

            this.config.background = background as BackgroundConfig;
            this.config.grid = grid as GridConfig;
        } catch (error) {
            this.showError('Error loading settings');
        }
    }

    private setupEventListeners(): void {
        // Background Type
        document.querySelectorAll('input[name="bgType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const type = (e.target as HTMLInputElement).value as 'color' | 'image';
                this.config.background.type = type;
                this.updateBackgroundInputs();
            });
        });

        // Color Picker
        const colorPicker = document.getElementById('bgColor') as HTMLInputElement;
        colorPicker.addEventListener('change', (e) => {
            this.config.background.value = (e.target as HTMLInputElement).value;
        });

        // Image Upload
        const imageInput = document.getElementById('bgImage') as HTMLInputElement;
        imageInput.addEventListener('change', this.handleImageUpload.bind(this));

        // Slideshow Toggle
        const slideshowToggle = document.getElementById('slideshowEnabled') as HTMLInputElement;
        slideshowToggle.addEventListener('change', (e) => {
            this.config.background.slideshow.enabled = (e.target as HTMLInputElement).checked;
            this.updateSlideshowSettings();
        });

        // Slideshow Interval
        const intervalInput = document.getElementById('slideshowInterval') as HTMLInputElement;
        intervalInput.addEventListener('change', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value);
            if (value >= 1 && value <= 60) {
                this.config.background.slideshow.interval = value * 60000; // Convert to milliseconds
            }
        });

        // Grid Settings
        ['cellSize', 'gridMargin', 'gridColumns', 'gridRows'].forEach(id => {
            const input = document.getElementById(id) as HTMLInputElement;
            input.addEventListener('change', (e) => {
                const value = parseInt((e.target as HTMLInputElement).value);
                const key = id.replace('grid', '').toLowerCase() as keyof GridConfig;
                (this.config.grid as any)[key] = value;
            });
        });

        // Save Settings
        document.getElementById('saveSettings')?.addEventListener('click', this.saveSettings.bind(this));

        // Reset Settings
        document.getElementById('resetSettings')?.addEventListener('click', this.resetSettings.bind(this));
    }

    private async handleImageUpload(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            try {
                const dataUrl = await this.readFileAsDataURL(file);
                if (this.config.background.slideshow.enabled) {
                    if (this.config.background.slideshow.images.length >= LIMITS.MAX_IMAGES) {
                        this.showError(`Maximum of ${LIMITS.MAX_IMAGES} images allowed`);
                        return;
                    }
                    this.config.background.slideshow.images.push(dataUrl);
                    this.updateSlideshowImages();
                } else {
                    this.config.background.value = dataUrl;
                }
            } catch (error) {
                this.showError('Error loading image');
            }
        }
    }

    private readFileAsDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private updateUI(): void {
        this.updateBackgroundInputs();
        this.updateSlideshowSettings();
        this.updateGridInputs();
    }

    private updateBackgroundInputs(): void {
        const colorInput = document.getElementById('bgColor') as HTMLInputElement;
        const imageInput = document.getElementById('bgImage') as HTMLInputElement;

        // Actualizar radio buttons
        const radioButtons = document.querySelectorAll('input[name="bgType"]');
        radioButtons.forEach((radio: Element) => {
            (radio as HTMLInputElement).checked = (radio as HTMLInputElement).value === this.config.background.type;
        });

        // Mostrar/ocultar inputs relevantes
        colorInput.style.display = this.config.background.type === 'color' ? 'block' : 'none';
        imageInput.style.display = this.config.background.type === 'image' ? 'block' : 'none';

        if (this.config.background.type === 'color') {
            colorInput.value = this.config.background.value;
        }
    }

    private updateSlideshowSettings(): void {
        const slideshowToggle = document.getElementById('slideshowEnabled') as HTMLInputElement;
        const slideshowSettings = document.getElementById('slideshow-settings');
        const intervalInput = document.getElementById('slideshowInterval') as HTMLInputElement;

        slideshowToggle.checked = this.config.background.slideshow.enabled;
        if (slideshowSettings) {
            slideshowSettings.classList.toggle('hidden', !this.config.background.slideshow.enabled);
        }

        intervalInput.value = String(this.config.background.slideshow.interval / 60000); // Convert from milliseconds
        this.updateSlideshowImages();
    }

    private updateSlideshowImages(): void {
        const container = document.getElementById('slideshow-images');
        if (!container) return;

        container.innerHTML = '';
        this.config.background.slideshow.images.forEach((image, index) => {
            const div = document.createElement('div');
            div.className = 'slideshow-image';

            const img = document.createElement('img');
            img.src = image;

            const removeButton = document.createElement('button');
            removeButton.innerHTML = '×';
            removeButton.onclick = () => {
                this.config.background.slideshow.images.splice(index, 1);
                this.updateSlideshowImages();
            };

            div.appendChild(img);
            div.appendChild(removeButton);
            container.appendChild(div);
        });
    }

    private updateGridInputs(): void {
        Object.entries(this.config.grid).forEach(([key, value]) => {
            const input = document.getElementById(key === 'cellSize' ? key : `grid${key.charAt(0).toUpperCase() + key.slice(1)}`) as HTMLInputElement;
            if (input) {
                input.value = String(value);
            }
        });
    }

    private async saveSettings(): Promise<void> {
        try {
            await Promise.all([
                storage.setBackground(this.config.background),
                storage.setGridConfig(this.config.grid)
            ]);
            this.showSuccess('Settings saved successfully');
        } catch (error) {
            this.showError('Error saving settings');
        }
    }

    private async resetSettings(): Promise<void> {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            this.config.background = DEFAULT_BACKGROUND_CONFIG;
            this.config.grid = DEFAULT_GRID_CONFIG;
            this.updateUI();
            await this.saveSettings();
        }
    }

    private showError(message: string): void {
        this.showMessage(message, 'error');
    }

    private showSuccess(message: string): void {
        this.showMessage(message, 'success');
    }

    private showMessage(message: string, type: 'error' | 'success'): void {
        const container = document.querySelector('.popup-content');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = `status-message ${type}`;
        messageElement.textContent = message;

        container.insertBefore(messageElement, container.firstChild);

        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});