
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiMessage, setApiMessage] = useState('در حال بارگذاری پیام از بک‌اند...');

  useEffect(() => {
    // Fetch the message from our Go backend
    fetch('https://api.medlead.ir/') //  <-- آدرس بک‌اند شما
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.text();
      })
      .then(data => setApiMessage(data))
      .catch(error => setApiMessage(`خطا در ارتباط با بک‌اند: ${error.message}`));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MedLead Frontend</h1>
        <p><strong>پیام از بک‌اند:</strong></p>
        <p className="api-message">{apiMessage}</p>
      </header>
    </div>
  );
}

export default App;