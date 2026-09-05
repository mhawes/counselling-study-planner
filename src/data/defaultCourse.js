export const defaultCourse = {
    courseTitle: 'CPCAB Counselling Portfolio',
    courseCode: 'CPCAB-100',
    courseYear: '2025-2026',
    coursework: [],
    rules: {
        perCriterion: { count: 2 },
        perType: {
            scope: 'section',
            counts: {
                Written: 2,
                TutorObservation: 2,
                Testimony: 2
            }
        }
    },
    units: [
        {
            id: '1',
            learningOutcome: 'Develop and maintain a professional therapeutic relationship',
            _visible: true,
            sections: [
                {
                    id: '1.1',
                    learningOutcome: 'Use active listening, empathy and awareness',
                    _visible: true,
                    criteria: [
                        {
                            id: '1.1.1',
                            title: 'Reflect on the importance of creating a safe environment',
                            guidance: ['Describe how trust and boundaries support the relationship'],
                            claims: [],
                            _visible: true
                        },
                        {
                            id: '1.1.2',
                            title: 'Demonstrate active listening and feedback skills',
                            guidance: ['Record examples of reflective listening and summarising'],
                            claims: [],
                            _visible: true
                        }
                    ]
                },
                {
                    id: '1.2',
                    learningOutcome: 'Apply theory to support the client process',
                    _visible: true,
                    criteria: [
                        {
                            id: '1.2.1',
                            title: 'Select appropriate theory for the client work',
                            guidance: ['Capture the theory you intend to apply and why'],
                            claims: [],
                            _visible: true
                        }
                    ]
                }
            ]
        }
    ]
};
//# sourceMappingURL=defaultCourse.js.map