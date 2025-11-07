import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, redirect } from "react-router-dom";
import Swal from 'sweetalert2'

import { Container, Row, Col, Form, ListGroup, InputGroup, Button, Spinner, Card, Modal } from 'react-bootstrap';

import { TbEngine, TbManualGearbox } from "react-icons/tb";
import { BsCarFront, BsFillCarFrontFill, BsFillFuelPumpFill } from "react-icons/bs";
import { PiEngineFill } from "react-icons/pi";
import { FaCreditCard, FaPhoneAlt } from 'react-icons/fa';

import { useDispatch, useSelector } from "react-redux";
import { makeReservation, reserveNow } from "../redux/features/ReserveSlice";

import { fetchBrands, fetchModels, fetchCars, fetchLocations } from "../hooks/useFetchData";

import { loadingContent } from "../components/general/general-components";

import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const CarDetail = () => {

    const dispatch = useDispatch();
    const user = useSelector(({ UserSlice }) => UserSlice.user);
    const reserveButtonRef = useRef(null);

    const { carBrand, carModel, carId } = useParams();
    const navigate = useNavigate();

    const [cars, setCars] = useState(null);
    const [brands, setBrands] = useState(null);
    const [models, setModels] = useState(null);
    const [locations, setLocations] = useState(null);

    const [selectedLocation, setSelectedLocation] = useState("");
    const [rentDate, setRentDate] = useState({ start: getDateByInputFormat(), end: getDateByInputFormat(1) });
    const [calculatedPrice, setCalculatedPrice] = useState(null);

    const [isReservationTimerEnable, setIsReservationTimerEnable] = useState(true);
    const [reservationTimer, setReservationTimer] = useState(300); //in seconds

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        phoneNumber: ''
    });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    useEffect(() => {

        fetchBrands().then(response => setBrands(response));
        fetchModels().then(response => setModels(response));
        fetchCars().then(response => {
            setCars(response)
            setIsReservationTimerEnable(response[carId].carCount > 0)
        });
        fetchLocations().then(response => { setLocations(response) });

    }, []);


    function getDateByInputFormat(dayOffset = 0, date = null) {

        let currentDate = date === null ? new Date() : new Date(date)
        if (dayOffset === 0) return currentDate.toISOString().split('T')[0]

        const offsetDate = new Date(currentDate)
        offsetDate.setDate(currentDate.getDate() + dayOffset)
        return offsetDate.toISOString().split('T')[0]
    }
    function timerToString() {
        let hours = ('0' + Math.floor(reservationTimer / 3600)).slice(-2);
        let minutes = ('0' + Math.floor(reservationTimer / 60)).slice(-2);
        let seconds = ('0' + reservationTimer % 60).slice(-2);
        return /*hours + ":" +*/ minutes + ":" + seconds;
    }
    function handleReserveTimeout() {

        let redirectTimerInterval
        Swal.fire({
            title: 'You did not complete the reservation!',
            html:
                'You are being redirected in <strong>5</strong> seconds',
            timer: 5000,
            didOpen: () => {
                const content = Swal.getHtmlContainer()
                const $ = content.querySelector.bind(content)

                Swal.showLoading()

                redirectTimerInterval = setInterval(() => {
                    Swal.getHtmlContainer().querySelector('strong')
                        .textContent = (Swal.getTimerLeft() / 1000)
                            .toFixed(0)
                }, 100)
            },
            willClose: () => {
                clearInterval(redirectTimerInterval);
                navigate("/")
            }
        })
    }

    useEffect(() => {
        if (!isReservationTimerEnable) return;

        if (reservationTimer > 0) {
            setTimeout(() => {
                setReservationTimer(reservationTimer - 1);
            }, 1000)
        }
        else {
            handleReserveTimeout()
        }
    }, [reservationTimer]);

    const calculateTotalPrice = () => {
        if (!cars || !rentDate.start || !rentDate.end) return;
        
        const startDate = new Date(rentDate.start);
        const endDate = new Date(rentDate.end);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        const dailyRate = cars[carId].rental_price || 0;
        const totalPrice = daysDiff * dailyRate;
        
        setCalculatedPrice(totalPrice);
        return totalPrice;
    };

    const handlePaymentMethodSelect = (method) => {
        setSelectedPaymentMethod(method);
        setPaymentDetails({
            cardNumber: '',
            cardName: '',
            expiryDate: '',
            cvv: '',
            phoneNumber: ''
        });
    };

    const simulatePayment = async () => {
        setIsProcessingPayment(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsProcessingPayment(false);
        return true; // Simulate successful payment
    };

    const handlePaymentSubmit = async () => {
        if (!selectedPaymentMethod) {
            Swal.fire({
                title: 'Error',
                text: 'Please select a payment method',
                icon: 'error'
            });
            return;
        }

        // Validate payment details based on selected method
        if (selectedPaymentMethod === 'card' && (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiryDate || !paymentDetails.cvv)) {
            Swal.fire({
                title: 'Error',
                text: 'Please fill in all card details',
                icon: 'error'
            });
            return;
        }

        if (selectedPaymentMethod === 'phone') {
            if (!paymentDetails.phoneNumber) {
                Swal.fire({
                    title: 'Error',
                    text: 'Please enter your phone number',
                    icon: 'error'
                });
                return;
            }
            
            // Validate phone number format (10 digits)
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(paymentDetails.phoneNumber)) {
                Swal.fire({
                    title: 'Invalid Phone Number',
                    text: 'Please enter a valid 10-digit phone number',
                    icon: 'error'
                });
                return;
            }
        }

        try {
            const paymentSuccess = await simulatePayment();
            if (paymentSuccess) {
                setShowPaymentModal(false);
                // Continue with reservation
                await processReservation();
            }
        } catch (error) {
            Swal.fire({
                title: 'Payment Failed',
                text: 'There was an error processing your payment. Please try again.',
                icon: 'error'
            });
        }
    };

    const processReservation = async () => {
        // Disable the button using ref
        if (reserveButtonRef.current) {
            reserveButtonRef.current.disabled = true;
        }
        setIsReservationTimerEnable(false);

        const reservationData = {
            reservationOwner: user.email,
            carId: parseInt(carId) || 0,
            carBrand: carBrand,
            carModel: carModel,
            startDate: rentDate.start,
            endDate: rentDate.end,
            location: selectedLocation,
            locationDetails: (() => {
                const [cityId, branchId] = selectedLocation.split('-');
                const city = locations[cityId] || {};
                const branch = city.branches ? city.branches[branchId] || {} : {};
                return {
                    cityId,
                    cityName: city.name || '',
                    branchId,
                    branchName: branch.name || '',
                    address: branch.address || '',
                    pinCode: branch.pinCode || '',
                    phone: branch.phone || '',
                    email: branch.email || ''
                };
            })(),
            totalPrice: calculatedPrice,
            termsAccepted: true,
            termsAcceptedDate: new Date().toISOString(),
            paymentDetails: {
                method: selectedPaymentMethod,
                amount: calculatedPrice,
                status: 'completed',
                date: new Date().toISOString()
            }
        }

        const carsClone = Object.assign({}, cars);
        carsClone[carId].carCount = carsClone[carId].carCount - 1;

        try {
            await setDoc(doc(db, "vehicle", "cars"), carsClone);
            await addDoc(collection(db, "rentals"), reservationData);

            await Swal.fire(
                'Reservation Completed!',
                'Car has been reserved for you!',
                'success'
            );
            
            navigate('/my-rentals');
        } catch (err) {
            console.error(err);
            await Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Something went wrong!"
            });
            if (reserveButtonRef.current) {
                reserveButtonRef.current.disabled = false;
            }
            setIsReservationTimerEnable(true);
        }
    };

    const handleReserveButtonClick = async () => {
        if (!calculatedPrice) {
            Swal.fire({ 
                title: "Please calculate the price first!", 
                icon: "warning" 
            });
            return;
        }

        if (!user.email) {
            Swal.fire({
                title: "You have to log in",
                text: "Please log in for reservation",
                icon: "info",
                showConfirmButton: true
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate("/login")
                }
            });
            return;
        }

        if (selectedLocation === "") {
            Swal.fire({ title: "Please choose a rental location!", icon: "warning" });
                return;
            }

        // Show terms and conditions popup
        const termsResult = await Swal.fire({
            title: 'Terms and Conditions',
            html: `
                <div style="text-align: left; max-height: 300px; overflow-y: auto; padding: 10px;">
                    <h4>Car Rental Terms and Conditions</h4>
                    
                    <h5>1. Driver Requirements</h5>
                    <ul>
                        <li>Must be at least 21 years old</li>
                        <li>Must have a valid driver's license</li>
                        <li>Must have a clean driving record</li>
                    </ul>

                    <h5>2. Payment and Fees</h5>
                    <ul>
                        <li>Full payment required at time of reservation</li>
                        <li>Security deposit required</li>
                        <li>Additional fees for late returns</li>
                    </ul>

                    <h5>3. Vehicle Use</h5>
                    <ul>
                        <li>Vehicle must be used only for intended purpose</li>
                        <li>No smoking in the vehicle</li>
                        <li>No unauthorized drivers</li>
                    </ul>

                    <h5>4. Insurance</h5>
                    <ul>
                        <li>Basic insurance included</li>
                        <li>Additional coverage available</li>
                        <li>Customer responsible for damages not covered</li>
                    </ul>

                    <h5>5. Cancellation Policy</h5>
                    <ul>
                        <li>Free cancellation up to 24 hours before pickup</li>
                        <li>50% charge for cancellations within 24 hours</li>
                        <li>No refund for no-shows</li>
                    </ul>

                    <h5>6. Vehicle Return</h5>
                    <ul>
                        <li>Vehicle must be returned with same fuel level</li>
                        <li>Vehicle must be returned in clean condition</li>
                        <li>Late returns subject to additional charges</li>
                    </ul>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'I Accept',
            cancelButtonText: 'I Decline',
            width: '600px'
        });

        if (!termsResult.isConfirmed) {
            return;
        }

        // Show payment modal instead of processing reservation directly
        setShowPaymentModal(true);
    };

    return (
        <div id="car-detail" style={{ clear: "both" }}>
            <Container className="py-4">
                <Row className="mb-5">
                    <Col>
                        {
                            isReservationTimerEnable &&
                            <h1 className="fs-1 text-center text-uppercase">Complete your reservation in <b>{timerToString()}</b></h1>
                        }
                    </Col>
                </Row>
                {
                    cars && brands && models && locations
                        ?
                        <>
                            <Row className="mb-4">
                                <Col xs={12} md={6}>
                                    <LazyLoadImage
                                        src={cars[carId].image}
                                        className="img-fluid"
                                        effect="blur"
                                        alt={`${carBrand} / ${carModel}`}
                                    />
                                </Col>
                                <Col xs={12} md={6}>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item variant="secondary" action>
                                            <BsFillCarFrontFill size="2em" className="me-2" style={{ marginTop: "-10px" }} />
                                            <span className="fs-6">Brand & Model:</span> &nbsp;
                                            <span className="fs-5 fw-bold">{`${carBrand} / ${carModel}`}</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item action>
                                            <TbEngine size="2em" className="me-2" style={{ marginTop: "-8px" }} />
                                            <span className="fs-6">HP:</span> &nbsp;
                                            <span className="fs-5 fw-bold">{cars[carId].power}</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item action>
                                            <PiEngineFill size="2em" className="me-2" style={{ marginTop: "-8px" }} />
                                            <span className="fs-6">Engine Size:</span> &nbsp;
                                            <span className="fs-5 fw-bold">{cars[carId].engineSize}</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item action>
                                            <TbManualGearbox size="2em" className="me-2" style={{ marginTop: "-8px" }} />
                                            <span className="fs-6">Gear Box:</span> &nbsp;
                                            <span className="fs-5 fw-bold">{cars[carId].gearbox}</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item action>
                                            <BsCarFront size="2em" className="me-2" style={{ marginTop: "-10px" }} />
                                            <span className="fs-6">Body Type:</span> &nbsp;
                                            <span className="fs-5 fw-bold">{cars[carId].bodyType}</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item action>
                                            <BsFillFuelPumpFill size="2em" className="me-2" style={{ marginTop: "-10px" }} />
                                            <span className="fs-6">Fuel Type:</span> &nbsp;
                                            <span className="fs-5 fw-bold">{cars[carId].fuelType}</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item action>
                                            <span className="fs-6">Rental Price:</span> &nbsp;
                                            <span className="fs-5 fw-bold">₹{cars[carId].rental_price ? cars[carId].rental_price.toLocaleString('en-IN') : '0'}/day</span>
                                        </ListGroup.Item>
                                    </ListGroup>

                                    <div className="text-end">
                                        <span className={`text-secondary fst-italic ${cars[carId].carCount > 0 ? "text-success" : "text-danger"}`}>
                                            Available Stock: {cars[carId].carCount}
                                        </span>
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12} md={6}>
                                    <Form>
                                        <Row>
                                            <Col xs={12} md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Rental Location</Form.Label>
                                                    <Form.Select
                                                        value={selectedLocation}
                                                        onChange={e => setSelectedLocation(e.target.value)}
                                                    >
                                                        <option value="">Select Rental Location</option>
                                                        {
                                                            cars[carId].availableLocations.map(locationId => {
                                                                const [cityId, branchId] = locationId.split('-');
                                                                const city = locations[cityId] || {};
                                                                const branch = city.branches ? city.branches[branchId] || {} : {};
                                                                return (
                                                                    <option key={`location_${locationId}`} value={locationId}>
                                                                        {city.name || ''} - {branch.name || ''}
                                                                </option>
                                                                );
                                                            })
                                                        }
                                                    </Form.Select>
                                                </Form.Group>
                                                {selectedLocation && (() => {
                                                    const [cityId, branchId] = selectedLocation.split('-');
                                                    const city = locations[cityId] || {};
                                                    const branch = city.branches ? city.branches[branchId] || {} : {};
                                                    return branch.name ? (
                                                        <Card className="mt-2">
                                                            <Card.Body>
                                                                <h5>Branch Details</h5>
                                                                <p className="mb-1"><strong>Address:</strong> {branch.address || 'N/A'}</p>
                                                                <p className="mb-1"><strong>PIN Code:</strong> {branch.pinCode || 'N/A'}</p>
                                                                <p className="mb-1"><strong>Phone:</strong> {branch.phone || 'N/A'}</p>
                                                                <p className="mb-1"><strong>Email:</strong> {branch.email || 'N/A'}</p>
                                                            </Card.Body>
                                                        </Card>
                                                    ) : null;
                                                })()}
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col xs={12} md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Start Date</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={rentDate.start}
                                                        min={getDateByInputFormat()}
                                                        onChange={e => {
                                                            setRentDate(prev => ({ ...prev, start: e.target.value }));
                                                            setCalculatedPrice(null);
                                                        }}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col xs={12} md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>End Date</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={rentDate.end}
                                                        min={rentDate.start}
                                                        onChange={e => {
                                                            setRentDate(prev => ({ ...prev, end: e.target.value }));
                                                            setCalculatedPrice(null);
                                                        }}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col xs={12} md={6}>
                                                <Button 
                                                    variant="info" 
                                                    className="w-100"
                                                    onClick={calculateTotalPrice}
                                                    disabled={!rentDate.start || !rentDate.end}
                                                >
                                                    Calculate Price
                                                </Button>
                                            </Col>
                                            <Col xs={12} md={6}>
                                                {calculatedPrice !== null && (
                                                    <div className="alert alert-info mb-0 text-center">
                                                        <strong>Total Price: ₹{calculatedPrice.toLocaleString('en-IN')}</strong>
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col>
                                                <Button
                                                    ref={reserveButtonRef}
                                                    variant="success"
                                                    className="w-100"
                                                    onClick={handleReserveButtonClick}
                                                    disabled={!isReservationTimerEnable || cars[carId].carCount === 0 || calculatedPrice === null}
                                                >
                                                    Reserve Now!
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Col>
                            </Row>
                        </>
                        :
                        loadingContent
                }
            </Container>

            {/* Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Payment Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-4">
                        <h5>Select Payment Method</h5>
                        <div className="d-flex gap-3">
                            <Button
                                variant={selectedPaymentMethod === 'card' ? 'primary' : 'outline-primary'}
                                className="d-flex align-items-center gap-2"
                                onClick={() => handlePaymentMethodSelect('card')}
                            >
                                <FaCreditCard /> Credit Card
                            </Button>
                            <Button
                                variant={selectedPaymentMethod === 'phone' ? 'primary' : 'outline-primary'}
                                className="d-flex align-items-center gap-2"
                                onClick={() => handlePaymentMethodSelect('phone')}
                            >
                                <FaPhoneAlt /> Phone Payment
                            </Button>
                        </div>
                    </div>

                    {selectedPaymentMethod === 'card' && (
                        <div className="payment-form">
                            <Form.Group className="mb-3">
                                <Form.Label>Card Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    value={paymentDetails.cardNumber}
                                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                                    maxLength={19}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Cardholder Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="John Doe"
                                    value={paymentDetails.cardName}
                                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardName: e.target.value }))}
                                />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Expiry Date</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="MM/YY"
                                            value={paymentDetails.expiryDate}
                                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                                            maxLength={5}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>CVV</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="123"
                                            value={paymentDetails.cvv}
                                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                                            maxLength={4}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {selectedPaymentMethod === 'phone' && (
                        <div className="payment-form">
                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="tel"
                                    placeholder="Enter 10-digit phone number"
                                    value={paymentDetails.phoneNumber}
                                    onChange={(e) => {
                                        // Only allow digits and limit to 10 characters
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setPaymentDetails(prev => ({ ...prev, phoneNumber: value }));
                                    }}
                                    maxLength={10}
                                    pattern="\d{10}"
                                    title="Please enter a 10-digit phone number"
                                />
                                <Form.Text className="text-muted">
                                    Enter a 10-digit phone number without spaces or special characters
                                </Form.Text>
                            </Form.Group>
                        </div>
                    )}

                    <div className="text-center mt-4">
                        <h4>Total Amount: ₹{calculatedPrice ? calculatedPrice.toLocaleString('en-IN') : '0'}</h4>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handlePaymentSubmit}
                        disabled={isProcessingPayment}
                    >
                        {isProcessingPayment ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Processing...
                            </>
                        ) : (
                            'Pay Now'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
};

export default CarDetail;