/**
 * State Management Utility Class
 * Handles undo/redo functionality and application state persistence
 * duvet: REQ-STATE-001 - Maintain complete history of user actions
 * duvet: REQ-STATE-002, REQ-STATE-003 - Undo/Redo functionality
 * duvet: REQ-STATE-004 - Support all user actions
 */

export class StateManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 100; // Prevent memory issues with very long sessions
        this.hasUnsavedChangesFlag = false;
        
        // Action types for tracking different operations
        this.actionTypes = {
            GRID_CREATE: 'grid_create',
            GRID_DELETE: 'grid_delete',
            GRID_MOVE: 'grid_move',
            GRID_RESIZE: 'grid_resize',
            GRID_CONFIG_CHANGE: 'grid_config_change',
            NOTE_PLACE: 'note_place',
            NOTE_REMOVE: 'note_remove',
            NOTE_GROUP_CHANGE: 'note_group_change',
            ROOT_NOTE_SET: 'root_note_set',
            ROOT_NOTE_CLEAR: 'root_note_clear',
            CANVAS_ORIENTATION_CHANGE: 'canvas_orientation_change',
            CANVAS_LOCK_TOGGLE: 'canvas_lock_toggle',
            BULK_OPERATION: 'bulk_operation'
        };

        // Listeners for state changes
        this.listeners = new Set();
    }

    /**
     * Add a listener for state changes
     */
    addListener(callback) {
        this.listeners.add(callback);
    }

    /**
     * Remove a listener
     */
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners(action) {
        this.listeners.forEach(callback => {
            try {
                callback(action);
            } catch (error) {
                console.error('Error in state change listener:', error);
            }
        });
    }

    /**
     * Save current state to history
     * duvet: REQ-STATE-001 - Maintain complete history of user actions
     */
    saveState(action, previousState, newState) {
        // Remove any redo history when new action is performed
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Create state entry
        const stateEntry = {
            id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            action: {
                type: action.type,
                description: action.description,
                data: action.data
            },
            previousState: this.cloneState(previousState),
            newState: this.cloneState(newState)
        };

        this.history.push(stateEntry);
        this.currentIndex = this.history.length - 1;

        // Limit history size to prevent memory issues
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.hasUnsavedChangesFlag = true;
        this.notifyListeners(stateEntry);
    }

    /**
     * Undo the last action
     * duvet: REQ-STATE-002 - Undo function reverses most recent action
     */
    undo() {
        if (!this.canUndo()) {
            console.warn('Cannot undo: no actions in history');
            return null;
        }

        const stateEntry = this.history[this.currentIndex];
        this.currentIndex--;

        console.log(`Undoing action: ${stateEntry.action.description}`);
        
        // Return the previous state to restore
        const result = {
            action: stateEntry.action,
            stateToRestore: stateEntry.previousState,
            direction: 'undo'
        };

        this.notifyListeners(result);
        return result;
    }

    /**
     * Redo the last undone action
     * duvet: REQ-STATE-003 - Redo function restores most recently undone action
     */
    redo() {
        if (!this.canRedo()) {
            console.warn('Cannot redo: no actions to redo');
            return null;
        }

        this.currentIndex++;
        const stateEntry = this.history[this.currentIndex];

        console.log(`Redoing action: ${stateEntry.action.description}`);

        // Return the new state to restore
        const result = {
            action: stateEntry.action,
            stateToRestore: stateEntry.newState,
            direction: 'redo'
        };

        this.notifyListeners(result);
        return result;
    }

    /**
     * Check if undo is possible
     */
    canUndo() {
        return this.currentIndex >= 0;
    }

    /**
     * Check if redo is possible
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Get current state information
     */
    getStateInfo() {
        return {
            historyLength: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            hasUnsavedChanges: this.hasUnsavedChangesFlag
        };
    }

    /**
     * Clear all history (used when loading files)
     */
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.hasUnsavedChangesFlag = false;
        this.notifyListeners({ type: 'history_cleared' });
    }

    /**
     * Mark changes as saved
     */
    markAsSaved() {
        this.hasUnsavedChangesFlag = false;
        this.notifyListeners({ type: 'changes_saved' });
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        return this.hasUnsavedChangesFlag;
    }

    /**
     * Create a deep clone of state object
     */
    cloneState(state) {
        if (state === null || state === undefined) return state;
        
        try {
            // Use structured cloning for complex objects
            return JSON.parse(JSON.stringify(state));
        } catch (error) {
            console.error('Error cloning state:', error);
            return null;
        }
    }

    /**
     * Create action object for state tracking
     */
    createAction(type, description, data = null) {
        return {
            type,
            description,
            data: data ? this.cloneState(data) : null
        };
    }

    /**
     * Batch multiple operations into a single undo/redo action
     */
    batchOperations(operations, description) {
        if (!Array.isArray(operations) || operations.length === 0) {
            return;
        }

        const batchAction = this.createAction(
            this.actionTypes.BULK_OPERATION,
            description,
            { operations: operations.map(op => ({ ...op })) }
        );

        // Execute all operations
        const results = operations.map(operation => {
            try {
                return operation.execute();
            } catch (error) {
                console.error('Error executing batched operation:', error);
                return null;
            }
        });

        // Save the batch as a single state entry
        this.saveState(batchAction, null, results);
    }

    /**
     * Get action history for debugging
     */
    getActionHistory() {
        return this.history.map(entry => ({
            id: entry.id,
            timestamp: entry.timestamp,
            action: entry.action,
            canUndo: this.history.indexOf(entry) <= this.currentIndex
        }));
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        const totalSize = JSON.stringify(this.history).length;
        const averageEntrySize = this.history.length > 0 ? totalSize / this.history.length : 0;
        
        return {
            totalEntries: this.history.length,
            totalSizeBytes: totalSize,
            averageEntrySizeBytes: Math.round(averageEntrySize),
            maxHistorySize: this.maxHistorySize,
            currentIndex: this.currentIndex
        };
    }

    /**
     * Validate state integrity
     */
    validateState(state) {
        if (!state || typeof state !== 'object') {
            return false;
        }

        // Basic validation - ensure required properties exist
        const requiredProperties = ['canvas', 'grids'];
        return requiredProperties.every(prop => prop in state);
    }

    /**
     * Export state history for debugging or analysis
     */
    exportHistory() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            currentIndex: this.currentIndex,
            history: this.history
        };
    }

    /**
     * Import state history (for debugging or testing)
     */
    importHistory(historyData) {
        try {
            if (historyData.version !== '1.0') {
                throw new Error('Unsupported history version');
            }

            this.history = historyData.history || [];
            this.currentIndex = historyData.currentIndex || -1;
            this.hasUnsavedChangesFlag = true;
            
            this.notifyListeners({ type: 'history_imported' });
            return true;
        } catch (error) {
            console.error('Error importing history:', error);
            return false;
        }
    }
}