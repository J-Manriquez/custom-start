import { storage } from '../../utils/storage';
import { BackgroundConfig, GridConfig } from '../../types';
import { backgroundManager } from '../background/BackgroundManager';
import { grid } from '../grid/Grid';
import { CSS_CLASSES, DEFAULT_BACKGROUND_CONFIG, DEFAULT_GRID_CONFIG } from '../../utils/constants';

export class SettingsPanel {
    private static instance: SettingsPanel;
    private panel: HTMLElement;
    private currentTab: string = 'general';

    private constructor() {
        this.panel = this.createPanel();
        document.body.appendChild(this.panel);
    }

    public static getInstance(): SettingsPanel {
        if (!SettingsPanel.instance) {
            SettingsPanel.instance = new SettingsPanel();
        }
        return SettingsPanel.instance;
    }

    private createPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'settings-panel';
        panel.innerHTML = `
            <div class="settings-overlay"></div>
            <div class="settings-content">
                <header class="settings-header">
                    <h2>Configuración</h2>
                    <button class="close-button">×</button>
                </header>
                <nav class="settings-tabs">
                    <button data-tab="general" class="active">General</button>
                    <button data-tab="background">Fondo</button>
                    <button data-tab="grid">Grid</button>
                    <button data-tab="theme">Tema</button>
                </nav>
                <div class="settings-body">
                    <div data-tab-content="general" class="tab-content active">
                        <h3>Configuración General</h3>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="showSearch">
                                Mostrar barra de búsqueda
                            </label>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="showBookmarks">
                                Mostrar barra de favoritos
                            </label>
                        </div>
                    </div>
                    <div data-tab-content="background" class="tab-content">
                        <h3>Configuración de Fondo</h3>
                        <div class="setting-group">
                            <label>Tipo de Fondo</label>
                            <select id="bgType">
                                <option value="color">Color</option>
                                <option value="image">Imagen</option>
                            </select>
                        </div>
                        <div class="setting-group" id="colorSettings">
                            <label>Color de Fondo</label>
                            <input type="color" id="bgColor">
                        </div>
                        <div class="setting-group" id="imageSettings" style="display: none;">
                            <label>Imagen de Fondo</label>
                            <input type="file" id="bgImage" accept="image/*">
                            <div id="bgImagePreview"></div>
                        </div>
                        <div class="setting-group">
                            <label>
                                <input type="checkbox" id="enableSlideshow">
                                Habilitar presentación de imágenes
                            </label>
                            <div id="slideshowSettings" style="display: none;">
                                <label>Intervalo (minutos)</label>
                                <input type="number" id="slideshowInterval" min="1" max="60" value="5">
                                <div id="slideshowImages"></div>
                                <button id="addSlideshowImage">Añadir Imagen</button>
                            </div>
                        </div>
                    </div>
                    <div data-tab-content="grid" class="tab-content">
                        <h3>Configuración del Grid</h3>
                        <div class="setting-group">
                            <label>Tamaño de Celda (px)</label>
                            <input type="number" id="cellSize" min="50" max="200">
                        </div>
                        <div class="setting-group">
                            <label>Margen entre Celdas (px)</label>
                            <input type="number" id="gridMargin" min="0" max="50">
                        </div>
                        <div class="setting-group">
                            <label>Columnas</label>
                            <input type="number" id="gridColumns" min="1" max="24">
                        </div>
                        <div class="setting-group">
                            <label>Filas</label>
                            <input type="number" id="gridRows" min="1" max="12">
                        </div>
                    </div>
                    <div data-tab-content="theme" class="tab-content">
                        <h3>Configuración del Tema</h3>
                        <div class="setting-group">
                            <label>Tema</label>
                            <select id="themeSelect">
                                <option value="light">Claro</option>
                                <option value="dark">Oscuro</option>
                                <option value="system">Sistema</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>Color Principal</label>
                            <input type="color" id="primaryColor">
                        </div>
                        <div class="setting-group">
                            <label>Color Secundario</label>
                            <input type="color" id="secondaryColor">
                        </div>
                    </div>
                </div>
                <footer class="settings-footer">
                    <button id="resetSettings">Restaurar Valores</button>
                    <button id="saveSettings" class="primary">Guardar Cambios</button>
                </footer>
            </div>
        `;

