import { DropzoneManager, OUTPUT_TOPICS } from './dropzone.js';
import { EventManager } from './events.js';

const eventManager = new EventManager();
alert('test')
// const dropzoneManager = new DropzoneManager(document.getElementById('dropzone'), eventManager);

// const validateBtn = document.getElementById('validateBtn');
// const senderEmail = document.getElementById('senderEmail');
// const recipientEmails = document.getElementById('recipientEmails');

// const appState = {
//     dropzoneValid: false,
//     formValid: false
// };

// const TOPICS = {
//     switchDisabled: 'switchDisabled',
//     setControlValidity: 'setControlValidity',
//     ...OUTPUT_TOPICS,
// }

// const updateApptStateFormValid = () => {
//     const validSender = validateEmail(senderEmail.value);
//     const validRecipients = validateRecipientEmails(recipientEmails.value, ';');
//     appState.formValid = validSender && validRecipients;
//     eventManager.emit(TOPICS.switchDisabled, appState);
// }

// const validateEmail = (email) => {
//     let regexp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     return regexp.test(email);
// }

// const validateRecipientEmails = (value, separator) => {
//     const emails = value.split(separator).filter(email => !!email.trim());
//     return !!emails.length && emails.every((email) => validateEmail(email.trim()));
// }

// const sendFiles = (files) => {
//     const request = {
//         sender: senderEmail.value,
//         recipients: recipientEmails.value,
//         files
//     };

//     console.info(`TODO: implement the HTTP call`);
// }

// // INIT EVENT LISTENERS
// senderEmail.addEventListener('input', () => { 
//     updateApptStateFormValid();
//     eventManager.emit(TOPICS.setControlValidity, senderEmail, validateEmail(senderEmail.value));
// });

// recipientEmails.addEventListener('input', () => { 
//     updateApptStateFormValid();
//     eventManager.emit(TOPICS.setControlValidity, recipientEmails, validateRecipientEmails(recipientEmails.value, ';'));
// });

// validateBtn.addEventListener('click', () => {
//     eventManager.emit(TOPICS.getFilesRequest);
// })

// // INIT SUBSCRIPTIONS
// eventManager.subscribe(TOPICS.fileListUpdated, (nbFiles, hasErrors) => {
//     appState.dropzoneValid = nbFiles && !hasErrors;
//     eventManager.emit(TOPICS.switchDisabled, appState);
// });

// eventManager.subscribe(TOPICS.switchDisabled, (state) => {
//     const valid = Object.values(state).reduce((val, acc) => acc && val);
//     validateBtn.disabled = !valid;
//     valid ? validateBtn.classList.remove('disabled') : validateBtn.classList.add('disabled');
// });

// eventManager.subscribe(TOPICS.setControlValidity, (control, valid) => {
//     valid ? control.classList.remove('invalid') : control.classList.add('invalid');
// });

// eventManager.subscribe(TOPICS.sendFiles, (dropzoneFiles) => {
//     sendFiles(dropzoneFiles);
// });