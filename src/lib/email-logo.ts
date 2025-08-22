// Email logo configuration
export const EMAIL_LOGO_CONFIG = {
  // Option 1: Use hosted logo (recommended for production)
  hostedLogo: 'https://test-dental-clinic.netlify.app/logo.png',
  
  // Option 2: Use base64 encoded logo (fallback, more reliable)
  // You can convert your logo.png to base64 and paste it here
  base64Logo: '', // Add base64 string here if needed
  
  // Logo styling
  headerLogoStyle: 'width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid white;',
  footerLogoStyle: 'width: 40px; height: 40px; border-radius: 50%; object-fit: cover;',
  
  // Get logo URL (prioritizes hosted, falls back to base64)
  getLogoUrl: () => {
    return EMAIL_LOGO_CONFIG.hostedLogo;
  },
  
  // Get logo HTML element
  getLogoHtml: (size: 'header' | 'footer' = 'header') => {
    const style = size === 'header' ? EMAIL_LOGO_CONFIG.headerLogoStyle : EMAIL_LOGO_CONFIG.footerLogoStyle;
    const logoUrl = EMAIL_LOGO_CONFIG.getLogoUrl();
    
    return `<img src="${logoUrl}" alt="Jeshna Dental Clinic" style="${style}">`;
  }
};
