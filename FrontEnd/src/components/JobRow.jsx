import StatusBadge from "./StatusBadge";

function JobRow({ job }) {

    return (
        <div className="job-row">

            <span>
                #{job._id.slice(-6)}
            </span>

            <strong>
                {job.type}
            </strong>

            <span>
                {job.priority}
            </span>

            <StatusBadge status={job.status} />

            <div className="progress-container">

                <div className="progress-bar">

                    <div
                        className="progress-fill"
                        style={{
                            width: `${job.progress}%`
                        }}
                    />

                </div>

                <span>
                    {job.progress}%
                </span>

            </div>

        </div>
    );
} 

export default JobRow;