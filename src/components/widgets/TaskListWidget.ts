import { Widget } from './Widget';
import { TaskItem, TaskListWidgetData } from '../../types';
import { CSS_CLASSES } from '../../utils/constants';

export class TaskListWidget extends Widget {
    protected tasks: TaskItem[];
    protected data: TaskListWidgetData;

    constructor(data: TaskListWidgetData) {
        super(data);
        this.data = data;
        this.tasks = (data as TaskListWidgetData).tasks || [];
    }


    protected createContent(): HTMLElement {
        const content = document.createElement('div');
        content.className = `${CSS_CLASSES.WIDGET_CONTENT} tasklist-widget`;

        // Crear el formulario de entrada
        const inputGroup = this.createInputGroup();
        content.appendChild(inputGroup);

        // Crear la lista de tareas
        const taskList = this.createTaskList();
        content.appendChild(taskList);

        // Crear los controles de filtrado
        const controls = this.createControls();
        content.appendChild(controls);

        return content;
    }

    private createInputGroup(): HTMLElement {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'task-input-group';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nueva tarea...';
        input.className = 'task-input';

        const addButton = document.createElement('button');
        addButton.textContent = '+';
        addButton.className = 'add-task-btn';

        // Manejar la adición de tareas
        const addTask = () => {
            const text = input.value.trim();
            if (text) {
                this.addTask(text);
                input.value = '';
            }
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        addButton.addEventListener('click', addTask);

        inputGroup.appendChild(input);
        inputGroup.appendChild(addButton);

        return inputGroup;
    }

    private createTaskList(): HTMLElement {
        const taskList = document.createElement('div');
        taskList.className = 'task-list';

        this.updateTaskList(taskList);

        return taskList;
    }

    private updateTaskList(container: HTMLElement): void {
        container.innerHTML = '';

        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.getSortedTasks(filteredTasks);

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });

        if (sortedTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No hay tareas';
            container.appendChild(emptyMessage);
        }
    }

    private createTaskElement(task: TaskItem): HTMLElement {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => this.toggleTask(task.id));

        // Texto
        const text = document.createElement('span');
        text.className = 'task-text';
        text.textContent = task.text;

        // Botón eliminar
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-task';
        deleteButton.innerHTML = '×';
        deleteButton.addEventListener('click', () => this.removeTask(task.id));

        taskElement.appendChild(checkbox);
        taskElement.appendChild(text);
        taskElement.appendChild(deleteButton);

        return taskElement;
    }


    private createControls(): HTMLElement {
        const controls = document.createElement('div');
        controls.className = 'task-controls';

        const widgetData = this.data as TaskListWidgetData;

        // Toggle para mostrar/ocultar completadas
        const showCompletedToggle = document.createElement('label');
        showCompletedToggle.className = 'show-completed-toggle';
        showCompletedToggle.innerHTML = `
            <input type="checkbox" ${widgetData.showCompleted ? 'checked' : ''}>
            <span>Mostrar completadas</span>
        `;
        showCompletedToggle.querySelector('input')?.addEventListener('change', (e) => {
            (this.data as TaskListWidgetData).showCompleted = (e.target as HTMLInputElement).checked;
            this.save();
            this.updateTaskList(this.element.querySelector('.task-list') as HTMLElement);
        });

        // Selector de ordenamiento
        const sortSelect = document.createElement('select');
        sortSelect.className = 'sort-select';
        sortSelect.innerHTML = `
            <option value="created" ${widgetData.sortBy === 'created' ? 'selected' : ''}>Fecha creación</option>
            <option value="completed" ${widgetData.sortBy === 'completed' ? 'selected' : ''}>Completadas</option>
            <option value="text" ${widgetData.sortBy === 'text' ? 'selected' : ''}>Alfabético</option>
        `;
        sortSelect.addEventListener('change', (e) => {
            (this.data as TaskListWidgetData).sortBy = (e.target as HTMLSelectElement).value as 'created' | 'completed' | 'text';
            this.save();
            this.updateTaskList(this.element.querySelector('.task-list') as HTMLElement);
        });

        controls.appendChild(showCompletedToggle);
        controls.appendChild(sortSelect);

        return controls;
    }

    private getFilteredTasks(): TaskItem[] {
        return this.tasks.filter(task => (this.data as TaskListWidgetData).showCompleted || !task.completed);
    }

    private getSortedTasks(tasks: TaskItem[]): TaskItem[] {
        return [...tasks].sort((a, b) => {
            switch ((this.data as TaskListWidgetData).sortBy) {
                case 'completed':
                    return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
                case 'text':
                    return a.text.localeCompare(b.text);
                case 'created':
                default:
                    return b.createdAt - a.createdAt;
            }
        });
    }

    protected async save(): Promise<void> {
        (this.data as TaskListWidgetData).tasks = this.tasks;
        await super.save();
    }

    private async addTask(text: string): Promise<void> {
        const newTask: TaskItem = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: Date.now()
        };

        this.tasks.push(newTask);
        await this.save();
        this.updateTaskList(this.element.querySelector('.task-list') as HTMLElement);
    }

    private async toggleTask(taskId: string): Promise<void> {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            await this.save();
            this.updateTaskList(this.element.querySelector('.task-list') as HTMLElement);
        }
    }

    private async removeTask(taskId: string): Promise<void> {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        await this.save();
        this.updateTaskList(this.element.querySelector('.task-list') as HTMLElement);
    }
}
