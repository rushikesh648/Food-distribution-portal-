import React, { useState, useEffect } from 'react';
import { Truck, Send, AlertCircle, CheckCircle, Package, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, setLogLevel } from 'firebase/firestore';

// Set Firebase log level for debugging
setLogLevel('debug');

// Mock list of available items for the form dropdown (should ideally sync with Inventory collection)
const MOCK_INVENTORY_ITEMS = [
    'Canned Beans', 
    'Fresh Produce Mix', 
    'Dry Pasta', 
    'Dairy (UHT Milk)',
    'Rice',
    'Cereal',
];

// --- MAIN APP COMPONENT ---
export default function App() {
    // Firebase and Auth State
    const [db, setDb] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // Form State
    const [organizationName, setOrganizationName] = useState('');
    const [requestedItem, setRequestedItem] = useState(MOCK_INVENTORY_ITEMS[0]);
    const [amount, setAmount] = useState(10);
    const [contactEmail, setContactEmail] = useState('');
    
    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error'

    // Canvas Globals (Must be used)
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    
    // 1. Initialize Firebase and Authenticate
    useEffect(() => {
        if (!firebaseConfig) {
            console.error("Firebase config not available. Cannot initialize app.");
            return;
        }

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authentication = getAuth(app);
        
        setDb(firestore);

        const unsubscribe = onAuthStateChanged(authentication, async (user) => {
            if (!user) {
                // Sign in anonymously for public data creation
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(authentication, initialAuthToken);
                    } else {
                        await signInAnonymously(authentication);
                    }
                } catch (error) {
                    console.error("Authentication failed:", error);
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, [initialAuthToken, firebaseConfig]);

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!db || !isAuthReady) {
            setSubmissionStatus('error');
            return console.error("Database not ready or user not authenticated.");
        }

        setIsSubmitting(true);
        setSubmissionStatus(null);

        const newRequest = {
            organization: organizationName,
            item: requestedItem,
            amount: parseInt(amount),
            contactEmail: contactEmail,
            status: 'Pending', // New requests always start as Pending
            requestedDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            timestamp: new Date().toISOString()
        };

        const requestsCollectionPath = `artifacts/${appId}/public/data/requests`;

        try {
            await addDoc(collection(db, requestsCollectionPath), newRequest);
            setSubmissionStatus('success');
            // Clear form
            setOrganizationName('');
            setAmount(10);
            setContactEmail('');
            console.log("Request submitted successfully.");
        } catch (error) {
            console.error("Error submitting request: ", error);
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-indigo-50 p-4 sm:p-8 font-sans flex items-center justify-center">
            <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl border-t-8 border-indigo-600">
                <header className="mb-8 text-center">
                    <Truck className="w-10 h-10 mx-auto text-indigo-600 mb-3" />
                    <h1 className="text-3xl font-bold text-gray-900">
                        Food Resource Request Form
                    </h1>
                    <p className="text-md text-gray-500 mt-2">
                        Submit a resource request for your community organization.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">Organization Name</label>
                        <input
                            type="text"
                            id="organizationName"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    
                     <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Contact Email</label>
                        <input
                            type="email"
                            id="contactEmail"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="requestedItem" className="block text-sm font-medium text-gray-700">Requested Item</label>
                            <select
                                id="requestedItem"
                                value={requestedItem}
                                onChange={(e) => setRequestedItem(e.target.value)}
                                required
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm"
                            >
                                {MOCK_INVENTORY_ITEMS.map(item => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Quantity (units)</label>
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                required
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {submissionStatus === 'success' && (
                        <div className="p-3 rounded-md bg-green-50">
                            <div className="flex">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                <h3 className="ml-3 text-sm font-medium text-green-800">Request Submitted Successfully!</h3>
                            </div>
                        </div>
                    )}

                    {submissionStatus === 'error' && (
                        <div className="p-3 rounded-md bg-red-50">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <h3 className="ml-3 text-sm font-medium text-red-800">Error submitting request. Please try again.</h3>
                            </div>
                        </div>
                    )}
                    
                    {!isAuthReady && (
                         <div className="p-3 text-center text-sm text-indigo-600 bg-indigo-50 rounded-md">
                            <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                            Connecting to service...
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !isAuthReady}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Send Request
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
