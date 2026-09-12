const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/database");
const Job = require("./models/job");
const jobQueue = require("./queues/jobQueue");
const setupJobEvents = require("./events/jobEvents");

const app = express();

const port = 7070;

app.use(cors());
app.use(express.json());

connectDB();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Socket connection
io.on("connection", (socket) => {

    console.log("Frontend connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Frontend disconnected:", socket.id);
    });

});

// Setup BullMQ events
setupJobEvents(io);


// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {

    res.send(
        "Backend for job processing system successfully running......"
    );

});


// ===============================
// CREATE SINGLE JOB
// ===============================

app.post("/api/jobs", async (req, res) => {

    try {

        const priorityMap = {
            HIGH: 1,
            MEDIUM: 5,
            LOW: 10
        };

        const scheduleMap = {
            ONCE: 0,
            EVERY_1_MINUTE: 60000,
            EVERY_5_MINUTES: 5 * 60 * 1000,
            EVERY_HOUR: 60 * 60 * 1000,
            DAILY: 24 * 60 * 60 * 1000
        };

        const priority = req.body.priority || "MEDIUM";

        const delay = req.body.delay || 0;

        const schedule = req.body.schedule || "ONCE";

        const interval = scheduleMap[schedule];


        // Validate priority

        if (!priorityMap[priority]) {

            return res.status(400).json({
                message: "Invalid priority. Use HIGH, MEDIUM or LOW."
            });

        }


        // Validate schedule

        if (!(schedule in scheduleMap)) {

            return res.status(400).json({
                message: "Invalid schedule."
            });

        }


        // Create MongoDB job

        const job = await Job.create({

            type: req.body.type,

            payload: req.body.payload,

            priority: priority

        });


        // BullMQ options

        const options = {

            // IMPORTANT
            // MongoDB ID = BullMQ job ID

            jobId: job._id.toString(),

            priority: priorityMap[priority],

            delay: delay,

            attempts: 3,

            backoff: {

                type: "exponential",

                delay: 2000

            }

        };


        // Repeat jobs

        if (schedule !== "ONCE") {

            options.repeat = {

                every: interval

            };

        }


        // Add job to BullMQ

        await jobQueue.add(

            job.type,

            {

                jobId: job._id.toString(),

                payload: job.payload

            },

            options

        );


        res.status(201).json(job);

    }

    catch (error) {

        console.error("Error creating job:", error);

        res.status(500).json({

            message: "Failed to create job",

            error: error.message

        });

    }

});


// ===============================
// CREATE BATCH JOBS
// ===============================

app.post("/api/jobs/batch", async (req, res) => {

    try {

        const priorityMap = {

            HIGH: 1,

            MEDIUM: 5,

            LOW: 10

        };


        const jobs = req.body.jobs;


        if (!Array.isArray(jobs) || jobs.length === 0) {

            return res.status(400).json({

                message: "jobs must be a non-empty array"

            });

        }


        const createdJobs = [];


        for (const data of jobs) {

            const priority = data.priority || "MEDIUM";

            const delay = data.delay || 0;


            // Validate priority

            if (!priorityMap[priority]) {

                return res.status(400).json({

                    message: `Invalid priority: ${priority}`

                });

            }


            // Create MongoDB record

            const job = await Job.create({

                type: data.type,

                priority: priority,

                payload: data.payload

            });


            // Add to BullMQ

            await jobQueue.add(

                job.type,

                {

                    jobId: job._id.toString(),

                    payload: job.payload

                },

                {

                    // IMPORTANT
                    // MongoDB ID = BullMQ ID

                    jobId: job._id.toString(),

                    priority: priorityMap[priority],

                    delay: delay,

                    attempts: 3,

                    backoff: {

                        type: "exponential",

                        delay: 2000

                    }

                }

            );


            createdJobs.push(job);

        }


        res.status(201).json({

            message: "Jobs added successfully",

            count: createdJobs.length,

            jobs: createdJobs

        });

    }

    catch (error) {

        console.error("Batch job error:", error);

        res.status(500).json({

            message: "Failed to create batch jobs",

            error: error.message

        });

    }

});


// ===============================
// GET ALL JOBS
// ===============================

app.get("/api/jobs", async (req, res) => {

    try {

        const jobs = await Job.find({})
            .sort({ createdAt: -1 });

        res.json(jobs);

    }

    catch (error) {

        res.status(500).json({

            message: "Failed to fetch jobs",

            error: error.message

        });

    }

});


// ===============================
// GET SPECIFIC JOB
// ===============================

app.get("/api/jobs/:id", async (req, res) => {

    try {

        const job = await Job.findById(req.params.id);


        if (!job) {

            return res.status(404).json({

                message: "Job not found"

            });

        }


        res.json(job);

    }

    catch (error) {

        res.status(500).json({

            message: "Failed to fetch job",

            error: error.message

        });

    }

});


// ===============================
// START SERVER
// ===============================

server.listen(port, () => {

    console.log(`Server running on port ${port}`);

});