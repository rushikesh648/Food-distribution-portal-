📦 Food Distribution PortalThis is a real-time portal for managing food inventory and distribution requests for community organizations. It is built using React for the frontend and Firebase Firestore for real-time data persistence.The application is split into two primary components:Internal Dashboard (FoodDistributionPortal.jsx): Used by warehouse staff to monitor inventory, approve requests, and decrement stock.Public Request Form (RequestSubmissionPortal.jsx): Used by external community organizations to submit new resource requests.🚀 Getting StartedPrerequisitesNode.js (LTS version)A Firebase project with Firestore enabled.Your Firebase configuration details.InstallationClone the Repository:git clone [https://github.com/rushikesh648/Food-distribution-portal-](https://github.com/rushikesh648/Food-distribution-portal-)
cd Food-distribution-portal-
Install Dependencies:npm install
Running the ApplicationThis application uses Canvas global variables for Firebase configuration. To run this locally, you must provide your own Firebase configuration.Note: For local development, you must replace the Canvas global variable usage with your actual Firebase config object:In both src/FoodDistributionPortal.jsx and src/RequestSubmissionPortal.jsx, you need to modify the initialization logic to use your real configuration:// REPLACE THIS:
// const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

// WITH THIS (using your actual config):
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    // ... rest of your config
};
Start the development server:npm start
To switch between the Dashboard and the Request Form, simply change the component rendered in your main src/App.js or entry file.💾 Firestore Data StructureBoth components interact with two public collections:Collection PathDescriptionExample Fieldsartifacts/[appId]/public/data/inventoryReal-time stock levels.item, quantity, unit, expiration, lastUpdatedartifacts/[appId]/public/data/requestsPending and processed community requests.organization, item, amount, status (Pending, Approved, Shipped), requestedDate
