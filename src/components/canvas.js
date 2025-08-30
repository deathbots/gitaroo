/**
 * Canvas Component - Main Application Canvas System
 * Manages the overall canvas, grids, and user interactions
 * duvet: REQ-CAN-001 to REQ-CAN-010 - Canvas system requirements
 */

import { Grid } from './grid.js';

export class Canvas {
    constructor(canvasElement, stateManager, fileOperations, musicTheory) {
        this.element = canvasElement;
        this.stateManager = stateManager;
        this.fileOperations = fileOperations;
        this.musicTheory = musicTheory;
        
        // Canvas state
        this.orientation = 'portrait'; // duvet: REQ-CAN-002 - Portrait and landscape modes
        this.isLocked = false; // duvet: REQ-CAN-006 - Lock/unlock functionality
        this.grids = new Map(); // Collection of Grid instances
        this.rootNote = null; // duvet: REQ-NOTE-013 - Only one root note across all grids
        this.intervals = new Map(); // Calculated intervals relative to root note
        
        // DOM elements
        this.dropZone = null;
        this.canvasContent = null;
        
        // Event handlers
        this.boundHandlers = {
            orientationToggle: this.toggleOrientation.bind(this),
            lockToggle: this.toggleLock.bind(this),
            createGrid: this.createGrid.bind(this),
            saveCanvas: this.handleSave.bind(this),
            loadCanvas: this.handleLoad.bind(this),
            loadTrigger: this.triggerFileLoad.bind(this),
            undo: this.handleUndo.bind(this),
            redo: this.handleRedo.bind(this),
            dragOver: this.handleDragOver.bind(this),
            dragLeave: this.handleDragLeave.bind(this),
            drop: this.handleDrop.bind(this),
            stateChange: this.handleStateChange.bind(this)
        };
        
        this.isInitialized = false;
    }

    /**
     * Initialize the Canvas system
     * duvet: REQ-CAN-001 - Canvas dimensions equivalent to US Letter paper
     */
    async init() {
        try {
            this.setupCanvasStructure();
            this.setupEventListeners();
            this.setupDragAndDrop();
            this.updateCanvasState();
            
            // Listen for state changes
            this.stateManager.addListener(this.boundHandlers.stateChange);
            
            this.isInitialized = true;
            console.log('Canvas system initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Canvas:', error);
            throw error;
        }
    }

    /**
     * Setup canvas DOM structure
     */
    setupCanvasStructure() {
        // Create canvas content area if it doesn't exist
        this.canvasContent = this.element.querySelector('.canvas-content');
        if (!this.canvasContent) {
            this.canvasContent = document.createElement('div');
            this.canvasContent.className = 'canvas-content';
            this.element.appendChild(this.canvasContent);
        }

        // Get drop zone element
        this.dropZone = this.element.querySelector('.drop-zone');
        
        // Apply initial canvas dimensions and orientation
        // duvet: REQ-CAN-001 - US Letter paper dimensions
        this.element.classList.add(this.orientation);
    }

    /**
     * Setup event listeners for canvas controls
     * duvet: REQ-CAN-004 - Canvas Controller toolbar with all primary controls
     */
    setupEventListeners() {
        // Canvas control buttons
        const orientationBtn = document.getElementById('orientation-toggle');
        const lockBtn = document.getElementById('lock-toggle');
        const createGridBtn = document.getElementById('create-grid');
        const saveBtn = document.getElementById('save-canvas');
        const loadTrigger = document.getElementById('load-trigger');
        const loadInput = document.getElementById('load-canvas');
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');

        // Add event listeners
        if (orientationBtn) orientationBtn.addEventListener('click', this.boundHandlers.orientationToggle);
        if (lockBtn) lockBtn.addEventListener('click', this.boundHandlers.lockToggle);
        if (createGridBtn) createGridBtn.addEventListener('click', this.boundHandlers.createGrid);
        if (saveBtn) saveBtn.addEventListener('click', this.boundHandlers.saveCanvas);
        if (loadTrigger) loadTrigger.addEventListener('click', this.boundHandlers.loadTrigger);
        if (loadInput) loadInput.addEventListener('change', this.boundHandlers.loadCanvas);
        if (undoBtn) undoBtn.addEventListener('click', this.boundHandlers.undo);
        if (redoBtn) redoBtn.addEventListener('click', this.boundHandlers.redo);
    }

