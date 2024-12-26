import { Widget } from './Widget';
import { BookmarkData, BookmarkWidget as BookmarkWidgetType } from '../../types';
import { CSS_CLASSES } from '../../utils/constants';
import { bookmarkService } from '../../services/BookmarkService';

export class BookmarkWidget extends Widget {
    private bookmarkData: BookmarkData;
    private readonly DEFAULT_ICON = '/assets/default-favicon.png';

    constructor(data: BookmarkWidgetType) {
        super(data);
        this.bookmarkData = data.bookmarkData;
    }

    protected async initialize(): Promise<void> {
        if (!this.bookmarkData.favicon) {
            this.bookmarkData.favicon = await bookmarkService.getFavicon(this.bookmarkData.url);
            await this.save();
        }
    }

    protected createContent(): HTMLElement {
        const content = document.createElement('div');
        content.className = `${CSS_CLASSES.WIDGET_CONTENT} bookmark-widget ${(this.data as BookmarkWidgetType).layout
            }`;

        if (this.data.isEditing) {
            content.appendChild(this.createEditForm());
        } else {
            content.appendChild(this.createBookmarkView());
        }

        return content;
    }

    private createBookmarkView(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'bookmark-container';

        // Icono
        const iconContainer = this.createIconElement();
        container.appendChild(iconContainer);

        // Contenido
        const contentContainer = this.createContentElement();
        container.appendChild(contentContainer);

        // Añadir manejador de clics
        container.addEventListener('click', this.handleBookmarkClick.bind(this));

        return container;
    }

    private createIconElement(): HTMLElement {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'bookmark-icon';

        const icon = document.createElement('img');
        icon.src = this.bookmarkData.customIcon || this.bookmarkData.favicon || this.DEFAULT_ICON;
        icon.alt = '';
        icon.onerror = () => {
            icon.src = this.DEFAULT_ICON;
        };

        if (this.bookmarkData.color) {
            iconContainer.style.backgroundColor = this.bookmarkData.color;
        }

        iconContainer.appendChild(icon);
        return iconContainer;
    }


