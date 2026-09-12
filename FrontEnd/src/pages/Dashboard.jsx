import { useEffect, useState } from "react";
import { getJobs } from "../services/jobService";
import JobTable from "../components/JobTable";
import socket from "../services/socket";

function Dashboard() {

    const [jobs, setJobs] = useState([]);

    useEffect(() => {

        const fetchJobs = async () => {

            try {
                const data = await getJobs();
                setJobs(data);
            } catch (error) {
                console.error(error);
            }

        };

        fetchJobs();

    }, []);


    useEffect(() => {

        socket.on("job-progress", (updatedJob) => {

            console.log("Live update:", updatedJob);

            setJobs((currentJobs) => {

                return currentJobs.map((job) => {

                    if (job._id === updatedJob.jobId) {

                        return {
                            ...job,
                            progress: updatedJob.progress,
                            status: updatedJob.status
                        };

                    }

                    return job;
                });

            });

        });


        return () => {
            socket.off("job-progress");
        };

    }, []);




    return (
        <div className="dashboard">

            <header className="dashboard-header">

                <div>
                    <h1>Job Processing Dashboard</h1>

                    <p>
                        Monitor and manage distributed background jobs.
                    </p>
                </div>

                <button className="create-job-btn">
                    + Create Job
                </button>

            </header>


            <section className="stats">

                <div className="stat-card">
                    <span>Total Jobs</span>
                    <strong>{jobs.length}</strong>
                </div>

                <div className="stat-card">
                    <span>Active</span>
                    <strong>
                        {jobs.filter(job => job.status === "ACTIVE").length}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>Completed</span>
                    <strong>
                        {jobs.filter(job => job.status === "COMPLETED").length}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>Failed</span>
                    <strong>
                        {jobs.filter(job => job.status === "FAILED").length}
                    </strong>
                </div>

            </section>


            <section className="jobs-section">

                <div className="section-header">

                    <h2>Recent Jobs</h2>

                    <select>
                        <option>All Jobs</option>
                        <option>Queued</option>
                        <option>Active</option>
                        <option>Completed</option>
                        <option>Failed</option>
                    </select>

                </div>

                <JobTable jobs={jobs} />

            </section>

        </div>
    );
}

export default Dashboard;