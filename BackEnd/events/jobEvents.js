const { QueueEvents } = require("bullmq");

const connection = {
    host: "127.0.0.1",
    port: 6379
};

const queueEvents = new QueueEvents(
    "job-processing",
    {
        connection
    }
);

function setupJobEvents(io) {

    queueEvents.on("progress", async ({ jobId, data }) => {

        console.log(
            `Job ${jobId} progress: ${data}%`
        );

        io.emit("job-progress", {
            jobId,
            progress: Number(data),
            status: data >= 100 ? "COMPLETED" : "ACTIVE"
        });

    });

}

module.exports = setupJobEvents;