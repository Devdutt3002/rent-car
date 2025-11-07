import React, {useEffect, useState} from 'react';

import {locationsData, vehiclesData} from "../../DATA/data.jsx";

import {useSelector} from "react-redux";

import {Link, useNavigate} from "react-router-dom";

import {Container, Row, Col, Button, Card, ListGroup, InputGroup, Form} from "react-bootstrap";

import {TbEngine, TbManualGearbox} from "react-icons/tb";
import {BsCarFront, BsFillCarFrontFill, BsFillFuelPumpFill} from "react-icons/bs";
import {PiEngineFill} from "react-icons/pi";

import {fetchBrands, fetchModels, fetchCars, fetchReservations, fetchLocations} from "../../hooks/useFetchData";
import {loadingContent} from "../../components/general/general-components";
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Swal from 'sweetalert2';
import UserDetailsCard from '../../components/UserDetailsCard';

const LocationDetailsCard = ({ branch, city }) => {
    const cardStyle = {
        border: 'none',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderRadius: '12px',
        background: 'linear-gradient(145deg, #ffffff, #f5f5f5)'
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

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
    };

    const sectionStyle = {
        background: '#f8f9fa',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
    };

    const textStyle = {
        margin: '0 0 0.5rem 0',
        fontSize: '1.1rem',
        color: '#34495e'
    };

    return (
        <Card className="mb-3" style={cardStyle}>
            <Card.Body style={{ padding: '1.5rem' }}>
                <div style={headerStyle}>
                    <h5 style={titleStyle}>
                        <i className="fas fa-map-marker-alt" style={{
                            color: '#e74c3c',
                            marginRight: '8px'
                        }}></i>
                        Location Details
                    </h5>
                </div>
                
                <div style={gridContainerStyle}>
                    <div style={sectionStyle}>
                        <p style={textStyle}>
                            <strong style={{color: '#2c3e50'}}>City:</strong>
                            <span style={{
                                marginLeft: '8px',
                                color: '#3498db',
                                fontWeight: '500'
                            }}>{city || 'N/A'}</span>
                        </p>
                        <p style={textStyle}>
                            <strong style={{color: '#2c3e50'}}>Branch:</strong>
                            <span style={{
                                marginLeft: '8px',
                                color: '#3498db',
                                fontWeight: '500'
                            }}>{branch.name || branch.branchName || 'N/A'}</span>
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <p style={textStyle}>
                            <strong style={{color: '#2c3e50'}}>Address:</strong>
                            <span style={{
                                marginLeft: '8px',
                                color: '#7f8c8d',
                                fontWeight: '500'
                            }}>{branch.address || 'N/A'}</span>
                        </p>
                        <p style={{...textStyle, margin: '0'}}>
                            <strong style={{color: '#2c3e50'}}>PIN Code:</strong>
                            <span style={{
                                marginLeft: '8px',
                                color: '#7f8c8d',
                                fontWeight: '500'
                            }}>{branch.pinCode || 'N/A'}</span>
                        </p>
                    </div>

                    <div style={sectionStyle}>
                        <p style={textStyle}>
                            <strong style={{color: '#2c3e50'}}>Phone:</strong>
                            <span style={{
                                marginLeft: '8px',
                                color: '#27ae60',
                                fontWeight: '500'
                            }}>{branch.phone || 'N/A'}</span>
                        </p>
                        <p style={{...textStyle, margin: '0'}}>
                            <strong style={{color: '#2c3e50'}}>Email:</strong>
                            <span style={{
                                marginLeft: '8px',
                                color: '#27ae60',
                                fontWeight: '500'
                            }}>{branch.email || 'N/A'}</span>
                        </p>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

const CarImageDisplay = ({ car, brand, model }) => {
    const containerStyle = {
        width: '100%',
        height: '300px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        background: 'linear-gradient(145deg, #f8f9fa, #e9ecef)'
    };

    const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center',
        padding: '1rem',
        transition: 'transform 0.3s ease-in-out'
    };

    const overlayStyle = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
        padding: '1rem',
        color: 'white',
        textAlign: 'center',
        fontWeight: '500',
        fontSize: '1.1rem',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
    };

    return (
        <div style={containerStyle}>
            <img 
                src={car.image} 
                alt={`${brand} / ${model}`}
                style={imageStyle}
                onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.target.style.transform = 'scale(1)'}
            />
            <div style={overlayStyle}>
                {`${brand} ${model}`}
            </div>
        </div>
    );
};

