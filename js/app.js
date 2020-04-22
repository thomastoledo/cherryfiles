import { DropzoneManager, OUTPUT_TOPICS } from './dropzone.js';
import { EventManager } from './events.js';

const eventManager = new EventManager(); // event manager for Publish/Subscribe pattern
// dropzone module
const dropzoneManager = new DropzoneManager(document.getElementById('dropzone'), eventManager);

// Form components
const validateBtn = document.getElementById('validateBtn');
const senderEmail = document.getElementById('senderEmail');
const recipientEmails = document.getElementById('recipientEmails');

// App state: works like a global state of the application, allowing us to check on it and modify it
const appState = {
    dropzoneValid: false,
    formValid: false
};

// Topcis on which we subscribe (works with the Event Manager)
const TOPICS = {
    switchDisabled: 'switchDisabled',
    setControlValidity: 'setControlValidity',
    ...OUTPUT_TOPICS, // Event Manager's topics published by the Dropzone Manager
}

/**
 * @brief update the field "formValid" of the App State
 */
const updateAppStateFormValid = () => {
    const validSender = validateEmail(senderEmail.value);
    const validRecipients = validateEmails(recipientEmails.value, ';');
    appState.formValid = validSender && validRecipients;
    eventManager.emit(TOPICS.switchDisabled, appState);
}

/**
 * @brief check if an email (string) is valid
 * @param {string} email 
 */
const validateEmail = (email) => {
    let regexp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regexp.test(email.toLowerCase());
}

/**
 * @brief validate a list of emails
 * @param {string} value (string of emails)
 * @param {string} separator (default value is ;)
 */
const validateEmails = (value, separator = ';') => {
    const emails = value.split(separator) // premièrement, on crée un tableau
                        .filter(email => !!email.trim()); // on filtre en enlevant les valeurs vides
    return !!emails.length && emails.every((email) => validateEmail(email.trim()));
}

/**
 * @brief send files to server
 * @param {DropzoneFile[]} files 
 */
const sendFiles = (files) => {
    const request = {
        sender: senderEmail.value,
        recipients: recipientEmails.value,
        files
    };

    console.info(`TODO later: implement the HTTP call`);
}

// INIT EVENT LISTENERS
senderEmail.addEventListener('input', () => { 
    updateAppStateFormValid();
    // publish email valid or not
    eventManager.emit(TOPICS.setControlValidity, senderEmail, validateEmail(senderEmail.value));
});

recipientEmails.addEventListener('input', () => { 
    updateAppStateFormValid();
    // public emails valid or not
    eventManager.emit(TOPICS.setControlValidity, recipientEmails, validateEmails(recipientEmails.value, ';'));
});

validateBtn.addEventListener('click', () => {
    // public request to retrieve files
    eventManager.emit(TOPICS.getFilesRequest);
})

// INIT SUBSCRIPTIONS
// when file list is updated
eventManager.subscribe(TOPICS.fileListUpdated, (nbFiles, hasErrors) => {
    // update app state
    appState.dropzoneValid = nbFiles && !hasErrors;
    // publish to disable/enable the 'Validate' button according to appState
    eventManager.emit(TOPICS.switchDisabled, appState);
});

// disable/enable the 'Validate' button according to a state
eventManager.subscribe(TOPICS.switchDisabled, (state) => {
    // Object.values(variable) allows you to retrieve all the values
    
    const valid = Object.values(state) // Object.values({nom: 'toto', age: 12}) will return ['toto', 12]
                    .reduce((val, acc) => acc && val); // reduce is an Array method which reduce the array to a single value
    
    validateBtn.disabled = !valid;
    valid ? validateBtn.classList.remove('disabled') : validateBtn.classList.add('disabled');
});

// set style invalidity (it's just for CSS)
eventManager.subscribe(TOPICS.setControlValidity, (control, valid) => {
    valid ? control.classList.remove('invalid') : control.classList.add('invalid');
});

// send files
eventManager.subscribe(TOPICS.sendFiles, (dropzoneFiles) => {
    sendFiles(dropzoneFiles);
});