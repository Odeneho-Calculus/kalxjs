/**
 * KalxJS Fallback Rendering System
 * 
 * This script provides a fallback rendering mechanism for KalxJS applications.
 * If the main framework fails to render content, this script will detect the empty
 * container and inject fallback content to ensure users see something.
 */

window.addEventListener('load', function () {
    // Wait for the framework to attempt rendering
    setTimeout(function () {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            const appContent = appContainer.innerHTML.trim();

            // Check if the container is empty or only contains comments
            if (!appContent || appContent === '' || appContent.startsWith('<!--')) {
                console.warn('KalxJS: Framework rendering failed, activating fallback rendering');

                // Render fallback content directly to DOM
                appContainer.innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h2 style="color: #42b883;">Application Content</h2>
                        <p>The application content should appear here.</p>
                        <p>If you're seeing this message, the framework's rendering system encountered an issue.</p>
                        <div style="margin-top: 2rem; padding: 1rem; background: #f8f8f8; border-radius: 4px; text-align: left;">
                            <h3>Troubleshooting Tips:</h3>
                            <ul>
                                <li>Check browser console for errors</li>
                                <li>Verify that all components are properly defined</li>
                                <li>Ensure router and store are correctly initialized</li>
                                <li>Check for version compatibility between packages</li>
                            </ul>
                        </div>
                    </div>
                `;
            }
        }
    }, 1000); // Wait 1 second for the framework to render
});