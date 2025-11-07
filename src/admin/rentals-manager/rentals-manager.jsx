import React, {useEffect, useState} from 'react';
import {Accordion, Button, Card, Col, Form, InputGroup, ListGroup, Row} from "react-bootstrap";

import {fetchCars, fetchLocations, fetchReservations} from "../../hooks/useFetchData";
import {loadingContent} from "../../components/general/general-components";
import {BsCarFront, BsFillCarFrontFill, BsFillFuelPumpFill} from "react-icons/bs";
import {TbEngine, TbManualGearbox} from "react-icons/tb";
import {PiEngineFill} from "react-icons/pi";
import {FaMapMarkerAlt} from "react-icons/fa";

import {doc, getDocs, deleteDoc, query, collection, where} from "firebase/firestore";
import { db } from "../../config/firebase";
import Swal from "sweetalert2";
import UserDetailsCard from '../../components/UserDetailsCard';

const CarImageDisplay = ({ car, brand, model }) => {
    const containerStyle = {
        width: '100%',
        height: '250px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        background: 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
        marginBottom: '1rem'
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

const LocationDisplay = ({ reserveData, locations }) => {
    const getLocationInfo = () => {
        try {
            if (reserveData.locationDetails) {
                return {
                    cityName: reserveData.locationDetails.cityName,
                    branchName: reserveData.locationDetails.branchName
                };
            }

            if (typeof reserveData.location === 'string') {
                const [cityId, branchId] = reserveData.location.split('-');
                const city = locations[cityId] || {};
                const branch = city.branches ? city.branches[branchId] || {} : {};
                return {
                    cityName: city.name || 'N/A',
                    branchName: branch.name || 'N/A'
                };
            }

            return {
                cityName: 'N/A',
                branchName: 'N/A'
            };
        } catch (error) {
            console.error('Error processing location:', error);
            return {
                cityName: 'N/A',
                branchName: 'N/A'
            };
        }
    };

    const { cityName, branchName } = getLocationInfo();

    return (
        <div style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #e9ecef'
        }}>
            <h6 style={{
                color: '#2c3e50',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <FaMapMarkerAlt style={{ color: '#e74c3c' }} />
                Location Details
            </h6>
            <p style={{
                margin: '0',
                fontSize: '1.1rem',
                color: '#34495e'
            }}>
                <strong style={{ color: '#2c3e50' }}>City:</strong>
                <span style={{
                    marginLeft: '8px',
                    color: '#3498db',
                    fontWeight: '500'
                }}>{cityName}</span>
            </p>
            <p style={{
                margin: '0',
                fontSize: '1.1rem',
                color: '#34495e'
            }}>
                <strong style={{ color: '#2c3e50' }}>Branch:</strong>
                <span style={{
                    marginLeft: '8px',
                    color: '#3498db',
                    fontWeight: '500'
                }}>{branchName}</span>
            </p>
        </div>
    );
};

const RentalsManager = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [cars, setCars] = useState(null);
    const [locations, setLocations] = useState(null);
    const [reservations, setReservations] = useState(null);
    const [users, setUsers] = useState({});

    const fetchUserDetails = async (email) => {
        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                return {
                    ...userData,
                    id: querySnapshot.docs[0].id
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching user details:", error);
            return null;
        }
    };

    const groupReservationsWithSameOwner = (allReservations) => {
        return allReservations.reduce((acc, curr) => {
            let key = curr["reservationOwner"]
            if(!acc[key]) acc[key] = []
            acc[key].push(curr)
            return acc
        }, {});
    }

    useEffect(() => {
        Promise.all([
            fetchCars(),
            fetchLocations(),
            fetchReservations(),
        ])
        .then(async responses => {
            setCars(responses[0]);
            setLocations(responses[1]);
            
            if (responses[2]) {
                const groupedReservations = groupReservationsWithSameOwner(responses[2]);
                setReservations(groupedReservations);
                
                // Fetch user details for each unique email
                const userEmails = Object.keys(groupedReservations);
                const userDetailsPromises = userEmails.map(email => fetchUserDetails(email));
                const userDetailsResults = await Promise.all(userDetailsPromises);
                
                const userDetailsMap = {};
                userEmails.forEach((email, index) => {
                    if (userDetailsResults[index]) {
                        userDetailsMap[email] = userDetailsResults[index];
                    }
                });
                
                setUsers(userDetailsMap);
            }
            
            setIsLoading(false);
        });
    }, []);

    const handleCancelUserReservations = async (owner) => {
        Swal.fire({
            title: "Do you want to cancel all reservation of this user?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, cancel all!",
            cancelButtonText: "No"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const q = query(collection(db, "rentals"), where("reservationOwner", "==", owner));
                const querySnapshot = await getDocs(q);

                Promise.all(querySnapshot.docs.map(async (doc) => {
                    await deleteDoc(doc.ref)
                }))
                    .then(() => {
                        Swal.fire(
                            `User's All Reservations Cancelled!`,
                            `Reservations has been removed!`,
                            'success'
                        ).then((result) => {
                            if (result.isConfirmed) {
                                window.location.reload();
                            }
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: "Something went wrong!"
                        });
                    });
            }
        });
    }

    const handleCancelSpecificReservation = async documentId => {
        Swal.fire({
            title: "Do you want to cancel this reservation?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, cancel it!",
            cancelButtonText: "No"
        }).then((result) => {
            if (result.isConfirmed) {
                deleteDoc(doc(db, "rentals", documentId))
                    .then(() => {
                        Swal.fire(
                            'Reservation Cancelled!',
                            'Selected car has been removed!',
                            'success'
                        ).then((result) => {
                            if (result.isConfirmed) {
                                window.location.reload();
                            }
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: "Something went wrong!"
                        });
                    });
            }
        });
    }

    return (
        <div>
            <h1>Rentals Management</h1>
            <div className="d-grid gap-2 p-3">
                {!isLoading ? (
                    reservations ? (
                        <Accordion>
                            {Object.entries(reservations).map(([groupKey, reserveGroup], index) => (
                                <Accordion.Item key={index} eventKey={index}>
                                    <Accordion.Header>
                                        <h3 className="m-0">
                                            <span>USER: </span>
                                            <span className="fw-bold">{groupKey}</span>
                                        </h3>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        {users[groupKey] && (
                                            <Row className="mb-4">
                                                <Col xs={12} md={8} className="mx-auto">
                                                    <UserDetailsCard user={users[groupKey]} />
                                                </Col>
                                            </Row>
                                        )}
                                        <Accordion>
                                            {reserveGroup.map((reserveData, index) => (
                                                <Accordion.Item key={index} eventKey={index}>
                                                    <Accordion.Header>
                                                        <h3 className="m-0">
                                                            <BsFillCarFrontFill size="2em" className="me-2" style={{marginTop: "-10px"}}/>
                                                            <span className="fs-5 fw-bold">{`${reserveData.carBrand} / ${reserveData.carModel}`}</span>
                                                        </h3>
                                                    </Accordion.Header>
                                                    <Accordion.Body>
                                                        <Row>
                                                            <Col xs={12} md={6}>
                                                                <CarImageDisplay 
                                                                    car={cars[reserveData.carId]}
                                                                    brand={reserveData.carBrand}
                                                                    model={reserveData.carModel}
                                                                />
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
                                                            <Col xs={12} md={6}>
                                                                <LocationDisplay 
                                                                    reserveData={reserveData}
                                                                    locations={locations}
                                                                />
                                                                <Row>
                                                                    <Col xs={12}>
                                                                        <InputGroup size="lg" className="mb-2">
                                                                            <InputGroup.Text>Start Date</InputGroup.Text>
                                                                            <Form.Control
                                                                                type="date"
                                                                                value={reserveData.startDate}
                                                                                disabled
                                                                            />
                                                                        </InputGroup>
                                                                    </Col>
                                                                    <Col xs={12}>
                                                                        <InputGroup size="lg" className="mb-3">
                                                                            <InputGroup.Text>End Date</InputGroup.Text>
                                                                            <Form.Control
                                                                                type="date"
                                                                                value={reserveData.endDate}
                                                                                disabled
                                                                            />
                                                                        </InputGroup>
                                                                    </Col>
                                                                </Row>
                                                                <Button 
                                                                    variant="danger" 
                                                                    className="w-100" 
                                                                    onClick={() => handleCancelSpecificReservation(reserveData.documentId)}
                                                                >
                                                                    Cancel this Reservation
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                                        <div className="mt-2">
                                            <Button 
                                                variant="danger" 
                                                className="w-100"
                                                onClick={() => handleCancelUserReservations(groupKey)}
                                            >
                                                Cancel all reservations for this user
                                            </Button>
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    ) : (
                        <p>No reservations have been made by users...</p>
                    )
                ) : (
                    loadingContent
                )}
            </div>
        </div>
    );
};

export default RentalsManager;