/**
 * KalxJS Direct Rendering Script
 * 
 * This script provides a direct DOM rendering mechanism that bypasses the framework
 * entirely. It's used as a last resort when all other rendering methods fail.
 */

(function () {
    // Wait for the DOM to be fully loaded
    window.addEventListener('DOMContentLoaded', function () {
        // Wait a bit to let the framework try to render first
        setTimeout(checkAndRender, 1000);
    });

    // Also check on window load (in case DOMContentLoaded already fired)
    window.addEventListener('load', function () {
        setTimeout(checkAndRender, 1500);
    });

    function checkAndRender() {
        const appElement = document.getElementById('app');

        // Check if the app container exists and is empty or contains only comments
        if (appElement && (
            appElement.innerHTML.trim() === '' ||
            appElement.innerHTML.includes('<!--empty node-->') ||
            (appElement.childNodes.length === 1 && appElement.childNodes[0].nodeType === 8) // Only comment node
        )) {
            console.warn('KalxJS: Direct render script activated - framework rendering failed');

            // Render a basic UI directly to the DOM
            renderEmergencyContent(appElement);
        }
    }

    function renderEmergencyContent(container) {
        // Clear the container
        container.innerHTML = '';

        // Create the main container
        const mainContent = document.createElement('div');
        mainContent.className = 'direct-render-container';
        mainContent.style.padding = '20px';
        mainContent.style.fontFamily = 'Arial, sans-serif';
        mainContent.style.maxWidth = '800px';
        mainContent.style.margin = '0 auto';
        mainContent.style.textAlign = 'center';

        // Create header
        const header = document.createElement('div');
        header.className = 'direct-render-header';

        const logo = document.createElement('div');
        logo.className = 'direct-render-logo';
        logo.style.fontSize = '48px';
        logo.style.marginBottom = '10px';
        logo.textContent = '🚀';

        const title = document.createElement('h1');
        title.style.color = '#42b883';
        title.style.marginBottom = '20px';
        title.textContent = 'Welcome to KalxJS';

        header.appendChild(logo);
        header.appendChild(title);

        // Create content
        const content = document.createElement('div');
        content.className = 'direct-render-content';

        const message = document.createElement('p');
        message.style.fontSize = '18px';
        message.style.lineHeight = '1.5';
        message.style.marginBottom = '30px';
        message.textContent = 'This content is rendered by the emergency direct-render script.';

        const explanation = document.createElement('p');
        explanation.style.fontSize = '16px';
        explanation.style.lineHeight = '1.5';
        explanation.style.marginBottom = '30px';
        explanation.textContent = 'The KalxJS framework encountered an issue with its rendering pipeline. This emergency script ensures you still see content instead of a blank page.';

        content.appendChild(message);
        content.appendChild(explanation);

        // Create features section
        const features = document.createElement('div');
        features.className = 'direct-render-features';
        features.style.display = 'flex';
        features.style.justifyContent = 'center';
        features.style.flexWrap = 'wrap';
        features.style.gap = '20px';
        features.style.marginBottom = '40px';

        // Feature items
        const featureItems = [
            { icon: '⚡', title: 'Fast', description: 'Optimized for performance' },
            { icon: '🧩', title: 'Modular', description: 'Component-based architecture' },
            { icon: '🔄', title: 'Reactive', description: 'Automatic UI updates' },
            { icon: '🛠️', title: 'Flexible', description: 'Adaptable to your needs' }
        ];

        featureItems.forEach(item => {
            const feature = document.createElement('div');
            feature.className = 'direct-render-feature';
            feature.style.width = '180px';
            feature.style.padding = '15px';
            feature.style.backgroundColor = '#f8f8f8';
            feature.style.borderRadius = '8px';
            feature.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

            const featureIcon = document.createElement('div');
            featureIcon.style.fontSize = '32px';
            featureIcon.style.marginBottom = '10px';
            featureIcon.textContent = item.icon;

            const featureTitle = document.createElement('h3');
            featureTitle.style.margin = '0 0 10px 0';
            featureTitle.style.color = '#42b883';
            featureTitle.textContent = item.title;

            const featureDesc = document.createElement('p');
            featureDesc.style.margin = '0';
            featureDesc.style.fontSize = '14px';
            featureDesc.textContent = item.description;

            feature.appendChild(featureIcon);
            feature.appendChild(featureTitle);
            feature.appendChild(featureDesc);

            features.appendChild(feature);
        });

        // Create action button
        const action = document.createElement('div');
        action.className = 'direct-render-action';
        action.style.marginTop = '30px';

        const button = document.createElement('button');
        button.style.padding = '12px 24px';
        button.style.backgroundColor = '#42b883';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.fontSize = '16px';
        button.style.cursor = 'pointer';
        button.textContent = 'Reload Application';
        button.onclick = function () {
            window.location.reload();
        };

        action.appendChild(button);

        // Create footer
        const footer = document.createElement('footer');
        footer.className = 'direct-render-footer';
        footer.style.marginTop = '50px';
        footer.style.padding = '20px';
        footer.style.borderTop = '1px solid #eee';
        footer.style.color = '#666';
        footer.style.fontSize = '14px';

        const footerText = document.createElement('p');
        footerText.textContent = 'KalxJS Emergency Rendering System';

        footer.appendChild(footerText);

        // Assemble all sections
        mainContent.appendChild(header);
        mainContent.appendChild(content);
        mainContent.appendChild(features);
        mainContent.appendChild(action);
        mainContent.appendChild(footer);

        // Add to container
        container.appendChild(mainContent);

        console.log('KalxJS: Emergency content rendered successfully');
    }
})();