import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { fetchLocations } from '../../hooks/useFetchData';
import { Accordion, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';
import './locations-manager.scss';

const LocationsManager = () => {
    const [cities, setCities] = useState({});
    const [newCity, setNewCity] = useState('');
    const [newBranch, setNewBranch] = useState({ name: '', address: '', pinCode: '', phone: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [branchFormErrors, setBranchFormErrors] = useState({
        name: '',
        address: '',
        pinCode: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchLocations();
            console.log('Fetched locations:', response);
            if (response && typeof response === 'object') {
                setCities(response);
            } else {
                setCities({});
            }
        } catch (error) {
            console.error('Error loading locations:', error);
            setError('Failed to load locations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateFirestore = async (updatedCities) => {
        try {
            await setDoc(doc(db, "vehicle", "locations"), updatedCities);
            return true;
        } catch (error) {
            console.error('Error updating Firestore:', error);
            return false;
        }
    };

    const handleAddCity = () => {
        if (!newCity.trim()) {
            setError('City name cannot be empty');
            return;
        }

        // Check for duplicate city names
        const isDuplicate = Object.values(cities).some(city => 
            city.name.toLowerCase() === newCity.trim().toLowerCase()
        );

        if (isDuplicate) {
            setError('City already exists');
            return;
        }

        setCities(prev => {
            const cityId = Date.now().toString();
            return {
                ...prev,
                [cityId]: {
                    name: newCity.trim(),
                    branches: {}
                }
            };
        });
        setNewCity('');
        setError(null);
        setSuccessMessage('City added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const validateBranchForm = (branchData) => {
        const errors = {
            name: '',
            address: '',
            pinCode: '',
            phone: '',
            email: ''
        };
        let isValid = true;

        // Validate branch name
        if (!branchData.name.trim()) {
            errors.name = 'Branch name is required';
            isValid = false;
        }

        // Validate address
        if (!branchData.address.trim()) {
            errors.address = 'Address is required';
            isValid = false;
        }

        // Validate PIN code (6 digits)
        if (!branchData.pinCode.trim()) {
            errors.pinCode = 'PIN code is required';
            isValid = false;
        } else if (!/^\d{6}$/.test(branchData.pinCode)) {
            errors.pinCode = 'PIN code must be exactly 6 digits';
            isValid = false;
        }

        // Validate phone number (10 digits)
        if (!branchData.phone.trim()) {
            errors.phone = 'Phone number is required';
            isValid = false;
        } else if (!/^\d{10}$/.test(branchData.phone)) {
            errors.phone = 'Phone number must be exactly 10 digits';
            isValid = false;
        }

        // Validate email (gmail.com only)
        if (!branchData.email.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(branchData.email)) {
            errors.email = 'Please enter a valid Gmail address (example@gmail.com)';
            isValid = false;
        }

        setBranchFormErrors(errors);
        return isValid;
    };

    const handleAddBranch = (cityId) => {
        // Validate all branch details using our validation function
        if (!validateBranchForm(newBranch)) {
            return;
        }

        // Check for duplicate branch names in the city
        const cityBranches = cities[cityId] && cities[cityId].branches ? cities[cityId].branches : {};
        const isDuplicate = Object.values(cityBranches).some(branch => 
            branch.name.toLowerCase() === newBranch.name.trim().toLowerCase()
        );

        if (isDuplicate) {
            setError('Branch already exists in this city');
            return;
        }

        setCities(prev => {
            const branchId = Date.now().toString();
            const currentCity = prev[cityId] || { name: '', branches: {} };
            return {
                ...prev,
                [cityId]: {
                    ...currentCity,
                    branches: {
                        ...(currentCity.branches || {}),
                        [branchId]: {
                            ...newBranch,
                            name: newBranch.name.trim(),
                            address: newBranch.address.trim(),
                            pinCode: newBranch.pinCode.trim(),
                            phone: newBranch.phone.trim(),
                            email: newBranch.email.trim()
                        }
                    }
                }
            };
        });
        setNewBranch({ name: '', address: '', pinCode: '', phone: '', email: '' });
        setBranchFormErrors({
            name: '',
            address: '',
            pinCode: '',
            phone: '',
            email: ''
        });
        setError(null);
        setSuccessMessage('Branch added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleRemoveCity = async (cityId, event) => {
        if (event) {
            event.stopPropagation();  // Prevent accordion toggle
        }

        // Show SweetAlert2 confirmation
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! All branches in this city will also be removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            const updatedCities = { ...cities };
            delete updatedCities[cityId];

            // Update Firestore first
            const success = await updateFirestore(updatedCities);

            if (success) {
                setCities(updatedCities);
                Swal.fire(
                    'Deleted!',
                    'The city has been removed.',
                    'success'
                );
            } else {
                Swal.fire(
                    'Error!',
                    'Failed to remove the city. Please try again.',
                    'error'
                );
            }
        }
    };

    const handleRemoveBranch = async (cityId, branchId, event) => {
        if (event) {
            event.stopPropagation();  // Prevent accordion toggle
        }

        // Show SweetAlert2 confirmation
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            const updatedCities = { ...cities };
            const updatedBranches = { ...updatedCities[cityId].branches };
            delete updatedBranches[branchId];
            updatedCities[cityId] = {
                ...updatedCities[cityId],
                branches: updatedBranches
            };

            // Update Firestore first
            const success = await updateFirestore(updatedCities);

            if (success) {
                setCities(updatedCities);
                Swal.fire(
                    'Deleted!',
                    'The branch has been removed.',
                    'success'
                );
            } else {
                Swal.fire(
                    'Error!',
                    'Failed to remove the branch. Please try again.',
                    'error'
                );
            }
        }
    };

    const handleSaveChanges = async () => {
        try {
            setSaveLoading(true);
            setError(null);
            
            const success = await updateFirestore(cities);
            
            if (success) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Changes saved successfully',
                    icon: 'success'
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to save changes. Please try again.',
                    icon: 'error'
                });
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to save changes. Please try again.',
                icon: 'error'
            });
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem' }}>
            <h2>Locations Management</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1.5rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem' 
            }}>
                <h3>Add New City</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Form.Control
                        type="text"
                        placeholder="Enter city name..."
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                    />
                    <Button onClick={handleAddCity}>Add City</Button>
                </div>
            </div>

            <Accordion className="mb-4">
                {Object.entries(cities).map(([cityId, city]) => (
                    <Accordion.Item key={cityId} eventKey={cityId}>
                        <Accordion.Header>
                            {city.name}
                            <Button
                                variant="danger"
                                size="sm"
                                style={{ 
                                    position: 'absolute', 
                                    right: '3rem',
                                    zIndex: 2 
                                }}
                                onClick={(e) => handleRemoveCity(cityId, e)}
                            >
                                Remove City
                            </Button>
                        </Accordion.Header>
                        <Accordion.Body>
                            <div style={{ 
                                backgroundColor: '#f8f9fa', 
                                padding: '1.5rem', 
                                borderRadius: '0.5rem', 
                                marginBottom: '1.5rem' 
                            }}>
                                <h4 style={{ marginBottom: '1rem' }}>Add New Branch</h4>
                                <Form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAddBranch(cityId);
                                }}>
                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Branch Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="branchName"
                                                    placeholder="Enter branch name"
                                                    value={newBranch.name}
                                                    onChange={(e) => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
                                                    isInvalid={!!branchFormErrors.name}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {branchFormErrors.name}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Address</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="address"
                                                    placeholder="Enter address"
                                                    value={newBranch.address}
                                                    onChange={(e) => setNewBranch(prev => ({ ...prev, address: e.target.value }))}
                                                    isInvalid={!!branchFormErrors.address}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {branchFormErrors.address}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>PIN Code</Form.Label>
                                        <Form.Control
                                            type="text"
                                                    name="pinCode"
                                                    placeholder="Enter 6-digit PIN code"
                                                    maxLength={6}
                                                    pattern="\d{6}"
                                                    value={newBranch.pinCode}
                                                    onChange={(e) => setNewBranch(prev => ({ ...prev, pinCode: e.target.value }))}
                                                    isInvalid={!!branchFormErrors.pinCode}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {branchFormErrors.pinCode}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Phone</Form.Label>
                                                <Form.Control
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="Enter 10-digit phone number"
                                                    maxLength={10}
                                                    pattern="\d{10}"
                                                    value={newBranch.phone}
                                                    onChange={(e) => setNewBranch(prev => ({ ...prev, phone: e.target.value }))}
                                                    isInvalid={!!branchFormErrors.phone}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {branchFormErrors.phone}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    placeholder="Enter email"
                                                    value={newBranch.email}
                                                    onChange={(e) => setNewBranch(prev => ({ ...prev, email: e.target.value }))}
                                                    isInvalid={!!branchFormErrors.email}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {branchFormErrors.email}
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Button type="submit" variant="primary">Add Branch</Button>
                                </Form>
                                </div>

                            <div>
                                <h4>Branches</h4>
                                {Object.entries(city.branches || {}).map(([branchId, branch]) => (
                                    <div 
                                        key={branchId} 
                                        style={{ 
                                            padding: '1rem', 
                                            border: '1px solid #dee2e6', 
                                            borderRadius: '0.375rem', 
                                            marginBottom: '0.5rem',
                                            backgroundColor: 'white',
                                            transition: 'box-shadow 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h5 style={{ color: '#0d6efd', marginBottom: '0.75rem' }}>{branch.name}</h5>
                                                <p style={{ marginBottom: '0.25rem', color: '#6c757d' }}>Address: {branch.address}</p>
                                                <p style={{ marginBottom: '0.25rem', color: '#6c757d' }}>Pin Code: {branch.pinCode}</p>
                                                <p style={{ marginBottom: '0.25rem', color: '#6c757d' }}>Phone: {branch.phone}</p>
                                                <p style={{ marginBottom: '0.25rem', color: '#6c757d' }}>Email: {branch.email}</p>
                                            </div>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={(e) => handleRemoveBranch(cityId, branchId, e)}
                                            >
                                                Remove Branch
                                </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>

            <Button
                variant="success"
                onClick={handleSaveChanges}
                disabled={saveLoading}
                style={{ 
                    width: '100%',
                    marginTop: '1rem'
                }}
            >
                {saveLoading ? (
                    <>
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                        />
                        Saving...
                    </>
                ) : (
                    'Save All Changes'
                )}
            </Button>
        </div>
    );
};

export default LocationsManager;