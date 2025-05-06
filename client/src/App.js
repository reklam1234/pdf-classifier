import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    setResponse(data);
  };

  return (
    <div className="App">
      <h1>PDF Classifier</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload & Classify</button>
      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
}

export default App;