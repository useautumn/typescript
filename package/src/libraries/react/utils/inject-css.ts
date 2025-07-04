import { CSS_CONTENT } from '../../../generated/css-content';

let stylesInjected = false;

export function injectAutumnStyles(): void {
  // Only inject in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Prevent duplicate injection
  if (stylesInjected || document.querySelector('[data-autumn-styles]')) {
    return;
  }

  try {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-autumn-styles', '');
    styleElement.setAttribute('type', 'text/css');
    
    // Add CSS content
    styleElement.textContent = CSS_CONTENT;
    
    // Inject into document head
    document.head.appendChild(styleElement);
    
    stylesInjected = true;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 Autumn styles injected');
    }
  } catch (error) {
    console.error('Failed to inject Autumn styles:', error);
  }
} 