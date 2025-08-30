/**
 * Music Theory Utility Tests
 * duvet: REQ-TEST-001 - Unit tests covering all core functionality
 */

/* global describe, test, expect, beforeEach */

import { MusicTheory } from '../../src/utils/music-theory.js';

describe('MusicTheory', () => {
    let musicTheory;

    beforeEach(() => {
        musicTheory = new MusicTheory();
    });

    describe('Basic Note Calculations', () => {
        test('should calculate correct note for open string', () => {
            // duvet: REQ-NOTE-003 - Calculate chromatic note value based on string tuning and fret position
            const eString = { note: 'E', semitone: 4 };
            const note = musicTheory.getNoteAt(eString, 0);
            
            expect(note.name).toBe('E');
            expect(note.semitone).toBe(4);
            expect(note.isNatural).toBe(true);
            expect(note.displayText).toBe('E'); // duvet: REQ-NOTE-004 - Natural notes display letter
        });

        test('should calculate correct note for fretted position', () => {
            const eString = { note: 'E', semitone: 4 };
            const note = musicTheory.getNoteAt(eString, 1); // F
            
            expect(note.name).toBe('F');
            expect(note.semitone).toBe(5);
            expect(note.isNatural).toBe(true);
            expect(note.displayText).toBe('F');
        });

        test('should handle accidental notes correctly', () => {
            const eString = { note: 'E', semitone: 4 };
            const note = musicTheory.getNoteAt(eString, 2); // F#
            
            expect(note.name).toBe('F#');
            expect(note.semitone).toBe(6);
            expect(note.isNatural).toBe(false);
            expect(note.displayText).toBe(''); // duvet: REQ-NOTE-005 - Accidentals don't display text
        });

        test('should handle octave wraparound', () => {
            const eString = { note: 'E', semitone: 4 };
            const note = musicTheory.getNoteAt(eString, 12); // E (octave)
            
            expect(note.name).toBe('E');
            expect(note.semitone).toBe(4);
            expect(note.isNatural).toBe(true);
        });
    });

    describe('Interval Calculations', () => {
        test('should calculate minor 3rd correctly', () => {
            // duvet: REQ-INT-002, REQ-INT-003 - Interval calculation based on semitone distances
            const rootNote = { semitone: 0 }; // C
            const targetNote = { semitone: 3 }; // D#/Eb
            
            const interval = musicTheory.calculateInterval(rootNote, targetNote);
            
            expect(interval.type).toBe('minor-3rd');
            expect(interval.distance).toBe(3);
            expect(interval.semitones).toBe(3);
        });

        test('should calculate perfect 5th correctly', () => {
            const rootNote = { semitone: 0 }; // C
            const targetNote = { semitone: 7 }; // G
            
            const interval = musicTheory.calculateInterval(rootNote, targetNote);
            
            expect(interval.type).toBe('perfect-5th');
            expect(interval.distance).toBe(7);
            expect(interval.semitones).toBe(7);
        });

        test('should handle octave wraparound in intervals', () => {
            const rootNote = { semitone: 7 }; // G
            const targetNote = { semitone: 3 }; // D# (becomes 8 semitones up: 12 - 7 + 3 = 8)
            
            const interval = musicTheory.calculateInterval(rootNote, targetNote);
            
            // 8 semitones is not a recognized interval, so should return null
            expect(interval).toBeNull();
        });

        test('should return null for unrecognized intervals', () => {
            const rootNote = { semitone: 0 };
            const targetNote = { semitone: 1 }; // Minor 2nd (not in recognized intervals)
            
            const interval = musicTheory.calculateInterval(rootNote, targetNote);
            
            expect(interval).toBeNull();
        });
    });

    describe('Standard Tuning', () => {
        test('should provide correct 6-string standard tuning', () => {
            // duvet: REQ-GRID-004 - Standard guitar tuning (E-A-D-G-B-E)
            const tuning = musicTheory.getStandardTuning(6);
            
            expect(tuning).toHaveLength(6);
            expect(tuning[0]).toEqual({ note: 'E', semitone: 4 });  // Low E
            expect(tuning[1]).toEqual({ note: 'A', semitone: 9 });  // A
            expect(tuning[2]).toEqual({ note: 'D', semitone: 2 });  // D
            expect(tuning[3]).toEqual({ note: 'G', semitone: 7 });  // G
            expect(tuning[4]).toEqual({ note: 'B', semitone: 11 }); // B
            expect(tuning[5]).toEqual({ note: 'E', semitone: 4 });  // High E
        });

        test('should handle extended range guitars', () => {
            // duvet: REQ-GRID-016 - Support for 4-12 strings
            const tuning7 = musicTheory.getStandardTuning(7);
            const tuning8 = musicTheory.getStandardTuning(8);
            
            expect(tuning7).toHaveLength(7);
            expect(tuning8).toHaveLength(8);
            expect(tuning7[0]).toEqual({ note: 'B', semitone: 11 }); // 7th string is B
        });

        test('should handle short scale guitars', () => {
            const tuning4 = musicTheory.getStandardTuning(4);
            
            expect(tuning4).toHaveLength(4);
            // Should be the highest 4 strings of standard tuning
            expect(tuning4[0]).toEqual({ note: 'D', semitone: 2 });
            expect(tuning4[1]).toEqual({ note: 'G', semitone: 7 });
            expect(tuning4[2]).toEqual({ note: 'B', semitone: 11 });
            expect(tuning4[3]).toEqual({ note: 'E', semitone: 4 });
        });
    });

    describe('Fret Markers', () => {
        test('should provide correct fret markers for standard range', () => {
            // duvet: REQ-GRID-005, REQ-GRID-006 - Fret position markers
            const markers = musicTheory.getFretMarkers(0, 12);
            
            const singleDots = markers.filter(m => m.type === 'single');
            const doubleDots = markers.filter(m => m.type === 'double');
            
            expect(singleDots.map(m => m.fret)).toEqual([3, 5, 7, 9]);
            expect(doubleDots.map(m => m.fret)).toEqual([12]);
        });

        test('should handle extended fret ranges', () => {
            const markers = musicTheory.getFretMarkers(0, 21);
            
            const expectedSingleDots = [3, 5, 7, 9, 15, 17, 19, 21];
            const singleDots = markers.filter(m => m.type === 'single');
            
            expect(singleDots.map(m => m.fret)).toEqual(expectedSingleDots);
        });
    });

    describe('CSS Class Mapping', () => {
        test('should provide correct CSS classes for intervals', () => {
            // duvet: REQ-INT-004 - Interval highlighting with distinct colors
            expect(musicTheory.getIntervalCssClass('minor-3rd')).toBe('interval-minor-3rd');
            expect(musicTheory.getIntervalCssClass('perfect-5th')).toBe('interval-perfect-5th');
            expect(musicTheory.getIntervalCssClass('octave')).toBe('interval-octave');
            expect(musicTheory.getIntervalCssClass('invalid')).toBe('');
        });

        test('should provide correct CSS classes for notes', () => {
            const eString = { note: 'E', semitone: 4 };
            const cNote = musicTheory.getNoteAt(eString, 8); // Should be C (E + 8 semitones = 4 + 8 = 12 % 12 = 0)
            
            expect(cNote.cssClass).toBe('c');
            expect(cNote.name).toBe('C');
        });
    });

    describe('Utility Functions', () => {
        test('should parse note strings correctly', () => {
            const cNote = musicTheory.parseNote('C');
            const fSharpNote = musicTheory.parseNote('F#');
            
            expect(cNote.name).toBe('C');
            expect(cNote.semitone).toBe(0);
            expect(fSharpNote.name).toBe('F#');
            expect(fSharpNote.semitone).toBe(6);
        });

        test('should validate tuning configurations', () => {
            const validTuning = [
                { note: 'E', semitone: 4 },
                { note: 'A', semitone: 9 }
            ];
            const invalidTuning = [
                { note: 'E' }, // Missing semitone
                { semitone: 9 } // Missing note
            ];
            
            expect(musicTheory.validateTuning(validTuning)).toBe(true);
            expect(musicTheory.validateTuning(invalidTuning)).toBe(false);
            expect(musicTheory.validateTuning(null)).toBe(false);
            expect(musicTheory.validateTuning('not an array')).toBe(false);
        });

        test('should provide all note names', () => {
            const allNotes = musicTheory.getAllNoteNames();
            
            expect(allNotes).toHaveLength(12);
            expect(allNotes).toContain('C');
            expect(allNotes).toContain('C#');
            expect(allNotes).toContain('F#');
            expect(allNotes).toContain('B');
        });
    });
});