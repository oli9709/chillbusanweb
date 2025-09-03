import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <div style={{padding: '100px 20px', textAlign: 'center'}}>
          <h1 style={{color: 'red', fontSize: '50px'}}>TEST - REACT IS WORKING!</h1>
          <p>If you can see this, React is working!</p>
        </div>
      </div>
    </Router>
  );
}

export default App;
