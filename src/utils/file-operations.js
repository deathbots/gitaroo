/**
 * File Operations Utility Class
 * Handles save/load functionality for Canvas state
 * duvet: REQ-STATE-005, REQ-STATE-006 - Save function exports complete Canvas state as JSON
 * duvet: REQ-STATE-007, REQ-STATE-008, REQ-STATE-009 - Load function restores Canvas state from JSON
 */

export class FileOperations {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.currentFileName = null;
        this.fileVersion = '1.0';
    }

    /**
     * Save the complete Canvas state as downloadable JSON file
     * duvet: REQ-STATE-005 - Export complete Canvas state as downloadable JSON file
     * duvet: REQ-STATE-006 - JSON contains all Grid configurations, note placements, colors, root note selection, and Canvas settings
     */
    saveCanvas(canvasState, filename = null) {
        try {
            // Generate filename if not provided
            if (!filename) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                filename = `gitaroo-fretboard-${timestamp}.json`;
            }

            // Create comprehensive state object
            const saveData = {
                version: this.fileVersion,
                timestamp: Date.now(),
                metadata: {
                    application: 'Gitaroo Guitar Fretboard Learning Tool',
                    createdBy: 'user',
                    description: 'Guitar fretboard diagram with notes and configurations'
                },
                canvas: {
                    orientation: canvasState.orientation || 'portrait',
                    locked: canvasState.locked || false,
                    dimensions: canvasState.dimensions || {
                        width: 816,
                        height: 1056
                    }
                },
                grids: canvasState.grids || [],
                notes: canvasState.notes || {},
                rootNote: canvasState.rootNote || null,
                intervals: canvasState.intervals || {},
                settings: canvasState.settings || {}
            };

            // Validate the data before saving
            if (!this.validateSaveData(saveData)) {
                throw new Error('Invalid data structure for saving');
            }

            // Convert to JSON string
            const jsonString = JSON.stringify(saveData, null, 2);

            // Create and trigger download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            URL.revokeObjectURL(url);

            // Mark as saved in state manager
            this.stateManager.markAsSaved();
            this.currentFileName = filename;

            console.log(`Canvas saved successfully as ${filename}`);
            return { success: true, filename };

        } catch (error) {
            console.error('Error saving canvas:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load Canvas state from JSON file
     * duvet: REQ-STATE-007 - Load function restores complete Canvas state from valid JSON file
     * duvet: REQ-STATE-008 - Validate JSON file structure and provide user feedback
     * duvet: REQ-STATE-009 - File loading clears current Canvas state and replaces with loaded state
     */
    async loadCanvas(file) {
        try {
            // Validate file type
            if (!file) {
                throw new Error('No file provided');
            }

            if (!file.name.toLowerCase().endsWith('.json')) {
                throw new Error('File must be a JSON file (.json extension)');
            }

            // Read file content
            const fileContent = await this.readFileAsText(file);
            
            // Parse JSON
            let loadedData;
            try {
                loadedData = JSON.parse(fileContent);
            } catch (parseError) {
                throw new Error('Invalid JSON format: ' + parseError.message);
            }

            // Validate file structure
            const validationResult = this.validateLoadData(loadedData);
            if (!validationResult.isValid) {
                throw new Error('Invalid file structure: ' + validationResult.error);
            }

            // Check version compatibility
            if (loadedData.version && loadedData.version !== this.fileVersion) {
                console.warn(`File version ${loadedData.version} may not be fully compatible with current version ${this.fileVersion}`);
            }

            // Extract state data
            const canvasState = {
                canvas: loadedData.canvas || {},
                grids: loadedData.grids || [],
                notes: loadedData.notes || {},
                rootNote: loadedData.rootNote || null,
                intervals: loadedData.intervals || {},
                settings: loadedData.settings || {}
            };

            // Clear current state history as we're loading new state
            this.stateManager.clearHistory();
            this.currentFileName = file.name;

            console.log(`Canvas loaded successfully from ${file.name}`);
            return { success: true, data: canvasState, filename: file.name };

        } catch (error) {
            console.error('Error loading canvas:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Read file as text using FileReader
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Validate data structure before saving
     * duvet: REQ-STATE-006 - JSON contains all required components
     */
    validateSaveData(data) {
        try {
            // Check required top-level properties
            const requiredProps = ['version', 'canvas', 'grids'];
            for (const prop of requiredProps) {
                if (!(prop in data)) {
                    console.error(`Missing required property: ${prop}`);
                    return false;
                }
            }

            // Validate canvas object
            if (typeof data.canvas !== 'object') {
                console.error('Canvas must be an object');
                return false;
            }

            // Validate grids array
            if (!Array.isArray(data.grids)) {
                console.error('Grids must be an array');
                return false;
            }

            // Validate each grid structure
            for (const grid of data.grids) {
                if (!this.validateGridStructure(grid)) {
                    return false;
                }
            }

            // Validate notes object
            if (data.notes && typeof data.notes !== 'object') {
                console.error('Notes must be an object');
                return false;
            }

            return true;

        } catch (error) {
            console.error('Error validating save data:', error);
            return false;
        }
    }

    /**
     * Validate loaded data structure
     * duvet: REQ-STATE-008 - Validate JSON file structure
     */
    validateLoadData(data) {
        try {
            // Check if data is an object
            if (!data || typeof data !== 'object') {
                return { isValid: false, error: 'File must contain a JSON object' };
            }

            // Check for required metadata
            if (!data.version) {
                return { isValid: false, error: 'Missing version information' };
            }

            // Check for canvas configuration
            if (!data.canvas || typeof data.canvas !== 'object') {
                return { isValid: false, error: 'Missing or invalid canvas configuration' };
            }

            // Check for grids array
            if (!data.grids || !Array.isArray(data.grids)) {
                return { isValid: false, error: 'Missing or invalid grids array' };
            }

            // Validate each grid in detail
            for (let i = 0; i < data.grids.length; i++) {
                const gridValidation = this.validateGridStructure(data.grids[i]);
                if (!gridValidation) {
                    return { isValid: false, error: `Invalid grid structure at index ${i}` };
                }
            }

            return { isValid: true };

        } catch (error) {
            return { isValid: false, error: 'Error parsing file: ' + error.message };
        }
    }

    /**
     * Validate individual grid structure
     */
    validateGridStructure(grid) {
        try {
            // Required grid properties
            const requiredProps = ['id', 'position', 'config'];
            for (const prop of requiredProps) {
                if (!(prop in grid)) {
                    console.error(`Grid missing required property: ${prop}`);
                    return false;
                }
            }

            // Validate position
            if (!grid.position || typeof grid.position !== 'object') {
                console.error('Grid position must be an object');
                return false;
            }

            if (typeof grid.position.x !== 'number' || typeof grid.position.y !== 'number') {
                console.error('Grid position must have numeric x and y coordinates');
                return false;
            }

            // Validate config
            if (!grid.config || typeof grid.config !== 'object') {
                console.error('Grid config must be an object');
                return false;
            }

            const configProps = ['startFret', 'endFret', 'stringCount', 'tuning', 'orientation'];
            for (const prop of configProps) {
                if (!(prop in grid.config)) {
                    console.error(`Grid config missing required property: ${prop}`);
                    return false;
                }
            }

            // Validate numeric values
            if (typeof grid.config.startFret !== 'number' || 
                typeof grid.config.endFret !== 'number' || 
                typeof grid.config.stringCount !== 'number') {
                console.error('Grid config numeric values must be numbers');
                return false;
            }

            // Validate tuning array
            if (!Array.isArray(grid.config.tuning)) {
                console.error('Grid tuning must be an array');
                return false;
            }

            return true;

        } catch (error) {
            console.error('Error validating grid structure:', error);
            return false;
        }
    }

    /**
     * Get current file information
     */
    getCurrentFileInfo() {
        return {
            fileName: this.currentFileName,
            hasUnsavedChanges: this.stateManager.hasUnsavedChanges(),
            version: this.fileVersion
        };
    }

    /**
     * Create a backup of current state
     */
    createBackup(canvasState) {
        const timestamp = new Date().toISOString();
        return this.saveCanvas(canvasState, `gitaroo-backup-${timestamp}.json`);
    }

    /**
     * Export state for debugging or sharing
     */
    exportDebugInfo(canvasState) {
        const debugData = {
            ...canvasState,
            debug: {
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                historyStats: this.stateManager.getMemoryStats(),
                actionHistory: this.stateManager.getActionHistory().slice(-10) // Last 10 actions
            }
        };

        return this.saveCanvas(debugData, `gitaroo-debug-${Date.now()}.json`);
    }

    /**
     * Check if browser supports file operations
     */
    static isSupported() {
        return !!(window.File && window.FileReader && window.Blob && window.URL);
    }
}