import React, { useState } from 'react';
import './DataPickerOverlay.css';

const DatePickerOverlay = () => {
  const [outboundDate, setOutboundDate] = useState('');
  const [inboundDate, setInboundDate] = useState('');

  return (
    <div className="date-picker-overlay">
      <h2>Book Your Flight</h2>
      <div className="date-inputs">
        <div className="input-group">
          <label>Outbound</label>
          <input
            type="date"
            value={outboundDate}
            onChange={(e) => setOutboundDate(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Inbound</label>
          <input
            type="date"
            value={inboundDate}
            onChange={(e) => setInboundDate(e.target.value)}
          />
        </div>
      </div>
      <button className="submit-button">Submit</button>
    </div>
  );
};

export default DatePickerOverlay;
