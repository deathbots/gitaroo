/**
 * Grid Component - Individual Fretboard Grid System
 * Handles fretboard visualization, note placement, and grid manipulation
 * duvet: REQ-GRID-001 to REQ-GRID-023 - Grid system requirements
 */

export class Grid {
    constructor(gridElement, stateManager, musicTheory, canvas) {
        this.element = gridElement;
        this.stateManager = stateManager;
        this.musicTheory = musicTheory;
        this.canvas = canvas;
        
        // Grid configuration - duvet: REQ-GRID-003 - Default to frets 0-7
        this.config = {
            startFret: 0,
            endFret: 7,
            stringCount: 6, // duvet: REQ-GRID-004 - Default to 6 strings
            tuning: this.musicTheory.getStandardTuning(6),
            orientation: 'vertical' // duvet: REQ-GRID-008 - Support both orientations
        };
        
        // Grid state
        this.position = { x: 0, y: 0 };
        this.notes = new Map(); // Placed notes on this grid
        this.isLocked = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // DOM elements
        this.controller = null;
        this.fretboard = null;
        this.fretArea = null;
        
        // Event handlers
        this.boundHandlers = {
            startDrag: this.startDrag.bind(this),
            drag: this.drag.bind(this),
            endDrag: this.endDrag.bind(this),
            configChange: this.handleConfigChange.bind(this),
            noteClick: this.handleNoteClick.bind(this),
            noteDoubleClick: this.handleNoteDoubleClick.bind(this),
            deleteGrid: this.handleDelete.bind(this)
        };
        
        // Callback for deletion
        this.onDelete = null;
        
        this.isInitialized = false;
    }

    /**
     * Initialize the grid
     * duvet: REQ-GRID-001 - Rendered using HTML elements and CSS styling
     */
    async init() {
        try {
            this.createGridStructure();
            this.setupEventListeners();
            this.setupDragFunctionality();
            this.renderFretboard();
            this.updateGridLayout();
            
            this.isInitialized = true;
            console.log(`Grid ${this.element.id} initialized`);
            
        } catch (error) {
            console.error('Failed to initialize Grid:', error);
            throw error;
        }
    }

    /**
     * Create the basic grid DOM structure
     * duvet: REQ-GRID-013 - Grid Controller positioned at top of Grid
     */
    createGridStructure() {
        this.element.innerHTML = `
            <div class="grid-controller">
                <label>Start:</label>
                <input type="number" class="start-fret" min="0" max="24" value="${this.config.startFret}">
                
                <label>End:</label>
                <input type="number" class="end-fret" min="0" max="24" value="${this.config.endFret}">
                
                <label>Strings:</label>
                <input type="number" class="string-count" min="4" max="12" value="${this.config.stringCount}">
                
                <label>Tuning:</label>
                <div class="tuning-controls">
                    ${this.generateTuningControls()}
                </div>
                
                <button class="btn-small orientation-toggle" title="Toggle Orientation">
                    ${this.config.orientation === 'vertical' ? '⬇️' : '➡️'}
                </button>
                
                <button class="btn-small delete-btn" title="Delete Grid">🗑️</button>
            </div>
            
            <div class="fretboard ${this.config.orientation}">
                <div class="fret-numbers"></div>
                <div class="fret-area"></div>
                <div class="string-names"></div>
            </div>
        `;
        
        // Get references to key elements
        this.controller = this.element.querySelector('.grid-controller');
        this.fretboard = this.element.querySelector('.fretboard');
        this.fretArea = this.element.querySelector('.fret-area');
    }

    /**
     * Generate tuning control selects for each string
     * duvet: REQ-GRID-017 - Controls for setting chromatic tuning of each string
     */
    generateTuningControls() {
        const noteNames = this.musicTheory.getAllNoteNames();
        let controlsHtml = '';
        
        for (let i = 0; i < this.config.stringCount; i++) {
            const stringTuning = this.config.tuning[i];
            controlsHtml += `
                <select class="tuning-select" data-string="${i}">
                    ${noteNames.map(note => 
                        `<option value="${note}" ${stringTuning.note === note ? 'selected' : ''}>${note}</option>`
                    ).join('')}
                </select>
            `;
        }
        
        return controlsHtml;
    }

