/**
 * Canvas Workflow Integration Tests
 * duvet: REQ-TEST-002 - Integration tests for user workflows and file operations
 */

/* global describe, test, expect, beforeEach, afterEach */

// Mock DOM environment for Canvas integration tests
const mockDOM = () => {
    // Create mock canvas element
    const mockCanvas = {
        id: 'canvas',
        classList: {
            classes: ['canvas', 'portrait'],
            add: function(className) { this.classes.push(className); },
            remove: function(className) { 
                this.classes = this.classes.filter(c => c !== className); 
            },
            contains: function(className) { return this.classes.includes(className); },
            toggle: function(className) {
                if (this.contains(className)) {
                    this.remove(className);
                } else {
                    this.add(className);
                }
            }
        },
        appendChild: function(child) { 
            if (!this.children) this.children = [];
            this.children.push(child); 
        },
        querySelector: function(selector) {
            if (selector === '.canvas-content') {
                return mockCanvasContent;
            }
            if (selector === '.drop-zone') {
                return mockDropZone;
            }
            return null;
        },
        addEventListener: function() {},
        removeEventListener: function() {},
        offsetWidth: 816,
        offsetHeight: 1056
    };

    const mockCanvasContent = {
        appendChild: function(child) {
            if (!this.children) this.children = [];
            this.children.push(child);
        }
    };

    const mockDropZone = {
        classList: {
            classes: ['drop-zone', 'hidden'],
            add: function(className) { this.classes.push(className); },
            remove: function(className) { 
                this.classes = this.classes.filter(c => c !== className); 
            },
            contains: function(className) { return this.classes.includes(className); }
        }
    };

    // Mock document
    global.document = {
        getElementById: function(id) {
            const mockButtons = {
                'orientation-toggle': { addEventListener: function() {}, textContent: '📄 Portrait' },
                'lock-toggle': { addEventListener: function() {}, textContent: '🔓 Unlocked' },
                'create-grid': { addEventListener: function() {} },
                'save-canvas': { addEventListener: function() {} },
                'load-trigger': { addEventListener: function() {} },
                'load-canvas': { addEventListener: function() {} },
                'undo': { addEventListener: function() {}, disabled: true },
                'redo': { addEventListener: function() {}, disabled: true }
            };
            return mockButtons[id] || null;
        },
        createElement: function(tagName) {
            return {
                tagName: tagName.toUpperCase(),
                className: '',
                style: {},
                appendChild: function() {},
                addEventListener: function() {},
                classList: {
                    add: function() {},
                    remove: function() {},
                    contains: function() { return false; }
                }
            };
        },
        body: {
            appendChild: function() {}
        }
    };

    return mockCanvas;
};

