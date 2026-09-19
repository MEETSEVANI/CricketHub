function validateRegistration(email, password) {
    const errors = [];
  
    if (!email || typeof email !== 'string') {
      errors.push('Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address.');
    }
  
    if (!password || typeof password !== 'string') {
      errors.push('Password is required.');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long.');
      }
  
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter.');
      }
  
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter.');
      }
  
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number.');
      }
  
      if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character.');
      }
    }
  
    return errors;
  }
  
  module.exports = {
    validateRegistration,
  };