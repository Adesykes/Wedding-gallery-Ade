import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // This matches the export default in App.js

const API_BASE = process.env.REACT_APP_API_BASE;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const express = require('express');
const cors = require('cors');

const app = express();

// ...rest of your code

module.exports = app; // if needed