describe('Canvas Workflow Integration', () => {
    let mockCanvasElement;
    let mockStateManager;
    let mockFileOperations;
    let mockMusicTheory;

    beforeEach(() => {
        mockCanvasElement = mockDOM();
        
        // Mock StateManager
        mockStateManager = {
            addListener: function() {},
            removeListener: function() {},
            saveState: function() {},
            getStateInfo: function() {
                return { canUndo: false, canRedo: false, historyLength: 0 };
            },
            createAction: function(type, description, data) {
                return { type, description, data };
            },
            actionTypes: {
                CANVAS_ORIENTATION_CHANGE: 'canvas_orientation_change',
                CANVAS_LOCK_TOGGLE: 'canvas_lock_toggle',
                GRID_CREATE: 'grid_create',
                GRID_DELETE: 'grid_delete'
            }
        };

        // Mock FileOperations
        mockFileOperations = {
            saveCanvas: function() { 
                return { success: true, filename: 'test.json' }; 
            },
            loadCanvas: function() { 
                return Promise.resolve({ success: true, data: {} }); 
            }
        };

        // Mock MusicTheory
        mockMusicTheory = {
            getStandardTuning: function(stringCount) {
                const tuning = [];
                for (let i = 0; i < stringCount; i++) {
                    tuning.push({ note: 'E', semitone: 4 });
                }
                return tuning;
            },
            calculateInterval: function() { return null; },
            calculateAllIntervals: function() { return new Map(); }
        };
    });

    afterEach(() => {
        // Clean up global mocks
        delete global.document;
    });

    describe('Canvas Initialization', () => {
        test('should initialize canvas with proper state', async () => {
            // duvet: REQ-CAN-001 - Canvas dimensions equivalent to US Letter paper
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            expect(canvas.orientation).toBe('portrait');
            expect(canvas.isLocked).toBe(false);
            expect(canvas.grids.size).toBe(0);
            expect(canvas.rootNote).toBeNull();
        });

        test('should set up event listeners during initialization', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // Test that bound handlers are created
            expect(typeof canvas.boundHandlers.orientationToggle).toBe('function');
            expect(typeof canvas.boundHandlers.lockToggle).toBe('function');
            expect(typeof canvas.boundHandlers.createGrid).toBe('function');
        });
    });

    describe('Canvas State Management', () => {
        test('should track canvas state correctly', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            const initialState = canvas.getCanvasState();

            expect(initialState).toHaveProperty('canvas');
            expect(initialState).toHaveProperty('grids');
            expect(initialState).toHaveProperty('notes');
            expect(initialState).toHaveProperty('rootNote');
            expect(initialState).toHaveProperty('intervals');
            expect(initialState).toHaveProperty('settings');

            expect(initialState.canvas.orientation).toBe('portrait');
            expect(initialState.canvas.locked).toBe(false);
            expect(initialState.grids).toEqual([]);
            expect(initialState.notes).toEqual({});
        });

        test('should handle orientation toggle', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // duvet: REQ-CAN-005 - Orientation toggle button
            expect(canvas.orientation).toBe('portrait');
            
            canvas.toggleOrientation();
            
            expect(canvas.orientation).toBe('landscape');
        });

        test('should handle lock toggle', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // duvet: REQ-CAN-006 - Lock/unlock toggle
            expect(canvas.isLocked).toBe(false);
            
            canvas.toggleLock();
            
            expect(canvas.isLocked).toBe(true);
        });
    });

    describe('Grid Management Workflow', () => {
        test('should create grid with proper default configuration', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // Mock grid creation
            const mockGrid = {
                init: function() { return Promise.resolve(); },
                serialize: function() {
                    return {
                        id: 'test-grid',
                        position: { x: 50, y: 50 },
                        config: {
                            startFret: 0,
                            endFret: 7,
                            stringCount: 6,
                            tuning: mockMusicTheory.getStandardTuning(6),
                            orientation: 'vertical'
                        },
                        notes: {}
                    };
                }
            };

            // Simulate grid creation
            canvas.grids.set('test-grid', mockGrid);

            expect(canvas.grids.size).toBe(1);
            expect(canvas.grids.has('test-grid')).toBe(true);

            const state = canvas.getCanvasState();
            expect(state.grids).toHaveLength(1);
        });

        test('should handle grid deletion workflow', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // Add a mock grid
            const mockGrid = {
                element: { remove: function() {} },
                serialize: function() { return {}; }
            };
            canvas.grids.set('test-grid', mockGrid);

            expect(canvas.grids.size).toBe(1);

            // Simulate deletion
            canvas.handleGridDelete('test-grid');

            expect(canvas.grids.size).toBe(0);
        });
    });

    describe('Root Note and Interval Management', () => {
        test('should set root note and update intervals', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            const noteInfo = {
                name: 'E',
                semitone: 4,
                isNatural: true,
                gridId: 'test-grid',
                noteId: 'test-note'
            };

            // duvet: REQ-NOTE-013 - Only one root note across all grids
            expect(canvas.rootNote).toBeNull();
            
            canvas.setRootNote(noteInfo);
            
            expect(canvas.rootNote).toEqual(noteInfo);
        });

        test('should clear previous root note when setting new one', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            const firstNote = { name: 'E', gridId: 'grid1', noteId: 'note1' };
            const secondNote = { name: 'A', gridId: 'grid2', noteId: 'note2' };

            canvas.setRootNote(firstNote);
            expect(canvas.rootNote).toEqual(firstNote);

            canvas.setRootNote(secondNote);
            expect(canvas.rootNote).toEqual(secondNote);
        });

        test('should update interval highlighting when root note changes', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // Mock grid with interval highlighting capability
            const mockGrid = {
                getAllNotes: function() { return new Map(); },
                updateIntervalHighlighting: function() { this.intervalsUpdated = true; },
                clearIntervalHighlighting: function() { this.intervalsCleared = true; },
                intervalsUpdated: false,
                intervalsCleared: false
            };

            canvas.grids.set('test-grid', mockGrid);

            // Set root note
            canvas.setRootNote({ name: 'E', gridId: 'test-grid' });
            expect(mockGrid.intervalsUpdated).toBe(true);

            // Clear root note
            canvas.setRootNote(null);
            expect(mockGrid.intervalsCleared).toBe(true);
        });
    });

    describe('File Operations Integration', () => {
        test('should save canvas state correctly', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            let saveCallCount = 0;
            const mockFileOps = {
                ...mockFileOperations,
                saveCanvas: function(state) {
                    saveCallCount++;
                    expect(state).toHaveProperty('canvas');
                    expect(state).toHaveProperty('grids');
                    return { success: true, filename: 'test.json' };
                }
            };

            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOps,
                mockMusicTheory
            );

            await canvas.handleSave();
            expect(saveCallCount).toBe(1);
        });

        test('should restore canvas state from loaded data', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            const testState = {
                canvas: {
                    orientation: 'landscape',
                    locked: true
                },
                grids: [],
                notes: {},
                rootNote: null,
                intervals: {}
            };

            await canvas.restoreCanvasState(testState);

            expect(canvas.orientation).toBe('landscape');
            expect(canvas.isLocked).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle save errors gracefully', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const mockFileOpsWithError = {
                saveCanvas: function() {
                    throw new Error('Save failed');
                }
            };

            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOpsWithError,
                mockMusicTheory
            );

            // Should not throw
            await expect(canvas.handleSave()).resolves.not.toThrow();
        });

        test('should handle load errors gracefully', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const mockFileOpsWithError = {
                loadCanvas: function() {
                    return Promise.resolve({ 
                        success: false, 
                        error: 'Invalid file format' 
                    });
                }
            };

            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOpsWithError,
                mockMusicTheory
            );

            const mockFile = { name: 'test.json' };
            const mockEvent = { target: { files: [mockFile] } };

            // Should not throw
            await expect(canvas.handleLoad(mockEvent)).resolves.not.toThrow();
        });
    });

    describe('Performance and Cleanup', () => {
        test('should handle animation pause/resume', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // Mock grid with animation controls
            const mockGrid = {
                pauseAnimations: function() { this.animationsPaused = true; },
                resumeAnimations: function() { this.animationsResumed = true; },
                animationsPaused: false,
                animationsResumed: false
            };

            canvas.grids.set('test-grid', mockGrid);

            canvas.pauseAnimations();
            expect(mockGrid.animationsPaused).toBe(true);

            canvas.resumeAnimations();
            expect(mockGrid.animationsResumed).toBe(true);
        });

        test('should clean up resources on destroy', async () => {
            const { Canvas } = await import('../../src/components/canvas.js');
            
            const canvas = new Canvas(
                mockCanvasElement,
                mockStateManager,
                mockFileOperations,
                mockMusicTheory
            );

            // Mock grid with destroy method
            const mockGrid = {
                destroy: function() { this.destroyed = true; },
                destroyed: false
            };

            canvas.grids.set('test-grid', mockGrid);
            canvas.isInitialized = true;

            canvas.destroy();

            expect(mockGrid.destroyed).toBe(true);
            expect(canvas.isInitialized).toBe(false);
        });
    });
});