// Tipos base para el sistema de grid
export interface GridPosition {
    x: number;
    y: number;
}

export interface GridSize {
    width: number;
    height: number;
}

export interface GridCell {
    position: GridPosition;
    occupied: boolean;
    widgetId?: string;
}

// Tipos para widgets
export enum WidgetType {
    ICON = 'icon',
    NOTE = 'note',
    TASKLIST = 'tasklist',
    BOOKMARK = 'bookmark',
    IMAGE = 'image'
}

export interface WidgetBase {
    id: string;
    type: WidgetType;
    position: GridPosition;
    size: GridSize;
    title?: string;
    isEditing: boolean;
}

export interface IconWidget extends WidgetBase {
    type: WidgetType.ICON;
    url: string;
    iconUrl: string;
}

export interface NoteWidget extends WidgetBase {
    type: WidgetType.NOTE;
    content: string;
    backgroundColor: string;
}

export interface TaskItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

export interface TaskListWidget extends WidgetBase {
    type: WidgetType.TASKLIST;
    items: TaskItem[];
}

// Tipos para el sistema de fondos
export interface SlideshowConfig {
    enabled: boolean;
    interval: number;
    images: string[];
}

export interface BackgroundConfig {
    type: 'color' | 'image';
    value: string;
    slideshow: SlideshowConfig;
}

export interface GridConfig {
    cellSize: number;
    margin: number;
    columns: number;
    rows: number;
}

// Tipos para almacenamiento
export interface StorageData {
    widgets: WidgetBase[];
    background: BackgroundConfig;
    gridConfig: GridConfig;
}

export interface StorageItems {
    [key: string]: any;
}

export interface BackgroundConfig {
    type: 'color' | 'image';
    value: string;
    slideshow: {
        enabled: boolean;
        interval: number;
        images: string[];
    };
}

export interface GridConfig {
    cellSize: number;
    margin: number;
    columns: number;
    rows: number;
}

//interfaces para el TaskListWidget
export interface TaskItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

export interface TaskListWidgetData extends WidgetBase {
    type: WidgetType.TASKLIST;
    tasks: TaskItem[];
    sortBy: 'created' | 'completed' | 'text';
    showCompleted: boolean;
}

export interface BookmarkData {
    url: string;
    title: string;
    favicon: string;
    description?: string;
    tags: string[];
    folderId?: string;
    lastVisited: number;
    customIcon?: string;
    color?: string;
}

export interface BookmarkFolder {
    id: string;
    name: string;
    parentId?: string;
}

export interface BookmarkWidget extends WidgetBase {
    type: WidgetType.BOOKMARK;
    bookmarkData: BookmarkData;
    showDescription: boolean;
    showTags: boolean;
    layout: 'compact' | 'full';
    folders?: BookmarkFolder[];
}