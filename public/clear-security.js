// Clear security data script
console.log('Clearing security data...');

// Clear all security-related localStorage items
const securityKeys = [
  'failed_login_attempts',
  'suspicious_activity', 
  'ip_blacklist',
  'appointment_attempts',
  'security_session_id'
];

securityKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Cleared: ${key}`);
});

// Clear sessionStorage
sessionStorage.removeItem('security_session_id');
console.log('Cleared: security_session_id from sessionStorage');

console.log('Security data cleared successfully!');