    /**
     * Setup event listeners for grid controls and interactions
     */
    setupEventListeners() {
        // Configuration controls
        const startFretInput = this.element.querySelector('.start-fret');
        const endFretInput = this.element.querySelector('.end-fret');
        const stringCountInput = this.element.querySelector('.string-count');
        const orientationBtn = this.element.querySelector('.orientation-toggle');
        const deleteBtn = this.element.querySelector('.delete-btn');
        
        if (startFretInput) startFretInput.addEventListener('change', this.boundHandlers.configChange);
        if (endFretInput) endFretInput.addEventListener('change', this.boundHandlers.configChange);
        if (stringCountInput) stringCountInput.addEventListener('change', this.boundHandlers.configChange);
        if (orientationBtn) orientationBtn.addEventListener('click', this.toggleOrientation.bind(this));
        if (deleteBtn) deleteBtn.addEventListener('click', this.boundHandlers.deleteGrid);
        
        // Tuning controls
        this.element.querySelectorAll('.tuning-select').forEach(select => {
            select.addEventListener('change', this.boundHandlers.configChange);
        });
    }

    /**
     * Setup grid dragging functionality
     * duvet: REQ-GRID-021 - Each Grid draggable within Canvas boundaries
     */
    setupDragFunctionality() {
        this.element.addEventListener('mousedown', this.boundHandlers.startDrag);
        document.addEventListener('mousemove', this.boundHandlers.drag);
        document.addEventListener('mouseup', this.boundHandlers.endDrag);
    }

    /**
     * Start dragging the grid
     */
    startDrag(event) {
        if (this.isLocked || !event.target.closest('.grid-controller')) return;
        
        this.isDragging = true;
        const rect = this.element.getBoundingClientRect();
        this.dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        this.element.style.cursor = 'grabbing';
        event.preventDefault();
    }

    /**
     * Handle grid dragging
     * duvet: REQ-GRID-022 - Grid positioning constrained to Canvas boundaries
     */
    drag(event) {
        if (!this.isDragging) return;
        
        const canvasRect = this.canvas.element.getBoundingClientRect();
        const gridRect = this.element.getBoundingClientRect();
        
        // Calculate new position
        let newX = event.clientX - canvasRect.left - this.dragOffset.x;
        let newY = event.clientY - canvasRect.top - this.dragOffset.y;
        
        // Constrain to canvas boundaries
        newX = Math.max(0, Math.min(newX, canvasRect.width - gridRect.width));
        newY = Math.max(0, Math.min(newY, canvasRect.height - gridRect.height));
        
        // Update position
        this.position = { x: newX, y: newY };
        this.element.style.left = `${newX}px`;
        this.element.style.top = `${newY}px`;
    }

