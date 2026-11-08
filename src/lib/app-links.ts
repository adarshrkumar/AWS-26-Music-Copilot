export interface AppLink {
    href: string;
    label: string;
    description: string;
}

export const appLinks: AppLink[] = [
    { href: '/app/songs', label: 'Songs', description: 'Create, edit and delete your songs. They stay on this device until you choose to sync them.' },
    { href: '/app/progression', label: 'Progression', description: 'Set the key, tempo and bars, and build the chord progression.' },
    { href: '/app/scales', label: 'Scales', description: 'See the scales, arpeggios and guide tones that fit each chord.' },
    { href: '/app/editor', label: 'Editor', description: 'Write tabs and sheet music in one place.' },
    { href: '/app/autofill', label: 'Autofill', description: 'Review phrase proposals and accept the ones you want.' },
    { href: '/app/teacher', label: 'Teacher', description: 'Set sample progressions for a class, see how students use them, or join a class.' },
    { href: '/app/metrics', label: 'Metrics', description: 'See how the app is used, as counts only with no song content.' },
];
