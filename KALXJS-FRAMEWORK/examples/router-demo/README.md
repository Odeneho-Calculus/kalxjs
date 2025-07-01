# KalxJS Router Demo

This demo showcases the KalxJS Router functionality in a real-world application.

## Features Demonstrated

- Hash-based routing
- Navigation between pages
- Dynamic route parameters
- Route matching
- Navigation guards
- 404 page handling

## Project Structure

- `index.html` - Entry point
- `App.kal` - Main application component
- `router.js` - Router configuration
- `components/` - Page components
  - `Home.kal` - Home page
  - `About.kal` - About page
  - `User.kal` - User profile page with dynamic ID parameter
  - `NotFound.kal` - 404 page
  - `Navbar.kal` - Navigation component

## Running the Demo

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:3001)

## Testing the Router

1. **Basic Navigation**: Click on the navigation links to move between pages
2. **Dynamic Routes**: Try the User 1 and User 2 links to see dynamic route parameters in action
3. **Manual URL Changes**: Manually change the URL hash to test route matching
4. **404 Handling**: Try navigating to a non-existent route
5. **Browser Navigation**: Use the browser's back and forward buttons to test history navigation

## Console Output

Open your browser's developer console to see the navigation guard logs that show when routes change.
