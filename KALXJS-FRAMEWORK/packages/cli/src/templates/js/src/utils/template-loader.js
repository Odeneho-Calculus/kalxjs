/**
 * Template loader utility
 * Loads HTML templates from files and injects them into the DOM
 */

/**
 * Loads a template from a file and injects it into a template element
 * @param {string} templateId - ID of the template element
 * @param {string} templatePath - Path to the template file
 * @returns {Promise<void>}
 */
export async function loadTemplate(templateId, templatePath) {
  try {
    // Fetch the template content
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
    }
    
    // Get the template content
    const templateContent = await response.text();
    
    // Find the template element
    const templateElement = document.getElementById(templateId);
    
    if (!templateElement) {
      throw new Error(`Template element not found: ${templateId}`);
    }
    
    // Set the template content
    templateElement.innerHTML = templateContent;
    
    console.log(`Template loaded: ${templateId}`);
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
  }
}

/**
 * Loads all templates
 * @returns {Promise<void>}
 */
export async function loadAllTemplates() {
  // Define templates to load
  const templates = [
    { id: 'welcome-template', path: '/src/templates/welcome.html' },
    { id: 'counter-template', path: '/src/templates/counter.html' }
  ];
  
  // Load all templates in parallel
  await Promise.all(templates.map(template => 
    loadTemplate(template.id, template.path)
  ));
  
  console.log('All templates loaded');
}