const MyRentals = () => {

    // IT WAS USING BEFORE DATABASE USAGE (FOR GLOBAL STATE MANAGEMENT)
    // const {reservations} = useSelector(state => state.ReserveSlice);
    // NOT REQUIRED ANYMORE (BECAUSE RESERVATION DATA WILL FETCH FROM DB)

    const locale = 'en';
    const [date, setDate] = useState(new Date());

    const [isLoading, setIsLoading] = useState(true);

    const user = useSelector(({UserSlice}) => UserSlice.user);

    const [cars, setCars] = useState(null);
    const [locations, setLocations] = useState(null);

    const [reservations, setReservations] = useState(null);

    useEffect(() => {

        setInterval(() => {
            setDate(new Date());
        }, 60 * 1000);

        Promise.all([
            fetchCars(),
            fetchLocations(),
            fetchReservations(user.email),
        ])
        .then(responses => {

            setCars(responses[0])
            setLocations(responses[1])
            setReservations(responses[2])

            setIsLoading(false);
        });

    }, []);


    const welcomeMessage = () => {

        let day = `${date.toLocaleDateString(locale, { weekday: 'long' })}, ${date.getDate()} ${date.toLocaleDateString(locale, { month: 'long' })}`;
        let hour = date.getHours();
        let wish = `Good ${(hour < 12 && 'Morning') || (hour < 17 && 'Afternoon') || 'Evening'}, `;

        let time = date.toLocaleTimeString(locale, { hour: 'numeric', hour12: true, minute: 'numeric' });

        return <h4 className="mb-1">
            {day} <span className="text-black-50">|</span> {time}
            <hr className="my-1"/>
            {wish} <span className="fw-600">{user.email}</span>
        </h4>
    }

    const getBranchDetails = (reserveData, locations) => {
        try {
            if (reserveData.locationDetails) {
                return <LocationDetailsCard 
                    branch={reserveData.locationDetails} 
                    city={reserveData.locationDetails.cityName}
                />;
            }

            if (reserveData.location && typeof reserveData.location === 'string') {
                const [cityId, branchId] = reserveData.location.split('-');
                const city = locations[cityId] || {};
                const branch = city.branches ? city.branches[branchId] || {} : {};
                
                return branch.name ? (
                    <LocationDetailsCard 
                        branch={branch}
                        city={city.name}
                    />
                ) : null;
            }
            
            return null;
        } catch (error) {
            console.error('Error processing branch details:', error);
            return null;
        }
    };

    const handleCancelReservation = async (documentId) => {
        try {
            const result = await Swal.fire({
                title: 'Cancel Reservation',
                text: "Are you sure you want to cancel this reservation? This action cannot be undone.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, cancel it!',
                cancelButtonText: 'No, keep it'
            });

            if (result.isConfirmed) {
                // Delete the reservation from Firebase
                await deleteDoc(doc(db, "rentals", documentId));
                
                // Update local state to remove the cancelled reservation
                setReservations(prev => prev.filter(res => res.documentId !== documentId));
                
                await Swal.fire(
                    'Cancelled!',
                    'Your reservation has been cancelled.',
                    'success'
                );
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            await Swal.fire(
                'Error!',
                'Failed to cancel the reservation. Please try again.',
                'error'
            );
        }
    };

    return (
        <div id="my-rentals">
            <Container className="py-4">
                <Row className="mb-5">
                    <Col>
                        <h1 className="fs-1 text-center text-uppercase">My Rentals</h1>
                    </Col>
                </Row>
                {user.email && (
                    <>
                    <div className="d-flex justify-content-center mb-1">
                        {welcomeMessage()}
                    </div>
                        <Row className="mb-4">
                            <Col xs={12} md={8} className="mx-auto">
                                <UserDetailsCard user={user} />
                            </Col>
                        </Row>
                    </>
                )}
                <Row>
                    {
                        !isLoading
                        ?
                            reservations
                                ?
                                reservations.map((reserveData, index) => {
                                    // Generate a unique key using reservation data
                                    const uniqueKey = `rental-${reserveData.carId}-${reserveData.startDate}-${index}`;
                                    
                                    // Parse location data safely
                                    const locationDisplay = (() => {
                                        try {
                                            if (!reserveData.location) return 'Location not available';
                                            
                                            // First check for locationDetails (new format)
                                            if (reserveData.locationDetails) {
                                                return `${reserveData.locationDetails.cityName} - ${reserveData.locationDetails.branchName}`;
                                            }
                                            
                                            // Handle legacy string format
                                            if (typeof reserveData.location === 'string') {
                                                const [cityId, branchId] = reserveData.location.split('-');
                                                const city = locations[cityId] || {};
                                                const branch = city.branches ? city.branches[branchId] || {} : {};
                                                return `${city.name || ''} - ${branch.name || ''}`;
                                            }
                                            
                                            return 'Location not available';
                                        } catch (error) {
                                            console.error('Error processing location:', error);
                                            return 'Location not available';
                                        }
                                    })();

                                    return (
                                        <Col xs={{ span: 10, offset: 1 }} key={uniqueKey}>
                                        <Card className="my-2">
                                            <Row>
                                                <Col xs={12}>
                                                    <ListGroup variant="flush" className="text-center">
                                                        <ListGroup.Item variant="secondary" action>
                                                            <BsFillCarFrontFill size="2em" className="me-2" style={{marginTop: "-10px"}}/>
                                                            <span className="fs-5 fw-bold">{`${reserveData.carBrand} / ${reserveData.carModel}`}</span>
                                                        </ListGroup.Item>
                                                    </ListGroup>
                                                </Col>
                                            </Row>
                                            <Row>
                                                    <Col xs={12} md={6} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '1.5rem'
                                                    }}>
                                                        <CarImageDisplay 
                                                            car={cars[reserveData.carId]}
                                                            brand={reserveData.carBrand}
                                                            model={reserveData.carModel}
                                                        />
                                                </Col>
                                                <Col xs={12} md={6}>
                                                    <ListGroup variant="flush">
                                                        <ListGroup.Item>
                                                            <TbEngine size="2em" className="me-2" style={{marginTop: "-8px"}}/>
                                                            <span className="fs-6">HP:</span> &nbsp;
                                                            <span className="fs-5 fw-bold">{cars[reserveData.carId].power}</span>
                                                        </ListGroup.Item>
                                                        <ListGroup.Item>
                                                            <PiEngineFill size="2em" className="me-2" style={{marginTop: "-8px"}}/>
                                                            <span className="fs-6">Engine Size:</span> &nbsp;
                                                            <span className="fs-5 fw-bold">{cars[reserveData.carId].engineSize}</span>
                                                        </ListGroup.Item>
                                                        <ListGroup.Item>
                                                            <TbManualGearbox size="2em" className="me-2" style={{marginTop: "-8px"}}/>
                                                            <span className="fs-6">Gear Box:</span> &nbsp;
                                                            <span className="fs-5 fw-bold">{cars[reserveData.carId].gearbox}</span>
                                                        </ListGroup.Item>
                                                        <ListGroup.Item>
                                                            <BsCarFront size="2em" className="me-2" style={{marginTop: "-10px"}}/>
                                                            <span className="fs-6">Body Type:</span> &nbsp;
                                                            <span className="fs-5 fw-bold">{cars[reserveData.carId].bodyType}</span>
                                                        </ListGroup.Item>
                                                        <ListGroup.Item>
                                                            <BsFillFuelPumpFill size="2em" className="me-2" style={{marginTop: "-10px"}}/>
                                                            <span className="fs-6">Fuel Type:</span> &nbsp;
                                                            <span className="fs-5 fw-bold">{cars[reserveData.carId].fuelType}</span>
                                                        </ListGroup.Item>
                                                    </ListGroup>
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col>
                                                    <Row>
                                                        <Col xs={12} md={6}>
                                                            <InputGroup size="lg" className="my-2">
                                                                    <InputGroup.Text id={`rental-location-${uniqueKey}`}>
                                                                        Rental Location
                                                                    </InputGroup.Text>
                                                                <Form.Select size="lg" disabled>
                                                                        <option value={reserveData.location}>
                                                                            {locationDisplay}
                                                                        </option>
                                                                </Form.Select>
                                                            </InputGroup>
                                                        </Col>
                                                        <Col xs={12} md={6}>
                                                            <InputGroup size="lg" className="my-2">
                                                                <InputGroup.Text id="start-date">Start Date</InputGroup.Text>
                                                                <Form.Control
                                                                    type="date"
                                                                    min={reserveData.startDate}
                                                                    value={reserveData.startDate}
                                                                    disabled
                                                                />
                                                            </InputGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col xs={12} md={6}>
                                                            <InputGroup size="lg" className="my-2">
                                                                <InputGroup.Text id="end-date">End Date</InputGroup.Text>
                                                                <Form.Control
                                                                    type="date"
                                                                    min={reserveData.endDate}
                                                                    value={reserveData.endDate}
                                                                    disabled
                                                                />
                                                            </InputGroup>
                                                        </Col>
                                                    </Row>
                                                        {getBranchDetails(reserveData, locations)}
                                                        <div className="d-flex justify-content-end p-3">
                                                            <Button 
                                                                variant="danger" 
                                                                onClick={() => handleCancelReservation(reserveData.documentId)}
                                                                style={{
                                                                    minWidth: '150px',
                                                                    fontSize: '1.1rem',
                                                                    padding: '0.5rem 1rem'
                                                                }}
                                                            >
                                                                Cancel Reservation
                                                            </Button>
                                                        </div>
                                                </Col>
                                            </Row>
                                        </Card>
                                        </Col>
                                    );
                                })
                                :
                                <Col>
                                    <Card className="text-center text-danger p-5">
                                        <p className="fs-4 mb-5">You have not rented any vehicles yet!</p>
                                        <Link to="/vehicles">
                                            <Button variant="secondary" size="lg" className="primary-bg-color border-0">
                                                Click to Browse Vehicles
                                            </Button>
                                        </Link>
                                    </Card>
                                </Col>
                        :
                            loadingContent
                    }
                </Row>
            </Container>
        </div>
    );
};

export default MyRentals;