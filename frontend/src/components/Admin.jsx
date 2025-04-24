import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "../app.css";

// function MainAdmin() {
//   const navigate = useNavigate();
//   const [topResult, setTopResult] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/");
//   };

//   const handleFileChange = async (e) => {
//     const files = e.target.files;
//     const formData = new FormData();

//     for (let i = 0; i < files.length; i++) {
//       formData.append("files", files[i]);
//     }

//     setUploading(true);

//     try {
//       const response = await fetch("http://localhost:8000/upload-resumes/", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();
//       setTopResult(data.top_result);
//     } catch (error) {
//       console.error("Upload failed:", error);
//       alert("Something went wrong during the upload.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="App p-6 max-w-4xl mx-auto">
//       <div className="flex justify-between items-center mb-6" style={{ textAlign: 'center' }}>
//         <h1 className="text-2xl font-bold">Best Resume Selection</h1>
//         <button
//           onClick={handleLogout}
//           style={{
//             position: 'absolute', right: 40, top: 70, padding: "5px 20px",
//             fontSize: "15px"
//           }}
//           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//         >
//           Logout
//         </button>
//       </div>

//       <div className="mb-4">
//         <input
//           type="file"
//           multiple
//           accept=".pdf"
//           onChange={handleFileChange}
//           className="block w-full text-sm text-gray-700 border border-gray-300 rounded cursor-pointer"
//         />
//         {uploading && <p className="text-blue-600 mt-2">Uploading...</p>}
//       </div>

//       {topResult && (
//         <div className="mt-6 p-4 border border-green-400 rounded bg-green-100">
//           <h2 className="font-semibold text-lg">Top Resume Result</h2>
//           <p>{topResult}</p>
//         </div>
//       )}
//     </div>
//   );
// }

function MainAdmin() {
    const navigate = useNavigate();
    const [topResult, setTopResult] = useState([]);
    const [uploading, setUploading] = useState(false);
  
    const handleLogout = () => {
      localStorage.clear();
      navigate("/");
    };
  
    const handleFileChange = async (e) => {
      const files = e.target.files;
      const formData = new FormData();
  
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
  
      setUploading(true);
  
      try {
        const response = await fetch("http://localhost:8000/upload-resumes/", {
          method: "POST",
          body: formData,
        });
  
        const data = await response.json();
        setTopResult(data.top_result); // Top result should be an array of names
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Something went wrong during the upload.");
      } finally {
        setUploading(false);
      }
    };
  
    return (
      <div className="App p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6" style={{ textAlign: 'center' }}>
          <h1 className="text-2xl font-bold">Best Resume Selection</h1>
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute', right: 40, top: 70, padding: "5px 20px",
              fontSize: "15px"
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div><br/><br/>
  
        <div className="mb-4" style={{textAlign:'center'}}>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded cursor-pointer"
          />
          {uploading && <p className="text-blue-600 mt-2">Uploading...</p>}
        </div>
  
        {topResult.length > 0 && (
          <div className="mt-6 p-4 border border-green-400 rounded bg-green-100">
            <h2 className="font-semibold text-lg" style={{textAlign:'center'}}>Top Resume Result</h2>
            <div style={{paddingLeft:'45%'}}>
              {topResult.map((name, index) => (
                <p key={index}>{name}</p>  
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  

function Admin() {
  return (
    <Routes>
        <Route path="/" element={<MainAdmin />} />
        <Route path="/institute-dashboard/*" element={<Admin />} />

    </Routes>
  );
}

export default Admin;
