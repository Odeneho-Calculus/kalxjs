// packages/utils/src/dom.js

/**
 * Adds a class to an element
 * 
 * @param {Element} el The element
 * @param {string} className The class name
 */
export function addClass(el, className) {
  if (!el || !className) return;
  
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ` ${className}`;
  }
}

/**
 * Removes a class from an element
 * 
 * @param {Element} el The element
 * @param {string} className The class name
 */
export function removeClass(el, className) {
  if (!el || !className) return;
  
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className
      .replace(new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'), ' ')
      .trim();
  }
}

/**
 * Toggles a class on an element
 * 
 * @param {Element} el The element
 * @param {string} className The class name
 */
export function toggleClass(el, className) {
  if (!el || !className) return;
  
  if (el.classList) {
    el.classList.toggle(className);
  } else {
    const classes = el.className.split(' ');
    const existingIndex = classes.indexOf(className);
    
    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    } else {
      classes.push(className);
    }
    
    el.className = classes.join(' ');
  }
}

/**
 * Checks if an element has a class
 * 
 * @param {Element} el The element
 * @param {string} className The class name
 * @returns {boolean} True if the element has the class
 */
export function hasClass(el, className) {
  if (!el || !className) return false;
  
  if (el.classList) {
    return el.classList.contains(className);
  } else {
    return new RegExp(`(^| )${className}( |$)`, 'gi').test(el.className);
  }
}

/**
 * Gets or sets an attribute on an element
 * 
 * @param {Element} el The element
 * @param {string} name The attribute name
 * @param {string} [value] The attribute value
 * @returns {string|undefined} The attribute value if getting
 */
export function attr(el, name, value) {
  if (!el || !name) return;
  
  if (value === undefined) {
    return el.getAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
}

/**
 * Gets or sets the text content of an element
 * 
 * @param {Element} el The element
 * @param {string} [text] The text content
 * @returns {string|undefined} The text content if getting
 */
export function text(el, text) {
  if (!el) return;
  
  if (text === undefined) {
    return el.textContent;
  } else {
    el.textContent = text;
  }
}

/**
 * Gets or sets the HTML content of an element
 * 
 * @param {Element} el The element
 * @param {string} [html] The HTML content
 * @returns {string|undefined} The HTML content if getting
 */
export function html(el, html) {
  if (!el) return;
  
  if (html === undefined) {
    return el.innerHTML;
  } else {
    el.innerHTML = html;
  }
}

/**
 * Gets or sets the CSS style of an element
 * 
 * @param {Element} el The element
 * @param {string|Object} prop The property name or style object
 * @param {string} [value] The property value
 * @returns {string|undefined} The property value if getting
 */
export function css(el, prop, value) {
  if (!el) return;
  
  if (typeof prop === 'object') {
    // Set multiple styles
    Object.keys(prop).forEach(key => {
      el.style[key] = prop[key];
    });
  } else if (value === undefined) {
    // Get style
    return getComputedStyle(el)[prop];
  } else {
    // Set style
    el.style[prop] = value;
  }
}