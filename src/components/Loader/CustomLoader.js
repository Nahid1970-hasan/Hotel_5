import React from 'react';
import './Loader.css'; // Import your loader styles here

const CustomLoader = () => {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="ebs-text">D</div>
        <div className="ebs-text">I</div>
        <div className="ebs-text">B</div>
        <div className="ebs-text">S</div>
      </div>
      <p className="loader-slogan">Smart Business Solution</p>
    </div>
  );
};

export default CustomLoader;
