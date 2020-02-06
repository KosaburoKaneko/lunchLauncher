import axios from './axios';

console.log('Sending request to Slack...');

axios.post('', {
  text: 'hello'
});

console.log('Message has been sent.');
