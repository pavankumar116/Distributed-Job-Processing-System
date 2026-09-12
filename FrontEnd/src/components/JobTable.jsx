import JobRow from "./JobRow";

function JobTable({ jobs }) {

    return (
        <div className="job-table">

            <div className="job-table-header">

                <span>ID</span>
                <span>Job</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Progress</span>

            </div>

            {jobs.map((job) => (

                <JobRow
                    key={job._id}
                    job={job}
                />

            ))}

        </div>
    );
}

export default JobTable;