    /**
     * End dragging
     */
    endDrag(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.element.style.cursor = 'move';
        
        // Save position change to state manager
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.GRID_MOVE,
                `Move grid ${this.element.id}`,
                { position: this.position }
            ),
            null, // Previous state would need to be tracked for complex undo
            this.canvas.getCanvasState()
        );
    }

    /**
     * Handle configuration changes
     * duvet: REQ-GRID-014, REQ-GRID-015, REQ-GRID-016, REQ-GRID-017 - Configuration controls
     */
    handleConfigChange(event) {
        if (this.isLocked) return;
        
        const previousState = this.canvas.getCanvasState();
        
        const target = event.target;
        let needsRender = false;
        
        if (target.classList.contains('start-fret')) {
            const value = Math.max(0, Math.min(24, parseInt(target.value) || 0));
            if (value !== this.config.startFret) {
                this.config.startFret = value;
                // Ensure end fret is not less than start fret
                if (this.config.endFret < this.config.startFret) {
                    this.config.endFret = this.config.startFret;
                    this.element.querySelector('.end-fret').value = this.config.endFret;
                }
                needsRender = true;
            }
        } else if (target.classList.contains('end-fret')) {
            const value = Math.max(0, Math.min(24, parseInt(target.value) || 0));
            if (value !== this.config.endFret) {
                this.config.endFret = value;
                // Ensure start fret is not greater than end fret
                if (this.config.startFret > this.config.endFret) {
                    this.config.startFret = this.config.endFret;
                    this.element.querySelector('.start-fret').value = this.config.startFret;
                }
                needsRender = true;
            }
        } else if (target.classList.contains('string-count')) {
            const value = Math.max(4, Math.min(12, parseInt(target.value) || 6));
            if (value !== this.config.stringCount) {
                this.config.stringCount = value;
                this.config.tuning = this.musicTheory.getStandardTuning(value);
                needsRender = true;
                // Update tuning controls
                this.updateTuningControls();
            }
        } else if (target.classList.contains('tuning-select')) {
            const stringIndex = parseInt(target.dataset.string);
            const note = target.value;
            const noteInfo = this.musicTheory.parseNote(note);
            if (noteInfo && this.config.tuning[stringIndex]) {
                this.config.tuning[stringIndex] = noteInfo;
                needsRender = true;
            }
        }
        
        if (needsRender) {
            // duvet: REQ-GRID-023 - Grid resizing occurs automatically when parameters modified
            this.renderFretboard();
            this.updateGridLayout();
            
            // Save configuration change
            const newState = this.canvas.getCanvasState();
            this.stateManager.saveState(
                this.stateManager.createAction(
                    this.stateManager.actionTypes.GRID_CONFIG_CHANGE,
                    `Update grid ${this.element.id} configuration`
                ),
                previousState,
                newState
            );
        }
    }

    /**
     * Toggle grid orientation
     * duvet: REQ-GRID-018 - Orientation toggle for vertical/horizontal display
     */
    toggleOrientation() {
        if (this.isLocked) return;
        
        const previousState = this.canvas.getCanvasState();
        
        this.config.orientation = this.config.orientation === 'vertical' ? 'horizontal' : 'vertical';
        
        // Update DOM classes
        this.fretboard.classList.remove('vertical', 'horizontal');
        this.fretboard.classList.add(this.config.orientation);
        
        // Update button icon
        const btn = this.element.querySelector('.orientation-toggle');
        if (btn) {
            btn.textContent = this.config.orientation === 'vertical' ? '⬇️' : '➡️';
        }
        
        this.renderFretboard();
        this.updateGridLayout();
        
        // Save state change
        const newState = this.canvas.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.GRID_CONFIG_CHANGE,
                `Change grid ${this.element.id} orientation to ${this.config.orientation}`
            ),
            previousState,
            newState
        );
    }

    /**
     * Render the fretboard with current configuration
     * duvet: REQ-GRID-002 - Fretboard representation with configurable fret range
     */
    renderFretboard() {
        const fretCount = this.config.endFret - this.config.startFret + 1;
        
        // Clear existing content
        this.fretArea.innerHTML = '';
        
        // Set CSS custom properties for grid layout
        this.fretArea.style.setProperty('--fret-count', fretCount);
        this.fretArea.style.setProperty('--string-count', this.config.stringCount);
        
        // Create note positions for each string/fret intersection
        for (let stringIndex = 0; stringIndex < this.config.stringCount; stringIndex++) {
            for (let fret = this.config.startFret; fret <= this.config.endFret; fret++) {
                this.createNotePosition(stringIndex, fret);
            }
        }
        
        // Add fret and string lines
        this.renderFretLines();
        this.renderStringLines();
        
        // Add fret markers
        this.renderFretMarkers();
        
        // Update labels
        this.updateFretNumbers();
        this.updateStringNames();
    }

    /**
     * Create a clickable note position
     * duvet: REQ-NOTE-001 - Place notes by clicking on fret/string intersection
     */
    createNotePosition(stringIndex, fret) {
        const position = document.createElement('div');
        position.className = 'note-position';
        position.dataset.string = stringIndex;
        position.dataset.fret = fret;
        
        // Calculate grid position based on orientation
        if (this.config.orientation === 'vertical') {
            position.style.gridRow = stringIndex + 1;
            position.style.gridColumn = (fret - this.config.startFret) + 1;
        } else {
            position.style.gridRow = (fret - this.config.startFret) + 1;
            position.style.gridColumn = stringIndex + 1;
        }
        
        // Add click handlers
        position.addEventListener('click', this.boundHandlers.noteClick);
        position.addEventListener('dblclick', this.boundHandlers.noteDoubleClick);
        
        this.fretArea.appendChild(position);
    }

    /**
     * Handle note click (placement/removal/grouping)
     * duvet: REQ-NOTE-001 - Users can place notes by clicking
     * duvet: REQ-NOTE-009 - Clicking cycles through color states
     */
    handleNoteClick(event) {
        if (this.isLocked) return;
        
        const stringIndex = parseInt(event.target.dataset.string);
        const fret = parseInt(event.target.dataset.fret);
        const noteId = `${this.element.id}_${stringIndex}_${fret}`;
        
        const existingNote = this.notes.get(noteId);
        
        if (existingNote) {
            // Cycle through group colors or remove note
            this.cycleNoteGroup(noteId, existingNote);
        } else {
            // Place new note
            this.placeNote(stringIndex, fret);
        }
    }

    /**
     * Handle note double-click (root note selection)
     * duvet: REQ-NOTE-012 - Double-clicking designates root note
     */
    handleNoteDoubleClick(event) {
        if (this.isLocked) return;
        
        const stringIndex = parseInt(event.target.dataset.string);
        const fret = parseInt(event.target.dataset.fret);
        const noteId = `${this.element.id}_${stringIndex}_${fret}`;
        
        const note = this.notes.get(noteId);
        if (note) {
            // Set as root note in canvas
            const rootNoteInfo = {
                ...note,
                gridId: this.element.id,
                noteId: noteId
            };
            
            this.canvas.setRootNote(rootNoteInfo);
        }
    }

    /**
     * Place a new note on the fretboard
     * duvet: REQ-NOTE-001, REQ-NOTE-002, REQ-NOTE-003, REQ-NOTE-004, REQ-NOTE-005
     */
    placeNote(stringIndex, fret) {
        const previousState = this.canvas.getCanvasState();
        
        // Calculate note information
        const stringTuning = this.config.tuning[stringIndex];
        const noteInfo = this.musicTheory.getNoteAt(stringTuning, fret);
        const noteId = `${this.element.id}_${stringIndex}_${fret}`;
        
        // Create note element
        const noteElement = document.createElement('div');
        noteElement.className = `note ${noteInfo.cssClass}`;
        noteElement.textContent = noteInfo.displayText; // duvet: REQ-NOTE-004, REQ-NOTE-005
        noteElement.dataset.noteId = noteId;
        
        // Find the position element and add note to it
        const position = this.fretArea.querySelector(`[data-string="${stringIndex}"][data-fret="${fret}"]`);
        if (position) {
            position.appendChild(noteElement);
        }
        
        // Store note information
        const note = {
            ...noteInfo,
            stringIndex,
            fret,
            element: noteElement,
            groupState: 'chromatic' // Start with chromatic color
        };
        
        this.notes.set(noteId, note);
        
        // Save state change
        const newState = this.canvas.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.NOTE_PLACE,
                `Place ${noteInfo.name} note at fret ${fret}, string ${stringIndex + 1}`
            ),
            previousState,
            newState
        );
        
        console.log(`Placed note: ${noteInfo.name} at fret ${fret}, string ${stringIndex + 1}`);
    }

    /**
     * Cycle through note group colors
     * duvet: REQ-NOTE-009 - Clicking cycles through 5 color states
     * duvet: REQ-NOTE-010 - Group colors: LightCoral, OrangeRed, MediumPurple, DarkCyan
     */
    cycleNoteGroup(noteId, note) {
        const previousState = this.canvas.getCanvasState();
        
        const groupStates = ['chromatic', 'group-1', 'group-2', 'group-3', 'group-4'];
        const currentIndex = groupStates.indexOf(note.groupState);
        const nextIndex = (currentIndex + 1) % groupStates.length;
        
        if (nextIndex === 0) {
            // Back to chromatic - if this is the only state, remove the note
            if (currentIndex === 0) {
                this.removeNote(noteId);
                return;
            }
        }
        
        const newGroupState = groupStates[nextIndex];
        note.groupState = newGroupState;
        
        // Update note element classes
        note.element.className = `note ${note.cssClass}`;
        if (newGroupState !== 'chromatic') {
            note.element.classList.add(newGroupState);
        }
        
        // Check if this note is the root note and update its color
        if (this.canvas.rootNote && this.canvas.rootNote.noteId === noteId) {
            note.element.classList.add('root'); // duvet: REQ-NOTE-015 - Root note overrides group color
        }
        
        // Save state change
        const newState = this.canvas.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.NOTE_GROUP_CHANGE,
                `Change note ${note.name} group to ${newGroupState}`
            ),
            previousState,
            newState
        );
    }

    /**
     * Remove a note from the fretboard
     */
    removeNote(noteId) {
        const note = this.notes.get(noteId);
        if (!note) return;
        
        const previousState = this.canvas.getCanvasState();
        
        // Remove from DOM
        note.element.remove();
        
        // Remove from collection
        this.notes.delete(noteId);
        
        // If this was the root note, clear it
        if (this.canvas.rootNote && this.canvas.rootNote.noteId === noteId) {
            this.canvas.setRootNote(null);
        }
        
        // Save state change
        const newState = this.canvas.getCanvasState();
        this.stateManager.saveState(
            this.stateManager.createAction(
                this.stateManager.actionTypes.NOTE_REMOVE,
                `Remove ${note.name} note`
            ),
            previousState,
            newState
        );
    }

    /**
     * Render fret lines
     */
    renderFretLines() {
        for (let fret = this.config.startFret; fret <= this.config.endFret; fret++) {
            const line = document.createElement('div');
            line.className = 'fret-line';
            
            if (this.config.orientation === 'vertical') {
                const position = ((fret - this.config.startFret) / (this.config.endFret - this.config.startFret)) * 100;
                line.style.left = `${position}%`;
            } else {
                const position = ((fret - this.config.startFret) / (this.config.endFret - this.config.startFret)) * 100;
                line.style.top = `${position}%`;
            }
            
            this.fretArea.appendChild(line);
        }
    }

    /**
     * Render string lines
     */
    renderStringLines() {
        for (let stringIndex = 0; stringIndex < this.config.stringCount; stringIndex++) {
            const line = document.createElement('div');
            line.className = 'string-line';
            
            if (this.config.orientation === 'vertical') {
                const position = (stringIndex / (this.config.stringCount - 1)) * 100;
                line.style.top = `${position}%`;
            } else {
                const position = (stringIndex / (this.config.stringCount - 1)) * 100;
                line.style.left = `${position}%`;
            }
            
            this.fretArea.appendChild(line);
        }
    }

    /**
     * Render fret position markers
     * duvet: REQ-GRID-005, REQ-GRID-006, REQ-GRID-007 - Fret position markers
     */
    renderFretMarkers() {
        const markers = this.musicTheory.getFretMarkers(this.config.startFret, this.config.endFret);
        
        markers.forEach(marker => {
            const markerElement = document.createElement('div');
            markerElement.className = `fret-marker ${marker.type}`;
            
            // Position marker at the appropriate fret
            const fretPosition = ((marker.fret - this.config.startFret) / (this.config.endFret - this.config.startFret)) * 100;
            
            if (this.config.orientation === 'vertical') {
                markerElement.style.left = `${fretPosition}%`;
                markerElement.style.top = '50%';
                markerElement.style.transform = 'translate(-50%, -50%)';
            } else {
                markerElement.style.top = `${fretPosition}%`;
                markerElement.style.left = '50%';
                markerElement.style.transform = 'translate(-50%, -50%)';
            }
            
            this.fretArea.appendChild(markerElement);
        });
    }

    /**
     * Update fret number labels
     * duvet: REQ-GRID-009, REQ-GRID-010 - Fret numbers positioned according to orientation
     */
    updateFretNumbers() {
        const fretNumbers = this.element.querySelector('.fret-numbers');
        fretNumbers.innerHTML = '';
        
        for (let fret = this.config.startFret; fret <= this.config.endFret; fret++) {
            const label = document.createElement('span');
            label.textContent = fret;
            fretNumbers.appendChild(label);
        }
    }

    /**
     * Update string name labels
     * duvet: REQ-GRID-011, REQ-GRID-012 - String tuning notes positioned according to orientation
     */
    updateStringNames() {
        const stringNames = this.element.querySelector('.string-names');
        stringNames.innerHTML = '';
        
        this.config.tuning.forEach((tuning, index) => {
            const label = document.createElement('span');
            label.textContent = tuning.note;
            label.title = `String ${index + 1}: ${tuning.note}`;
            stringNames.appendChild(label);
        });
    }

    /**
     * Update tuning controls when string count changes
     */
    updateTuningControls() {
        const tuningContainer = this.element.querySelector('.tuning-controls');
        tuningContainer.innerHTML = this.generateTuningControls();
        
        // Re-add event listeners
        tuningContainer.querySelectorAll('.tuning-select').forEach(select => {
            select.addEventListener('change', this.boundHandlers.configChange);
        });
    }

    /**
     * Update grid layout and positioning
     */
    updateGridLayout() {
        // This method can be expanded for more complex layout calculations
        // Currently, CSS Grid handles most of the layout automatically
    }

    /**
     * Handle grid deletion
     * duvet: REQ-GRID-019 - Delete button removes Grid from Canvas
     * duvet: REQ-GRID-020 - Visual feedback for deletion (undo availability)
     */
    handleDelete() {
        if (this.isLocked) return;
        
        // Add visual feedback animation
        this.element.classList.add('delete-flash');
        
        setTimeout(() => {
            if (this.onDelete) {
                this.onDelete(this.element.id);
            }
        }, 300);
    }

    /**
     * Set the locked state of the grid
     * duvet: REQ-CAN-006 - Lock state affects Grid editing
     */
    setLocked(locked) {
        this.isLocked = locked;
        
        if (locked) {
            this.element.classList.add('locked');
        } else {
            this.element.classList.remove('locked');
        }
        
        // Disable/enable controls
        this.element.querySelectorAll('input, select, button').forEach(control => {
            control.disabled = locked;
        });
    }

    /**
     * Clear root note highlighting on this grid
     */
    clearRootNote() {
        this.notes.forEach(note => {
            note.element.classList.remove('root');
        });
    }

    /**
     * Update interval highlighting for notes on this grid
     * duvet: REQ-INT-005 - Interval colors override chromatic and group colors
     * duvet: REQ-INT-006 - Interval highlighting updates automatically
     */
    updateIntervalHighlighting(intervals, rootNote) {
        this.notes.forEach((note, noteId) => {
            // Clear previous interval classes
            note.element.classList.remove(
                'interval-minor-3rd',
                'interval-major-3rd', 
                'interval-perfect-4th',
                'interval-perfect-5th',
                'interval-minor-7th',
                'interval-major-7th',
                'interval-octave'
            );
            
            // Add interval class if this note has an interval relationship to root
            const interval = intervals.get(noteId);
            if (interval) {
                const intervalClass = this.musicTheory.getIntervalCssClass(interval.type);
                if (intervalClass) {
                    note.element.classList.add(intervalClass);
                }
            }
            
            // Ensure root note color takes precedence
            if (rootNote && rootNote.noteId === noteId) {
                note.element.classList.add('root');
            }
        });
    }

    /**
     * Clear interval highlighting
     * duvet: REQ-INT-007 - Interval highlighting removed when no root note
     */
    clearIntervalHighlighting() {
        this.notes.forEach(note => {
            note.element.classList.remove(
                'interval-minor-3rd',
                'interval-major-3rd',
                'interval-perfect-4th', 
                'interval-perfect-5th',
                'interval-minor-7th',
                'interval-major-7th',
                'interval-octave'
            );
        });
    }

    /**
     * Get all notes on this grid
     */
    getAllNotes() {
        return new Map(this.notes);
    }

    /**
     * Clear any active selections
     */
    clearSelections() {
        // Implementation for clearing selections if needed
    }

    /**
     * Performance: Pause animations
     */
    pauseAnimations() {
        this.element.classList.add('animations-paused');
    }

    /**
     * Performance: Resume animations
     */
    resumeAnimations() {
        this.element.classList.remove('animations-paused');
    }

    /**
     * Serialize grid state for saving
     */
    serialize() {
        const notesData = {};
        this.notes.forEach((note, noteId) => {
            notesData[noteId] = {
                name: note.name,
                semitone: note.semitone,
                isNatural: note.isNatural,
                stringIndex: note.stringIndex,
                fret: note.fret,
                groupState: note.groupState
            };
        });
        
        return {
            id: this.element.id,
            position: this.position,
            config: { ...this.config },
            notes: notesData
        };
    }

    /**
     * Restore grid state from saved data
     */
    async deserialize(data) {
        // Restore configuration
        this.config = { ...data.config };
        this.position = { ...data.position };
        
        // Update position
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
        
        // Recreate grid structure with new config
        this.createGridStructure();
        this.setupEventListeners();
        this.renderFretboard();
        
        // Restore notes
        if (data.notes) {
            Object.entries(data.notes).forEach(([noteId, noteData]) => {
                this.restoreNote(noteId, noteData);
            });
        }
    }

    /**
     * Restore a single note from saved data
     */
    restoreNote(noteId, noteData) {
        // Create note element
        const noteElement = document.createElement('div');
        noteElement.className = `note ${this.musicTheory.noteClassMap[noteData.name]}`;
        if (noteData.groupState !== 'chromatic') {
            noteElement.classList.add(noteData.groupState);
        }
        noteElement.textContent = noteData.isNatural ? noteData.name : '';
        noteElement.dataset.noteId = noteId;
        
        // Find position and add note
        const position = this.fretArea.querySelector(
            `[data-string="${noteData.stringIndex}"][data-fret="${noteData.fret}"]`
        );
        if (position) {
            position.appendChild(noteElement);
        }
        
        // Store note data
        const note = {
            ...noteData,
            element: noteElement,
            cssClass: this.musicTheory.noteClassMap[noteData.name]
        };
        
        this.notes.set(noteId, note);
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('mousemove', this.boundHandlers.drag);
        document.removeEventListener('mouseup', this.boundHandlers.endDrag);
        
        this.isInitialized = false;
    }
}