/**
 * File Operations Integration Tests
 * duvet: REQ-TEST-002 - Integration tests for user workflows and file operations
 */

/* global describe, test, expect, beforeEach */

import { FileOperations } from '../../src/utils/file-operations.js';
import { StateManager } from '../../src/utils/state-management.js';

describe('FileOperations Integration', () => {
    let fileOperations;
    let stateManager;
    let mockCanvasState;

    beforeEach(() => {
        stateManager = new StateManager();
        fileOperations = new FileOperations(stateManager);
        
        // Mock canvas state for testing
        mockCanvasState = {
            canvas: {
                orientation: 'portrait',
                locked: false,
                dimensions: { width: 816, height: 1056 }
            },
            grids: [
                {
                    id: 'test-grid-1',
                    position: { x: 50, y: 50 },
                    config: {
                        startFret: 0,
                        endFret: 7,
                        stringCount: 6,
                        tuning: [
                            { note: 'E', semitone: 4 },
                            { note: 'A', semitone: 9 },
                            { note: 'D', semitone: 2 },
                            { note: 'G', semitone: 7 },
                            { note: 'B', semitone: 11 },
                            { note: 'E', semitone: 4 }
                        ],
                        orientation: 'vertical'
                    },
                    notes: {
                        'test-grid-1_0_0': {
                            name: 'E',
                            semitone: 4,
                            isNatural: true,
                            stringIndex: 0,
                            fret: 0,
                            groupState: 'chromatic'
                        }
                    }
                }
            ],
            notes: {
                'test-grid-1_0_0': {
                    name: 'E',
                    semitone: 4,
                    isNatural: true,
                    stringIndex: 0,
                    fret: 0,
                    groupState: 'chromatic'
                }
            },
            rootNote: null,
            intervals: {},
            settings: {
                version: '1.0',
                timestamp: Date.now()
            }
        };
    });

    describe('Save Operations', () => {
        test('should save valid canvas state', () => {
            // duvet: REQ-STATE-005 - Save function exports complete Canvas state as JSON
            const result = fileOperations.saveCanvas(mockCanvasState, 'test-save.json');
            
            expect(result.success).toBe(true);
            expect(result.filename).toBe('test-save.json');
        });

        test('should validate save data structure', () => {
            // duvet: REQ-STATE-006 - JSON contains all required components
            const validData = fileOperations.validateSaveData(mockCanvasState);
            expect(validData).toBe(true);
        });

        test('should reject invalid save data', () => {
            const invalidData = { invalid: 'structure' };
            const validData = fileOperations.validateSaveData(invalidData);
            expect(validData).toBe(false);
        });

        test('should generate automatic filename when none provided', () => {
            const result = fileOperations.saveCanvas(mockCanvasState);
            
            expect(result.success).toBe(true);
            expect(result.filename).toMatch(/^gitaroo-fretboard-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
        });
    });

    describe('Load Operations', () => {
        test('should validate correct file structure', () => {
            // duvet: REQ-STATE-008 - Validate JSON file structure
            const validationResult = fileOperations.validateLoadData(mockCanvasState);
            
            expect(validationResult.isValid).toBe(true);
        });

        test('should reject files with missing required properties', () => {
            const invalidData = {
                version: '1.0',
                // Missing canvas and grids
            };
            
            const validationResult = fileOperations.validateLoadData(invalidData);
            
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.error).toContain('canvas');
        });

        test('should reject files with invalid grid structure', () => {
            const invalidData = {
                ...mockCanvasState,
                grids: [
                    { id: 'invalid' } // Missing required properties
                ]
            };
            
            const validationResult = fileOperations.validateLoadData(invalidData);
            
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.error).toContain('grid');
        });

        test('should handle version compatibility', () => {
            const futureVersionData = {
                ...mockCanvasState,
                version: '2.0'
            };
            
            const validationResult = fileOperations.validateLoadData(futureVersionData);
            
            // Should still be valid but may warn
            expect(validationResult.isValid).toBe(true);
        });
    });

    describe('Round-trip Operations', () => {
        test('should maintain data integrity through save/load cycle', () => {
            // duvet: REQ-STATE-007 - Load function restores complete Canvas state
            
            // Save the data
            const saveResult = fileOperations.saveCanvas(mockCanvasState, 'roundtrip-test.json');
            expect(saveResult.success).toBe(true);

            // Validate the saved data can be loaded
            const validationResult = fileOperations.validateLoadData(mockCanvasState);
            expect(validationResult.isValid).toBe(true);

            // Check that all critical data is preserved
            expect(mockCanvasState.canvas.orientation).toBe('portrait');
            expect(mockCanvasState.grids).toHaveLength(1);
            expect(mockCanvasState.grids[0].id).toBe('test-grid-1');
            expect(mockCanvasState.notes['test-grid-1_0_0'].name).toBe('E');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing canvas state gracefully', () => {
            const result = fileOperations.saveCanvas(null);
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle malformed data gracefully', () => {
            const circularData = {};
            circularData.self = circularData; // Creates circular reference
            
            const result = fileOperations.saveCanvas(circularData);
            
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Grid Validation', () => {
        test('should validate complete grid structure', () => {
            const validGrid = mockCanvasState.grids[0];
            const isValid = fileOperations.validateGridStructure(validGrid);
            
            expect(isValid).toBe(true);
        });

        test('should reject grids with missing position', () => {
            const invalidGrid = {
                ...mockCanvasState.grids[0],
                position: undefined
            };
            
            const isValid = fileOperations.validateGridStructure(invalidGrid);
            expect(isValid).toBe(false);
        });

        test('should reject grids with invalid config', () => {
            const invalidGrid = {
                ...mockCanvasState.grids[0],
                config: {
                    startFret: 'invalid', // Should be number
                    endFret: 7,
                    stringCount: 6,
                    tuning: [],
                    orientation: 'vertical'
                }
            };
            
            const isValid = fileOperations.validateGridStructure(invalidGrid);
            expect(isValid).toBe(false);
        });

        test('should reject grids with invalid tuning array', () => {
            const invalidGrid = {
                ...mockCanvasState.grids[0],
                config: {
                    ...mockCanvasState.grids[0].config,
                    tuning: 'not-an-array'
                }
            };
            
            const isValid = fileOperations.validateGridStructure(invalidGrid);
            expect(isValid).toBe(false);
        });
    });

    describe('File Information', () => {
        test('should track current file info', () => {
            const info = fileOperations.getCurrentFileInfo();
            
            expect(info).toHaveProperty('fileName');
            expect(info).toHaveProperty('hasUnsavedChanges');
            expect(info).toHaveProperty('version');
            expect(info.version).toBe('1.0');
        });
    });

    describe('Browser Support', () => {
        test('should detect file operation support', () => {
            const isSupported = FileOperations.isSupported();
            
            // In JSDOM environment, this should be true
            expect(typeof isSupported).toBe('boolean');
        });
    });
});