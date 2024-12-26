import { storage } from '../../utils/storage';
import { CSS_CLASSES, CUSTOM_EVENTS, ERROR_MESSAGES, WIDGET_DEFAULT_SIZES } from '../../utils/constants';
import { grid } from '../grid/Grid';
import { TaskListWidget } from './TaskListWidget';
import { BookmarkWidget, } from './BookmarkWidget';
import {
    WidgetBase,
    WidgetType,
    GridPosition,
    GridSize,
    TaskListWidgetData,
    BookmarkWidget as BookmarkWidgetInterface // Añade esta línea
} from '../../types';

export abstract class Widget {
    protected element: HTMLElement;
    protected data: WidgetBase;

    constructor(data: WidgetBase) {
        this.data = data;
        this.element = this.createBaseElement();
        this.setupEventListeners();
    }

    protected createBaseElement(): HTMLElement {
        const widget = document.createElement('div');
        widget.className = CSS_CLASSES.WIDGET;
        widget.id = this.data.id;
        widget.dataset.type = this.data.type;

        // Aplicar posicionamiento
        this.applyPosition(widget);

        // Crear estructura básica
        const header = this.createHeader();
        const content = this.createContent();
        const footer = this.createFooter();

        widget.appendChild(header);
        widget.appendChild(content);
        widget.appendChild(footer);

        return widget;
    }

    protected createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = CSS_CLASSES.WIDGET_HEADER;

        // Título
        if (this.data.title) {
            const title = document.createElement('h3');
            title.textContent = this.data.title;
            header.appendChild(title);
        }

        // Botones de control
        const controls = document.createElement('div');
        controls.className = 'widget-controls';

        // Botón de editar
        const editButton = document.createElement('button');
        editButton.innerHTML = '✎';
        editButton.onclick = () => this.toggleEdit();
        controls.appendChild(editButton);

        // Botón de cerrar
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.remove();
        controls.appendChild(closeButton);

        header.appendChild(controls);
        return header;
    }

    protected abstract createContent(): HTMLElement;

    protected createFooter(): HTMLElement {
        const footer = document.createElement('div');
        footer.className = CSS_CLASSES.WIDGET_FOOTER;
        return footer;
    }

    protected setupEventListeners(): void {
        // Drag and Drop
        this.element.setAttribute('draggable', 'true');

        this.element.addEventListener('dragstart', (e) => {
            if (e instanceof DragEvent) {
                e.dataTransfer?.setData('text/plain', this.data.id);
                this.element.classList.add('dragging');
            }
        });

        this.element.addEventListener('dragend', () => {
            this.element.classList.remove('dragging');
        });

        // Resize
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.handleResize(width, height);
            }
        });

        resizeObserver.observe(this.element);
    }

    protected async handleResize(width: number, height: number): Promise<void> {
        const gridConfig = grid.getConfig();
        const newSize: GridSize = {
            width: Math.round(width / (gridConfig.cellSize + gridConfig.margin)),
            height: Math.round(height / (gridConfig.cellSize + gridConfig.margin))
        };

        if (this.isValidSize(newSize)) {
            this.data.size = newSize;
            await this.save();
        }
    }

    protected isValidSize(size: GridSize): boolean {
        // Convertimos el tipo a string para usarlo como clave
        const widgetType = this.data.type.toString() as keyof typeof WIDGET_DEFAULT_SIZES;
        const defaultSize = WIDGET_DEFAULT_SIZES[widgetType];

        if (!defaultSize) {
            throw new Error(ERROR_MESSAGES.INVALID_TYPE);
        }

        return size.width >= defaultSize.width && size.height >= defaultSize.height;
    }

    public async move(position: GridPosition): Promise<boolean> {
        if (!grid.isPositionValid(position)) {
            throw new Error(ERROR_MESSAGES.INVALID_POSITION);
        }

        if (!grid.isAreaFree(position, this.data.size)) {
            throw new Error(ERROR_MESSAGES.POSITION_OCCUPIED);
        }

        // Liberar posición actual
        grid.freeCells(this.data.position, this.data.size);

        // Ocupar nueva posición
        grid.occupyCells(position, this.data.size);
        this.data.position = position;

        // Actualizar visual
        this.applyPosition(this.element);

        // Guardar cambios
        await this.save();
        return true;
    }

    protected applyPosition(element: HTMLElement): void {
        const gridConfig = grid.getConfig();
        const { x, y } = this.data.position;
        const { width, height } = this.data.size;

        element.style.gridColumn = `${x + 1} / span ${width}`;
        element.style.gridRow = `${y + 1} / span ${height}`;
    }

    public async toggleEdit(): Promise<void> {
        this.data.isEditing = !this.data.isEditing;
        this.element.classList.toggle(CSS_CLASSES.EDITING);
        await this.save();
    }

    public async remove(): Promise<void> {
        // Liberar celdas ocupadas
        grid.freeCells(this.data.position, this.data.size);

        // Eliminar elemento del DOM
        this.element.remove();

        // Eliminar de almacenamiento
        const widgets = await storage.getWidgets() as WidgetBase[];
        const updatedWidgets = widgets.filter(w => w.id !== this.data.id);
        await storage.setWidgets(updatedWidgets);

        // Disparar evento
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.WIDGET_REMOVED, {
            detail: { widgetId: this.data.id }
        }));
    }

    protected async save(): Promise<void> {
        const widgets = await storage.getWidgets() as WidgetBase[];
        const index = widgets.findIndex(w => w.id === this.data.id);

        if (index !== -1) {
            widgets[index] = this.data;
        } else {
            widgets.push(this.data);
        }

        await storage.setWidgets(widgets);

        // Disparar evento
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.WIDGET_UPDATED, {
            detail: { widget: this.data }
        }));
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getData(): WidgetBase {
        return { ...this.data };
    }
}

// Implementación específica para cada tipo de widget
export class IconWidget extends Widget {
    protected createContent(): HTMLElement {
        const content = document.createElement('div');
        content.className = CSS_CLASSES.WIDGET_CONTENT;

        const icon = document.createElement('img');
        icon.src = (this.data as any).iconUrl;
        icon.alt = this.data.title || 'Icon';

        const link = document.createElement('a');
        link.href = (this.data as any).url;
        link.appendChild(icon);

        content.appendChild(link);
        return content;
    }
}

export class NoteWidget extends Widget {
    protected createContent(): HTMLElement {
        const content = document.createElement('div');
        content.className = CSS_CLASSES.WIDGET_CONTENT;

        const textarea = document.createElement('textarea');
        textarea.value = (this.data as any).content;
        textarea.readOnly = !this.data.isEditing;

        textarea.addEventListener('change', async () => {
            (this.data as any).content = textarea.value;
            await this.save();
        });

        content.appendChild(textarea);
        return content;
    }
}

// Factory para crear widgets
export class WidgetFactory {
    static create(data: WidgetBase): Widget {
        switch (data.type) {
            case WidgetType.ICON:
                return new IconWidget(data);
            case WidgetType.NOTE:
                return new NoteWidget(data);
            case WidgetType.TASKLIST:
                return new TaskListWidget(data as TaskListWidgetData);
            case WidgetType.BOOKMARK:
                return new BookmarkWidget(data as BookmarkWidgetInterface);
            // Agregar más tipos según se implementen
            default:
                throw new Error(ERROR_MESSAGES.INVALID_TYPE);
        }
    }
}