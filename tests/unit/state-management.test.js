/**
 * State Management Tests
 * duvet: REQ-TEST-001 - Unit tests covering all core functionality
 */

/* global describe, test, expect, beforeEach, jest */

import { StateManager } from '../../src/utils/state-management.js';

describe('StateManager', () => {
    let stateManager;

    beforeEach(() => {
        stateManager = new StateManager();
    });

    describe('State History Management', () => {
        test('should initialize with empty history', () => {
            // duvet: REQ-STATE-001 - Maintain complete history of user actions
            expect(stateManager.canUndo()).toBe(false);
            expect(stateManager.canRedo()).toBe(false);
            expect(stateManager.getStateInfo().historyLength).toBe(0);
        });

        test('should save state correctly', () => {
            const action = {
                type: 'test_action',
                description: 'Test action'
            };
            const previousState = { test: 'previous' };
            const newState = { test: 'new' };

            stateManager.saveState(action, previousState, newState);

            expect(stateManager.canUndo()).toBe(true);
            expect(stateManager.canRedo()).toBe(false);
            expect(stateManager.getStateInfo().historyLength).toBe(1);
        });

        test('should handle multiple state saves', () => {
            for (let i = 0; i < 3; i++) {
                stateManager.saveState(
                    { type: 'test', description: `Action ${i}` },
                    { step: i },
                    { step: i + 1 }
                );
            }

            expect(stateManager.getStateInfo().historyLength).toBe(3);
            expect(stateManager.getStateInfo().currentIndex).toBe(2);
        });
    });

    describe('Undo Functionality', () => {
        test('should undo single action correctly', () => {
            // duvet: REQ-STATE-002 - Undo function reverses most recent action
            const action = {
                type: 'note_place',
                description: 'Place note at C3'
            };
            const previousState = { notes: [] };
            const newState = { notes: ['C3'] };

            stateManager.saveState(action, previousState, newState);
            
            const undoResult = stateManager.undo();

            expect(undoResult).not.toBeNull();
            expect(undoResult.direction).toBe('undo');
            expect(undoResult.stateToRestore).toEqual(previousState);
            expect(stateManager.canUndo()).toBe(false);
            expect(stateManager.canRedo()).toBe(true);
        });

        test('should handle multiple undos', () => {
            // Save three states
            for (let i = 0; i < 3; i++) {
                stateManager.saveState(
                    { type: 'test', description: `Action ${i}` },
                    { count: i },
                    { count: i + 1 }
                );
            }

            // Undo twice
            const undo1 = stateManager.undo();
            const undo2 = stateManager.undo();

            expect(undo1.stateToRestore).toEqual({ count: 2 });
            expect(undo2.stateToRestore).toEqual({ count: 1 });
            expect(stateManager.canUndo()).toBe(true);
            expect(stateManager.getStateInfo().currentIndex).toBe(0);
        });

        test('should return null when no actions to undo', () => {
            const result = stateManager.undo();
            expect(result).toBeNull();
        });
    });

    describe('Redo Functionality', () => {
        test('should redo single action correctly', () => {
            // duvet: REQ-STATE-003 - Redo function restores most recently undone action
            const action = {
                type: 'note_place',
                description: 'Place note at C3'
            };
            const previousState = { notes: [] };
            const newState = { notes: ['C3'] };

            stateManager.saveState(action, previousState, newState);
            stateManager.undo();
            
            const redoResult = stateManager.redo();

            expect(redoResult).not.toBeNull();
            expect(redoResult.direction).toBe('redo');
            expect(redoResult.stateToRestore).toEqual(newState);
            expect(stateManager.canUndo()).toBe(true);
            expect(stateManager.canRedo()).toBe(false);
        });

        test('should handle multiple redos', () => {
            // Save and undo multiple states
            for (let i = 0; i < 3; i++) {
                stateManager.saveState(
                    { type: 'test', description: `Action ${i}` },
                    { count: i },
                    { count: i + 1 }
                );
            }

            stateManager.undo();
            stateManager.undo();

            // Redo twice
            const redo1 = stateManager.redo();
            const redo2 = stateManager.redo();

            expect(redo1.stateToRestore).toEqual({ count: 2 });
            expect(redo2.stateToRestore).toEqual({ count: 3 });
            expect(stateManager.canRedo()).toBe(false);
        });

        test('should return null when no actions to redo', () => {
            const result = stateManager.redo();
            expect(result).toBeNull();
        });
    });

    describe('Redo History Clearing', () => {
        test('should clear redo history when new action is performed', () => {
            // Create initial history
            for (let i = 0; i < 3; i++) {
                stateManager.saveState(
                    { type: 'test', description: `Action ${i}` },
                    { count: i },
                    { count: i + 1 }
                );
            }

            // Undo to create redo history
            stateManager.undo();
            stateManager.undo();
            expect(stateManager.canRedo()).toBe(true);

            // Perform new action - should clear redo history
            stateManager.saveState(
                { type: 'new_action', description: 'New action' },
                { count: 1 },
                { count: 'new' }
            );

            expect(stateManager.canRedo()).toBe(false);
            expect(stateManager.getStateInfo().historyLength).toBe(2);
        });
    });

    describe('State Listeners', () => {
        test('should notify listeners of state changes', () => {
            let calledWith = null;
            const listener = (data) => { calledWith = data; };
            stateManager.addListener(listener);

            const action = { type: 'test', description: 'Test' };
            stateManager.saveState(action, {}, {});

            expect(calledWith).not.toBeNull();
            expect(calledWith.action).toEqual(action);
        });

        test('should handle listener errors gracefully', () => {
            let errorListenerCalled = false;
            let goodListenerCalled = false;
            
            const errorListener = () => {
                errorListenerCalled = true;
                throw new Error('Listener error');
            };
            const goodListener = () => {
                goodListenerCalled = true;
            };

            stateManager.addListener(errorListener);
            stateManager.addListener(goodListener);

            // Should not throw despite error in listener
            expect(() => {
                stateManager.saveState(
                    { type: 'test', description: 'Test' },
                    {}, {}
                );
            }).not.toThrow();

            expect(errorListenerCalled).toBe(true);
            expect(goodListenerCalled).toBe(true);
        });

        test('should remove listeners correctly', () => {
            let called = false;
            const listener = () => { called = true; };
            stateManager.addListener(listener);
            stateManager.removeListener(listener);

            stateManager.saveState(
                { type: 'test', description: 'Test' },
                {}, {}
            );

            expect(called).toBe(false);
        });
    });

    describe('Action Types', () => {
        test('should provide all required action types', () => {
            // duvet: REQ-STATE-004 - Support all user actions
            const requiredTypes = [
                'GRID_CREATE',
                'GRID_DELETE',
                'GRID_MOVE',
                'NOTE_PLACE',
                'NOTE_REMOVE',
                'ROOT_NOTE_SET',
                'CANVAS_ORIENTATION_CHANGE'
            ];

            requiredTypes.forEach(type => {
                expect(stateManager.actionTypes[type]).toBeDefined();
            });
        });

        test('should create action objects correctly', () => {
            const action = stateManager.createAction(
                stateManager.actionTypes.NOTE_PLACE,
                'Place note at C3',
                { note: 'C', fret: 3 }
            );

            expect(action.type).toBe(stateManager.actionTypes.NOTE_PLACE);
            expect(action.description).toBe('Place note at C3');
            expect(action.data).toEqual({ note: 'C', fret: 3 });
        });
    });

    describe('Unsaved Changes Tracking', () => {
        test('should track unsaved changes correctly', () => {
            expect(stateManager.hasUnsavedChanges()).toBe(false);

            stateManager.saveState(
                { type: 'test', description: 'Test' },
                {}, {}
            );

            expect(stateManager.hasUnsavedChanges()).toBe(true);

            stateManager.markAsSaved();
            expect(stateManager.hasUnsavedChanges()).toBe(false);
        });
    });

    describe('History Management', () => {
        test('should limit history size to prevent memory issues', () => {
            stateManager.maxHistorySize = 5;

            // Add more than max history size
            for (let i = 0; i < 7; i++) {
                stateManager.saveState(
                    { type: 'test', description: `Action ${i}` },
                    { count: i },
                    { count: i + 1 }
                );
            }

            expect(stateManager.getStateInfo().historyLength).toBe(5);
            expect(stateManager.getStateInfo().currentIndex).toBe(4);
        });

        test('should clear history correctly', () => {
            stateManager.saveState(
                { type: 'test', description: 'Test' },
                {}, {}
            );

            stateManager.clearHistory();

            expect(stateManager.getStateInfo().historyLength).toBe(0);
            expect(stateManager.getStateInfo().currentIndex).toBe(-1);
            expect(stateManager.hasUnsavedChanges()).toBe(false);
        });
    });

    describe('State Cloning', () => {
        test('should clone state objects deeply', () => {
            const originalState = {
                grids: [{ id: 1, notes: ['C', 'D'] }],
                canvas: { orientation: 'portrait' }
            };

            const clonedState = stateManager.cloneState(originalState);

            expect(clonedState).toEqual(originalState);
            expect(clonedState).not.toBe(originalState);
            expect(clonedState.grids).not.toBe(originalState.grids);
            expect(clonedState.grids[0]).not.toBe(originalState.grids[0]);
        });

        test('should handle null and undefined values', () => {
            expect(stateManager.cloneState(null)).toBe(null);
            expect(stateManager.cloneState(undefined)).toBe(undefined);
        });
    });

    describe('Memory Statistics', () => {
        test('should provide memory usage statistics', () => {
            stateManager.saveState(
                { type: 'test', description: 'Test' },
                { data: 'test' },
                { data: 'modified' }
            );

            const stats = stateManager.getMemoryStats();

            expect(stats.totalEntries).toBe(1);
            expect(stats.totalSizeBytes).toBeGreaterThan(0);
            expect(stats.averageEntrySizeBytes).toBeGreaterThan(0);
            expect(stats.maxHistorySize).toBe(stateManager.maxHistorySize);
            expect(stats.currentIndex).toBe(0);
        });
    });
});