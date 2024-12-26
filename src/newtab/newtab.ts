import { grid } from '../components/grid/Grid';
import { backgroundManager } from '../components/background/BackgroundManager';
import { WidgetFactory } from '../components/widgets/Widget';
import { WidgetType, WidgetBase, GridPosition } from '../types'; // Añadido GridPosition
import { storage } from '../utils/storage';
import { WIDGET_DEFAULT_SIZES } from '../utils/constants'; // Añadido WIDGET_DEFAULT_SIZES
import { dragAndDrop } from '../utils/dragAndDrop'; // Añadido dragAndDrop
import { settingsPanel } from '@/components/settings/SettingsPanel';

class NewTabPage {
    private editMode: boolean = false;
    private gridElement: HTMLElement | null = null;
    private addWidgetDialog: HTMLDialogElement | null = null;

    constructor() {
        this.initialize();
    }

    private setupSettingsButton(): void {
        const settingsButton = document.getElementById('openSettings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                settingsPanel.show();
            });
        }
    }

    private async initialize(): Promise<void> {
        // Inicializar elementos
        this.gridElement = document.getElementById('grid');
        this.addWidgetDialog = document.getElementById('addWidgetDialog') as HTMLDialogElement;

        if (!this.gridElement) {
            console.error('Grid element not found');
            return;
        }

        // Inicializar componentes principales
        await Promise.all([
            grid.initialize(this.gridElement),
            backgroundManager.initialize()
        ]);

        // Configurar eventos
        this.setupEventListeners();

        // Cargar widgets existentes
        await this.loadWidgets();
    }

    private setupEventListeners(): void {
        // Toggle Edit Mode
        const editButton = document.getElementById('toggleEditMode');
        editButton?.addEventListener('click', () => this.toggleEditMode());

        // Add Widget Button
        const addButton = document.getElementById('addWidget');
        addButton?.addEventListener('click', () => this.showAddWidgetDialog());

        // Settings Button
        const settingsButton = document.getElementById('openSettings');
        settingsButton?.addEventListener('click', () => this.openSettings());

        // Widget Type Buttons
        const widgetTypeButtons = document.querySelectorAll('.widget-type-button');
        widgetTypeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = (e.currentTarget as HTMLElement).dataset.type as WidgetType;
                this.createWidget(type);
            });
        });

        // Dialog Cancel Button
        const cancelButton = this.addWidgetDialog?.querySelector('.cancel-button');
        cancelButton?.addEventListener('click', () => {
            this.addWidgetDialog?.close();
        });
    }

    private async loadWidgets(): Promise<void> {
        const widgets = await storage.getWidgets() as WidgetBase[];
        widgets.forEach(widgetData => {
            const widget = WidgetFactory.create(widgetData);
            this.gridElement?.appendChild(widget.getElement());
        });
    }

    private toggleEditMode(): void {
        this.editMode = !this.editMode;
        document.body.classList.toggle('edit-mode', this.editMode);
        // Implementar lógica adicional para el modo de edición
    }

    private showAddWidgetDialog(): void {
        this.addWidgetDialog?.showModal();
    }

    private async createWidget(type: WidgetType): Promise<void> {
        const gridConfig = grid.getConfig();

        // Encontrar primera posición libre
        let position: GridPosition | null = null;
        const defaultSize = WIDGET_DEFAULT_SIZES[type];

        // Buscar una posición libre en el grid
        for (let y = 0; y < gridConfig.rows; y++) {
            for (let x = 0; x < gridConfig.columns; x++) {
                if (grid.isAreaFree({ x, y }, defaultSize)) {
                    position = { x, y };
                    break;
                }
            }
            if (position) break;
        }

        if (!position) {
            alert('No hay espacio disponible en el grid');
            this.addWidgetDialog?.close();
            return;
        }

        // Crear datos base del widget
        const widgetData: WidgetBase = {
            id: `widget-${Date.now()}`,
            type,
            position,
            size: defaultSize,
            isEditing: false
        };

        // Añadir datos específicos según el tipo
        switch (type) {
            case WidgetType.ICON:
                (widgetData as any).url = '';
                (widgetData as any).iconUrl = '';
                break;
            case WidgetType.NOTE:
                (widgetData as any).content = '';
                (widgetData as any).backgroundColor = '#ffffff';
                break;
            // Añadir más casos según se necesite
        }

        // Crear el widget
        const widget = WidgetFactory.create(widgetData);
        const element = widget.getElement();

        // Inicializar drag & drop
        dragAndDrop.initializeDraggable(element, widgetData);

        // Añadir al grid
        this.gridElement?.appendChild(element);
        grid.occupyCells(position, defaultSize);

        // Guardar en almacenamiento
        const widgets = await storage.getWidgets() as WidgetBase[];
        widgets.push(widgetData);
        await storage.setWidgets(widgets);

        // Cerrar diálogo
        this.addWidgetDialog?.close();

        // Si es un widget que requiere configuración inicial, abrir modo edición
        if (type === WidgetType.ICON || type === WidgetType.NOTE) {
            widget.toggleEdit();
        }
    }

    private openSettings(): void {
        // Implementar apertura de configuraciones
    }
}

// Inicializar cuando el DOM esté listo

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const gridElement = document.getElementById('grid');
        if (!gridElement) {
            console.error('Grid element not found');
            return;
        }

        // Inicializar el almacenamiento
        await storage.initialize();

        // Inicializar el fondo
        await backgroundManager.initialize();

        // Inicializar el grid
        await grid.initialize(gridElement);

        console.log('New tab page initialized successfully');
    } catch (error) {
        console.error('Error initializing new tab page:', error);
    }
});