    /**
     * Setup drag and drop functionality
     * duvet: REQ-CAN-009 - Drag-and-drop file loading with visual feedback
     */
    setupDragAndDrop() {
        this.element.addEventListener('dragover', this.boundHandlers.dragOver);
        this.element.addEventListener('dragleave', this.boundHandlers.dragLeave);
        this.element.addEventListener('drop', this.boundHandlers.drop);
    }

    /**
     * Toggle canvas orientation between portrait and landscape
     * duvet: REQ-CAN-005 - Orientation toggle button
     * duvet: REQ-CAN-002 - Portrait and landscape orientation support
     */
    toggleOrientation() {
        if (this.isLocked) return;

        const previousState = this.getCanvasState();
        
        this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
        
        // Update DOM classes
        this.element.classList.remove('portrait', 'landscape');
        this.element.classList.add(this.orientation);
        
        // Update button text
        const btn = document.getElementById('orientation-toggle');
        if (btn) {
            btn.textContent = this.orientation === 'portrait' ? '📄 Portrait' : '📃 Landscape';
        }
        
        // Save state change
        const newState = this.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.CANVAS_ORIENTATION_CHANGE,
                `Change orientation to ${this.orientation}`
            ),
            previousState,
            newState
        );

        console.log(`Canvas orientation changed to ${this.orientation}`);
    }

    /**
     * Toggle canvas lock state
     * duvet: REQ-CAN-006 - Lock/unlock toggle
     * duvet: REQ-UI-003 - Canvas lock state visual indication
     */
    toggleLock() {
        const previousState = this.getCanvasState();
        
        this.isLocked = !this.isLocked;
        
        // Update DOM classes and visual indication
        if (this.isLocked) {
            this.element.classList.add('locked');
        } else {
            this.element.classList.remove('locked');
        }
        
        // Update button text and state
        const btn = document.getElementById('lock-toggle');
        if (btn) {
            btn.textContent = this.isLocked ? '🔒 Locked' : '🔓 Unlocked';
        }
        
        // Update all grids' lock state
        this.grids.forEach(grid => {
            grid.setLocked(this.isLocked);
        });
        
        // Save state change
        const newState = this.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.CANVAS_LOCK_TOGGLE,
                `Canvas ${this.isLocked ? 'locked' : 'unlocked'}`
            ),
            previousState,
            newState
        );

        console.log(`Canvas ${this.isLocked ? 'locked' : 'unlocked'}`);
    }

    /**
     * Create a new fretboard grid
     * duvet: REQ-CAN-007 - Create Grid button adds new fretboard Grid
     */
    createGrid() {
        if (this.isLocked) return;

        const previousState = this.getCanvasState();
        
        // Generate unique ID for the grid
        const gridId = `grid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create grid element
        const gridElement = document.createElement('div');
        gridElement.className = 'grid';
        gridElement.id = gridId;
        
        // Default position (center of canvas with some offset for multiple grids)
        const gridCount = this.grids.size;
        const offsetX = (gridCount % 3) * 20; // Stagger grids horizontally
        const offsetY = Math.floor(gridCount / 3) * 20; // Stagger grids vertically
        
        gridElement.style.left = `${50 + offsetX}px`;
        gridElement.style.top = `${50 + offsetY}px`;
        
        // Add to canvas
        this.canvasContent.appendChild(gridElement);
        
        // Create Grid instance
        const grid = new Grid(
            gridElement,
            this.stateManager,
            this.musicTheory,
            this
        );
        
        // Initialize the grid
        grid.init();
        
        // Store in grids collection
        this.grids.set(gridId, grid);
        
        // duvet: REQ-GRID-020 - Visual feedback when Grid is deleted (setup for undo)
        grid.onDelete = (deletedGridId) => {
            this.handleGridDelete(deletedGridId);
        };
        
        // Save state change
        const newState = this.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.GRID_CREATE,
                `Create new grid ${gridId}`
            ),
            previousState,
            newState
        );

        console.log(`Created new grid: ${gridId}`);
        return grid;
    }

    /**
     * Handle grid deletion
     */
    handleGridDelete(gridId) {
        const grid = this.grids.get(gridId);
        if (!grid) return;

        const previousState = this.getCanvasState();
        
        // Remove from DOM and collection
        grid.element.remove();
        this.grids.delete(gridId);
        
        // Clear root note if it was on this grid
        if (this.rootNote && this.rootNote.gridId === gridId) {
            this.setRootNote(null);
        }
        
        // Save state change
        const newState = this.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.GRID_DELETE,
                `Delete grid ${gridId}`
            ),
            previousState,
            newState
        );

        console.log(`Deleted grid: ${gridId}`);
    }

    /**
     * Set root note and update interval highlighting
     * duvet: REQ-NOTE-013 - Only one root note across all grids
     * duvet: REQ-INT-001 - Calculate intervals for all notes relative to root
     */
    setRootNote(noteInfo) {
        // Clear previous root note
        if (this.rootNote) {
            const prevGrid = this.grids.get(this.rootNote.gridId);
            if (prevGrid) {
                prevGrid.clearRootNote();
            }
        }
        
        // Set new root note
        this.rootNote = noteInfo;
        
        // Update interval calculations for all notes
        this.updateIntervalHighlighting();
        
        console.log('Root note set:', noteInfo);
    }

    /**
     * Update interval highlighting across all grids
     * duvet: REQ-INT-006 - Interval highlighting updates when new root note selected
     * duvet: REQ-INT-007 - Interval highlighting removed when no root note selected
     */
    updateIntervalHighlighting() {
        // Clear previous intervals
        this.intervals.clear();
        
        if (!this.rootNote) {
            // No root note - clear all interval highlighting
            this.grids.forEach(grid => {
                grid.clearIntervalHighlighting();
            });
            return;
        }
        
        // Calculate intervals for all notes across all grids
        this.grids.forEach(grid => {
            const gridNotes = grid.getAllNotes();
            
            gridNotes.forEach((note, noteId) => {
                const interval = this.musicTheory.calculateInterval(this.rootNote, note);
                if (interval) {
                    this.intervals.set(noteId, interval);
                }
            });
            
            // Update grid's interval highlighting
            grid.updateIntervalHighlighting(this.intervals, this.rootNote);
        });
    }

    /**
     * Handle save canvas functionality
     * duvet: REQ-CAN-008 - Save functionality exports complete Canvas state
     */
    async handleSave() {
        try {
            const canvasState = this.getCanvasState();
            const result = this.fileOperations.saveCanvas(canvasState);
            
            if (result.success) {
                this.showToast(`Canvas saved as ${result.filename}`, 'success');
            } else {
                this.showToast(`Save failed: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error saving canvas:', error);
            this.showToast('Save failed: ' + error.message, 'error');
        }
    }

    /**
     * Handle load canvas functionality
     * duvet: REQ-CAN-008 - Load functionality imports complete Canvas state
     */
    async handleLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const result = await this.fileOperations.loadCanvas(file);
            
            if (result.success) {
                await this.restoreCanvasState(result.data);
                this.showToast(`Canvas loaded from ${result.filename}`, 'success');
                
                // Clear the file input
                event.target.value = '';
            } else {
                this.showToast(`Load failed: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error loading canvas:', error);
            this.showToast('Load failed: ' + error.message, 'error');
        }
    }

    /**
     * Trigger file load dialog
     */
    triggerFileLoad() {
        const loadInput = document.getElementById('load-canvas');
        if (loadInput) {
            loadInput.click();
        }
    }

    /**
     * Handle undo action
     * duvet: REQ-CAN-010 - Undo button maintains complete session history
     */
    handleUndo() {
        const result = this.stateManager.undo();
        if (result) {
            this.restoreCanvasState(result.stateToRestore);
            this.updateUndoRedoButtons();
            this.showToast('Action undone', 'info');
        }
    }

    /**
     * Handle redo action
     * duvet: REQ-CAN-010 - Redo button maintains complete session history
     */
    handleRedo() {
        const result = this.stateManager.redo();
        if (result) {
            this.restoreCanvasState(result.stateToRestore);
            this.updateUndoRedoButtons();
            this.showToast('Action redone', 'info');
        }
    }

    /**
     * Handle drag over event for file drop
     * duvet: REQ-UI-002 - Visual indication when file is dragged over
     */
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        
        // Show drop zone
        if (this.dropZone) {
            this.dropZone.classList.remove('hidden');
            this.dropZone.classList.add('active');
        }
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(event) {
        // Only hide if leaving the canvas entirely
        if (!this.element.contains(event.relatedTarget)) {
            if (this.dropZone) {
                this.dropZone.classList.remove('active');
                this.dropZone.classList.add('hidden');
            }
        }
    }

    /**
     * Handle file drop event
     * duvet: REQ-CAN-009 - Drag-and-drop file loading support
     */
    async handleDrop(event) {
        event.preventDefault();
        
        // Hide drop zone
        if (this.dropZone) {
            this.dropZone.classList.remove('active');
            this.dropZone.classList.add('hidden');
        }
        
        const files = Array.from(event.dataTransfer.files);
        const jsonFile = files.find(file => file.name.toLowerCase().endsWith('.json'));
        
        if (jsonFile) {
            try {
                const result = await this.fileOperations.loadCanvas(jsonFile);
                
                if (result.success) {
                    await this.restoreCanvasState(result.data);
                    this.showToast(`Canvas loaded from ${result.filename}`, 'success');
                } else {
                    this.showToast(`Load failed: ${result.error}`, 'error');
                }
            } catch (error) {
                console.error('Error loading dropped file:', error);
                this.showToast('Load failed: ' + error.message, 'error');
            }
        } else {
            this.showToast('Please drop a JSON file', 'warning');
        }
    }

    /**
     * Handle state change notifications
     */
    handleStateChange(action) {
        this.updateUndoRedoButtons();
        
        // Handle specific state changes
        if (action.direction === 'undo' || action.direction === 'redo') {
            // State restoration is handled by the undo/redo methods
            return;
        }
    }

    /**
     * Get current canvas state for saving/state management
     */
    getCanvasState() {
        const gridsData = [];
        const notesData = {};
        
        this.grids.forEach((grid, gridId) => {
            gridsData.push(grid.serialize());
            
            // Collect notes from this grid
            const gridNotes = grid.getAllNotes();
            gridNotes.forEach((note, noteId) => {
                notesData[noteId] = note;
            });
        });
        
        return {
            canvas: {
                orientation: this.orientation,
                locked: this.isLocked,
                dimensions: {
                    width: this.element.offsetWidth,
                    height: this.element.offsetHeight
                }
            },
            grids: gridsData,
            notes: notesData,
            rootNote: this.rootNote,
            intervals: Object.fromEntries(this.intervals),
            settings: {
                version: '1.0',
                timestamp: Date.now()
            }
        };
    }

    /**
     * Restore canvas state from saved data
     * duvet: REQ-STATE-009 - File loading clears current state and replaces with loaded state
     */
    async restoreCanvasState(stateData) {
        try {
            // Clear current state
            this.clearAll();
            
            // Restore canvas settings
            if (stateData.canvas) {
                this.orientation = stateData.canvas.orientation || 'portrait';
                this.isLocked = stateData.canvas.locked || false;
                
                // Update DOM
                this.element.classList.remove('portrait', 'landscape', 'locked');
                this.element.classList.add(this.orientation);
                if (this.isLocked) {
                    this.element.classList.add('locked');
                }
            }
            
            // Restore grids
            if (stateData.grids && Array.isArray(stateData.grids)) {
                for (const gridData of stateData.grids) {
                    await this.restoreGrid(gridData);
                }
            }
            
            // Restore root note and intervals
            this.rootNote = stateData.rootNote || null;
            if (stateData.intervals) {
                this.intervals = new Map(Object.entries(stateData.intervals));
            }
            
            // Update interval highlighting
            this.updateIntervalHighlighting();
            
            // Update UI state
            this.updateCanvasState();
            
        } catch (error) {
            console.error('Error restoring canvas state:', error);
            throw error;
        }
    }

    /**
     * Restore a single grid from saved data
     */
    async restoreGrid(gridData) {
        const gridElement = document.createElement('div');
        gridElement.className = 'grid';
        gridElement.id = gridData.id;
        
        // Restore position
        if (gridData.position) {
            gridElement.style.left = `${gridData.position.x}px`;
            gridElement.style.top = `${gridData.position.y}px`;
        }
        
        // Add to canvas
        this.canvasContent.appendChild(gridElement);
        
        // Create and restore Grid instance
        const grid = new Grid(
            gridElement,
            this.stateManager,
            this.musicTheory,
            this
        );
        
        await grid.init();
        await grid.deserialize(gridData);
        
        // Store in collection
        this.grids.set(gridData.id, grid);
        
        // Setup delete handler
        grid.onDelete = (deletedGridId) => {
            this.handleGridDelete(deletedGridId);
        };
    }

    /**
     * Clear all grids and reset canvas
     */
    clearAll() {
        // Remove all grids
        this.grids.forEach(grid => {
            grid.element.remove();
        });
        this.grids.clear();
        
        // Clear state
        this.rootNote = null;
        this.intervals.clear();
    }

    /**
     * Update canvas UI state (buttons, etc.)
     */
    updateCanvasState() {
        // Update orientation button
        const orientationBtn = document.getElementById('orientation-toggle');
        if (orientationBtn) {
            orientationBtn.textContent = this.orientation === 'portrait' ? '📄 Portrait' : '📃 Landscape';
        }
        
        // Update lock button
        const lockBtn = document.getElementById('lock-toggle');
        if (lockBtn) {
            lockBtn.textContent = this.isLocked ? '🔒 Locked' : '🔓 Unlocked';
        }
        
        this.updateUndoRedoButtons();
    }

    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');
        const stateInfo = this.stateManager.getStateInfo();
        
        if (undoBtn) {
            undoBtn.disabled = !stateInfo.canUndo;
        }
        
        if (redoBtn) {
            redoBtn.disabled = !stateInfo.canRedo;
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, type === 'error' ? 5000 : 3000);
    }

    /**
     * Clear any active selections or modes
     */
    clearSelections() {
        this.grids.forEach(grid => {
            grid.clearSelections();
        });
    }

    /**
     * Performance: Pause animations when page is hidden
     */
    pauseAnimations() {
        this.grids.forEach(grid => {
            grid.pauseAnimations();
        });
    }

    /**
     * Performance: Resume animations when page is visible
     */
    resumeAnimations() {
        this.grids.forEach(grid => {
            grid.resumeAnimations();
        });
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove event listeners
        this.stateManager.removeListener(this.boundHandlers.stateChange);
        
        // Clean up grids
        this.grids.forEach(grid => {
            grid.destroy();
        });
        
        this.isInitialized = false;
    }
}