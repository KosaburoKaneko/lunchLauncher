import axios from 'axios';

const SLACK_ENDPOINT =
  'https://hooks.slack.com/services/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';
const SLACK_BOT_TOKEN =
  'xoxb-928390395747-927075841618-sSIH54xbhAYHoF3tusMZx1mB';

axios.defaults.baseURL = SLACK_ENDPOINT;
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.params = {};
axios.defaults.params['token'] = SLACK_BOT_TOKEN;

export default axios;
