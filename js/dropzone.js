import { uuidv4 } from './utils.js';

const DROPZONE_TOPICS = {
    setErrors: 'setErrors',
    addErrors: 'addErrors',
    removeErrors: 'removeErrors',
    setFileListItemErrorClass: 'setFileListItemErrorClass',
    addFiles: 'addFiles',
    removeFile: 'removeFile',
    emptyFileList: 'emptyFileList',
    fileListUpdated: 'fileListUpdated',
    getFilesRequest: 'getFilesRequest',
    sendFiles: 'sendFiles'
}

export const OUTPUT_TOPICS = {
    fileListUpdated: DROPZONE_TOPICS.fileListUpdated,
    getFilesRequest: DROPZONE_TOPICS.getFilesRequest,
    sendFiles: DROPZONE_TOPICS.sendFiles

}

const DROPZONE_ERROR_NAMES = {
    directory: 'directory',
    duplicates: 'duplicates',
    size: 'size',
}

const DROPZONE_ERROR_MESSAGES = {
    directory: `Les répertoires ne sont pas autorisés.`,
    duplicates: `Nous n'autorisons pas l'envoi de fichiers ayant le même nom. Veuillez renommer le(s) fichier(s) concerné(s) puis réessayer.`,
    size: `Nous n'autorisons pas les envois de plus de 2Go.`
}

/**
 * @class DropzoneManager
 * @brief manage dropzone and its files
 */
 export class DropzoneManager {
    constructor(dropzone_, eventManager_) {

        // init dropzoneContent, fileInput, resetBtn, dropzoneMsg and dropzoneErrors
        this.domWrapper = new DropzoneDOMWrapper(dropzone_, eventManager_);

        this.eventManager = eventManager_;
        // init subscriptions
        this.initSubscriptions();

        // MAX SIZE in Go
        this.MAX_SIZE = 2;

        this.managerErrors = {};
        this.dropzoneFiles = [];        
    }

    initSubscriptions() {
        this.eventManager.subscribe(DROPZONE_TOPICS.setFileListItemErrorClass, (dropzoneFile) => {
            this.domWrapper.setFileListItemErrorClass(dropzoneFile.uuid, dropzoneFile.isError);
        });

        this.eventManager.subscribe(DROPZONE_TOPICS.setErrors, (errs) => {
            this.managerErrors = {...errs};
            this.domWrapper.updateErrors(this.managerErrors);
        })

        this.eventManager.subscribe(DROPZONE_TOPICS.addErrors, (errs) => {
            this.managerErrors = {...managerErrors, ...errs};
            this.domWrapper.updateErrors(this.managerErrors);
        });

        this.eventManager.subscribe(DROPZONE_TOPICS.removeErrors, (...errorKeys) => {
            errorKeys.forEach(key => {
                delete this.managerErrors[key];
            });
            this.domWrapper.updateErrors(this.managerErrors);
        });

        this.eventManager.subscribe(DROPZONE_TOPICS.addFiles, (newDropzoneFiles) => {
           this.dropzoneFiles.push(...newDropzoneFiles);
           this.domWrapper.refreshDropzoneContent(this.dropzoneFiles);
           this.updateValidity();
        });

        this.eventManager.subscribe(DROPZONE_TOPICS.removeFile, (uuid) => {
            this.domWrapper.removeFileListItem(uuid);
            this.removeFile(uuid);
            this.eventManager.emit(DROPZONE_TOPICS.fileListUpdated, this.retrieveValidFiles().length, this.hasErrors());
        });

        this.eventManager.subscribe(DROPZONE_TOPICS.emptyFileList, () => {
            this.emptyFileList();
            this.domWrapper.emptyFileList();
            this.eventManager.emit(DROPZONE_TOPICS.setErrors, {});
            this.eventManager.emit(DROPZONE_TOPICS.fileListUpdated, this.retrieveValidFiles().length, this.hasErrors());
        });

        this.eventManager.subscribe(DROPZONE_TOPICS.getFilesRequest, () => {
            this.eventManager.emit(DROPZONE_TOPICS.sendFiles, [...this.dropzoneFiles.map(({file}) => file)]);
        });
    }

    removeFile(uuid) {
        this.dropzoneFiles = this.dropzoneFiles.filter(file => file.uuid !== uuid);
        if (this.dropzoneFiles.length === 0) {
            this.eventManager.emit(DROPZONE_TOPICS.emptyFileList)
        } else {
            this.updateValidity();
        }
    
    }

    updateValidity() {
        const errors = {};
        const mapFilename = {};

        let totalSize = 0;

        const onerror = (dropzoneFile) => {
            dropzoneFile.isDirectory = true;
            errors[DROPZONE_ERROR_NAMES.directory] = DROPZONE_ERROR_MESSAGES.directory;            
        };

        const onloadend = (dropzoneFile, isLast) => {
            this.eventManager.emit(DROPZONE_TOPICS.setFileListItemErrorClass, dropzoneFile);
            if (isLast) {
                this.eventManager.emit(DROPZONE_TOPICS.fileListUpdated, this.retrieveValidFiles().length, this.hasErrors());
                this.eventManager.emit(DROPZONE_TOPICS.setErrors, errors);
            }
        }

        this.dropzoneFiles.forEach((dropzoneFile, i, array) => {
            if (mapFilename[dropzoneFile.file.name]) {
                if (!errors[DROPZONE_ERROR_NAMES.duplicates]) {
                    errors[DROPZONE_ERROR_NAMES.duplicates] = DROPZONE_ERROR_MESSAGES.duplicates;
                }
                dropzoneFile.isDuplicate = true;
            } else {
                dropzoneFile.isDuplicate = false;
                mapFilename[dropzoneFile.file.name] = true;
            }
            

            totalSize += dropzoneFile.file.size;
            if (this.convertBytesToGigaBytes(totalSize) > this.MAX_SIZE) {
                errors[DROPZONE_ERROR_NAMES.size] = DROPZONE_ERROR_MESSAGES.size;
            }
            
            const reader = new FileReader();
            if (!errors[DROPZONE_ERROR_NAMES.directory]) {
                reader.onerror = () => { onerror(dropzoneFile) };
            }
            reader.onloadend = () => { onloadend(dropzoneFile, i === array.length - 1) };
            reader.readAsDataURL(dropzoneFile.file);
        });
    }

    emptyFileList() {
        this.dropzoneFiles = [];
    }

    retrieveValidFiles() {
        return this.dropzoneFiles.filter(({isError}) => !isError);
    }

    hasErrors() {
        return this.dropzoneFiles.some(({isError}) => isError);
    }

    convertBytesToGigaBytes(bytes) {
        return bytes / Math.pow(1024, 3);
    }
}

