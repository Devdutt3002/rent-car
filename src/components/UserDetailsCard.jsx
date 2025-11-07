import React from 'react';
import { Card } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const UserDetailsCard = ({ user }) => {
    const cardStyle = {
        border: 'none',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderRadius: '12px',
        background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
        marginBottom: '1rem'
    };

    const headerStyle = {
        borderBottom: '2px solid #e0e0e0',
        marginBottom: '1rem',
        paddingBottom: '0.5rem'
    };

    const titleStyle = {
        color: '#2c3e50',
        fontSize: '1.25rem',
        fontWeight: '600',
        margin: '0'
    };

    const detailStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0.75rem',
        color: '#34495e',
        fontSize: '1.1rem'
    };

    const iconStyle = {
        marginRight: '10px',
        color: '#3498db'
    };

    return (
        <Card style={cardStyle}>
            <Card.Body style={{ padding: '1.5rem' }}>
                <div style={headerStyle}>
                    <h5 style={titleStyle}>
                        <FaUser style={iconStyle} />
                        User Details
                    </h5>
                </div>
                
                <div>
                    <div style={detailStyle}>
                        <FaUser style={iconStyle} />
                        <span><strong>Name:</strong> {user.customerName || 'Not provided'}</span>
                    </div>
                    
                    <div style={detailStyle}>
                        <FaEnvelope style={iconStyle} />
                        <span><strong>Email:</strong> {user.email}</span>
                    </div>
                    
                    <div style={detailStyle}>
                        <FaPhone style={iconStyle} />
                        <span><strong>Phone:</strong> {user.mobileNo || 'Not provided'}</span>
                    </div>
                    
                    <div style={detailStyle}>
                        <FaMapMarkerAlt style={iconStyle} />
                        <span><strong>Address:</strong> {user.address || 'Not provided'}</span>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default UserDetailsCard; 