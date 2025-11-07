import { useState } from "react";
import { useDispatch } from "react-redux";
import { db, auth } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { clearUserData, setUser } from "../redux/features/UserSlice";

const useAuthentication = () => {

    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const signInCall = async ({email, password}) => {
        setIsLoading(true);
        try {
            const {user} = await signInWithEmailAndPassword(auth, email, password);

            const q = query(collection(db, "users"), where("userUID", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                throw new Error("User data not found in database");
            }
            
            const docData = querySnapshot.docs[0].data();
            const userData = {...user, ...docData};
            dispatch(setUser(userData));

            setMessage({
                content: "You are successfully logged in!",
                isError: false
            });
            
            return { success: true, role: docData.role };
        }
        catch (err) {
            console.error("Login error:", err);
            
            let errorMessage = "An error occurred during login. Please try again.";
            
            if (err.code === 'auth/user-not-found') {
                errorMessage = "No account exists with this email. Please check your email or sign up.";
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password. Please try again.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format. Please enter a valid email.";
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = "Too many failed login attempts. Please try again later.";
            }

            setMessage({
                content: errorMessage,
                isError: true
            });
            
            return { success: false, role: null };
        } finally {
            setIsLoading(false);
        }
    };

    const signUpCall = async ({email, password}) => {
        setIsLoading(true);

        try {
            // Create authentication user first
            const {user} = await createUserWithEmailAndPassword(auth, email, password);

            // Now that we're authenticated, we can access Firestore
            const userQuery = query(collection(db, "users"), where("email", "==", email));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
                // If user document exists, delete the auth account and throw error
                await deleteUser(user);
                throw new Error("auth/email-already-registered");
            }

            const docData = {
                userUID: user.uid,
                email: email,
                role: email === "pramod@gmail.com" ? "admin" : "user",
                createdAt: new Date().toISOString()
            };

            // Add the document and get its reference
            const docRef = await addDoc(collection(db, "users"), docData);
            
            // Add the document ID to the user data
            const userData = {...user, ...docData, id: docRef.id};
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update Redux store
            dispatch(setUser(userData));

            setMessage({
                content: "You are successfully signed up!",
                isError: false
            });

            // Return both success status and user role for navigation
            return { success: true, role: docData.role };
        }
        catch (err) {
            console.error("Signup error:", err);
            
            let errorMessage = "An error occurred during signup. Please try again.";
            
            if (err.code === 'auth/email-already-in-use' || err.message === 'auth/email-already-registered') {
                errorMessage = "This email is already registered. Please use a different email or login.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format. Please enter a valid email.";
            } else if (err.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. Please use at least 6 characters.";
            } else if (err.code === 'auth/operation-not-allowed') {
                errorMessage = "Email/password accounts are not enabled. Please contact support.";
            }

            setMessage({
                content: errorMessage,
                isError: true
            });
            
            return { success: false, role: null };
        } finally {
            setIsLoading(false);
        }
    };

    const signOutCall = async () => {

        setIsLoading (true);

        try {
            await signOut (auth);
            dispatch(clearUserData());

            setMessage({
                content: "You are successfully logged out!",
                isError: false
            });
        }
        catch (err) {
            console.log(err);

            setMessage({
                content: err,
                isError: true
            });
        }
        finally {
            setIsLoading (false);
        }
    };

    return {isLoading, message, signInCall, signUpCall, signOutCall};
}

export default useAuthentication;