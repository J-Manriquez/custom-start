import { GridPosition, WidgetBase } from '../types';
import { grid } from '../components/grid/Grid';
import { CSS_CLASSES } from './constants';

export class DragAndDropManager {
    private static instance: DragAndDropManager;
    private draggingElement: HTMLElement | null = null;
    private originalPosition: GridPosition | null = null;
    private ghostElement: HTMLElement | null = null;

    private constructor() {
        this.initialize();
    }

    public static getInstance(): DragAndDropManager {
        if (!DragAndDropManager.instance) {
            DragAndDropManager.instance = new DragAndDropManager();
        }
        return DragAndDropManager.instance;
    }

    private initialize(): void {
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
    }

    public initializeDraggable(element: HTMLElement, widgetData: WidgetBase): void {
        element.setAttribute('draggable', 'true');

        element.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, widgetData);
        });

        element.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });
    }

    private handleDragStart(e: DragEvent, widgetData: WidgetBase): void {
        if (!e.dataTransfer) return;

        this.draggingElement = e.target as HTMLElement;
        this.originalPosition = { ...widgetData.position };

        // Crear elemento fantasma para el arrastre
        this.ghostElement = this.draggingElement.cloneNode(true) as HTMLElement;
        this.ghostElement.classList.add('dragging-ghost');
        document.body.appendChild(this.ghostElement);

        // Configurar datos de transferencia
        e.dataTransfer.setData('application/json', JSON.stringify(widgetData));
        e.dataTransfer.effectAllowed = 'move';

        // Establecer imagen personalizada para el arrastre
        const rect = this.draggingElement.getBoundingClientRect();
        e.dataTransfer.setDragImage(this.ghostElement, rect.width / 2, rect.height / 2);

        // Añadir clase visual
        this.draggingElement.classList.add(CSS_CLASSES.DRAGGING);

        // Mostrar áreas válidas en el grid
        this.highlightValidDropZones(widgetData);
    }

    private handleDragOver(e: DragEvent): void {
        e.preventDefault();
        if (!this.draggingElement || !e.dataTransfer) return;

        e.dataTransfer.dropEffect = 'move';

        // Calcular posición en el grid
        const gridPosition = this.getGridPosition(e.clientX, e.clientY);
        if (gridPosition) {
            this.updateGhostPosition(gridPosition);
        }
    }

    private handleDrop(e: DragEvent): void {
        e.preventDefault();
        if (!this.draggingElement || !e.dataTransfer) return;

        const widgetData = JSON.parse(e.dataTransfer.getData('application/json')) as WidgetBase;
        const newPosition = this.getGridPosition(e.clientX, e.clientY);

        if (newPosition && grid.isAreaFree(newPosition, widgetData.size)) {
            // Actualizar posición del widget
            widgetData.position = newPosition;
            const widget = this.draggingElement;

            // Aplicar nueva posición
            widget.style.gridColumn = `${newPosition.x + 1} / span ${widgetData.size.width}`;
            widget.style.gridRow = `${newPosition.y + 1} / span ${widgetData.size.height}`;

            // Actualizar ocupación en el grid
            if (this.originalPosition) {
                grid.freeCells(this.originalPosition, widgetData.size);
            }
            grid.occupyCells(newPosition, widgetData.size);
        }

        this.cleanupDrag();
    }

    private handleDragEnd(e: DragEvent): void {
        e.preventDefault();
        this.cleanupDrag();
    }

    private cleanupDrag(): void {
        if (this.draggingElement) {
            this.draggingElement.classList.remove(CSS_CLASSES.DRAGGING);
        }
        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }
        this.draggingElement = null;
        this.originalPosition = null;
        this.removeHighlights();
    }

    private getGridPosition(x: number, y: number): GridPosition | null {
        const gridElement = document.querySelector(`.${CSS_CLASSES.GRID}`);
        if (!gridElement) return null;

        const rect = gridElement.getBoundingClientRect();
        const gridConfig = grid.getConfig();

        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        const gridX = Math.floor(relativeX / (gridConfig.cellSize + gridConfig.margin));
        const gridY = Math.floor(relativeY / (gridConfig.cellSize + gridConfig.margin));

        if (gridX >= 0 && gridX < gridConfig.columns && gridY >= 0 && gridY < gridConfig.rows) {
            return { x: gridX, y: gridY };
        }

        return null;
    }

    private updateGhostPosition(position: GridPosition): void {
        if (!this.ghostElement) return;

        const gridConfig = grid.getConfig();
        const x = position.x * (gridConfig.cellSize + gridConfig.margin);
        const y = position.y * (gridConfig.cellSize + gridConfig.margin);

        this.ghostElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    private highlightValidDropZones(widgetData: WidgetBase): void {
        const gridConfig = grid.getConfig();
        for (let y = 0; y < gridConfig.rows; y++) {
            for (let x = 0; x < gridConfig.columns; x++) {
                const position = { x, y };
                if (grid.isAreaFree(position, widgetData.size)) {
                    const cell = document.querySelector(
                        `.${CSS_CLASSES.GRID_CELL}[data-x="${x}"][data-y="${y}"]`
                    );
                    cell?.classList.add('valid-drop-zone');
                }
            }
        }
    }

    private removeHighlights(): void {
        document.querySelectorAll('.valid-drop-zone').forEach(element => {
            element.classList.remove('valid-drop-zone');
        });
    }
}

export const dragAndDrop = DragAndDropManager.getInstance();