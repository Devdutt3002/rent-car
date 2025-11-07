import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/features/UserSlice";

const UserDetails = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        customerName: "",
        address: "",
        mobileNo: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Get the current user from localStorage
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (!currentUser || !currentUser.userUID) {
                throw new Error("User not found");
            }

            // Update user document in Firestore
            const userRef = doc(db, "users", currentUser.id);
            await updateDoc(userRef, {
                customerName: formData.customerName,
                address: formData.address,
                mobileNo: formData.mobileNo,
                profileCompleted: true
            });

            // Update Redux store
            dispatch(setUser({
                ...currentUser,
                customerName: formData.customerName,
                address: formData.address,
                mobileNo: formData.mobileNo,
                profileCompleted: true
            }));

            setMessage({
                content: "Profile details saved successfully!",
                isError: false
            });

            // Redirect to home page after a short delay
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (error) {
            console.error("Error saving user details:", error);
            setMessage({
                content: "Error saving profile details. Please try again.",
                isError: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div id="user-details">
            <Container className="pt-4 pb-5">
                <Row className="mb-5">
                    <Col>
                        <h1 className="fs-1 text-center text-uppercase">Complete Your Profile</h1>
                        {message && (
                            <Alert variant={message.isError ? "danger" : "success"}>
                                {message.content}
                            </Alert>
                        )}
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Row className="justify-content-center">
                            <Col xs={12} md={8}>
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Full Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter your full name"
                                            name="customerName"
                                            value={formData.customerName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Enter your complete address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Mobile Number</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            placeholder="Enter 10-digit mobile number"
                                            name="mobileNo"
                                            value={formData.mobileNo}
                                            onChange={(e) => {
                                                // Only allow digits and limit to 10 characters
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                handleInputChange({
                                                    target: {
                                                        name: 'mobileNo',
                                                        value: value
                                                    }
                                                });
                                            }}
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            title="Please enter a valid 10-digit mobile number"
                                            required
                                        />
                                        <Form.Text className="text-muted">
                                            Enter a 10-digit mobile number without spaces or special characters
                                        </Form.Text>
                                    </Form.Group>

                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-100"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Saving..." : "Save Details"}
                                    </Button>
                                </Form>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default UserDetails; 