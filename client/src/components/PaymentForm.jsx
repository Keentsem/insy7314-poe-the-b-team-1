import React, { useState } from 'react';
import GlassSurface from './GlassSurface';
import ElectricBorder from './ElectricBorder';

const PaymentForm = ({ userId, onPaymentComplete }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    recipientAccount: '',
    recipientSwift: '',
    recipientName: '',
    reference: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Enhanced RegEx patterns for input validation
  const patterns = {
    amount: /^[0-9]{1,10}(\.[0-9]{1,2})?$/,
    recipientAccount: /^[A-Z0-9]{8,34}$/, // IBAN format
    recipientSwift: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, // SWIFT/BIC format
    recipientName: /^[a-zA-Z\s\-'\.]{2,100}$/, // Names with common punctuation
    reference: /^[a-zA-Z0-9\s\-]{1,35}$/ // Payment reference
  };

  const errorMessages = {
    amount: 'Amount must be a valid number with up to 2 decimal places (e.g., 100.50)',
    recipientAccount: 'Account must be a valid IBAN (8-34 alphanumeric characters)',
    recipientSwift: 'SWIFT code must be 8 or 11 characters (e.g., ABCDUS33XXX)',
    recipientName: 'Name must be 2-100 characters, letters, spaces, hyphens, apostrophes only',
    reference: 'Reference must be 1-35 characters, alphanumeric with spaces and hyphens only'
  };

  const validateInput = (name, value) => {
    if (!patterns[name]) return '';

    if (!value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    if (!patterns[name].test(value)) {
      return errorMessages[name];
    }

    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Real-time input sanitization
    let sanitizedValue = value;

    if (name === 'recipientAccount' || name === 'recipientSwift') {
      sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (name === 'amount') {
      sanitizedValue = value.replace(/[^0-9.]/g, '');
    } else if (name === 'recipientName') {
      sanitizedValue = value.replace(/[^a-zA-Z\s\-'\.]/g, '');
    } else if (name === 'reference') {
      sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));

    // Real-time validation
    const error = validateInput(name, sanitizedValue);
    setErrors(prev => ({ ...prev, [name]: error }));

    if (message) setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate all required fields
    const requiredFields = ['amount', 'recipientAccount', 'recipientSwift', 'recipientName'];

    requiredFields.forEach(field => {
      const error = validateInput(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Additional business logic validation
    const amount = parseFloat(formData.amount);
    if (amount < 1) {
      newErrors.amount = 'Minimum transfer amount is $1.00';
      isValid = false;
    }
    if (amount > 10000) {
      newErrors.amount = 'Maximum transfer amount is $10,000.00';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      setMessage('Please fix the validation errors above');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://localhost:3003/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          userId,
          amount: parseFloat(formData.amount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Payment submitted successfully! Transaction ID: ' + data.transaction.id);
        onPaymentComplete(data.transaction);

        // Reset form
        setFormData({
          amount: '',
          currency: 'USD',
          recipientAccount: '',
          recipientSwift: '',
          recipientName: '',
          reference: ''
        });
        setErrors({});
      } else {
        setMessage(data.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ElectricBorder
      color="#7df9ff"
      speed={1}
      chaos={0.5}
      thickness={2}
      style={{ borderRadius: 16 }}
    >
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={16}
        blur={11}
        displace={0.5}
        distortionScale={-180}
        redOffset={0}
        greenOffset={10}
        blueOffset={20}
        brightness={80}
        opacity={0.93}
        backgroundOpacity={0.15}
        saturation={1.3}
        mixBlendMode="normal"
        className="payment-form-container"
      >
      <div style={{ width: '100%' }}>
        <h3>International Payment</h3>

        {message && (
          <div className={message.includes('successfully') ? 'success-message' : 'error-response'}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount *</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="100.00"
              className={errors.amount ? 'error' : ''}
              maxLength="13"
              required
            />
            {errors.amount && <div className="error-message">{errors.amount}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency *</label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="currency-select"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="ZAR">ZAR - South African Rand</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recipientAccount">Recipient Account (IBAN) *</label>
          <input
            type="text"
            id="recipientAccount"
            name="recipientAccount"
            value={formData.recipientAccount}
            onChange={handleChange}
            placeholder="GB29NWBK60161331926819"
            className={errors.recipientAccount ? 'error' : ''}
            maxLength="34"
            required
          />
          {errors.recipientAccount && <div className="error-message">{errors.recipientAccount}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="recipientSwift">SWIFT/BIC Code *</label>
          <input
            type="text"
            id="recipientSwift"
            name="recipientSwift"
            value={formData.recipientSwift}
            onChange={handleChange}
            placeholder="NWBKGB2L"
            className={errors.recipientSwift ? 'error' : ''}
            maxLength="11"
            required
          />
          {errors.recipientSwift && <div className="error-message">{errors.recipientSwift}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="recipientName">Recipient Name *</label>
          <input
            type="text"
            id="recipientName"
            name="recipientName"
            value={formData.recipientName}
            onChange={handleChange}
            placeholder="John Smith"
            className={errors.recipientName ? 'error' : ''}
            maxLength="100"
            required
          />
          {errors.recipientName && <div className="error-message">{errors.recipientName}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="reference">Payment Reference</label>
          <input
            type="text"
            id="reference"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="Invoice 12345"
            className={errors.reference ? 'error' : ''}
            maxLength="35"
          />
          {errors.reference && <div className="error-message">{errors.reference}</div>}
        </div>

        <button
          type="submit"
          className="btn pay-button"
          disabled={isSubmitting || Object.values(errors).some(error => error)}
        >
          {isSubmitting ? 'Processing Payment...' : `Pay ${formData.amount} ${formData.currency}`}
        </button>

        <div className="security-notice">
          🔒 All payment data is encrypted and processed securely
        </div>
      </form>
      </div>
      </GlassSurface>
    </ElectricBorder>
  );
};

export default PaymentForm;