import axios from 'axios';

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.params = {};

export default axios;
