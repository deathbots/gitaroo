/**
 * Music Theory Utility Class
 * Handles chromatic scale calculations, interval recognition, and note naming
 * duvet: REQ-NOTE-003 - Calculate chromatic note values based on string tuning and fret position
 * duvet: REQ-INT-001, REQ-INT-002, REQ-INT-003 - Interval calculation based on semitone distances
 */

export class MusicTheory {
    constructor() {
        // duvet: REQ-NOTE-004, REQ-NOTE-005 - Natural notes display letters, accidentals don't
        this.chromaticScale = [
            { name: 'C', isNatural: true, semitone: 0 },
            { name: 'C#', isNatural: false, semitone: 1 },
            { name: 'D', isNatural: true, semitone: 2 },
            { name: 'D#', isNatural: false, semitone: 3 },
            { name: 'E', isNatural: true, semitone: 4 },
            { name: 'F', isNatural: true, semitone: 5 },
            { name: 'F#', isNatural: false, semitone: 6 },
            { name: 'G', isNatural: true, semitone: 7 },
            { name: 'G#', isNatural: false, semitone: 8 },
            { name: 'A', isNatural: true, semitone: 9 },
            { name: 'A#', isNatural: false, semitone: 10 },
            { name: 'B', isNatural: true, semitone: 11 }
        ];

        // duvet: REQ-INT-003 - Recognized intervals with semitone distances
        this.intervals = {
            'minor-3rd': { semitones: 3, name: 'Minor 3rd' },
            'major-3rd': { semitones: 4, name: 'Major 3rd' },
            'perfect-4th': { semitones: 5, name: 'Perfect 4th' },
            'perfect-5th': { semitones: 7, name: 'Perfect 5th' },
            'minor-7th': { semitones: 10, name: 'Minor 7th' },
            'major-7th': { semitones: 11, name: 'Major 7th' },
            'octave': { semitones: 12, name: 'Octave' }
        };

        // duvet: REQ-GRID-004 - Standard guitar tuning (E-A-D-G-B-E)
        this.standardTuning = [
            { note: 'E', semitone: 4 },  // Low E (6th string)
            { note: 'A', semitone: 9 },  // A (5th string)
            { note: 'D', semitone: 2 },  // D (4th string)
            { note: 'G', semitone: 7 },  // G (3rd string)
            { note: 'B', semitone: 11 }, // B (2nd string)
            { note: 'E', semitone: 4 }   // High E (1st string)
        ];

        // Note name to CSS class mapping
        this.noteClassMap = {
            'C': 'c',
            'C#': 'c-sharp',
            'D': 'd',
            'D#': 'd-sharp',
            'E': 'e',
            'F': 'f',
            'F#': 'f-sharp',
            'G': 'g',
            'G#': 'g-sharp',
            'A': 'a',
            'A#': 'a-sharp',
            'B': 'b'
        };
    }

    /**
     * Get note information for a specific string and fret
     * duvet: REQ-NOTE-003 - Calculate chromatic note value based on string tuning and fret position
     */
    getNoteAt(stringTuning, fretNumber) {
        const baseSemitone = stringTuning.semitone;
        const totalSemitones = (baseSemitone + fretNumber) % 12;
        const noteInfo = this.chromaticScale.find(note => note.semitone === totalSemitones);
        
        return {
            ...noteInfo,
            cssClass: this.noteClassMap[noteInfo.name],
            displayText: noteInfo.isNatural ? noteInfo.name : '', // duvet: REQ-NOTE-004, REQ-NOTE-005
            fret: fretNumber,
            stringTuning: stringTuning
        };
    }

    /**
     * Calculate interval between two notes
     * duvet: REQ-INT-002 - Interval calculation based on semitone distances
     */
    calculateInterval(rootNote, targetNote) {
        if (!rootNote || !targetNote) return null;

        const rootSemitone = rootNote.semitone;
        const targetSemitone = targetNote.semitone;
        
        // Calculate semitone distance, handling octave wraparound
        let distance = targetSemitone - rootSemitone;
        if (distance < 0) distance += 12;
        
        // Find matching interval
        const intervalKey = Object.keys(this.intervals).find(key => 
            this.intervals[key].semitones === distance
        );
        
        return intervalKey ? {
            type: intervalKey,
            distance: distance,
            ...this.intervals[intervalKey]
        } : null;
    }

