/**
 * Customer List View Component
 * Displays all registered customers with animated list and stats
 */

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getSecureFetchOptions } from '../../config/api';
import { LoadingSpinner, showToast, AnimatedList } from '../ui';
import { FiUser, FiMail, FiCalendar, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

const CustomerListView = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CUSTOMERS_EMPLOYEE_ALL, getSecureFetchOptions('GET'));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customers');
      }

      setCustomers(data.customers || []);
    } catch (err) {
      showToast.error(`Failed to fetch customers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CUSTOMERS_EMPLOYEE_STATS, getSecureFetchOptions('GET'));
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(
        API_ENDPOINTS.CUSTOMERS_EMPLOYEE_DETAILS(customerId),
        getSecureFetchOptions('GET')
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customer details');
      }

      setCustomerDetails(data);
    } catch (err) {
      showToast.error(`Failed to fetch customer details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDetails(customer._id);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const customerItems = customers.map(customer => (
    <div key={customer._id} onClick={() => handleCustomerSelect(customer)} style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: '500', color: '#e5e7eb' }}>{customer.name}</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>{customer.email}</p>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          {customer.accountNumber}
        </div>
      </div>
    </div>
  ));

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ color: '#e5e7eb', marginBottom: '24px', fontSize: '1.75rem' }}>
        <FiUser style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
        Registered Customers
      </h2>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <StatCard
            icon={<FiUser />}
            label="Total Customers"
            value={stats.totalCustomers}
            color="#667eea"
          />
          <StatCard
            icon={<FiDollarSign />}
            label="Total Payments"
            value={stats.totalPayments}
            color="#f59e0b"
          />
          <StatCard
            icon={<FiCheckCircle />}
            label="Verified Payments"
            value={stats.verifiedPayments}
            color="#10b981"
          />
          <StatCard
            icon={<FiCheckCircle />}
            label="Completed Payments"
            value={stats.completedPayments}
            color="#06b6d4"
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Customer List */}
        <div style={{
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <h3 style={{ color: '#e5e7eb', marginBottom: '16px' }}>
            Customer Directory ({customers.length})
          </h3>
          <AnimatedList
            items={customerItems}
            onItemSelect={(item, index) => handleCustomerSelect(customers[index])}
            showGradients={true}
            enableArrowNavigation={true}
            displayScrollbar={true}
          />
        </div>

        {/* Customer Details */}
        {selectedCustomer && (
          <div style={{
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ color: '#e5e7eb', marginBottom: '24px' }}>Customer Details</h3>

            {loadingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <LoadingSpinner />
              </div>
            ) : customerDetails ? (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 auto 16px'
                  }}>
                    {customerDetails.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <h4 style={{ textAlign: 'center', color: '#e5e7eb', margin: 0 }}>
                    {customerDetails.customer.name}
                  </h4>
                  <p style={{ textAlign: 'center', color: '#9ca3af', margin: '4px 0' }}>
                    {customerDetails.customer.email}
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <DetailRow icon={<FiUser />} label="Account Number" value={customerDetails.customer.accountNumber} />
                  <DetailRow icon={<FiCalendar />} label="Member Since" value={new Date(customerDetails.customer.createdAt).toLocaleDateString()} />
                  <DetailRow icon={<FiDollarSign />} label="Account Balance" value={`$${customerDetails.customer.accountBalance.toFixed(2)}`} />
                </div>

                <div style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '24px'
                }}>
                  <h4 style={{ color: '#e5e7eb', marginBottom: '12px', fontSize: '1rem' }}>Payment Statistics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <MiniStat label="Total Payments" value={customerDetails.stats.totalPayments} />
                    <MiniStat label="Pending" value={customerDetails.stats.pendingPayments} color="#f59e0b" />
                    <MiniStat label="Verified" value={customerDetails.stats.verifiedPayments} color="#10b981" />
                    <MiniStat label="Rejected" value={customerDetails.stats.rejectedPayments} color="#ef4444" />
                  </div>
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>Total Transaction Amount</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                      ${customerDetails.stats.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Employee Statistics */}
                {customerDetails.employeeStats && customerDetails.employeeStats.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginTop: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <h4 style={{ color: '#e5e7eb', marginBottom: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiCheckCircle style={{ color: '#10b981' }} />
                      Verified By Employees
                    </h4>
                    {customerDetails.employeeStats.map((empStat, idx) => (
                      <div key={idx} style={{
                        padding: '12px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#e5e7eb' }}>
                              {empStat.employeeName}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
                              {empStat.employeeEmail}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                              ${empStat.totalAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                          <span style={{ color: '#10b981' }}>
                            ✓ {empStat.acceptedCount} Accepted
                          </span>
                          {empStat.rejectedCount > 0 && (
                            <span style={{ color: '#ef4444' }}>
                              ✗ {empStat.rejectedCount} Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', textAlign: 'center' }}>Select a customer to view details</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <div style={{ color, fontSize: '24px' }}>{icon}</div>
      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>{label}</p>
    </div>
    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#e5e7eb' }}>{value}</p>
  </div>
);

const DetailRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
    <div style={{ color: '#9ca3af', fontSize: '18px' }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>{label}</p>
      <p style={{ margin: 0, color: '#e5e7eb', fontWeight: '500' }}>{value}</p>
    </div>
  </div>
);

const MiniStat = ({ label, value, color = '#e5e7eb' }) => (
  <div style={{ textAlign: 'center' }}>
    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color }}>{value}</p>
    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{label}</p>
  </div>
);

export default CustomerListView;
