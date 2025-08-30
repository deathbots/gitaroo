/**
 * Guitar Fretboard Learning Tool - Main Application Entry Point
 * duvet: REQ-SYS-001 - Static HTML application with no server dependencies
 * duvet: REQ-TECH-001 - Vanilla JavaScript implementation
 */

import { Canvas } from './components/canvas.js';
import { StateManager } from './utils/state-management.js';
import { FileOperations } from './utils/file-operations.js';
import { MusicTheory } from './utils/music-theory.js';

/**
 * Main Application Class
 * Coordinates all components and manages application lifecycle
 */
class GitarooApp {
    constructor() {
        this.canvas = null;
        this.stateManager = null;
        this.fileOperations = null;
        this.musicTheory = null;
        this.isInitialized = false;
        
        // duvet: REQ-TECH-003 - Modern browser compatibility check
        this.checkBrowserCompatibility();
    }

    /**
     * Initialize the application
     * duvet: REQ-SYS-003 - Function entirely within web browser
     */
    async init() {
        try {
            // Initialize utilities
            this.musicTheory = new MusicTheory();
            this.stateManager = new StateManager();
            this.fileOperations = new FileOperations(this.stateManager);
            
            // Initialize canvas system
            this.canvas = new Canvas(
                document.getElementById('canvas'),
                this.stateManager,
                this.fileOperations,
                this.musicTheory
            );
            
            await this.canvas.init();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            this.isInitialized = true;
            console.log('Gitaroo Guitar Fretboard Learning Tool initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Gitaroo:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Check browser compatibility
     * duvet: REQ-TECH-003 - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
     */
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'CSS.supports',
            'fetch',
            'Promise',
            'Map',
            'Set',
            'Object.assign',
            'Array.from'
        ];

        const missingFeatures = requiredFeatures.filter(feature => {
            const parts = feature.split('.');
            let obj = window;
            for (const part of parts) {
                if (!obj || !(part in obj)) return true;
                obj = obj[part];
            }
            return false;
        });

        if (missingFeatures.length > 0) {
            this.showError(
                `Your browser is not supported. Missing features: ${missingFeatures.join(', ')}. ` +
                'Please use a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).'
            );
            return false;
        }

        // Check CSS Grid support
        if (!CSS.supports('display', 'grid')) {
            this.showError('Your browser does not support CSS Grid. Please update your browser.');
            return false;
        }

        return true;
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Prevent accidental page unload with unsaved changes
        window.addEventListener('beforeunload', (event) => {
            if (this.stateManager && this.stateManager.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = '';
                return '';
            }
        });
        
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, pause any animations or reduce performance
                this.canvas?.pauseAnimations();
            } else {
                // Page is visible, resume normal operation
                this.canvas?.resumeAnimations();
            }
        });
    }

    /**
     * Handle keyboard shortcuts
     * duvet: REQ-UI-006 - Keyboard accessibility
     */
    handleKeyboardShortcuts(event) {
        if (!this.isInitialized) return;

        // Check for modifier keys
        const isCtrl = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;

        switch (event.key) {
            case 'z':
                if (isCtrl && !isShift) {
                    event.preventDefault();
                    this.stateManager.undo();
                } else if (isCtrl && isShift) {
                    event.preventDefault();
                    this.stateManager.redo();
                }
                break;
                
            case 'y':
                if (isCtrl) {
                    event.preventDefault();
                    this.stateManager.redo();
                }
                break;
                
            case 's':
                if (isCtrl) {
                    event.preventDefault();
                    this.fileOperations.saveCanvas();
                }
                break;
                
            case 'o':
                if (isCtrl) {
                    event.preventDefault();
                    document.getElementById('load-canvas').click();
                }
                break;
                
            case 'n':
                if (isCtrl) {
                    event.preventDefault();
                    this.canvas.createGrid();
                }
                break;
                
            case 'l':
                if (isCtrl) {
                    event.preventDefault();
                    this.canvas.toggleLock();
                }
                break;
                
            case 'r':
                if (isCtrl) {
                    event.preventDefault();
                    this.canvas.toggleOrientation();
                }
                break;
                
            case 'Escape':
                // Clear any active selections or modes
                this.canvas.clearSelections();
                break;
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    /**
     * Show success message to user
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Get application instance for debugging
     */
    static getInstance() {
        return window.gitarooApp;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.gitarooApp = new GitarooApp();
    await window.gitarooApp.init();
});

// Export for module system and debugging
export { GitarooApp };