    private createContentElement(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'bookmark-content';

        // Título
        const title = document.createElement('div');
        title.className = 'bookmark-title';
        title.textContent = this.bookmarkData.title || new URL(this.bookmarkData.url).hostname;
        container.appendChild(title);

        // Descripción (si está habilitada y existe)
        if ((this.data as BookmarkWidgetType).showDescription && this.bookmarkData.description) {
            const description = document.createElement('div');
            description.className = 'bookmark-description';
            description.textContent = this.bookmarkData.description;
            container.appendChild(description);
        }

        // Tags (si están habilitados y existen)
        if ((this.data as BookmarkWidgetType).showTags && this.bookmarkData.tags.length > 0) {
            const tags = document.createElement('div');
            tags.className = 'bookmark-tags';
            this.bookmarkData.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'bookmark-tag';
                tagElement.textContent = tag;
                tags.appendChild(tagElement);
            });
            container.appendChild(tags);
        }

        return container;
    }

    private async handleBookmarkClick(event: MouseEvent): Promise<void> {
        event.preventDefault();

        // Actualizar última visita
        this.bookmarkData.lastVisited = Date.now();
        await this.save();

        // Abrir el enlace
        window.open(this.bookmarkData.url, '_blank');
    }

    private createEditForm(): HTMLElement {
        const form = document.createElement('form');
        form.className = 'bookmark-edit-form';

        // URL
        form.appendChild(this.createFormField('url', 'URL', this.bookmarkData.url, 'url', true));

        // Título
        form.appendChild(this.createFormField('title', 'Título', this.bookmarkData.title));

        // Descripción
        const descField = this.createFormField('description', 'Descripción', this.bookmarkData.description || '', 'textarea');
        form.appendChild(descField);

        // Tags
        form.appendChild(this.createFormField('tags', 'Etiquetas', this.bookmarkData.tags.join(', ')));

        // Color
        const colorField = this.createFormField('color', 'Color', this.bookmarkData.color || '#ffffff', 'color');
        form.appendChild(colorField);

        // Opciones de visualización
        form.appendChild(this.createDisplayOptions());

        // Botones de acción
        const buttons = this.createFormButtons();
        form.appendChild(buttons);

        // Evento submit
        form.addEventListener('submit', this.handleSubmit.bind(this));

        return form;
    }

    private createFormField(
        name: string,
        label: string,
        value: string,
        type: string = 'text',
        required: boolean = false
    ): HTMLElement {
        const container = document.createElement('div');
        container.className = 'form-field';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.htmlFor = name;

        const input = type === 'textarea'
            ? document.createElement('textarea')
            : document.createElement('input');

        if (type !== 'textarea') {
            (input as HTMLInputElement).type = type;
        }

        input.id = name;
        input.name = name;
        input.value = value;
        input.required = required;

        container.appendChild(labelElement);
        container.appendChild(input);

        return container;
    }

    private createDisplayOptions(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'display-options';

        const title = document.createElement('h4');
        title.textContent = 'Opciones de visualización';
        container.appendChild(title);

        // Mostrar descripción
        const descOption = document.createElement('label');
        descOption.className = 'checkbox-option';
        descOption.innerHTML = `
            <input type="checkbox" name="showDescription" 
                   ${(this.data as BookmarkWidgetType).showDescription ? 'checked' : ''}>
            <span>Mostrar descripción</span>
        `;
        container.appendChild(descOption);

        // Mostrar tags
        const tagsOption = document.createElement('label');
        tagsOption.className = 'checkbox-option';
        tagsOption.innerHTML = `
            <input type="checkbox" name="showTags" 
                   ${(this.data as BookmarkWidgetType).showTags ? 'checked' : ''}>
            <span>Mostrar etiquetas</span>
        `;
        container.appendChild(tagsOption);

        // Layout
        const layoutOption = document.createElement('div');
        layoutOption.className = 'radio-group';
        layoutOption.innerHTML = `
            <label>Layout:</label>
            <label>
                <input type="radio" name="layout" value="compact" 
                       ${(this.data as BookmarkWidgetType).layout === 'compact' ? 'checked' : ''}>
                <span>Compacto</span>
            </label>
            <label>
                <input type="radio" name="layout" value="full" 
                       ${(this.data as BookmarkWidgetType).layout === 'full' ? 'checked' : ''}>
                <span>Completo</span>
            </label>
        `;
        container.appendChild(layoutOption);

        return container;
    }

    private createFormButtons(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'form-buttons';

        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.className = 'primary';
        saveButton.textContent = 'Guardar';

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancelar';
        cancelButton.onclick = () => this.toggleEdit();

        container.appendChild(saveButton);
        container.appendChild(cancelButton);

        return container;
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const url = formData.get('url') as string;
        if (!bookmarkService.validateUrl(url)) {
            alert('URL inválida');
            return;
        }

        // Actualizar datos del bookmark
        this.bookmarkData = {
            ...this.bookmarkData,
            url,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            tags: (formData.get('tags') as string)
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean),
            color: formData.get('color') as string
        };

        // Actualizar opciones de visualización
        const widgetData = this.data as BookmarkWidgetType;
        widgetData.showDescription = formData.get('showDescription') === 'on';
        widgetData.showTags = formData.get('showTags') === 'on';
        widgetData.layout = formData.get('layout') as 'compact' | 'full';

        // Actualizar favicon si la URL cambió
        if (url !== this.bookmarkData.url) {
            this.bookmarkData.favicon = await bookmarkService.getFavicon(url);
        }

        await this.save();
        this.toggleEdit();
    }

    protected async save(): Promise<void> {
        (this.data as BookmarkWidgetType).bookmarkData = this.bookmarkData;
        await super.save();
    }

    public override async toggleEdit(): Promise<void> {
        await super.toggleEdit();
        // Actualizar el contenido cuando cambia el modo de edición
        const content = this.element.querySelector(`.${CSS_CLASSES.WIDGET_CONTENT}`);
        if (content) {
            content.innerHTML = '';
            content.appendChild(
                this.data.isEditing ? this.createEditForm() : this.createBookmarkView()
            );
        }
    }
}