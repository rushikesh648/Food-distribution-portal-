import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck, Users, Activity, CheckCircle, Clock, Save, Loader2, Database, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, updateDoc, onSnapshot, collection, query, writeBatch, getDocs, setLogLevel } from 'firebase/firestore';

// Set Firebase log level for debugging
setLogLevel('debug');

// Utility function to determine status color
const getStatusColor = (status) => {
    switch (status) {
        case 'Approved': return 'bg-teal-100 text-teal-700 border-teal-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        case 'Shipped': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
        case 'Low Stock': return 'bg-red-100 text-red-700 border-red-300';
        default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
};

// --- COMPONENTS ---

// 1. Stat Card Component
const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border-t-4 ${color} transform transition duration-300 hover:shadow-xl`}>
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color.replace('-t-4 border', 'bg').replace('-500', '-600')} text-white bg-opacity-90`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    </div>
);

// 2. Inventory Table Component
const InventoryTable = ({ inventory, db, userId, appId, isAuthReady }) => {
    const handleUpdateStock = async (itemId) => {
        if (!db || !isAuthReady) return console.error("Database not ready or user not authenticated.");
        
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        // Simple mock update logic: increase stock by 10
        const newQuantity = item.quantity + 10;
        
        try {
            const itemRef = doc(db, `artifacts/${appId}/public/data/inventory`, itemId);
            await updateDoc(itemRef, {
                quantity: newQuantity,
                lastUpdated: new Date().toISOString()
            });
            console.log(`Stock updated for ${item.item}. New quantity: ${newQuantity}`);
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    };

    return (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-600" /> Current Inventory Stock
            </h2>
            <div className="overflow-x-auto flex-grow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.map((item) => {
                            const isLowStock = item.quantity < 50;
                            return (
                                <tr key={item.id} className={`hover:bg-indigo-50 transition duration-150 ${isLowStock ? 'bg-red-50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.quantity} {item.unit}
                                        {isLowStock && (
                                            <span className={`inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor('Low Stock')}`}>
                                                <AlertTriangle className="w-3 h-3 mr-1" /> Low
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                            new Date(item.expiration) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days near expiry
                                            ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {item.expiration}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button 
                                            onClick={() => handleUpdateStock(item.id)}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                            disabled={!isAuthReady}
                                        >
                                            <Save className="w-4 h-4 mr-1" /> Add 10 {item.unit}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!inventory.length && (
                 <p className="text-center py-12 text-gray-500">No inventory items found. Add some to the database!</p>
            )}
        </div>
    );
};

// 3. Request Manager Component (New Logic)
const RequestManager = ({ requests, inventory, db, appId, isAuthReady }) => {
    
    // Function to handle status updates and inventory decrement (using a batch write)
    const handleStatusUpdate = async (requestId, requestItem, requestAmount, newStatus) => {
        if (!db || !isAuthReady) return console.error("Database not ready.");

        const batch = writeBatch(db);
        const requestRef = doc(db, `artifacts/${appId}/public/data/requests`, requestId);
        
        batch.update(requestRef, {
            status: newStatus,
            processedBy: newStatus !== 'Pending' ? new Date().toISOString() : null
        });

        // If the request is being SHIPPED, we must update the inventory
        if (newStatus === 'Shipped') {
            const inventoryItem = inventory.find(i => i.item === requestItem);
            
            if (!inventoryItem) {
                console.error(`Inventory item not found for ${requestItem}. Cannot ship.`);
                return; // Prevent shipping if inventory item doesn't exist
            }

            const newQuantity = inventoryItem.quantity - requestAmount;
            
            if (newQuantity < 0) {
                 // In a real app, this would trigger an error modal, not just a console log
                console.error(`Insufficient stock to ship ${requestAmount} units of ${requestItem}. Only ${inventoryItem.quantity} available.`);
                return;
            }

            const inventoryRef = doc(db, `artifacts/${appId}/public/data/inventory`, inventoryItem.id);
            
            batch.update(inventoryRef, {
                quantity: newQuantity,
                lastUpdated: new Date().toISOString()
            });
        }
        
        try {
            await batch.commit();
            console.log(`Request ${requestId} status updated to ${newStatus}. Inventory adjusted (if shipped).`);
        } catch (error) {
            console.error("Error committing batch update (status/inventory): ", error);
        }
    };


    return (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-teal-600" /> Manage Distribution Requests
            </h2>
            <div className="overflow-y-auto flex-grow space-y-4">
                {requests.map((request) => {
                    const inventoryItem = inventory.find(i => i.item === request.item);
                    const isShippable = inventoryItem && inventoryItem.quantity >= request.amount;
                    
                    return (
                        <div key={request.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition duration-150" style={{borderColor: getStatusColor(request.status).split(' ')[3]}}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-lg font-semibold text-indigo-600">{request.organization}</p>
                                    <p className="text-sm text-gray-700 mt-1">
                                        Needs <span className="font-bold">{request.amount}</span> units of <span className="font-bold">{request.item}</span>
                                    </p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                                    {request.status}
                                </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                                
                                {request.status === 'Pending' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(request.id, request.item, request.amount, 'Approved')}
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                                        disabled={!isAuthReady}
                                    >
                                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                    </button>
                                )}

                                {request.status === 'Approved' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(request.id, request.item, request.amount, 'Shipped')}
                                        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white ${isShippable ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                        disabled={!isAuthReady || !isShippable}
                                        title={isShippable ? "Ship this request" : `Not enough stock (Available: ${inventoryItem.quantity || 0})`}
                                    >
                                        <Truck className="w-3 h-3 mr-1" /> Ship
                                    </button>
                                )}

                                {(request.status === 'Approved' || request.status === 'Shipped') && (
                                     <button 
                                        onClick={() => handleStatusUpdate(request.id, request.item, request.amount, 'Pending')}
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                        disabled={!isAuthReady}
                                    >
                                        <RefreshCw className="w-3 h-3 mr-1" /> Reset
                                    </button>
                                )}
                            </div>
                            {!isShippable && request.status === 'Approved' && (
                                <p className="text-xs text-red-500 mt-2">⚠️ Cannot ship: Insufficient stock of {request.item}.</p>
                            )}
                        </div>
                    );
                })}
            </div>
            {!requests.length && (
                 <p className="text-center py-12 text-gray-500">No pending requests at this time. All clear!</p>
            )}
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
    // Firebase and Auth State
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // Application Data State
    const [inventory, setInventory] = useState([]);
    const [requests, setRequests] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

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
        setAuth(authentication);

        const unsubscribe = onAuthStateChanged(authentication, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // If not signed in via custom token, sign in anonymously
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(authentication, initialAuthToken);
                    } else {
                        await signInAnonymously(authentication);
                    }
                    setUserId(authentication.currentUser?.uid || crypto.randomUUID());
                } catch (error) {
                    console.error("Authentication failed:", error);
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, [initialAuthToken, firebaseConfig]);

    // 2. Real-time Data Listeners
    useEffect(() => {
        if (!db || !isAuthReady) return;

        // Collection path for public, shared data: artifacts/{appId}/public/data/{collectionName}
        const inventoryCollectionPath = `artifacts/${appId}/public/data/inventory`;
        const requestsCollectionPath = `artifacts/${appId}/public/data/requests`;

        // Inventory Listener
        const unsubInventory = onSnapshot(collection(db, inventoryCollectionPath), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInventory(data);
            console.log("Inventory data updated:", data);
            
            // If the collection is empty, seed initial data (optional, for first run)
            if (data.length === 0) {
                 seedInitialData(db, appId);
            }
        }, (error) => {
            console.error("Error fetching inventory data:", error);
        });

        // Requests Listener
        const unsubRequests = onSnapshot(collection(db, requestsCollectionPath), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(data);
            console.log("Requests data updated:", data);
        }, (error) => {
             console.error("Error fetching requests data:", error);
        });

        return () => {
            unsubInventory();
            unsubRequests();
        };
    }, [db, isAuthReady, appId]);


    // Seed function to ensure there is data on first run
    const seedInitialData = async (firestore, appId) => {
        const initialData = [
            { item: 'Canned Beans', quantity: 450, unit: 'cases', expiration: '2026-08-01', lastUpdated: new Date().toISOString() },
            { item: 'Fresh Produce Mix', quantity: 120, unit: 'crates', expiration: '2025-10-15', lastUpdated: new Date().toISOString() },
            { item: 'Dry Pasta', quantity: 600, unit: 'boxes', expiration: '2027-01-20', lastUpdated: new Date().toISOString() },
            { item: 'Dairy (UHT Milk)', quantity: 30, unit: 'gallons', expiration: '2025-11-05', lastUpdated: new Date().toISOString() }, // Low stock item
        ];
        
        const initialRequests = [
            { organization: 'Community Shelter A', item: 'Canned Beans', amount: 50, status: 'Pending', requestedDate: '2025-10-08' },
            { organization: 'Food Bank Central', item: 'Dry Pasta', amount: 100, status: 'Approved', requestedDate: '2025-10-07' },
        ];

        const inventoryRef = collection(firestore, `artifacts/${appId}/public/data/inventory`);
        const requestsRef = collection(firestore, `artifacts/${appId}/public/data/requests`);
        
        try {
            await Promise.all(initialData.map(data => addDoc(inventoryRef, data)));
            await Promise.all(initialRequests.map(data => addDoc(requestsRef, data)));
            console.log("Initial data seeded successfully.");
        } catch (e) {
            console.error("Error seeding initial data:", e);
        }
    };


    // 3. Update time clock every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Derived State for Stats
    const totalInventoryUnits = useMemo(() => 
        inventory.reduce((sum, item) => sum + item.quantity, 0),
        [inventory]
    );

    const pendingRequests = useMemo(() => 
        requests.filter(r => r.status === 'Pending').length,
        [requests]
    );
    
    const lowStockItems = useMemo(() => 
        inventory.filter(r => r.quantity < 50).length,
        [inventory]
    );


    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                    <Truck className="w-8 h-8 mr-3 text-indigo-600" />
                    Distribution Portal Dashboard
                </h1>
                <p className="text-md text-gray-600 mt-2">
                    Real-time overview of food inventory and community requests.
                </p>
               
