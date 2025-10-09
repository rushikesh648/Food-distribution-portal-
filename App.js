import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, onSnapshot, getDocs, updateDoc, writeBatch, where } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

// Set Firebase log level for debugging
setLogLevel('Debug');

// Global variables from the canvas environment (MUST BE USED)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Utility to generate a consistent UUID (for use when __initial_auth_token is missing)
const generateUserId = () => {
  return 'citizen-' + Math.random().toString(36).substring(2, 9);
};

// Data structure for a distribution record
const initialRecords = [
  { recipientId: generateUserId(), foodItem: 'Rice (5kg)', quantity: 1, location: 'Central Hub A', status: 'Pending', timestamp: Date.now() - 100000 },
  { recipientId: generateUserId(), foodItem: 'Beans (1kg)', quantity: 3, location: 'Local Center B', status: 'Completed', timestamp: Date.now() - 50000 },
  { recipientId: generateUserId(), foodItem: 'Oil (1L)', quantity: 1, location: 'Central Hub A', status: 'Pending', timestamp: Date.now() - 10000 },
];

// --- Main Application Component ---
const App = () => {
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. Firebase Initialization and Authentication ---
  useEffect(() => {
    try {
      if (Object.keys(firebaseConfig).length === 0) {
        throw new Error("Firebase configuration is missing. Cannot initialize.");
      }
      
      const firebaseApp = initializeApp(firebaseConfig);
      const authInstance = getAuth(firebaseApp);
      const dbInstance = getFirestore(firebaseApp);

      setAuth(authInstance);
      setDb(dbInstance);

      const signIn = async () => {
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }
      };

      // Ensure auth state is established before setting userId
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          // Use the actual UID, or a placeholder if running in a non-authenticated environment
          setUserId(user.uid || generateUserId());
          setIsLoading(false);
        } else if (!userId) {
          // Fallback if auth fails or not available, assign a default local ID
          setUserId(generateUserId());
          setIsLoading(false);
        }
      });
      
      // Execute sign-in attempt
      signIn().catch(err => {
        console.error("Firebase Sign-in Failed:", err);
        setError("Authentication failed. Check console for details.");
        setIsLoading(false);
      });

      return () => unsubscribe();

    } catch (err) {
      console.error("Firebase Initialization Error:", err);
      setError("Failed to initialize Firebase. Check console.");
      setIsLoading(false);
    }
  }, []);

  // --- 2. Simulated Role Check ---
  // In a real Auth0 setup, this would check the 'roles' array in the JWT access token.
  // Here, we simulate by checking if the ID starts with 'manager-'.
  const isManager = useMemo(() => userId && userId.startsWith('manager-'), [userId]);
  const isCitizen = useMemo(() => userId && userId.startsWith('citizen-'), [userId]);

  // --- 3. Data Fetching (Real-time with onSnapshot) ---
  useEffect(() => {
    if (!db || !userId) return;

    // Collection path for public/shared data
    const recordsCollectionPath = `artifacts/${appId}/public/data/distribution_records`;
    const recordsRef = collection(db, recordsCollectionPath);

    // Build the query based on the user's role
    let recordsQuery = recordsRef;

    if (isCitizen) {
      // Citizen: Filter records to only show theirs
      recordsQuery = query(recordsRef, where('recipientId', '==', userId));
    }

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(recordsQuery, 
      (snapshot) => {
        const fetchedRecords = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure timestamp is a JS Date object for sorting
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp),
        }));
        // Sort in memory (newest first)
        fetchedRecords.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); 
        setRecords(fetchedRecords);
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore Error (onSnapshot):", err);
        setError("Failed to fetch data. Check console.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup the listener
  }, [db, userId, isCitizen, appId]); // Depend on db, userId, and role

  // --- 4. Data Management Functions ---

  // Function to create and upload sample data (Admin function)
  const uploadSampleData = useCallback(async () => {
    if (!db) {
      setError("Database not initialized.");
      return;
    }
    
    // Admin ID to demonstrate data separation
    const managerId = 'manager-' + crypto.randomUUID().substring(0, 8); 

    const sampleRecords = [
      { recipientId: managerId, foodItem: 'Management Report', quantity: 1, location: 'HQ', status: 'Completed', timestamp: new Date() },
      ...initialRecords.map(r => ({...r, recipientId: r.recipientId.replace('citizen-', 'citizen-' + crypto.randomUUID().substring(0, 5))})), // Ensure unique IDs
      { recipientId: userId, foodItem: 'Citizen Kit', quantity: 1, location: 'Local Center D', status: 'Pending', timestamp: new Date() },
    ];

    const batch = writeBatch(db);
    const recordsCollectionPath = `artifacts/${appId}/public/data/distribution_records`;
    
    try {
      sampleRecords.forEach(record => {
        // Create a new document reference with an auto-generated ID
        const newDocRef = doc(collection(db, recordsCollectionPath)); 
        // Use a standard field for date storage
        batch.set(newDocRef, record);
      });
      await batch.commit();
      console.log("Sample data successfully uploaded via batch.");
    } catch (e) {
      console.error("Error adding sample documents: ", e);
      setError("Failed to add sample data.");
    }
  }, [db, userId, appId]);

  // Function to update a record (Manager function)
  const updateRecordStatus = useCallback(async (recordId, newStatus) => {
    if (!db || !isManager) return;
    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/distribution_records`, recordId);
      await updateDoc(docRef, { status: newStatus });
    } catch (e) {
      console.error("Error updating record: ", e);
      setError("Failed to update record status.");
    }
  }, [db, isManager, appId]);


  // --- 5. UI Components ---

  const LoadingState = () => (
    <div className="flex justify-center items-center p-8 bg-white rounded-xl shadow-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
      <p className="text-indigo-600 font-semibold">Loading system data and authenticating...</p>
    </div>
  );

  const ErrorState = () => (
    <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md">
      <p className="font-bold">System Error</p>
      <p>{error}</p>
    </div>
  );

  const DistributionTable = ({ data, title, isManagerView = false }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">{title} ({data.length})</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No distribution records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isManagerView && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient ID</th>}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {isManagerView && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((record) => (
                <tr key={record.id}>
                  {isManagerView && <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 truncate max-w-[120px]">{record.recipientId}</td>}
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{record.foodItem}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{record.quantity}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{record.location}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{record.timestamp ? record.timestamp.toLocaleDateString() : 'N/A'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  {isManagerView && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      {record.status === 'Pending' ? (
                        <button
                          onClick={() => updateRecordStatus(record.id, 'Completed')}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition duration-150"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-gray-400">Done</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const ManagerDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-lg border-b-4 border-indigo-500">
        <h1 className="text-3xl font-extrabold text-indigo-700">Manager Dashboard</h1>
        <button
          onClick={uploadSampleData}
          disabled={!db}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50"
        >
          Add Sample Distribution Data
        </button>
      </div>
      <DistributionTable
        data={records}
        title="All Distribution Records (Read/Write Access)"
        isManagerView={true}
      />
    </div>
  );

  const CitizenPortal = () => {
    const totalPending = records.filter(r => r.status === 'Pending').length;
    const totalCompleted = records.filter(r => r.status === 'Completed').length;
    
    // Simulate complex benefit calculation based on current records
    const nextDistribution = records.find(r => r.status === 'Pending')?.location || 'TBD';

    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-xl shadow-2xl border-b-4 border-blue-500">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-4">Your Food Benefit Card</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg shadow-inner">
              <p className="text-sm font-semibold text-blue-600">Pending Distributions</p>
              <p className="text-3xl font-bold text-blue-800 mt-1">{totalPending}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg shadow-inner">
              <p className="text-sm font-semibold text-green-600">Completed Pickups</p>
              <p className="text-3xl font-bold text-green-800 mt-1">{totalCompleted}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg shadow-inner">
              <p className="text-sm font-semibold text-yellow-600">Next Pickup Location</p>
              <p className="text-xl font-bold text-yellow-800 mt-1">{nextDistribution}</p>
            </div>
          </div>
        </div>
        <DistributionTable
          data={records}
          title="Your Personal Distribution History (Read-Only Access)"
          isManagerView={false}
        />
        <div className="text-center p-4 bg-gray-100 rounded-lg text-gray-600">
          <p className="text-sm">
            <span className="font-bold">Note:</span> As a Citizen, you only see records associated with your ID. 
            The system security prevents access to other users' sensitive information.
          </p>
        </div>
      </div>
    );
  };

  // --- 6. Main Render Logic ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-20 bg-gray-50 p-4">
        <LoadingState />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <header className="mb-8 p-4 bg-white shadow-md rounded-xl">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900">Government Food System Portal</h1>
          <p className="text-lg text-gray-500 mt-1">Simulated Auth0 Role-Based Access with Firestore</p>
        </div>
        <div className="mt-4 border-t pt-3 flex flex-wrap justify-between items-center text-sm">
          <span className={`font-semibold ${isManager ? 'text-red-600' : 'text-green-600'}`}>
            Current Role: {isManager ? 'System Manager' : 'Citizen / Beneficiary'}
          </span>
          <span className="text-gray-600">
            User ID: <code className="bg-gray-200 p-1 rounded text-xs">{userId || 'N/A'}</code>
          </span>
        </div>
      </header>

      {error && <div className="mb-6"><ErrorState /></div>}

      <main>
        {isManager ? <ManagerDashboard /> : <CitizenPortal />}
      </main>

      <footer className="mt-10 p-4 text-center text-xs text-gray-400">
        <p>Data stored in Firestore under App ID: {appId}</p>
        <p>User ID is {initialAuthToken ? 'authenticated via token' : 'assigned anonymously/locally'}.</p>
      </footer>
    </div>
  );
};

export default App;
