const { Worker } = require("bullmq");

const Job = require("../models/job");
const connectDB = require("../config/database");
const deadLetterQueue = require("../queues/deadLetterQueue");

const connection = {
    host: "127.0.0.1",
    port: 6379
};

const worker = new Worker(
    "job-processing",

    async (job) => {

        console.log(`Processing BullMQ job: ${job.id}`);

        // Find corresponding MongoDB job
        const jobRecord = await Job.findById(job.data.jobId); 
        
        //console.log(jobRecord);

        if (!jobRecord) {
            throw new Error("Job record not found");
        }

        // Update MongoDB → ACTIVE
        await Job.findByIdAndUpdate(
            job.data.jobId,
            {
                status: "ACTIVE",
                attemptsMade: job.attemptsMade + 1
            }
        );

        console.log("Job status: ACTIVE");

        // // Simulate actual processing
        // await new Promise(resolve => {
        //     setTimeout(resolve, 5000);
        // }); 

        for (let progress = 20; progress <= 100; progress += 20) {

            await new Promise(resolve => {
                setTimeout(resolve, 5000);
            });

            await job.updateProgress(progress);
            await Job.findByIdAndUpdate(
                job.data.jobId,
                {
                 progress: progress
                }
            );

            console.log(`Job ${job.id} progress: ${progress}%`);

        }

        // Test failure
        if (job.data.payload?.shouldFail) {
            throw new Error("Simulated job failure");
        }

        // Success
        await Job.findByIdAndUpdate(
            job.data.jobId,
            {
                status: "COMPLETED",
                error: null
            }
        );

        console.log("Job status: COMPLETED");
    },

    {
        connection
        //concurrency:3
        
    }
);

worker.on("completed", (job) => {

    console.log(
        `BullMQ job ${job.id} completed`
    );
});

worker.on("failed", async (job, error) => {

    if (!job) return;

    console.log(`Job ${job.id} failed`);
    console.log(`Reason: ${error.message}`);

    const finalAttempt =
        job.attemptsMade >= job.opts.attempts;

    if (finalAttempt) {

        await Job.findByIdAndUpdate(
            job.data.jobId,
            {
                status: "DEAD",
                error: error.message
            }
        );

        await deadLetterQueue.add(
            "DEAD_JOB",
            {
                originalJobId: job.data.jobId,
                originalQueueJobId: job.id,
                type: job.name,
                payload: job.data.payload,
                attemptsMade: job.attemptsMade,
                error: error.message
            }
        );

        console.log(
            `Job ${job.id} moved to Dead Letter Queue`
        );
    }
});

async function startWorker() {

    await connectDB();

    console.log("Worker connected to MongoDB");
}

startWorker();