class DropzoneDOMWrapper {
    constructor(dropzone_, eventManager_) {
        this.dropzone = dropzone_;
        this.eventManager = eventManager_;

        // mapping between MIME types and CSS classes
        this.mimes = {
            text: 'txt-type',
            image: 'img-type',
            application: 'app-type',
            video: 'video-type',
            audio: 'audio-type',
            other: 'other-type',
        };
        this.initDOM();
        this.initListeners();
    }

    initListeners() {
        const handleDragAndDrop = (event, handle) => {
            event.preventDefault();
            handle();
        }

        this.dropzoneContent.addEventListener('dragover', (event) => {event.preventDefault();});
        this.dropzoneContent.addEventListener('dragenter', (event) => { handleDragAndDrop(event, this.applyDragoverStyle.bind(this)) });
        this.dropzoneContent.addEventListener('dragleave', (event) => { handleDragAndDrop(event, this.removeDragoverStyle.bind(this)) });
        this.dropzoneContent.addEventListener('drop', (event) => {
            handleDragAndDrop(event, this.removeDragoverStyle.bind(this))
            this.eventManager.emit(DROPZONE_TOPICS.addFiles, DropzoneFileConverter.toDropzoneFiles(event.dataTransfer.files));
        });

        this.dropzoneMsg.addEventListener('dragover', (event) => {event.preventDefault();});
        this.dropzoneMsg.addEventListener('dragenter', (event) => { handleDragAndDrop(event, this.applyDragoverStyle.bind(this)) });
        this.dropzoneMsg.addEventListener('dragleave', (event) => { handleDragAndDrop(event, this.removeDragoverStyle.bind(this)) });
        this.dropzoneMsg.addEventListener('drop', (event) => {
            handleDragAndDrop(event, this.removeDragoverStyle.bind(this))
            this.eventManager.emit(DROPZONE_TOPICS.addFiles, DropzoneFileConverter.toDropzoneFiles(event.dataTransfer.files));
        });

        this.fileInput.addEventListener('change', () => { 
            this.eventManager.emit(DROPZONE_TOPICS.addFiles, DropzoneFileConverter.toDropzoneFiles(this.fileInput.files));
        });
        this.resetBtn.addEventListener('click', () => { this.eventManager.emit(DROPZONE_TOPICS.emptyFileList) });
    }

    initDOM() {
        this.dropzone.classList.add('dropzone');
        this.dropzoneContent = this.initDropzoneContent();
        this.dropzoneErrors = this.initDropzoneErrors();
        this.dropzoneMenu = this.initDropzoneMenu();
        this.dropzone.appendChild(this.dropzoneContent);
        this.dropzone.appendChild(this.dropzoneErrors);
        this.dropzone.appendChild(this.dropzoneMenu);
    }

    initDropzoneContent() {
        const section = document.createElement('section');
        section.classList.add('dropzone__content');
        this.dropzoneMsg = this.initDropzoneMsg();
        section.appendChild(this.dropzoneMsg);
        return section;
    }

    initDropzoneMsg() {
        const p = document.createElement('p');
        p.classList.add('dropzone__msg');
        p.innerText = `Déposez ici vos fichiers.\n2Go max.`;
        return p;
    }

