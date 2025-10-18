// import React, { useEffect, useState } from "react";
// import axios from "axios";
// const API_URL = "http://127.0.0.1:8000/api";
// const TimesheetForm = ({ onClose }) => {
//   const [foremen, setForemen] = useState([]);
//   const [jobCodes, setJobCodes] = useState([]);
//   const [selectedForemanId, setSelectedForemanId] = useState("");
//   const [foremanData, setForemanData] = useState(null);
//   const [selectedJobCode, setSelectedJobCode] = useState("");
//   const [jobData, setJobData] = useState(null);
//   const [selectedPhases, setSelectedPhases] = useState([]);
//   // --- Additional fields ---
//   const [jobName, setJobName] = useState("");
//   const [timeOfDay, setTimeOfDay] = useState("");
//   const [weather, setWeather] = useState("");
//   const [temperature, setTemperature] = useState("");
//   const [location, setLocation] = useState("");
//   const [projectEngineer, setProjectEngineer] = useState("");
//   const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
//   const [loading, setLoading] = useState(false);
//   const timeOfDayOptions = ["Morning", "Afternoon", "Evening", "Night"];
//   const weatherOptions = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy"];
//   const [selectedJobPhaseId, setSelectedJobPhaseId] = useState(null);
//   // --- Load foremen and job codes ---
//   useEffect(() => {
//     axios.get(`${API_URL}/users/?role=foreman`).then((res) => setForemen(res.data));
//     axios.get(`${API_URL}/job-phases/`).then((res) => setJobCodes(res.data));
//   }, []);
//   // --- Load foreman crew mapping ---
//   useEffect(() => {
//     if (!selectedForemanId) {
//       setForemanData(null);
//       return;
//     }
//     axios
//       .get(`${API_URL}/crew-mapping/by-foreman/${selectedForemanId}`)
//       .then((res) => setForemanData(res.data))
//       .catch((err) => {
//         console.error(`No crew mapping found for foreman ID ${selectedForemanId}:`, err);
//         setForemanData(null);
//       });
//   }, [selectedForemanId]);
//   // --- Load job details ---
//   useEffect(() => {
//     if (!selectedJobCode) {
//       setJobData(null);
//       setJobName("");
//       setProjectEngineer("");
//       setSelectedJobPhaseId(null);
//       return;
//     }
//     axios
//       .get(`${API_URL}/job-phases/${selectedJobCode}`)
//       .then((res) => {
//         setJobData(res.data);
//         setSelectedPhases([]);
//         // :white_check_mark: FIXED: handle both possible field names from backend
//         setJobName(res.data.job_name || res.data.job_description || "");
//         setProjectEngineer(res.data.project_engineer || "");
//         setSelectedJobPhaseId(res.data.id);
//       })
//       .catch(() => {
//         setJobData(null);
//         setJobName("");
//         setProjectEngineer("");
//         setSelectedJobPhaseId(null);
//       });
//   }, [selectedJobCode]);
//   const handlePhaseChange = (phase) => {
//     setSelectedPhases((prev) =>
//       prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
//     );
//   };
//   // --- Submit handler ---
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!selectedForemanId || !selectedJobCode) {
//       alert("Please select both Foreman and Job Code before submitting.");
//       return;
//     }
//     // :white_check_mark: Build full timesheet payload
//     const timesheetData = {
//       job_name: jobName || jobData?.job_name || jobData?.job_description || "Unnamed Job",
//       job: {
//         job_code: selectedJobCode,
//         phase_codes: selectedPhases,
//       },
//       time_of_day: timeOfDay,
//       weather,
//       temperature,
//       location,
//       project_engineer: projectEngineer,
//       ...foremanData, // includes employees, equipment, etc.
//     };
//     const payload = {
//       foreman_id: parseInt(selectedForemanId, 10),
//       date,
//       job_phase_id: selectedJobPhaseId, 
//       data: timesheetData,
//     };
//     console.log(":package: Sending Payload:", payload);
//     setLoading(true);
//     try {
//       await axios.post(`${API_URL}/timesheets/`, payload);
//       alert(" Timesheet sent successfully!");
//       onClose();
//     } catch (err) {
//       console.error(":x: Error sending timesheet:", err.response?.data);
//       alert(`Error: ${JSON.stringify(err.response?.data?.detail || err.message)}`);
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <div className="modal-overlay">
//       <div className="timesheet-form-modal">
//         <header className="modal-header">
//           <h2>Create Timesheet</h2>
//           <button onClick={onClose} className="modal-close-btn">&times;</button>
//         </header>
//         <form onSubmit={handleSubmit} className="form-content">
//           <div className="grid-2-cols">
//             <div className="form-group">
//               <label htmlFor="jobName">Job Name</label>
//               <input
//                 id="jobName"
//                 type="text"
//                 value={jobName}
//                 onChange={(e) => setJobName(e.target.value)}
//                 placeholder="Job name is auto-filled"
//                 required
//                 disabled={loading}
//                 className="form-input"
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="date">Date</label>
//               <input
//                 id="date"
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 className="form-input"
//                 disabled={loading}
//               />
//             </div>
//           </div>
//           <div className="form-group">
//             <label htmlFor="foreman">Foreman</label>
//             <select
//               id="foreman"
//               className="form-select"
//               value={selectedForemanId}
//               onChange={(e) => setSelectedForemanId(e.target.value)}
//               disabled={loading}
//               required
//             >
//               <option value="">-- Select Foreman --</option>
//               {foremen.map((fm) => (
//                 <option key={fm.id} value={fm.id}>
//                   {fm.first_name} {fm.last_name}
//                 </option>
//               ))}
//             </select>
//           </div>
//           {foremanData && (
//             <div className="crew-info-grid">
//               <aside className="crew-info-box box-indigo">
//                 <h3>Assigned Employees</h3>
//                 <p>{foremanData.employees?.map((e) => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}</p>
//               </aside>
//               <aside className="crew-info-box box-indigo">
//                 <h3>Assigned Equipment</h3>
//                 <p>{foremanData.equipment?.map((eq) => eq.name).join(", ") || "N/A"}</p>
//               </aside>
//               <aside className="crew-info-box box-green">
//                 <h3>Assigned Materials</h3>
//                 <p>{foremanData.materials?.map((mat) => mat.name).join(", ") || "N/A"}</p>
//               </aside>
//               <aside className="crew-info-box box-yellow">
//                 <h3>Assigned Vendors</h3>
//                 <p>{foremanData.vendors?.map((ven) => ven.name).join(", ") || "N/A"}</p>
//               </aside>
//             </div>
//           )}
//           <div className="form-group">
//             <label htmlFor="jobCode">Job Code</label>
//             <select
//               id="jobCode"
//               className="form-select"
//               value={selectedJobCode}
//               onChange={(e) => setSelectedJobCode(e.target.value)}
//               disabled={loading}
//               required
//             >
//               <option value="">-- Select Job Code --</option>
//               {jobCodes.map((job) => (
//                 <option key={job.job_code} value={job.job_code}>
//                   {job.job_code}
//                 </option>
//               ))}
//             </select>
//             {jobData?.phase_codes?.length > 0 && (
//               <fieldset className="phase-selection-fieldset">
//                 <legend>Select Phases:</legend>
//                 <div className="phase-list">
//                   {jobData.phase_codes.map((phase) => (
//                     <label
//                       key={phase}
//                       className={selectedPhases.includes(phase) ? "selected-phase" : ""}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={selectedPhases.includes(phase)}
//                         onChange={() => handlePhaseChange(phase)}
//                         disabled={loading}
//                       />
//                       <span>{phase}</span>
//                     </label>
//                   ))}
//                 </div>
//               </fieldset>
//             )}
//           </div>
//           {/* Additional input fields */}
//           <div className="grid-2-cols">
//             <div className="form-group">
//               <label htmlFor="timeOfDay">Time of Day</label>
//               <select
//                 id="timeOfDay"
//                 className="form-select"
//                 value={timeOfDay}
//                 onChange={(e) => setTimeOfDay(e.target.value)}
//                 disabled={loading}
//               >
//                 <option value="">-- Select Time of Day --</option>
//                 {timeOfDayOptions.map((option) => (
//                   <option key={option} value={option}>{option}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="weather">Weather</label>
//               <select
//                 id="weather"
//                 className="form-select"
//                 value={weather}
//                 onChange={(e) => setWeather(e.target.value)}
//                 disabled={loading}
//               >
//                 <option value="">-- Select Weather --</option>
//                 {weatherOptions.map((option) => (
//                   <option key={option} value={option}>{option}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="temperature">Temperature</label>
//               <input
//                 id="temperature"
//                 type="text"
//                 className="form-input"
//                 value={temperature}
//                 onChange={(e) => setTemperature(e.target.value)}
//                 disabled={loading}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="location">Location</label>
//               <input
//                 id="location"
//                 type="text"
//                 className="form-input"
//                 value={location}
//                 onChange={(e) => setLocation(e.target.value)}
//                 disabled={loading}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="projectEngineer">Project Engineer</label>
//               <input
//                 id="projectEngineer"
//                 type="text"
//                 className="form-input"
//                 value={projectEngineer}
//                 onChange={(e) => setProjectEngineer(e.target.value)}
//                 disabled={true}
//               />
//             </div>
//           </div>
//           <div className="form-actions">
//             <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`btn ${loading ? "btn-secondary" : "btn-primary"}`}
//             >
//               {loading ? "Sending..." : "Send Timesheet"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };
// export default TimesheetForm;


import React, { useEffect, useState } from "react";
import axios from "axios";
const API_URL = "http://127.0.0.1:8000/api";
const TimesheetForm = ({ onClose }) => {
  const [foremen, setForemen] = useState([]);
  const [jobCodes, setJobCodes] = useState([]);
  const [selectedForemanId, setSelectedForemanId] = useState("");
  const [foremanData, setForemanData] = useState(null);
  const [selectedJobCode, setSelectedJobCode] = useState("");
  const [jobData, setJobData] = useState(null);
  const [selectedPhases, setSelectedPhases] = useState([]);
  // --- Additional fields ---
  const [jobName, setJobName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [weather, setWeather] = useState("");
  const [temperature, setTemperature] = useState("");
  const [location, setLocation] = useState("");
  const [projectEngineer, setProjectEngineer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const timeOfDayOptions = ["Morning", "Afternoon", "Evening", "Night"];
  const weatherOptions = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy"];
  const [selectedJobPhaseId, setSelectedJobPhaseId] = useState(null);
  const [unit, setUnit] = useState('C');

  // --- Load foremen and job codes ---
  useEffect(() => {
    // Fetch all users, then filter by foreman role
    axios.get(`${API_URL}/users`).then((res) => {
      const foremanUsers = res.data.filter(user => user.role === "foreman");
      setForemen(foremanUsers);
    });
    axios.get(`${API_URL}/job-phases/`).then((res) => setJobCodes(res.data));
  }, []);
  // --- Load foreman crew mapping ---
  useEffect(() => {
    if (!selectedForemanId) {
      setForemanData(null);
      return;
    }
    axios
      .get(`${API_URL}/crew-mapping/by-foreman/${selectedForemanId}`)
      .then((res) => setForemanData(res.data))
      .catch((err) => {
        console.error(`No crew mapping found for foreman ID ${selectedForemanId}:`, err);
        setForemanData(null);
      });
  }, [selectedForemanId]);
  // --- Load job details ---
  useEffect(() => {
    if (!selectedJobCode) {
      setJobData(null);
      setJobName("");
      setProjectEngineer("");
      setSelectedJobPhaseId(null);
      return;
    }
    axios
      .get(`${API_URL}/job-phases/${selectedJobCode}`)
      .then((res) => {
        setJobData(res.data);
        setSelectedPhases([]);
        // Handle both possible field names
        setJobName(res.data.job_name || res.data.job_description || "");
        setProjectEngineer(res.data.project_engineer || "");
        setSelectedJobPhaseId(res.data.id);
      })
      .catch(() => {
        setJobData(null);
        setJobName("");
        setProjectEngineer("");
        setSelectedJobPhaseId(null);
      });
  }, [selectedJobCode]);
  const handlePhaseChange = (phase) => {
    setSelectedPhases((prev) =>
      prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
    );
  };
  // --- Submit handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedForemanId || !selectedJobCode) {
      alert("Please select both Foreman and Job Code before submitting.");
      return;
    }
    const timesheetData = {
      job_name: jobName || jobData?.job_name || jobData?.job_description || "",
      job: {
        job_code: selectedJobCode,
        phase_codes: selectedPhases,
      },
      time_of_day: timeOfDay,
      weather,
      temperature,
      location,
      project_engineer: projectEngineer,
      ...foremanData,
    };
    const payload = {
      foreman_id: parseInt(selectedForemanId, 10),
      date,
      job_phase_id: selectedJobPhaseId,
      data: timesheetData,
    };
    console.log(":package: Sending Payload:", payload);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/timesheets/`, payload);
      alert("Timesheet sent successfully!");
      onClose();
    } catch (err) {
      console.error(":x: Error sending timesheet:", err.response?.data);
      alert(`Error: ${JSON.stringify(err.response?.data?.detail || err.message)}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="modal-overlay">
      <div className="timesheet-form-modal">
        <header className="modal-header">
          <h2>Create Timesheet</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </header>
        <form onSubmit={handleSubmit} className="form-content">
          <div className="grid-2-cols">
            <div className="form-group">
              <label htmlFor="jobName">Job Name</label>
              <input
                id="jobName"
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Job name is auto-filled"
                required
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="foreman">Foreman</label>
            <select
              id="foreman"
              className="form-select"
              value={selectedForemanId}
              onChange={(e) => setSelectedForemanId(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">-- Select Foreman --</option>
              {foremen.map((fm) => (
                <option key={fm.id} value={fm.id}>
                  {fm.first_name} {fm.last_name}
                </option>
              ))}
            </select>
          </div>
          {foremanData && (
            <div className="crew-info-grid">
              <aside className="crew-info-box box-indigo">
                <h3>Assigned Employees</h3>
                <p>{foremanData.employees?.map((e) => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}</p>
              </aside>
              <aside className="crew-info-box box-indigo">
                <h3>Assigned Equipment</h3>
                <p>{foremanData.equipment?.map((eq) => eq.name).join(", ") || "N/A"}</p>
              </aside>
              <aside className="crew-info-box box-green">
                <h3>Assigned Materials</h3>
                <p>{foremanData.materials?.map((mat) => mat.name).join(", ") || "N/A"}</p>
              </aside>
              <aside className="crew-info-box box-yellow">
                <h3>Assigned Work Performed</h3>
                <p>{foremanData.vendors?.map((ven) => ven.name).join(", ") || "N/A"}</p>
              </aside>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="jobCode">Job Code</label>
            <select
              id="jobCode"
              className="form-select"
              value={selectedJobCode}
              onChange={(e) => setSelectedJobCode(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">-- Select Job Code --</option>
              {jobCodes.map((job) => (
                <option key={job.job_code} value={job.job_code}>
                  {job.job_code}
                </option>
              ))}
            </select>
            {jobData?.phase_codes?.length > 0 && (
              <fieldset className="phase-selection-fieldset">
                <legend>Select Phases:</legend>
                <div className="phase-list">
                  {jobData.phase_codes.map((phase) => (
                    <label
                      key={phase}
                      className={selectedPhases.includes(phase) ? "selected-phase" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPhases.includes(phase)}
                        onChange={() => handlePhaseChange(phase)}
                        disabled={loading}
                      />
                      <span>{phase}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
          {/* Additional input fields */}
          <div className="grid-2-cols">
            <div className="form-group">
              <label htmlFor="timeOfDay">Time of Day</label>
              <select
                id="timeOfDay"
                className="form-select"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select Time of Day --</option>
                {timeOfDayOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="weather">Weather</label>
              <select
                id="weather"
                className="form-select"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select Weather --</option>
                {weatherOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
  <label htmlFor="temperature">
    Temperature ({unit === 'C' ? '°C' : '°F'})
  </label>
  <div className="flex items-center gap-2">
    <input
      id="temperature"
      type="number"
      className="form-input flex-1"
      value={temperature}
      onChange={(e) => setTemperature(e.target.value)}
      disabled={loading}
      placeholder={`Enter temperature in ${unit === 'C' ? 'Celsius' : 'Fahrenheit'}`}
    />
    <select
      value={unit}
      onChange={(e) => setUnit(e.target.value)}
      disabled={loading}
      className="form-select"
    >
      <option value="C">°C</option>
      <option value="F">°F</option>
    </select>
  </div>
</div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectEngineer">Project Engineer</label>
              <input
                id="projectEngineer"
                type="text"
                className="form-input"
                value={projectEngineer}
                onChange={(e) => setProjectEngineer(e.target.value)}
                disabled={true}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn ${loading ? "btn-secondary" : "btn-primary"}`}
            >
              {loading ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TimesheetForm;