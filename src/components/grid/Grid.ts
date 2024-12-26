import { GridConfig, GridPosition, GridCell, WidgetBase } from '../../types';
import { storage } from '../../utils/storage';
import { CUSTOM_EVENTS, CSS_CLASSES } from '../../utils/constants';

export class Grid {
    private static instance: Grid;
    private config: GridConfig;
    private cells: GridCell[][];
    private element: HTMLElement | null;

    private constructor() {
        this.config = {
            cellSize: 100,
            margin: 10,
            columns: 12,
            rows: 6
        };
        this.cells = [];
        this.element = null;
    }

    public static getInstance(): Grid {
        if (!Grid.instance) {
            Grid.instance = new Grid();
        }
        return Grid.instance;
    }

    public async initialize(container: HTMLElement): Promise<void> {
        this.element = container;

        // Cargar configuración
        const storedConfig = await storage.getGridConfig() as GridConfig;
        this.config = storedConfig;

        // Inicializar la matriz de celdas
        this.initializeCells();

        // Crear el grid visual
        this.createGridElement();

        // Aplicar widgets existentes
        const widgets = await storage.getWidgets() as WidgetBase[];
        this.applyWidgets(widgets);
    }

    private initializeCells(): void {
        this.cells = Array(this.config.rows).fill(null).map(() =>
            Array(this.config.columns).fill(null).map((_, columnIndex) => ({
                position: { x: columnIndex, y: 0 },
                occupied: false
            }))
        );
    }

    private createGridElement(): void {
        if (!this.element) return;

        this.element.innerHTML = '';
        this.element.className = CSS_CLASSES.GRID;

        // Establecer estilo del contenedor
        this.element.style.display = 'grid';
        this.element.style.gridTemplateColumns = `repeat(${this.config.columns}, ${this.config.cellSize}px)`;
        this.element.style.gridGap = `${this.config.margin}px`;
        this.element.style.padding = `${this.config.margin}px`;

        // Crear celdas
        for (let y = 0; y < this.config.rows; y++) {
            for (let x = 0; x < this.config.columns; x++) {
                const cell = document.createElement('div');
                cell.className = CSS_CLASSES.GRID_CELL;
                cell.dataset.x = x.toString();
                cell.dataset.y = y.toString();
                this.element.appendChild(cell);
            }
        }
    }

    private applyWidgets(widgets: WidgetBase[]): void {
        widgets.forEach(widget => {
            this.occupyCells(widget.position, widget.size);
        });
    }

    public isPositionValid(position: GridPosition): boolean {
        return position.x >= 0 &&
            position.x < this.config.columns &&
            position.y >= 0 &&
            position.y < this.config.rows;
    }

    public isAreaFree(position: GridPosition, size: { width: number; height: number }): boolean {
        for (let y = position.y; y < position.y + size.height; y++) {
            for (let x = position.x; x < position.x + size.width; x++) {
                if (!this.isPositionValid({ x, y }) || this.cells[y][x].occupied) {
                    return false;
                }
            }
        }
        return true;
    }

    public occupyCells(position: GridPosition, size: { width: number; height: number }): void {
        for (let y = position.y; y < position.y + size.height; y++) {
            for (let x = position.x; x < position.x + size.width; x++) {
                if (this.isPositionValid({ x, y })) {
                    this.cells[y][x].occupied = true;
                }
            }
        }
    }

    public freeCells(position: GridPosition, size: { width: number; height: number }): void {
        for (let y = position.y; y < position.y + size.height; y++) {
            for (let x = position.x; x < position.x + size.width; x++) {
                if (this.isPositionValid({ x, y })) {
                    this.cells[y][x].occupied = false;
                }
            }
        }
    }

    public getConfig(): GridConfig {
        return { ...this.config };
    }

    public async updateConfig(newConfig: Partial<GridConfig>): Promise<void> {
        this.config = { ...this.config, ...newConfig };
        await storage.setGridConfig(this.config);

        // Recrear el grid con la nueva configuración
        this.initializeCells();
        this.createGridElement();

        // Notificar el cambio
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.GRID_UPDATED, {
            detail: this.config
        }));
    }
}

export const grid = Grid.getInstance();