        this.setupEventListeners(panel);
        return panel;
    }

    private setupEventListeners(panel: HTMLElement): void {
        // Cerrar panel
        panel.querySelector('.close-button')?.addEventListener('click', () => {
            this.hide();
        });

        // Cambio de tabs
        panel.querySelectorAll('.settings-tabs button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = (e.target as HTMLElement).dataset.tab;
                if (tab) this.switchTab(tab);
            });
        });

        // Tipo de fondo
        const bgTypeSelect = panel.querySelector('#bgType') as HTMLSelectElement;
        bgTypeSelect?.addEventListener('change', () => {
            this.toggleBackgroundSettings(bgTypeSelect.value);
        });

        // Slideshow
        const slideshowCheckbox = panel.querySelector('#enableSlideshow') as HTMLInputElement;
        slideshowCheckbox?.addEventListener('change', () => {
            this.toggleSlideshowSettings(slideshowCheckbox.checked);
        });

        // Guardar cambios
        panel.querySelector('#saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
        });

        // Restaurar valores
        panel.querySelector('#resetSettings')?.addEventListener('click', () => {
            this.resetSettings();
        });
    }

    private async loadCurrentSettings(): Promise<void> {
        // Obtener las configuraciones con tipos explícitos
        const backgroundConfig = await storage.getBackground() as BackgroundConfig;
        const gridConfig = await storage.getGridConfig() as GridConfig;

        // Cargar configuración de fondo
        const bgTypeSelect = this.panel.querySelector('#bgType') as HTMLSelectElement;
        const bgColorInput = this.panel.querySelector('#bgColor') as HTMLInputElement;
        const slideshowCheckbox = this.panel.querySelector('#enableSlideshow') as HTMLInputElement;
        const slideshowInterval = this.panel.querySelector('#slideshowInterval') as HTMLInputElement;

        if (backgroundConfig && typeof backgroundConfig === 'object') {
            bgTypeSelect.value = backgroundConfig.type;
            bgColorInput.value = backgroundConfig.type === 'color' ? backgroundConfig.value : '#ffffff';
            slideshowCheckbox.checked = backgroundConfig.slideshow.enabled;
            slideshowInterval.value = String(backgroundConfig.slideshow.interval / 60000); // Convertir de ms a minutos

            this.toggleBackgroundSettings(backgroundConfig.type);
            this.toggleSlideshowSettings(backgroundConfig.slideshow.enabled);
            this.updateSlideshowImages(backgroundConfig.slideshow.images);
        }

        // Cargar configuración del grid
        const cellSizeInput = this.panel.querySelector('#cellSize') as HTMLInputElement;
        const gridMarginInput = this.panel.querySelector('#gridMargin') as HTMLInputElement;
        const gridColumnsInput = this.panel.querySelector('#gridColumns') as HTMLInputElement;
        const gridRowsInput = this.panel.querySelector('#gridRows') as HTMLInputElement;

        if (gridConfig && typeof gridConfig === 'object') {
            cellSizeInput.value = String(gridConfig.cellSize);
            gridMarginInput.value = String(gridConfig.margin);
            gridColumnsInput.value = String(gridConfig.columns);
            gridRowsInput.value = String(gridConfig.rows);
        }
    }

    private async saveSettings(): Promise<void> {
        try {
            // Recopilar configuración de fondo
            const bgConfig: BackgroundConfig = {
                type: (this.panel.querySelector('#bgType') as HTMLSelectElement).value as 'color' | 'image',
                value: (this.panel.querySelector('#bgColor') as HTMLInputElement).value,
                slideshow: {
                    enabled: (this.panel.querySelector('#enableSlideshow') as HTMLInputElement).checked,
                    interval: parseInt((this.panel.querySelector('#slideshowInterval') as HTMLInputElement).value) * 60000,
                    images: [] // Se mantiene la lista actual de imágenes
                }
            };

            // Recopilar configuración del grid
            const gridConfig: GridConfig = {
                cellSize: parseInt((this.panel.querySelector('#cellSize') as HTMLInputElement).value),
                margin: parseInt((this.panel.querySelector('#gridMargin') as HTMLInputElement).value),
                columns: parseInt((this.panel.querySelector('#gridColumns') as HTMLInputElement).value),
                rows: parseInt((this.panel.querySelector('#gridRows') as HTMLInputElement).value)
            };

            // Guardar configuraciones
            await Promise.all([
                storage.setBackground(bgConfig),
                storage.setGridConfig(gridConfig)
            ]);

            // Aplicar cambios
            await backgroundManager.initialize();
            await grid.initialize(document.querySelector(`.${CSS_CLASSES.GRID}`) as HTMLElement);

            this.hide();
            this.showMessage('Configuración guardada correctamente', 'success');
        } catch (error) {
            this.showMessage('Error al guardar la configuración', 'error');
        }
    }

    private async resetSettings(): Promise<void> {
        if (confirm('¿Estás seguro de que deseas restaurar la configuración por defecto?')) {
            await Promise.all([
                storage.setBackground(DEFAULT_BACKGROUND_CONFIG),
                storage.setGridConfig(DEFAULT_GRID_CONFIG)
            ]);
            await this.loadCurrentSettings();
            this.showMessage('Configuración restaurada', 'success');
        }
    }

    private toggleBackgroundSettings(type: string): void {
        const colorSettings = this.panel.querySelector('#colorSettings') as HTMLElement;
        const imageSettings = this.panel.querySelector('#imageSettings') as HTMLElement;

        colorSettings.style.display = type === 'color' ? 'block' : 'none';
        imageSettings.style.display = type === 'image' ? 'block' : 'none';
    }

    private toggleSlideshowSettings(enabled: boolean): void {
        const slideshowSettings = this.panel.querySelector('#slideshowSettings') as HTMLElement;
        slideshowSettings.style.display = enabled ? 'block' : 'none';
    }

    private updateSlideshowImages(images: string[]): void {
        const container = this.panel.querySelector('#slideshowImages') as HTMLElement;
        container.innerHTML = '';

        images.forEach((image, index) => {
            const imageElement = document.createElement('div');
            imageElement.className = 'slideshow-image';
            imageElement.innerHTML = `
                <img src="${image}" alt="Slideshow image ${index + 1}">
                <button class="remove-image">×</button>
            `;

            imageElement.querySelector('.remove-image')?.addEventListener('click', () => {
                this.removeSlideshowImage(index);
            });

            container.appendChild(imageElement);
        });
    }

    private async removeSlideshowImage(index: number): Promise<void> {
        const bgConfig = await storage.getBackground() as BackgroundConfig;
        bgConfig.slideshow.images.splice(index, 1);
        await storage.setBackground(bgConfig);
        this.updateSlideshowImages(bgConfig.slideshow.images);
    }

    private switchTab(tab: string): void {
        // Actualizar botones
        this.panel.querySelectorAll('.settings-tabs button').forEach((button) => {
            const buttonElement = button as HTMLButtonElement;
            buttonElement.classList.toggle('active', buttonElement.dataset.tab === tab);
        });

        // Actualizar contenido
        this.panel.querySelectorAll('.tab-content').forEach((content) => {
            const contentElement = content as HTMLElement;
            contentElement.classList.toggle('active', contentElement.dataset.tabContent === tab);
        });

        this.currentTab = tab;
    }

    private showMessage(message: string, type: 'success' | 'error'): void {
        const messageElement = document.createElement('div');
        messageElement.className = `settings-message ${type}`;
        messageElement.textContent = message;

        this.panel.querySelector('.settings-content')?.appendChild(messageElement);

        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    public show(): void {
        this.panel.classList.add('visible');
        this.loadCurrentSettings();
    }

    public hide(): void {
        this.panel.classList.remove('visible');
    }
}

export const settingsPanel = SettingsPanel.getInstance();