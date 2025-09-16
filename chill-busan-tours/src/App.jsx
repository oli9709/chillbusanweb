import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import CustomTourBuilder from './components/CustomTourBuilder';
import './App.css';

function App() {
  return (
    <Router basename="/">
      <div className="App">
        <Navigation />
        
        <Routes>
          {/* Main Home Page */}
          <Route path="/" element={
            <div style={{padding: '100px 20px', textAlign: 'center'}}>
              <h1 style={{color: '#4A90E2', fontSize: '3rem', marginBottom: '20px'}}>Chill Busan Tours</h1>
              <p style={{fontSize: '1.2rem', marginBottom: '30px'}}>Private & Relaxed Local Tours</p>
              <div style={{background: '#f8f9fa', padding: '40px', borderRadius: '10px', margin: '20px 0'}}>
                <h2 style={{color: '#4A90E2', marginBottom: '20px'}}>Welcome to Busan!</h2>
                <p style={{marginBottom: '20px'}}>Experience the best of Busan with our personalized tours.</p>
                <a href="/custom-tour" style={{
                  background: '#4A90E2', 
                  color: 'white', 
                  padding: '15px 30px', 
                  borderRadius: '25px', 
                  textDecoration: 'none',
                  display: 'inline-block',
                  fontWeight: 'bold'
                }}>
                  🎨 Create Custom Tour
                </a>
              </div>
            </div>
          } />
          
          {/* Custom Tour Route */}
          <Route 
            path="/custom-tour" 
            element={<CustomTourBuilder />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
