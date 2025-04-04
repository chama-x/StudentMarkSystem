import React from 'react';
import schoolLogoImg from '../../assets/logo.jpeg'; // Import the school logo image

interface SchoolLogoProps {
  size?: 'small' | 'medium' | 'large';
  withName?: boolean;
  className?: string;
}

const SchoolLogo: React.FC<SchoolLogoProps> = ({ 
  size = 'medium', 
  withName = false,
  className = ''
}) => {
  // Define sizes for different variants
  const sizes = {
    small: {
      container: '44px',
      fontSize: '14px'
    },
    medium: {
      container: '64px',
      fontSize: '16px'
    },
    large: {
      container: '88px',
      fontSize: '18px'
    }
  };

  const selectedSize = sizes[size];

  return (
    <div className={`school-logo ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: selectedSize.container,
        height: selectedSize.container,
        borderRadius: '50%',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow)',
        border: '2px solid rgba(14, 165, 233, 0.15)',
        overflow: 'hidden' // Ensure the image stays within the circular container
      }}>
        {/* Actual School Logo Image */}
        <img 
          src={schoolLogoImg}
          alt="Mo/Kukurampola K.V. Logo"
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain' // Maintain aspect ratio while fitting in container
          }} 
        />
      </div>
      
      {withName && (
        <div style={{ 
          marginTop: '0.5rem', 
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: selectedSize.fontSize,
          color: 'var(--color-text)',
          lineHeight: '1.2'
        }}>
          Mo/Kukurampola K.V.
        </div>
      )}
    </div>
  );
};

export default SchoolLogo; 