    /**
     * Get all intervals for notes relative to a root note
     * duvet: REQ-INT-001 - Automatically calculate intervals for all notes relative to root
     */
    calculateAllIntervals(rootNote, allNotes) {
        if (!rootNote) return new Map();
        
        const intervals = new Map();
        
        allNotes.forEach((note, noteId) => {
            const interval = this.calculateInterval(rootNote, note);
            if (interval) {
                intervals.set(noteId, interval);
            }
        });
        
        return intervals;
    }

    /**
     * Get standard tuning for specified number of strings
     * duvet: REQ-GRID-016 - Support for 4-12 strings
     */
    getStandardTuning(stringCount) {
        if (stringCount <= 6) {
            // For 6 or fewer strings, use the standard tuning subset
            return this.standardTuning.slice(6 - stringCount);
        } else {
            // For more than 6 strings, extend with additional lower strings
            const extendedTuning = [...this.standardTuning];
            const additionalStrings = stringCount - 6;
            
            // Add lower strings (B, F#, C#, G#, D#, A#) for 7-12 string guitars
            const lowerStringNotes = [
                { note: 'B', semitone: 11 },  // 7th string
                { note: 'F#', semitone: 6 },  // 8th string
                { note: 'C#', semitone: 1 },  // 9th string
                { note: 'G#', semitone: 8 },  // 10th string
                { note: 'D#', semitone: 3 },  // 11th string
                { note: 'A#', semitone: 10 }  // 12th string
            ];
            
            for (let i = 0; i < additionalStrings && i < lowerStringNotes.length; i++) {
                extendedTuning.unshift(lowerStringNotes[i]);
            }
            
            return extendedTuning;
        }
    }

    /**
     * Get note from string representation
     */
    parseNote(noteString) {
        const note = this.chromaticScale.find(n => n.name === noteString);
        return note ? { ...note } : null;
    }

    /**
     * Get all possible note names for dropdowns
     */
    getAllNoteNames() {
        return this.chromaticScale.map(note => note.name);
    }

    /**
     * Validate tuning configuration
     */
    validateTuning(tuning) {
        if (!Array.isArray(tuning)) return false;
        
        return tuning.every(stringTuning => 
            stringTuning &&
            typeof stringTuning.note === 'string' &&
            typeof stringTuning.semitone === 'number' &&
            stringTuning.semitone >= 0 &&
            stringTuning.semitone <= 11
        );
    }

    /**
     * Get interval CSS class for styling
     * duvet: REQ-INT-004 - Interval highlighting with distinct colors
     */
    getIntervalCssClass(intervalType) {
        const classMap = {
            'minor-3rd': 'interval-minor-3rd',
            'major-3rd': 'interval-major-3rd',
            'perfect-4th': 'interval-perfect-4th',
            'perfect-5th': 'interval-perfect-5th',
            'minor-7th': 'interval-minor-7th',
            'major-7th': 'interval-major-7th',
            'octave': 'interval-octave'
        };
        
        return classMap[intervalType] || '';
    }

    /**
     * Get fret markers for standard positions
     * duvet: REQ-GRID-005, REQ-GRID-006 - Fret position markers at specific frets
     */
    getFretMarkers(startFret, endFret) {
        const markers = [];
        const singleDotFrets = [3, 5, 7, 9, 15, 17, 19, 21];
        const doubleDotFrets = [12];
        
        for (let fret = startFret; fret <= endFret; fret++) {
            if (singleDotFrets.includes(fret)) {
                markers.push({ fret, type: 'single' });
            } else if (doubleDotFrets.includes(fret)) {
                markers.push({ fret, type: 'double' });
            }
        }
        
        return markers;
    }

    /**
     * Convert semitone to frequency (for future audio features)
     */
    semitoneToFrequency(semitone, baseFrequency = 440) {
        // A4 = 440 Hz is at semitone 9 in the 4th octave
        // This is a placeholder for future audio integration
        return baseFrequency * Math.pow(2, (semitone - 9) / 12);
    }
}