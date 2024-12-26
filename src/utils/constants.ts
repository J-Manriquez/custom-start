import { BackgroundConfig, GridConfig, WidgetType } from '../types';

// Claves para el almacenamiento
export const STORAGE_KEYS = {
    WIDGETS: 'widgets',
    BACKGROUND: 'background',
    GRID_CONFIG: 'gridConfig'
} as const;

// Configuración predeterminada del grid
export const DEFAULT_GRID_CONFIG: GridConfig = {
    cellSize: 100,  // Tamaño en píxeles de cada celda
    margin: 10,     // Margen entre celdas
    columns: 12,    // Número de columnas en el grid
    rows: 6         // Número de filas en el grid
};

// Configuración predeterminada del fondo
export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
    type: 'color',
    value: '#f0f0f0',
    slideshow: {
        enabled: false,
        interval: 300000, // 5 minutos en milisegundos
        images: []
    }
};

export const THEME_COLORS = {
    light: {
        primary: '#1a73e8',
        secondary: '#5f6368',
        background: '#ffffff',
        surface: '#f8f9fa',
        border: '#dadce0',
        textPrimary: '#202124',
        textSecondary: '#5f6368'
    },
    dark: {
        primary: '#8ab4f8',
        secondary: '#9aa0a6',
        background: '#202124',
        surface: '#292a2d',
        border: '#3c4043',
        textPrimary: '#e8eaed',
        textSecondary: '#9aa0a6'
    }
} as const;

export const SYSTEM_PREFERENCES = {
    theme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
};

// Tamaños predeterminados para cada tipo de widget
export const WIDGET_DEFAULT_SIZES = {
    [WidgetType.ICON]: { width: 1, height: 1 },
    [WidgetType.NOTE]: { width: 2, height: 2 },
    [WidgetType.TASKLIST]: { width: 2, height: 3 },
    [WidgetType.BOOKMARK]: { width: 1, height: 1 },
    [WidgetType.IMAGE]: { width: 2, height: 2 }
} as const;

// Expresiones regulares para validación
export const VALID_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const VALID_URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Límites y restricciones
export const LIMITS = {
    MAX_WIDGETS: 50,           // Número máximo de widgets permitidos
    MAX_TITLE_LENGTH: 50,      // Longitud máxima para títulos
    MAX_NOTE_LENGTH: 1000,     // Longitud máxima para notas
    MAX_TASKS: 20,             // Número máximo de tareas por widget
    MAX_IMAGES: 10,            // Número máximo de imágenes en slideshow
    MIN_SLIDESHOW_INTERVAL: 5000,    // Intervalo mínimo para slideshow (5 segundos)
    MAX_SLIDESHOW_INTERVAL: 3600000  // Intervalo máximo para slideshow (1 hora)
} as const;

// Clases CSS
export const CSS_CLASSES = {
    WIDGET: 'custom-widget',
    WIDGET_CONTAINER: 'widget-container',
    WIDGET_HEADER: 'widget-header',
    WIDGET_CONTENT: 'widget-content',
    WIDGET_FOOTER: 'widget-footer',
    DRAGGABLE: 'draggable',
    RESIZABLE: 'resizable',
    EDITING: 'editing',
    GRID: 'custom-grid',
    GRID_CELL: 'grid-cell',
    GRID_CELL_OCCUPIED: 'occupied',
    BACKGROUND: 'custom-background',
    DRAGGING: 'dragging'
} as const;

// Mensajes de error
export const ERROR_MESSAGES = {
    INVALID_COLOR: 'Color inválido. Debe ser un código hexadecimal válido.',
    INVALID_URL: 'URL inválida. Debe ser una URL válida.',
    MAX_WIDGETS_REACHED: 'Has alcanzado el límite máximo de widgets.',
    INVALID_POSITION: 'Posición inválida en el grid.',
    POSITION_OCCUPIED: 'La posición está ocupada por otro widget.',
    STORAGE_ERROR: 'Error al acceder al almacenamiento.',
    INVALID_SIZE: 'Tamaño de widget inválido.',
    INVALID_TYPE: 'Tipo de widget inválido.'
} as const;

// Tipos de eventos personalizados
export const CUSTOM_EVENTS = {
    WIDGET_ADDED: 'widgetAdded',
    WIDGET_REMOVED: 'widgetRemoved',
    WIDGET_UPDATED: 'widgetUpdated',
    BACKGROUND_CHANGED: 'backgroundChanged',
    GRID_UPDATED: 'gridUpdated',
    STORAGE_UPDATED: 'storageUpdated'
} as const;