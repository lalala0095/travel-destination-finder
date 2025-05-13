import React, { useState } from 'react';
// Assuming Tailwind CSS is configured in your Vite project

// Define a type for the metadata, since keys are dynamic
type DestinationMetadata = {
  [key: string]: string; // Metadata keys are strings, values are strings
};

// Define a type for a single destination object based on your JSON structure
type Destination = {
  name: string;
  metadata: DestinationMetadata;
  images: string[]; // Array of image URLs
};

// Define a type for the API response structure
type ApiResponse = {
  message: Destination[]; // The main list of destinations is under the 'message' key
};


function App() {
  // State to store the user's prompt input
  const [prompt, setPrompt] = useState('');
  // State to store the fetched recommendations
  const [recommendations, setRecommendations] = useState<Destination[] | null>(null);
  // State to manage loading status
  const [isLoading, setIsLoading] = useState(false);
  // State to manage potential errors
  const [error, setError] = useState<string | null>(null);
  // State to track failed image URLs using a Set for efficient lookups
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());


  // Placeholder text for the textarea
  const placeholderText = "Describe your ideal trip, preferences, interests, and any specific requirements (e.g., 'Looking for nature destinations in Bulacan with hiking trails and good photo spots', 'Suggest historical places near me for a day trip'). Be as detailed as possible!";

  // Function to handle the button click and send the API request
  const handleGetRecommendations = async () => {
    // Clear previous results and errors, and failed images
    setRecommendations(null);
    setError(null);
    setFailedImageUrls(new Set()); // Clear failed images on new search
    setIsLoading(true); // Set loading state to true

    try {
      // Make the POST request to your FastAPI backend
      const response = await fetch('https://parish-toolbox-mats-through.trycloudflare.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Specify that we are sending JSON
        },
        // Send the prompt as the raw request body (as a JSON string literal)
        body: JSON.stringify(prompt),
      });

      // Check if the response is successful (status code 2xx)
      if (!response.ok) {
        // If the response is not ok, throw an error with the status
        const errorText = await response.text(); // Get error details from response body
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      // Parse the JSON response
      const data: ApiResponse = await response.json();

      // Update the state with the recommendations from the 'message' key
      if (data && data.message && Array.isArray(data.message)) {
         setRecommendations(data.message);
      } else {
         setError("Received unexpected data format from the API.");
         console.error("API Response Data:", data); // Log the unexpected data
      }


    } catch (err: any) {
      // Catch any errors during the fetch or processing
      console.error("Error fetching recommendations:", err);
      setError(`Failed to fetch recommendations: ${err.message}`);
    } finally {
      setIsLoading(false); // Set loading state back to false
    }
  };

  // Function to handle image loading errors
  const handleImageError = (imageUrl: string) => {
    // Add the failed image URL to the set
    setFailedImageUrls(prev => new Set(prev).add(imageUrl));
  };


  return (
    // Use Tailwind classes for layout and styling
    // Increased horizontal padding (px-6) and slightly wider max width (max-w-xl)
    // Added vertical padding (py-8) for more space at the top/bottom
    <div className="bg-gray-100 min-h-screen flex items-center justify-center px-4 py-8 font-sans">
      {/* Increased padding (p-8 -> p-10) and wider max width (max-w-lg -> max-w-2xl) */}
      {/* Added more vertical margin below title (mb-6 -> mb-8) */}
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-4xl">
        {/* Application Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center"> {/* Slightly larger text */}
          Travel Buddy AI
        </h1>

        {/* Prompt Text Area */}
        <textarea
          id="user-prompt"
          className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-48" // Used Tailwind h-48 (192px) for height
          placeholder={placeholderText}
          rows={8} // Specify initial number of rows
          value={prompt} // Bind textarea value to state
          onChange={(e) => setPrompt(e.target.value)} // Update state on change
          disabled={isLoading} // Disable textarea while loading
        ></textarea>

        {/* Button to submit the prompt */}
        <button
          id="submit-prompt"
          className={`mt-6 text-white py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out text-lg ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} mx-auto block`}
          onClick={handleGetRecommendations} // Add click handler
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
        </button>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-4 text-center text-blue-600">
            Loading...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-center text-red-600">
            Error: {error}
          </div>
        )}

        {/* Results Area */}
        {/* Show this section only if recommendations are available */}
        {recommendations && recommendations.length > 0 && (
          <div id="results-area" className="mt-8 border-t pt-8 border-gray-200"> {/* Increased top margin and padding */}
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recommendations:</h2> {/* Slightly larger text and more bottom margin */}
            {/* Map over the recommendations array to display each destination */}
            {recommendations.map((destination, index) => (
              <div key={index} className="mb-10 p-6 border border-gray-200 rounded-lg shadow-sm"> {/* Increased bottom margin and padding, slightly more rounded corners */}
                <h3 className="text-xl font-bold text-gray-700 mb-3">{destination.name}</h3> {/* Slightly larger text and more bottom margin */}

                {/* Display Metadata */}
                <div className="mb-6"> {/* Increased bottom margin */}
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">Details:</h4> {/* Slightly larger text and more bottom margin */}
                  {/* Map over the metadata key-value pairs */}
                  {Object.entries(destination.metadata).map(([key, value]) => (
                    <p key={key} className="text-gray-700 text-base mb-2"> {/* Slightly larger text and more bottom margin */}
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                    </p>
                  ))}
                </div>

                {/* Display Images (Gallery Viewer) */}
                {destination.images && destination.images.length > 0 && (
                  <div className="mt-6"> {/* Increased top margin */}
                    <h4 className="text-lg font-semibold text-gray-600 mb-3">Images:</h4> {/* Slightly larger text and more bottom margin */}
                    {/* Adjusted gap and grid columns for slightly larger images */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {destination.images.map((imageUrl, imgIndex) => (
                        // Conditionally render the image container ONLY if the URL is NOT in the failedImageUrls set
                        !failedImageUrls.has(imageUrl) && (
                          // Wrap the image div in an anchor tag
                          <a
                            key={imgIndex}
                            href={imageUrl} // Set the link to the image URL
                            target="_blank" // Open in a new tab
                            rel="noopener noreferrer" // Security best practice for target="_blank"
                            className="block w-full h-32 overflow-hidden rounded-md border border-gray-300 hover:border-blue-500 transition duration-200 ease-in-out" // Added block and hover effect
                          >
                            <img
                              src={imageUrl}
                              alt={`${destination.name} image ${imgIndex + 1}`}
                              className="w-full h-full object-cover" // object-cover to maintain aspect ratio
                              // Call the handler on error
                              onError={() => handleImageError(imageUrl)}
                            />
                          </a>
                        )
                      ))}
                       {/* Optional: Add a message if all images failed for a destination */}
                       {destination.images.length > 0 && destination.images.every(url => failedImageUrls.has(url)) && (
                           <p className="text-gray-500 text-sm col-span-full">No images loaded for this destination.</p>
                       )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Placeholder if no recommendations yet */}
         {!isLoading && !error && !recommendations && (
             <div className="mt-6 text-center text-gray-500 text-lg"> {/* Slightly larger text */}
                 Enter your travel preferences above to get started!
             </div>
         )}

      </div>
    </div>
  );
}

// Add a custom style for the textarea height if not using Tailwind h-* classes
// This should go in your global CSS file (e.g., src/index.css)
/*
.textarea-height {
  height: 250px; // Adjust as needed
}
*/

export default App;
