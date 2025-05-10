import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    
    // Check file size before upload
    if (selectedFile && selectedFile.size > 32 * 1024 * 1024) {
      setError('Filen är för stor. Maximal filstorlek är 32MB.');
      return;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Välj en fil först');
      return;
    }

    setError(null);
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5050/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || 'Ett fel uppstod');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Ett fel uppstod vid uppladdning');
      setResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>PDF Classifier</h1>
      <div className="upload-container">
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          className="file-input"
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || isLoading}
          className="upload-button"
        >
          {isLoading ? 'Bearbetar...' : 'Ladda upp & Klassificera'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading && <div className="loading">Klassificerar dokument...</div>}
      
      {response && (
        <div className="response-container">
          <h2>Resultat</h2>
          <div className="classification-result">
            {response.classification}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;