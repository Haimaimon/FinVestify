const Pusher = require("pusher");

const pusher = new Pusher({
    appId: '1816475',
    key: 'cb67c8ebd0ea59ee4a5e',
    secret: '1ea8e7cb8e3edb296b57',
    cluster: 'eu',
    useTLS: true
});

module.exports = pusher;