    initDropzoneErrors() {
        const p = document.createElement('p');
        p.classList.add('dropzone__errors');
        return p;
    }

    initDropzoneMenu() {
        const section = document.createElement('section');
        section.classList.add('dropzone__menu');
        this.resetBtn = this.initResetBtn();
        section.appendChild(this.resetBtn);
        section.appendChild(this.initFileInput());
        return section;
    }

    initResetBtn() {
        const btn = document.createElement('button');
        btn.classList.add('dropzone__btn', 'dropzone__reset-btn');
        btn.innerText = 'Vider';
        return btn;
    }

    initFileInput() {
        const label = document.createElement('label');
        const input = document.createElement('input');
        
        label.classList.add('file-upload', 'dropzone__btn', 'dropzone__btn--upload');
        label.innerText = 'Ajouter des fichiers';

        input.setAttribute('type', 'file');
        input.setAttribute('capture', 'user');
        input.setAttribute('multiple', true);

        this.fileInput = input;
        label.appendChild(input);
        return label;
    }

    setFileListItemErrorClass(elementId, isError) {
        if (isError) {
            document.getElementById(elementId)?.classList.add('dropzone-file--error');
        } else {
            document.getElementById(elementId)?.classList.remove('dropzone-file--error');
        }
    }

    updateErrors(errors) {
        this.dropzoneErrors.innerText = '';
        Object.values(errors).forEach(error => {
            this.dropzoneErrors.innerText += `${error}\n`;
        });
    }

    removeFileListItem(elementId) {
        document.getElementById(elementId)?.remove();
    }

    refreshDropzoneContent(dropzoneFiles) {
        // we reset the file input fileList
        this.clearFileInputList();
        this.hideMsgElement();
        this.clearDOMFileList();
        this.createDOMFileList(dropzoneFiles);
    }

    clearFileInputList() {
        this.fileInput.value = '';
    }

    hideMsgElement() {
        this.dropzoneMsg.style.display = 'none';
    }

    showMsgElement() {
        this.dropzoneMsg.removeAttribute('style');
    }

    clearDOMFileList() {
        if (!this.dropzoneContent.querySelector('.dropzone__file-list')) {
            return;
        }
        this.dropzoneContent.removeChild(this.dropzoneContent.querySelector('.dropzone__file-list'));
    }

    createDOMFileList(dropzoneFiles) {
        const ul = document.createElement('ul');
        ul.classList.add('dropzone__file-list');

        dropzoneFiles.forEach((dropzoneFile) => {
            const li = this.createDOMFileListItem(dropzoneFile);
            ul.appendChild(li);
        });
        this.dropzoneContent.appendChild(ul);
    }

    createDOMFileListItem(dropzoneFile) {
        const type = dropzoneFile.file.type.split('/')[0];
        const cssClass = this.mimes[type] || this.mimes.other;
        const li = document.createElement('li');
        const p = this.createDOMFileListItemTxt(dropzoneFile.file.name);
        const closeCross = this.createDOMFileListItemCloseIcon();

        closeCross.onclick = () => { this.eventManager.emit(DROPZONE_TOPICS.removeFile, dropzoneFile.uuid) };

        li.title = dropzoneFile.file.name;
        li.id = dropzoneFile.uuid;
        li.classList.add(cssClass);
        li.appendChild(p);
        li.appendChild(closeCross);
        return li;
    }

    createDOMFileListItemTxt(txt) {
        const p = document.createElement('p');
        p.innerText = txt;
        return p;
    }

    createDOMFileListItemCloseIcon() {
        const closeCross = document.createElement('i');
        closeCross.classList.add('material-icons', 'close-icon');
        closeCross.innerText = 'close';
        return closeCross;
    }

    emptyFileList() {
        this.clearDOMFileList();
        this.showMsgElement();
    }

    applyDragoverStyle() {
        this.dropzoneMsg.classList.add('dropzone__msg--dragover');
        this.dropzoneContent.classList.add('dropzone__content--dragover');
    }

    removeDragoverStyle() {
        this.dropzoneMsg.classList.remove('dropzone__msg--dragover');
        this.dropzoneContent.classList.remove('dropzone__content--dragover');
    }
}

/**
 * @class DropzoneFileConverter
 * @brief converter between File and DropzoneFile 
 */
class DropzoneFileConverter {
    constructor() {}

    /**
     * @brief convert FileList to DropzoneFile array
     * @param {FileList} files 
     */
    static toDropzoneFiles(files) {
        return Array.from(files).map(file => DropzoneFile.of(file));
    }
}

/**
 * @class DropzoneFile
 */
class DropzoneFile {
    constructor(file) {
        this.file = file;
        this.uuid = uuidv4();
        this.isDuplicate = false;
        this.isDirectory = false;
    }

    static of(file) {
        return new DropzoneFile(file);
    }

    get isError() {
        return this.isDirectory || this.isDuplicate;
    }
}

