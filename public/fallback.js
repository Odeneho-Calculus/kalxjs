/**
 * KalxJS Fallback Rendering System
 * 
 * This script provides a fallback rendering mechanism for KalxJS applications.
 * If the main framework fails to render content, this script will detect the empty
 * container and inject fallback content to ensure users see something.
 */

(function() {
  // Check for rendering issues after the page has loaded
  window.addEventListener('load', function() {
    // Wait for the framework to attempt rendering
    setTimeout(checkAndApplyFallback, 800);
  });

  function checkAndApplyFallback() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    const appContent = appContainer.innerHTML.trim();
    
    // Check if the container is empty or only contains comments or loading indicator
    if (!appContent || 
        appContent === '' || 
        appContent.includes('<!--empty node-->') ||
        (appContainer.childNodes.length === 1 && appContainer.childNodes[0].nodeType === 8)) {
      
      console.warn('KalxJS: Framework rendering failed, activating fallback rendering');
      
      // Render fallback content directly to DOM
      appContainer.innerHTML = `
        <div style="padding: 2rem; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 48px; margin-bottom: 1rem;">🚀</div>
            <h1 style="color: #42b883; margin-bottom: 1rem;">Welcome to KalxJS</h1>
            <p style="font-size: 18px; color: #666;">A progressive JavaScript framework for building user interfaces</p>
          </div>
          
          <div style="background: #f8f8f8; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
            <h2 style="color: #42b883; margin-top: 0;">Fallback Content</h2>
            <p>The KalxJS framework's rendering system encountered an issue. This is fallback content to ensure you see something instead of a blank page.</p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #42b883; margin-top: 0;">Components</h3>
              <p>Build encapsulated components that manage their own state, then compose them to make complex UIs.</p>
            </div>
            <div style="background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #42b883; margin-top: 0;">Reactivity</h3>
              <p>Automatically updates the UI when your data changes with a reactive and composable system.</p>
            </div>
            <div style="background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #42b883; margin-top: 0;">Virtual DOM</h3>
              <p>Lightweight virtual DOM implementation that efficiently updates only what needs to change.</p>
            </div>
          </div>
          
          <div style="margin-top: 2rem; padding: 1.5rem; background: #f8f8f8; border-radius: 8px; text-align: left;">
            <h3 style="color: #42b883; margin-top: 0;">Troubleshooting Tips:</h3>
            <ul style="padding-left: 1.5rem;">
              <li>Check browser console for errors</li>
              <li>Verify that all components are properly defined</li>
              <li>Ensure router and store are correctly initialized</li>
              <li>Check for version compatibility between packages</li>
            </ul>
            <div style="text-align: center; margin-top: 1.5rem;">
              <button onclick="window.location.reload()" 
                      style="padding: 0.75rem 1.5rem; background: #42b883; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer;">
                Reload Application
              </button>
            </div>
          </div>
          
          <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p>KalxJS Fallback Rendering System</p>
          </footer>
        </div>
      `;
    }
  }
})();