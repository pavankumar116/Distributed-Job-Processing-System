const { Queue } = require("bullmq");

const connection = {
    host: "127.0.0.1",
    port: 6379
};

const deadLetterQueue = new Queue("dead-letter", {
    connection
});

module.exports = deadLetterQueue;